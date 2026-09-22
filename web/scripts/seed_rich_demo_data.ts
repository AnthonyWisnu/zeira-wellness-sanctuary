import { prisma } from '../src/db/prisma';

async function main() {
  const bcryptHash = await Bun.password.hash('password123', { algorithm: 'bcrypt', cost: 10 });

  // 1. Update/Create Anthony Wisnu Jati as Founder & Head Administrator
  const adminUser = await prisma.tb_pengguna.upsert({
    where: { email: 'admin@zeira.sanctuary' },
    update: {
      nama_lengkap: 'Anthony Wisnu Jati',
      kata_sandi_hash: bcryptHash,
      status_aktif: true,
      peran: 'admin',
    },
    create: {
      id: '11111111-1111-1111-1111-111111111112',
      nama_lengkap: 'Anthony Wisnu Jati',
      email: 'admin@zeira.sanctuary',
      kata_sandi_hash: bcryptHash,
      peran: 'admin',
      nomor_telepon: '081122334455',
      status_aktif: true,
    },
  });

  // Also ensure anthony.wisnu@zeira.sanctuary works
  await prisma.tb_pengguna.upsert({
    where: { email: 'anthony.wisnu@zeira.sanctuary' },
    update: {
      nama_lengkap: 'Anthony Wisnu Jati',
      kata_sandi_hash: bcryptHash,
      status_aktif: true,
      peran: 'admin',
    },
    create: {
      id: '11111111-1111-1111-1111-111111111113',
      nama_lengkap: 'Anthony Wisnu Jati',
      email: 'anthony.wisnu@zeira.sanctuary',
      kata_sandi_hash: bcryptHash,
      peran: 'admin',
      nomor_telepon: '081122334455',
      status_aktif: true,
    },
  });
  console.log('1. Admin Anthony Wisnu Jati successfully updated/created.');

  // 2. Ensure Sarah Jenkins is trainer
  const trainerSarah = await prisma.tb_pengguna.upsert({
    where: { email: 'sarah.jenkins@zeira.sanctuary' },
    update: {
      nama_lengkap: 'Sarah Jenkins',
      kata_sandi_hash: bcryptHash,
      status_aktif: true,
      peran: 'pelatih',
    },
    create: {
      id: '22222222-2222-2222-2222-222222222223',
      nama_lengkap: 'Sarah Jenkins',
      email: 'sarah.jenkins@zeira.sanctuary',
      kata_sandi_hash: bcryptHash,
      peran: 'pelatih',
      nomor_telepon: '081122334456',
      status_aktif: true,
    },
  });

  // Ensure trainer profile exists
  const existingSarahProfile = await prisma.tb_profil_pelatih.findFirst({
    where: { id_pengguna: trainerSarah.id },
  });
  if (!existingSarahProfile) {
    await prisma.tb_profil_pelatih.create({
      data: {
        id_pengguna: trainerSarah.id,
        spesialisasi: 'Sound Healing, Breathwork & Reformer Pilates',
        sertifikasi: 'E-RYT 500 Yoga Alliance, Certified Sound Healer',
        bio: 'Instruktur residen Zeira Sanctuary berdedikasi memandu relaksasi sistem saraf dan ketenangan holistik.',
        pengalaman_tahun: 8,
      },
    });
  }
  console.log('2. Trainer Sarah Jenkins profile verified.');

  // 3. Ensure I Kadek Adi Sunetra is active member
  const memberKadek = await prisma.tb_pengguna.upsert({
    where: { email: 'kadek.adi@gmail.com' },
    update: {
      nama_lengkap: 'I Kadek Adi Sunetra',
      kata_sandi_hash: bcryptHash,
      status_aktif: true,
      peran: 'pelanggan',
    },
    create: {
      id: '33333333-3333-3333-3333-333333333334',
      nama_lengkap: 'I Kadek Adi Sunetra',
      email: 'kadek.adi@gmail.com',
      kata_sandi_hash: bcryptHash,
      peran: 'pelanggan',
      nomor_telepon: '081234567892',
      status_aktif: true,
    },
  });

  // 4. Ensure Budi Santoso is guest
  const guestBudi = await prisma.tb_pengguna.upsert({
    where: { email: 'budi.santoso@gmail.com' },
    update: {
      nama_lengkap: 'Budi Santoso',
      kata_sandi_hash: bcryptHash,
      status_aktif: true,
      peran: 'pelanggan',
    },
    create: {
      id: '44444444-4444-4444-4444-444444444445',
      nama_lengkap: 'Budi Santoso',
      email: 'budi.santoso@gmail.com',
      kata_sandi_hash: bcryptHash,
      peran: 'pelanggan',
      nomor_telepon: '081234567800',
      status_aktif: true,
    },
  });

  // 5. Ensure member package & locker LK-02 for Kadek Adi
  const silverPkg = await prisma.tb_paket_membership.findFirst({
    where: { nama_paket: { contains: 'Silver' } },
  });
  const lockerLK02 = await prisma.tb_loker.findFirst({
    where: { nomor_loker: 'LK-02' },
  });

  if (silverPkg && lockerLK02) {
    // Delete any conflicting active membership for Kadek
    await prisma.tb_keanggotaan.deleteMany({
      where: { id_pelanggan: memberKadek.id },
    });

    await prisma.tb_keanggotaan.create({
      data: {
        id: 'a1000000-0000-0000-0000-000000000002',
        id_pelanggan: memberKadek.id,
        id_paket_membership: silverPkg.id,
        id_loker: lockerLK02.id,
        tanggal_mulai: new Date(),
        tanggal_berakhir: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'aktif',
      },
    });

    await prisma.tb_loker.update({
      where: { id: lockerLK02.id },
      data: { status: 'digunakan' },
    });
    console.log('3. Active membership & LK-02 linked to I Kadek Adi Sunetra.');
  }

  // 6. Create Classes for Sarah Jenkins TODAY and THIS WEEK
  const ruanganZen = await prisma.tb_ruangan.findFirst({
    where: { nama_ruangan: { contains: 'Shanti' } },
  });
  const ruanganReformer = await prisma.tb_ruangan.findFirst({
    where: { nama_ruangan: { contains: 'Prana' } },
  });
  const katYoga = await prisma.tb_kategori_layanan.findFirst({
    where: { slug: 'yoga-breathwork' },
  });
  const katPilates = await prisma.tb_kategori_layanan.findFirst({
    where: { slug: 'pilates-balance' },
  });

  if (ruanganZen && ruanganReformer && katYoga && katPilates) {
    const now = new Date();
    // Class 1 for Sarah: TODAY in 2 hours
    const class1Start = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const class1End = new Date(now.getTime() + 3.5 * 60 * 60 * 1000);

    const sarahClass1 = await prisma.tb_jadwal_sesi.upsert({
      where: { id: 'c0000000-0000-0000-0000-000000000010' },
      update: {
        id_pelatih: trainerSarah.id,
        waktu_mulai: class1Start,
        waktu_selesai: class1End,
        jumlah_terisi: 2,
        status_sesi: 'terjadwal',
      },
      create: {
        id: 'c0000000-0000-0000-0000-000000000010',
        judul_sesi: 'Tibetan Sound Bath & Breathwork Immersion',
        id_kategori: katYoga.id,
        id_pelatih: trainerSarah.id,
        id_ruangan: ruanganZen.id,
        waktu_mulai: class1Start,
        waktu_selesai: class1End,
        kapasitas_maksimal: 10,
        jumlah_terisi: 2,
        harga_non_member: 185000,
        harga_member: 85000,
        batas_batal_jam: 12,
        status_sesi: 'terjadwal',
      },
    });

    // Class 2 for Sarah: Tomorrow morning
    const class2Start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const class2End = new Date(now.getTime() + 25.5 * 60 * 60 * 1000);

    await prisma.tb_jadwal_sesi.upsert({
      where: { id: 'c0000000-0000-0000-0000-000000000011' },
      update: {
        id_pelatih: trainerSarah.id,
        waktu_mulai: class2Start,
        waktu_selesai: class2End,
        status_sesi: 'terjadwal',
      },
      create: {
        id: 'c0000000-0000-0000-0000-000000000011',
        judul_sesi: 'Reformer Pilates Core Alignment',
        id_kategori: katPilates.id,
        id_pelatih: trainerSarah.id,
        id_ruangan: ruanganReformer.id,
        waktu_mulai: class2Start,
        waktu_selesai: class2End,
        kapasitas_maksimal: 8,
        jumlah_terisi: 1,
        harga_non_member: 220000,
        harga_member: 110000,
        batas_batal_jam: 24,
        status_sesi: 'terjadwal',
      },
    });

    console.log('4. Two classes created for Sarah Jenkins (including today).');

    // 7. Create Reservations for Kadek Adi & Budi Santoso in Sarah's class
    // Order 1 for Kadek Adi
    const orderKadek = await prisma.tb_pesanan.upsert({
      where: { kode_pesanan: 'ORD-20260922-KAD-01' },
      update: { status_pembayaran: 'lunas' },
      create: {
        id: 'b1000000-0000-0000-0000-000000000021',
        kode_pesanan: 'ORD-20260922-KAD-01',
        id_pelanggan: memberKadek.id,
        tipe_pesanan: 'sesi',
        id_jadwal: sarahClass1.id,
        total_bayar: 85000,
        metode_pembayaran: 'qris',
        status_pembayaran: 'lunas',
        waktu_verifikasi: new Date(),
      },
    });

    // Ticket for Kadek Adi
    await prisma.tb_reservasi_sesi.upsert({
      where: { kode_reservasi: 'RSV-20260922-KAD-01' },
      update: {
        id_pelanggan: memberKadek.id,
        id_jadwal: sarahClass1.id,
        status_reservasi: 'dipesan',
      },
      create: {
        id: 'c1000000-0000-0000-0000-000000000021',
        kode_reservasi: 'RSV-20260922-KAD-01',
        id_pesanan: orderKadek.id,
        id_jadwal: sarahClass1.id,
        id_pelanggan: memberKadek.id,
        tipe_tarif: 'member',
        harga_dikenakan: 85000,
        status_reservasi: 'dipesan',
      },
    });

    // Order 2 for Budi Santoso (Guest)
    const orderBudi = await prisma.tb_pesanan.upsert({
      where: { kode_pesanan: 'ORD-20260922-BUD-02' },
      update: { status_pembayaran: 'lunas' },
      create: {
        id: 'b1000000-0000-0000-0000-000000000022',
        kode_pesanan: 'ORD-20260922-BUD-02',
        id_pelanggan: guestBudi.id,
        tipe_pesanan: 'sesi',
        id_jadwal: sarahClass1.id,
        total_bayar: 185000,
        metode_pembayaran: 'bank_transfer',
        status_pembayaran: 'lunas',
        waktu_verifikasi: new Date(),
      },
    });

    // Ticket for Budi Santoso
    await prisma.tb_reservasi_sesi.upsert({
      where: { kode_reservasi: 'RSV-20260922-BUD-02' },
      update: {
        id_pelanggan: guestBudi.id,
        id_jadwal: sarahClass1.id,
        status_reservasi: 'dipesan',
      },
      create: {
        id: 'c1000000-0000-0000-0000-000000000022',
        kode_reservasi: 'RSV-20260922-BUD-02',
        id_pesanan: orderBudi.id,
        id_jadwal: sarahClass1.id,
        id_pelanggan: guestBudi.id,
        tipe_tarif: 'non_member',
        harga_dikenakan: 185000,
        status_reservasi: 'dipesan',
      },
    });

    // Ticket 2 for Kadek Adi: Tomorrow's class
    const orderKadek2 = await prisma.tb_pesanan.upsert({
      where: { kode_pesanan: 'ORD-20260922-KAD-02' },
      update: { status_pembayaran: 'lunas' },
      create: {
        id: 'b1000000-0000-0000-0000-000000000023',
        kode_pesanan: 'ORD-20260922-KAD-02',
        id_pelanggan: memberKadek.id,
        tipe_pesanan: 'sesi',
        id_jadwal: 'c0000000-0000-0000-0000-000000000011',
        total_bayar: 110000,
        metode_pembayaran: 'qris',
        status_pembayaran: 'lunas',
        waktu_verifikasi: new Date(),
      },
    });

    await prisma.tb_reservasi_sesi.upsert({
      where: { kode_reservasi: 'RSV-20260922-KAD-02' },
      update: {
        id_pelanggan: memberKadek.id,
        id_jadwal: 'c0000000-0000-0000-0000-000000000011',
        status_reservasi: 'dipesan',
      },
      create: {
        id: 'c1000000-0000-0000-0000-000000000023',
        kode_reservasi: 'RSV-20260922-KAD-02',
        id_pesanan: orderKadek2.id,
        id_jadwal: 'c0000000-0000-0000-0000-000000000011',
        id_pelanggan: memberKadek.id,
        tipe_tarif: 'member',
        harga_dikenakan: 110000,
        status_reservasi: 'dipesan',
      },
    });

    console.log('5. Confirmed tickets generated for Kadek Adi & Budi Santoso in Sarah\'s class.');
  }

  console.log('ALL RICH DEMO DATA SUCCESSFULLY SEEDED!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error seeding rich demo data:', err);
  process.exit(1);
});
