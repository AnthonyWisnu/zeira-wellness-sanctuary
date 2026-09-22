import { prisma } from '../../src/db/prisma';

export class ReservasiService {
  /**
   * Kunci Kursi Atomik 15 Menit & Anti-Overbooking
   * Menggunakan PostgreSQL Pessimistic Row-Level Locking (SELECT ... FOR UPDATE)
   */
  static async pesanKursi(pelangganId: string, jadwalId: string, isMemberAktif: boolean) {
    const kodePesanan = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const kodeTiket = `RSV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 Menit

    return prisma.$transaction(async (tx) => {
      // 1. Penguncian Baris Eksklusif (Row-Level Lock)
      const rows: any[] = await tx.$queryRaw`
        SELECT id, judul_sesi, kapasitas_maksimal, jumlah_terisi, harga_member, harga_non_member, waktu_mulai, status_sesi
        FROM tb_jadwal_sesi
        WHERE id = ${jadwalId}::uuid
        FOR UPDATE
      `;

      if (!rows || rows.length === 0) {
        throw new Error('Sesi kelas tidak ditemukan.');
      }

      const sesi = rows[0];

      if (sesi.status_sesi !== 'terjadwal') {
        throw new Error('Sesi kelas ini sudah tidak menerima pemesanan tiket.');
      }

      // 2. Cek Anti-Overbooking Mutlak
      if (sesi.jumlah_terisi >= sesi.kapasitas_maksimal) {
        throw new Error('Mohon maaf, kursi untuk sesi ini baru saja habis dipesan.');
      }

      // 3. Cek apakah pelanggan sudah punya tiket aktif untuk sesi ini
      const existingTicket = await tx.tb_reservasi_sesi.findFirst({
        where: {
          id_jadwal: jadwalId,
          id_pelanggan: pelangganId,
          status_reservasi: { in: ['menunggu_pembayaran', 'dipesan', 'hadir'] },
        },
      });

      if (existingTicket) {
        throw new Error('Anda sudah memiliki tiket atau reservasi aktif untuk sesi kelas ini.');
      }

      // 4. Kunci Kursi (Naikkan kuota terisi)
      await tx.$executeRaw`
        UPDATE tb_jadwal_sesi
        SET jumlah_terisi = jumlah_terisi + 1, waktu_diperbarui = CURRENT_TIMESTAMP
        WHERE id = ${jadwalId}::uuid
      `;

      // 5. Tentukan harga (Harga Member vs Non-Member)
      const hargaDikenakan = isMemberAktif ? Number(sesi.harga_member) : Number(sesi.harga_non_member);
      const tipeTarif = isMemberAktif ? 'member' : 'non_member';

      // 6. Buat Pesanan (tb_pesanan)
      const pesanan = await tx.tb_pesanan.create({
        data: {
          kode_pesanan: kodePesanan,
          id_pelanggan: pelangganId,
          tipe_pesanan: 'sesi',
          id_jadwal: jadwalId,
          total_bayar: hargaDikenakan,
          status_pembayaran: 'menunggu_pembayaran',
          waktu_kedaluwarsa: expiresAt,
          snap_token: `mock-snap-sesi-${kodePesanan}`,
        },
      });

      // 7. Buat Tiket Reservasi Sementara (tb_reservasi_sesi)
      const reservasi = await tx.tb_reservasi_sesi.create({
        data: {
          kode_reservasi: kodeTiket,
          id_pesanan: pesanan.id,
          id_jadwal: jadwalId,
          id_pelanggan: pelangganId,
          tipe_tarif: tipeTarif,
          harga_dikenakan: hargaDikenakan,
          status_reservasi: 'menunggu_pembayaran',
        },
      });

      return {
        pesanan,
        reservasi,
        sesiJudul: sesi.judul_sesi,
        waktuMulai: sesi.waktu_mulai,
        expiresAt,
        hargaDikenakan,
      };
    });
  }

  /**
   * Konfirmasi pembayaran lunas (misal via mock checkout atau webhook Midtrans)
   */
  static async konfirmasiPembayaran(pesananId: string, metodePembayaran: string = 'qris') {
    return prisma.$transaction(async (tx) => {
      const pesanan = await tx.tb_pesanan.findUnique({
        where: { id: pesananId },
        include: { tb_reservasi_sesi: true },
      });

      if (!pesanan) throw new Error('Pesanan tidak ditemukan.');
      if (pesanan.status_pembayaran === 'lunas') return pesanan;

      // Update status pesanan
      const updatedPesanan = await tx.tb_pesanan.update({
        where: { id: pesananId },
        data: {
          status_pembayaran: 'lunas',
          metode_pembayaran: metodePembayaran,
          waktu_verifikasi: new Date(),
        },
      });

      // Update status tiket reservasi menjadi 'dipesan' (tiket sah)
      if (pesanan.tb_reservasi_sesi) {
        await tx.tb_reservasi_sesi.update({
          where: { id: pesanan.tb_reservasi_sesi.id },
          data: { status_reservasi: 'dipesan' },
        });
      }

      return updatedPesanan;
    });
  }

  /**
   * Kebijakan Pembatalan Mandiri Fleksibel (Flexible Cancellation Law)
   * Pelanggan hanya bisa batal jika: waktu_mulai - NOW() >= batas_batal_jam
   */
  static async batalkanReservasiMandiri(pelangganId: string, reservasiId: string) {
    return prisma.$transaction(async (tx) => {
      const reservasi = await tx.tb_reservasi_sesi.findUnique({
        where: { id: reservasiId },
        include: {
          tb_jadwal_sesi: true,
          tb_pesanan: true,
        },
      });

      if (!reservasi) throw new Error('Tiket reservasi tidak ditemukan.');
      if (reservasi.id_pelanggan !== pelangganId) {
        throw new Error('Anda tidak memiliki akses untuk membatalkan tiket ini.');
      }
      if (reservasi.status_reservasi !== 'dipesan' && reservasi.status_reservasi !== 'menunggu_pembayaran') {
        throw new Error(`Tiket tidak dapat dibatalkan karena sudah berstatus ${reservasi.status_reservasi}.`);
      }

      const now = new Date();
      const waktuMulai = new Date(reservasi.tb_jadwal_sesi.waktu_mulai);
      const hoursRemaining = (waktuMulai.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Verifikasi batas waktu pembatalan
      if (hoursRemaining < reservasi.tb_jadwal_sesi.batas_batal_jam) {
        throw new Error(
          `Batas waktu pembatalan mandiri adalah ${reservasi.tb_jadwal_sesi.batas_batal_jam} jam sebelum kelas dimulai. Pembatalan mandiri ditolak.`
        );
      }

      // Ubah status tiket menjadi dibatalkan
      await tx.tb_reservasi_sesi.update({
        where: { id: reservasiId },
        data: { status_reservasi: 'dibatalkan' },
      });

      // Ubah status pesanan
      await tx.tb_pesanan.update({
        where: { id: reservasi.id_pesanan },
        data: { status_pembayaran: 'dibatalkan' },
      });

      // Kembalikan kursi studio secara atomik
      await tx.$executeRaw`
        UPDATE tb_jadwal_sesi
        SET jumlah_terisi = GREATEST(0, jumlah_terisi - 1), waktu_diperbarui = CURRENT_TIMESTAMP
        WHERE id = ${reservasi.id_jadwal}::uuid
      `;

      return { success: true, message: 'Reservasi berhasil dibatalkan dan kursi telah dikembalikan ke kuota publik.' };
    });
  }

  /**
   * Pelepasan kursi otomatis saat pesanan kedaluwarsa (15-Minute Expiry Handler)
   */
  static async lepaskanKursiKedaluwarsa() {
    const now = new Date();
    const expiredOrders = await prisma.tb_pesanan.findMany({
      where: {
        status_pembayaran: 'menunggu_pembayaran',
        waktu_kedaluwarsa: { lt: now },
        tipe_pesanan: 'sesi',
      },
      include: { tb_reservasi_sesi: true },
    });

    for (const order of expiredOrders) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.tb_pesanan.update({
            where: { id: order.id },
            data: { status_pembayaran: 'kedaluwarsa' },
          });

          if (order.tb_reservasi_sesi) {
            await tx.tb_reservasi_sesi.update({
              where: { id: order.tb_reservasi_sesi.id },
              data: { status_reservasi: 'kedaluwarsa' },
            });
          }

          if (order.id_jadwal) {
            await tx.$executeRaw`
              UPDATE tb_jadwal_sesi
              SET jumlah_terisi = GREATEST(0, jumlah_terisi - 1), waktu_diperbarui = CURRENT_TIMESTAMP
              WHERE id = ${order.id_jadwal}::uuid
            `;
          }
        });
      } catch (err) {
        console.error(`Gagal melepas kursi kedaluwarsa untuk pesanan ${order.kode_pesanan}:`, err);
      }
    }
  }

  /**
   * Mengambil riwayat tiket pelanggan untuk halaman /riwayat
   */
  static async getRiwayatTiketPelanggan(pelangganId: string) {
    const tiketList = await prisma.tb_reservasi_sesi.findMany({
      where: { id_pelanggan: pelangganId },
      include: {
        tb_jadwal_sesi: {
          include: {
            tb_kategori_layanan: true,
            tb_ruangan: true,
            tb_pengguna: true,
          },
        },
        tb_pesanan: true,
      },
      orderBy: { waktu_dibuat: 'desc' },
    });

    const now = new Date();

    return tiketList.map((t) => {
      const waktuMulai = new Date(t.tb_jadwal_sesi.waktu_mulai);
      const hoursRemaining = (waktuMulai.getTime() - now.getTime()) / (1000 * 60 * 60);
      const canCancel =
        (t.status_reservasi === 'dipesan' || t.status_reservasi === 'menunggu_pembayaran') &&
        hoursRemaining >= t.tb_jadwal_sesi.batas_batal_jam;

      return {
        id: t.id,
        kode_reservasi: t.kode_reservasi,
        kode_pesanan: t.tb_pesanan.kode_pesanan,
        judul_sesi: t.tb_jadwal_sesi.judul_sesi,
        kategori: t.tb_jadwal_sesi.tb_kategori_layanan.nama_kategori,
        ruangan: t.tb_jadwal_sesi.tb_ruangan.nama_ruangan,
        instruktur: t.tb_jadwal_sesi.tb_pengguna.nama_lengkap,
        waktu_mulai: t.tb_jadwal_sesi.waktu_mulai,
        waktu_selesai: t.tb_jadwal_sesi.waktu_selesai,
        harga_dikenakan: Number(t.harga_dikenakan),
        tipe_tarif: t.tipe_tarif,
        status_reservasi: t.status_reservasi,
        status_pembayaran: t.tb_pesanan.status_pembayaran,
        batas_batal_jam: t.tb_jadwal_sesi.batas_batal_jam,
        hoursRemaining: Math.max(0, Math.floor(hoursRemaining)),
        canCancel,
        waktu_absensi: t.waktu_absensi,
      };
    });
  }
}
