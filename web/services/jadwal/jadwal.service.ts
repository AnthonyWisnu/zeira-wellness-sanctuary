import { prisma } from '../../src/db/prisma';

export interface JadwalItemView {
  id: string;
  judul_sesi: string;
  kategori: {
    id: string;
    nama: string;
    slug: string;
    ikon: string | null;
  };
  pelatih: {
    id: string;
    nama: string;
    spesialisasi?: string;
  };
  ruangan: {
    id: string;
    nama: string;
    lokasi: string;
  };
  waktu_mulai: Date;
  waktu_selesai: Date;
  kapasitas_maksimal: number;
  jumlah_terisi: number;
  sisa_kuota: number;
  status_kuota: 'TERSEDIA' | 'HAMPIR_PENUH' | 'PENUH';
  harga_non_member: number;
  harga_member: number;
  harga_efektif: number;
  batas_batal_jam: number;
  status_sesi: string;
  isLockedForGuest: boolean;
  daysFromNow: number;
}

export class JadwalService {
  /**
   * Mengambil katalog jadwal dengan penegakan Vision Window Law (30 Hari Member vs 7 Hari Tamu)
   */
  static async getKatalogJadwal(isMemberAktif: boolean = false, kategoriSlug?: string): Promise<{
    jadwal: JadwalItemView[];
    kategoriList: { id: string; nama_kategori: string; slug: string; ikon: string | null }[];
  }> {
    const now = new Date();
    // Vision window horizon
    const maxHorizonDate = new Date();
    maxHorizonDate.setDate(maxHorizonDate.getDate() + 30); // Ambil data hingga 30 hari untuk dirender (tamu melihat hari 8-30 terkunci)

    const kategoriList = await prisma.tb_kategori_layanan.findMany({
      where: { status_aktif: true },
      orderBy: { nama_kategori: 'asc' },
    });

    const whereClause: any = {
      waktu_mulai: {
        gte: now,
        lte: maxHorizonDate,
      },
      status_sesi: { in: ['terjadwal', 'berlangsung'] },
    };

    if (kategoriSlug && kategoriSlug !== 'semua') {
      whereClause.tb_kategori_layanan = { slug: kategoriSlug };
    }

    const rawJadwal = await prisma.tb_jadwal_sesi.findMany({
      where: whereClause,
      include: {
        tb_kategori_layanan: true,
        tb_pengguna: {
          include: { tb_profil_pelatih: true },
        },
        tb_ruangan: true,
      },
      orderBy: { waktu_mulai: 'asc' },
    });

    const formatted: JadwalItemView[] = rawJadwal.map((sesi) => {
      const msDiff = sesi.waktu_mulai.getTime() - now.getTime();
      const daysFromNow = Math.floor(msDiff / (1000 * 60 * 60 * 24));
      const isLockedForGuest = !isMemberAktif && daysFromNow > 7;

      const sisa = Math.max(0, sesi.kapasitas_maksimal - sesi.jumlah_terisi);
      let status_kuota: 'TERSEDIA' | 'HAMPIR_PENUH' | 'PENUH' = 'TERSEDIA';
      if (sisa === 0) status_kuota = 'PENUH';
      else if (sisa <= 2) status_kuota = 'HAMPIR_PENUH';

      const hargaMember = Number(sesi.harga_member);
      const hargaNonMember = Number(sesi.harga_non_member);
      const hargaEfektif = isMemberAktif ? hargaMember : hargaNonMember;

      return {
        id: sesi.id,
        judul_sesi: sesi.judul_sesi,
        kategori: {
          id: sesi.tb_kategori_layanan.id,
          nama: sesi.tb_kategori_layanan.nama_kategori,
          slug: sesi.tb_kategori_layanan.slug,
          ikon: sesi.tb_kategori_layanan.ikon,
        },
        pelatih: {
          id: sesi.tb_pengguna.id,
          nama: sesi.tb_pengguna.nama_lengkap,
          spesialisasi: sesi.tb_pengguna.tb_profil_pelatih?.spesialisasi,
        },
        ruangan: {
          id: sesi.tb_ruangan.id,
          nama: sesi.tb_ruangan.nama_ruangan,
          lokasi: sesi.tb_ruangan.lokasi,
        },
        waktu_mulai: sesi.waktu_mulai,
        waktu_selesai: sesi.waktu_selesai,
        kapasitas_maksimal: sesi.kapasitas_maksimal,
        jumlah_terisi: sesi.jumlah_terisi,
        sisa_kuota: sisa,
        status_kuota,
        harga_non_member: hargaNonMember,
        harga_member: hargaMember,
        harga_efektif: hargaEfektif,
        batas_batal_jam: sesi.batas_batal_jam,
        status_sesi: sesi.status_sesi,
        isLockedForGuest,
        daysFromNow,
      };
    });

    return {
      jadwal: formatted,
      kategoriList,
    };
  }

  /**
   * Mengambil detail sesi spesifik berdasarkan ID
   */
  static async getJadwalById(id: string, isMemberAktif: boolean = false): Promise<JadwalItemView | null> {
    const sesi = await prisma.tb_jadwal_sesi.findUnique({
      where: { id },
      include: {
        tb_kategori_layanan: true,
        tb_pengguna: {
          include: { tb_profil_pelatih: true },
        },
        tb_ruangan: true,
      },
    });

    if (!sesi) return null;

    const now = new Date();
    const msDiff = sesi.waktu_mulai.getTime() - now.getTime();
    const daysFromNow = Math.floor(msDiff / (1000 * 60 * 60 * 24));
    const isLockedForGuest = !isMemberAktif && daysFromNow > 7;

    const sisa = Math.max(0, sesi.kapasitas_maksimal - sesi.jumlah_terisi);
    let status_kuota: 'TERSEDIA' | 'HAMPIR_PENUH' | 'PENUH' = 'TERSEDIA';
    if (sisa === 0) status_kuota = 'PENUH';
    else if (sisa <= 2) status_kuota = 'HAMPIR_PENUH';

    const hargaMember = Number(sesi.harga_member);
    const hargaNonMember = Number(sesi.harga_non_member);

    return {
      id: sesi.id,
      judul_sesi: sesi.judul_sesi,
      kategori: {
        id: sesi.tb_kategori_layanan.id,
        nama: sesi.tb_kategori_layanan.nama_kategori,
        slug: sesi.tb_kategori_layanan.slug,
        ikon: sesi.tb_kategori_layanan.ikon,
      },
      pelatih: {
        id: sesi.tb_pengguna.id,
        nama: sesi.tb_pengguna.nama_lengkap,
        spesialisasi: sesi.tb_pengguna.tb_profil_pelatih?.spesialisasi,
      },
      ruangan: {
        id: sesi.tb_ruangan.id,
        nama: sesi.tb_ruangan.nama_ruangan,
        lokasi: sesi.tb_ruangan.lokasi,
      },
      waktu_mulai: sesi.waktu_mulai,
      waktu_selesai: sesi.waktu_selesai,
      kapasitas_maksimal: sesi.kapasitas_maksimal,
      jumlah_terisi: sesi.jumlah_terisi,
      sisa_kuota: sisa,
      status_kuota,
      harga_non_member: hargaNonMember,
      harga_member: hargaMember,
      harga_efektif: isMemberAktif ? hargaMember : hargaNonMember,
      batas_batal_jam: sesi.batas_batal_jam,
      status_sesi: sesi.status_sesi,
      isLockedForGuest,
      daysFromNow,
    };
  }
}
