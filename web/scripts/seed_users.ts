import { prisma } from '../src/db/prisma';

async function main() {
  const bcryptHash = await Bun.password.hash('password123', { algorithm: 'bcrypt', cost: 10 });
  console.log('Using bcrypt hash for password123:', bcryptHash);

  // 1. Update existing 4 seed users with bcrypt hash
  await prisma.tb_pengguna.updateMany({
    where: {
      email: {
        in: [
          'admin@wellness.com',
          'trainer.bima@wellness.com',
          'kadek.adi@wellness.com',
          'putu.ayu@wellness.com',
        ],
      },
    },
    data: {
      kata_sandi_hash: bcryptHash,
      status_aktif: true,
    },
  });
  console.log('Updated existing 4 users with bcrypt hash.');

  // 2. Upsert admin@zeira.sanctuary
  await prisma.tb_pengguna.upsert({
    where: { email: 'admin@zeira.sanctuary' },
    update: { kata_sandi_hash: bcryptHash, status_aktif: true },
    create: {
      id: '11111111-1111-1111-1111-111111111112',
      nama_lengkap: 'Head Administrator',
      email: 'admin@zeira.sanctuary',
      kata_sandi_hash: bcryptHash,
      peran: 'admin',
      nomor_telepon: '081122334455',
      status_aktif: true,
    },
  });

  // 3. Upsert sarah.jenkins@zeira.sanctuary (Trainer)
  const trainer = await prisma.tb_pengguna.upsert({
    where: { email: 'sarah.jenkins@zeira.sanctuary' },
    update: { kata_sandi_hash: bcryptHash, status_aktif: true },
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
  const existingProfile = await prisma.tb_profil_pelatih.findFirst({
    where: { id_pengguna: trainer.id },
  });
  if (!existingProfile) {
    await prisma.tb_profil_pelatih.create({
      data: {
        id_pengguna: trainer.id,
        spesialisasi: 'Vinyasa Flow & Sound Bath',
        sertifikasi: 'E-RYT 500 Yoga Alliance, Sound Healing Master',
        bio: 'Instruktur residen Zeira Sanctuary dengan pengalaman 8 tahun dalam breathwork dan yoga restoratif.',
        pengalaman_tahun: 8,
      },
    });
  }

  // 4. Upsert budi.santoso@gmail.com (Tamu)
  await prisma.tb_pengguna.upsert({
    where: { email: 'budi.santoso@gmail.com' },
    update: { kata_sandi_hash: bcryptHash, status_aktif: true },
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

  // 5. Upsert kadek.adi@gmail.com (Member Aktif)
  const member = await prisma.tb_pengguna.upsert({
    where: { email: 'kadek.adi@gmail.com' },
    update: { kata_sandi_hash: bcryptHash, status_aktif: true },
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

  // Check if member already has active membership
  const activeMbr = await prisma.tb_keanggotaan.findFirst({
    where: { id_pelanggan: member.id, status: 'aktif' },
  });
  if (!activeMbr) {
    const pkg = await prisma.tb_paket_membership.findFirst();
    const locker = await prisma.tb_loker.findFirst({ where: { status: 'tersedia' } });
    if (pkg && locker) {
      await prisma.tb_keanggotaan.create({
        data: {
          id_pelanggan: member.id,
          id_paket_membership: pkg.id,
          id_loker: locker.id,
          tanggal_mulai: new Date(),
          tanggal_berakhir: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'aktif',
        },
      });
      await prisma.tb_loker.update({
        where: { id: locker.id },
        data: { status: 'digunakan' },
      });
    }
  }

  console.log('All demo users successfully seeded and verified!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error seeding demo users:', err);
  process.exit(1);
});
