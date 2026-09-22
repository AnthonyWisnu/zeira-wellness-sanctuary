import { prisma } from '../../src/db/prisma';

export class MembershipService {
  /**
   * Mengambil katalog paket membership yang sedang aktif
   */
  static async getKatalogPaket() {
    return prisma.tb_paket_membership.findMany({
      where: { status_aktif: true },
      orderBy: { durasi_hari: 'asc' },
    });
  }

  /**
   * Mengambil inventaris lemari loker lengkap dengan status penyewaan aktif saat ini
   */
  static async getStatusLoker() {
    const lokerList = await prisma.tb_loker.findMany({
      include: {
        tb_keanggotaan: {
          where: {
            status: 'aktif',
            tanggal_berakhir: { gte: new Date() },
          },
          include: {
            tb_pengguna: {
              select: { nama_lengkap: true, email: true },
            },
          },
          take: 1,
        },
      },
      orderBy: { nomor_loker: 'asc' },
    });

    return lokerList.map((loker) => {
      const activeRental = loker.tb_keanggotaan[0] || null;
      const isRented = !!activeRental;
      const isUnderMaintenance = loker.status === 'perawatan';

      let ketersediaan: 'TERSEDIA' | 'DISEWA_AKTIF' | 'PERAWATAN' = 'TERSEDIA';
      if (isUnderMaintenance) ketersediaan = 'PERAWATAN';
      else if (isRented || loker.status === 'digunakan') ketersediaan = 'DISEWA_AKTIF';

      return {
        id: loker.id,
        nomor_loker: loker.nomor_loker,
        lokasi_area: loker.lokasi_area,
        status_fisik: loker.status,
        ketersediaan,
        penyewa: activeRental
          ? {
              nama: activeRental.tb_pengguna.nama_lengkap,
              berakhir: activeRental.tanggal_berakhir.toISOString().split('T')[0],
            }
          : null,
      };
    });
  }

  /**
   * Pembelian paket membership baru atau perpanjangan
   */
  static async pesanMembership(pelangganId: string, paketId: string, lokerId?: string) {
    const paket = await prisma.tb_paket_membership.findUnique({
      where: { id: paketId },
    });
    if (!paket || !paket.status_aktif) {
      throw new Error('Paket membership tidak ditemukan atau sudah nonaktif.');
    }

    // Periksa apakah loker valid dan tersedia
    if (lokerId) {
      const loker = await prisma.tb_loker.findUnique({
        where: { id: lokerId },
        include: {
          tb_keanggotaan: {
            where: {
              status: 'aktif',
              tanggal_berakhir: { gte: new Date() },
            },
            take: 1,
          },
        },
      });

      if (!loker || loker.status === 'perawatan') {
        throw new Error('Loker sedang dalam perawatan dan tidak dapat disewa.');
      }
      if (loker.tb_keanggotaan.length > 0 && loker.tb_keanggotaan[0].id_pelanggan !== pelangganId) {
        throw new Error('Nomor loker ini sedang disewa oleh member lain.');
      }
    }

    // Buat pesanan pembayaran membership
    const kodePesanan = `MBR-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 Menit

    const pesanan = await prisma.tb_pesanan.create({
      data: {
        kode_pesanan: kodePesanan,
        id_pelanggan: pelangganId,
        tipe_pesanan: 'membership',
        total_bayar: paket.harga,
        status_pembayaran: 'menunggu_pembayaran',
        waktu_kedaluwarsa: expiresAt,
        snap_token: `mock-snap-mbr-${kodePesanan}`,
      },
    });

    return {
      pesanan,
      paket,
      lokerId,
    };
  }

  /**
   * Aktivasi membership setelah pembayaran lunas
   */
  static async aktivasiMembership(pelangganId: string, paketId: string, lokerId?: string) {
    const paket = await prisma.tb_paket_membership.findUnique({
      where: { id: paketId },
    });
    if (!paket) throw new Error('Paket tidak ditemukan.');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + paket.durasi_hari);

    return prisma.$transaction(async (tx) => {
      // Nonaktifkan membership aktif lama jika ada (untuk perpanjangan)
      await tx.tb_keanggotaan.updateMany({
        where: {
          id_pelanggan: pelangganId,
          status: 'aktif',
        },
        data: {
          status: 'kedaluwarsa',
        },
      });

      // Catat membership aktif baru
      const keanggotaanBaru = await tx.tb_keanggotaan.create({
        data: {
          id_pelanggan: pelangganId,
          id_paket_membership: paketId,
          id_loker: lokerId || null,
          tanggal_mulai: startDate,
          tanggal_berakhir: endDate,
          status: 'aktif',
        },
      });

      // Update status loker menjadi digunakan
      if (lokerId) {
        await tx.tb_loker.update({
          where: { id: lokerId },
          data: { status: 'digunakan' },
        });
      }

      return keanggotaanBaru;
    });
  }
}
