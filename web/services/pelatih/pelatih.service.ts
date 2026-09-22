import { prisma } from '../../src/db/prisma';

export class PelatihService {
  /**
   * Mengambil daftar sesi kelas yang diajar pelatih hari ini / mendatang
   */
  static async getJadwalPelatih(pelatihId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const result = await prisma.tb_jadwal_sesi.findMany({
      where: {
        id_pelatih: pelatihId,
        waktu_mulai: { gte: todayStart },
      },
      include: {
        tb_kategori_layanan: true,
        tb_ruangan: true,
        tb_reservasi_sesi: {
          where: {
            status_reservasi: { in: ['dipesan', 'hadir', 'tidak_hadir'] },
          },
          include: {
            tb_pengguna_tb_reservasi_sesi_id_pelangganTotb_pengguna: {
              select: {
                id: true,
                nama_lengkap: true,
                email: true,
                nomor_telepon: true,
              },
            },
          },
        },
      },
      orderBy: { waktu_mulai: 'asc' },
    });

    return result.map(sesi => ({
      ...sesi,
      tb_reservasi_sesi: sesi.tb_reservasi_sesi.map(r => ({
        ...r,
        tb_pengguna: (r as any).tb_pengguna_tb_reservasi_sesi_id_pelangganTotb_pengguna || (r as any).tb_pengguna,
      })),
    }));
  }

  /**
   * Mengambil daftar presensi peserta untuk suatu sesi kelas tertentu
   */
  static async getPesertaSesi(pelatihId: string, jadwalId: string) {
    const sesi = await prisma.tb_jadwal_sesi.findFirst({
      where: {
        id: jadwalId,
        id_pelatih: pelatihId,
      },
      include: {
        tb_ruangan: true,
        tb_kategori_layanan: true,
        tb_reservasi_sesi: {
          where: {
            status_reservasi: { in: ['dipesan', 'hadir', 'tidak_hadir'] },
          },
          include: {
            tb_pengguna_tb_reservasi_sesi_id_pelangganTotb_pengguna: {
              select: {
                id: true,
                nama_lengkap: true,
                email: true,
                nomor_telepon: true,
              },
            },
          },
          orderBy: { waktu_dibuat: 'asc' },
        },
      },
    });

    if (!sesi) {
      throw new Error('Sesi kelas tidak ditemukan atau Anda bukan instruktur yang ditugaskan.');
    }

    return {
      ...sesi,
      tb_reservasi_sesi: sesi.tb_reservasi_sesi.map(r => ({
        ...r,
        tb_pengguna: r.tb_pengguna_tb_reservasi_sesi_id_pelangganTotb_pengguna,
      })),
    };
  }

  /**
   * Verifikasi Kehadiran Fisik Peserta di Studio (Trainer Attendance Verification)
   */
  static async verifikasiKehadiran(pelatihId: string, reservasiId: string, statusKehadiran: 'hadir' | 'tidak_hadir') {
    const reservasi = await prisma.tb_reservasi_sesi.findUnique({
      where: { id: reservasiId },
      include: { tb_jadwal_sesi: true },
    });

    if (!reservasi) throw new Error('Tiket peserta tidak ditemukan.');
    if (reservasi.tb_jadwal_sesi.id_pelatih !== pelatihId) {
      throw new Error('Hanya pelatih yang mengajar kelas ini yang berhak memverifikasi kehadiran peserta.');
    }

    return prisma.tb_reservasi_sesi.update({
      where: { id: reservasiId },
      data: {
        status_reservasi: statusKehadiran,
        diabsen_oleh_pelatih_id: pelatihId,
        waktu_absensi: statusKehadiran === 'hadir' ? new Date() : null,
      },
    });
  }

  /**
   * Menyelesaikan sesi kelas
   */
  static async selesaikanSesi(pelatihId: string, jadwalId: string) {
    const sesi = await prisma.tb_jadwal_sesi.findFirst({
      where: { id: jadwalId, id_pelatih: pelatihId },
    });

    if (!sesi) throw new Error('Sesi tidak ditemukan.');

    return prisma.tb_jadwal_sesi.update({
      where: { id: jadwalId },
      data: { status_sesi: 'selesai' },
    });
  }
}
