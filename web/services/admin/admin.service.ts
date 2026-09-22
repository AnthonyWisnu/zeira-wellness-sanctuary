import { prisma } from '../../src/db/prisma';

export class AdminService {
  /**
   * Ringkasan Statistik Utama Dashboard Admin
   */
  static async getDashboardMetrics() {
    const totalPengguna = await prisma.tb_pengguna.count();
    const totalMemberAktif = await prisma.tb_keanggotaan.count({
      where: {
        status: 'aktif',
        tanggal_berakhir: { gte: new Date() },
      },
    });

    const totalJadwalAktif = await prisma.tb_jadwal_sesi.count({
      where: { status_sesi: 'terjadwal' },
    });

    const totalLoker = await prisma.tb_loker.count();
    const lokerDigunakan = await prisma.tb_loker.count({
      where: { status: 'digunakan' },
    });

    const aggregateIncome = await prisma.tb_pesanan.aggregate({
      _sum: { total_bayar: true },
      where: { status_pembayaran: 'lunas' },
    });

    return {
      totalPengguna,
      totalMemberAktif,
      totalJadwalAktif,
      totalLoker,
      lokerDigunakan,
      lokerTersedia: totalLoker - lokerDigunakan,
      totalPendapatan: Number(aggregateIncome._sum.total_bayar || 0),
    };
  }

  /**
   * Manajemen Master Ruangan
   */
  static async getRuanganList() {
    return prisma.tb_ruangan.findMany({ orderBy: { nama_ruangan: 'asc' } });
  }

  static async createRuangan(nama: string, lokasi: string, kapasitas: number) {
    return prisma.tb_ruangan.create({
      data: {
        nama_ruangan: nama,
        lokasi,
        kapasitas_maksimal: kapasitas,
      },
    });
  }

  /**
   * Manajemen Master Kategori
   */
  static async getKategoriList() {
    return prisma.tb_kategori_layanan.findMany({ orderBy: { nama_kategori: 'asc' } });
  }

  static async createKategori(nama: string, slug: string, ikon?: string, deskripsi?: string) {
    return prisma.tb_kategori_layanan.create({
      data: {
        nama_kategori: nama,
        slug: slug.toLowerCase().trim().replace(/\s+/g, '-'),
        ikon: ikon || 'sparkle',
        deskripsi,
      },
    });
  }

  /**
   * Master Loker
   */
  static async getLokerList() {
    return prisma.tb_loker.findMany({
      include: {
        tb_keanggotaan: {
          where: { status: 'aktif', tanggal_berakhir: { gte: new Date() } },
          include: { tb_pengguna: true },
        },
      },
      orderBy: { nomor_loker: 'asc' },
    });
  }

  static async updateStatusLoker(lokerId: string, status: 'tersedia' | 'digunakan' | 'perawatan') {
    return prisma.tb_loker.update({
      where: { id: lokerId },
      data: { status },
    });
  }

  /**
   * Manajemen Jadwal Sesi Kelas
   */
  static async getJadwalList() {
    return prisma.tb_jadwal_sesi.findMany({
      include: {
        tb_kategori_layanan: true,
        tb_pengguna: true,
        tb_ruangan: true,
      },
      orderBy: { waktu_mulai: 'desc' },
    });
  }

  static async getDaftarPelatih() {
    return prisma.tb_pengguna.findMany({
      where: { peran: 'pelatih', status_aktif: true },
      include: { tb_profil_pelatih: true },
      orderBy: { nama_lengkap: 'asc' },
    });
  }

  static async createJadwal(data: {
    judul_sesi: string;
    id_kategori: string;
    id_pelatih: string;
    id_ruangan: string;
    waktu_mulai: Date;
    waktu_selesai: Date;
    kapasitas_maksimal: number;
    harga_non_member: number;
    harga_member: number;
    batas_batal_jam: number;
  }) {
    return prisma.tb_jadwal_sesi.create({
      data: {
        judul_sesi: data.judul_sesi,
        id_kategori: data.id_kategori,
        id_pelatih: data.id_pelatih,
        id_ruangan: data.id_ruangan,
        waktu_mulai: data.waktu_mulai,
        waktu_selesai: data.waktu_selesai,
        kapasitas_maksimal: data.kapasitas_maksimal,
        harga_non_member: data.harga_non_member,
        harga_member: data.harga_member,
        batas_batal_jam: data.batas_batal_jam,
        status_sesi: 'terjadwal',
      },
    });
  }

  static async updateStatusJadwal(jadwalId: string, status: 'terjadwal' | 'berlangsung' | 'selesai' | 'dibatalkan') {
    return prisma.tb_jadwal_sesi.update({
      where: { id: jadwalId },
      data: { status_sesi: status },
    });
  }

  /**
   * Rekapitulasi Pesanan & Audit Transaksi
   */
  static async getRekapPesanan() {
    const pesananList = await prisma.tb_pesanan.findMany({
      include: {
        tb_pengguna_tb_pesanan_id_pelangganTotb_pengguna: { select: { nama_lengkap: true, email: true } },
        tb_reservasi_sesi: {
          include: { tb_jadwal_sesi: { select: { judul_sesi: true } } },
        },
      },
      orderBy: { waktu_dibuat: 'desc' },
      take: 50,
    });

    return pesananList.map((p) => ({
      ...p,
      tb_pengguna: p.tb_pengguna_tb_pesanan_id_pelangganTotb_pengguna,
    }));
  }
}
