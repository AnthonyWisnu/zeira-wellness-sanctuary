-- ============================================================================
-- SKEMA BASIS DATA POSTGRESQL 16 NATIVE - WELLNESS CLUB WEB RESERVASI
-- Standar: PostgreSQL 16 Native (Zero uuid-ossp, Pure gen_random_uuid())
-- Konvensi: Prefix tb_* dengan Atribut Bahasa Indonesia Baku
-- Model Bisnis: Membership Masa Aktif (Dedicated Locker, Pool, Mineral Water)
--               + Non-Member Drop-in Sesi & Fleksibilitas Tarif Admin
-- Integritas Data: Partial Unique Index, Atomic Concurrency (SELECT FOR UPDATE)
-- ============================================================================

-- Bersihkan objek lama jika ada untuk idempotensi setup
DROP VIEW IF EXISTS v_status_loker CASCADE;
DROP VIEW IF EXISTS v_katalog_sesi_tersedia CASCADE;
DROP TABLE IF EXISTS tb_reservasi_sesi CASCADE;
DROP TABLE IF EXISTS tb_pesanan CASCADE;
DROP TABLE IF EXISTS tb_jadwal_sesi CASCADE;
DROP TABLE IF EXISTS tb_keanggotaan CASCADE;
DROP TABLE IF EXISTS tb_paket_membership CASCADE;
DROP TABLE IF EXISTS tb_loker CASCADE;
DROP TABLE IF EXISTS tb_ruangan CASCADE;
DROP TABLE IF EXISTS tb_kategori_layanan CASCADE;
DROP TABLE IF EXISTS tb_profil_pelatih CASCADE;
DROP TABLE IF EXISTS tb_pengguna CASCADE;
DROP FUNCTION IF EXISTS fn_set_timestamp_diperbarui CASCADE;

-- ============================================================================
-- FUNGSI TRIGGER: AUTO-UPDATE TIMESTAMP WAKTU_DIPERBARUI
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_set_timestamp_diperbarui()
RETURNS TRIGGER AS $$
BEGIN
    NEW.waktu_diperbarui = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. TABEL PENGGUNA (Akun Pusat Autentikasi & Otorisasi RBAC)
-- ============================================================================
CREATE TABLE tb_pengguna (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_lengkap VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    nomor_telepon VARCHAR(25),
    kata_sandi_hash VARCHAR(255) NOT NULL,
    peran VARCHAR(20) NOT NULL DEFAULT 'pelanggan' 
        CHECK (peran IN ('admin', 'pelatih', 'pelanggan')),
    status_aktif BOOLEAN NOT NULL DEFAULT true,
    waktu_dibuat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    waktu_diperbarui TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pengguna_email ON tb_pengguna(email);
CREATE INDEX idx_pengguna_peran ON tb_pengguna(peran);

CREATE TRIGGER trg_pengguna_diperbarui
    BEFORE UPDATE ON tb_pengguna
    FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp_diperbarui();

-- ============================================================================
-- 2. TABEL PROFIL PELATIH (Data Spesialisasi & Sertifikasi Trainer)
-- ============================================================================
CREATE TABLE tb_profil_pelatih (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pengguna UUID NOT NULL UNIQUE REFERENCES tb_pengguna(id) ON DELETE CASCADE,
    spesialisasi VARCHAR(150) NOT NULL, -- Contoh: 'Ashtanga & Vinyasa Yoga Flow'
    sertifikasi TEXT,                  -- Contoh: 'RYT-500 Yoga Alliance, STOTT Pilates'
    bio TEXT,
    pengalaman_tahun INTEGER NOT NULL DEFAULT 1 CHECK (pengalaman_tahun >= 0),
    waktu_dibuat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    waktu_diperbarui TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profil_pelatih_pengguna ON tb_profil_pelatih(id_pengguna);

CREATE TRIGGER trg_profil_pelatih_diperbarui
    BEFORE UPDATE ON tb_profil_pelatih
    FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp_diperbarui();

-- ============================================================================
-- 3. TABEL KATEGORI LAYANAN (Kelompok Kelas & Terapi Relaksasi)
-- ============================================================================
CREATE TABLE tb_kategori_layanan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kategori VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    deskripsi TEXT,
    ikon VARCHAR(50), -- Nama ikon: 'sparkles', 'activity', 'flame'
    status_aktif BOOLEAN NOT NULL DEFAULT true,
    waktu_dibuat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    waktu_diperbarui TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_kategori_layanan_diperbarui
    BEFORE UPDATE ON tb_kategori_layanan
    FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp_diperbarui();

-- ============================================================================
-- 4. TABEL RUANGAN (Studio & Fasilitas dengan Pembatasan Kapasitas Ketenangan)
-- ============================================================================
CREATE TABLE tb_ruangan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_ruangan VARCHAR(100) NOT NULL UNIQUE,
    lokasi VARCHAR(100) NOT NULL, -- Contoh: 'Lantai 2 Sayap Timur'
    kapasitas_maksimal INTEGER NOT NULL CHECK (kapasitas_maksimal > 0),
    status_aktif BOOLEAN NOT NULL DEFAULT true,
    catatan TEXT,
    waktu_dibuat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    waktu_diperbarui TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_ruangan_diperbarui
    BEFORE UPDATE ON tb_ruangan
    FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp_diperbarui();

-- ============================================================================
-- 5. TABEL LOKER (Lemari Loker Pribadi Khusus Member - Dedicated Locker)
-- Catatan Arsitektur: 
-- Kepemilikan aktual dikontrol secara dinamis melalui tb_keanggotaan aktif
-- dengan Partial Unique Index untuk mencegah over-assignment secara atomik.
-- ============================================================================
CREATE TABLE tb_loker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_loker VARCHAR(20) NOT NULL UNIQUE, -- Contoh: 'LK-01', 'LK-02'
    lokasi_area VARCHAR(50) NOT NULL DEFAULT 'Locker Room Utama',
    status VARCHAR(20) NOT NULL DEFAULT 'tersedia'
        CHECK (status IN ('tersedia', 'digunakan', 'perawatan')),
    catatan TEXT,
    waktu_dibuat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    waktu_diperbarui TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_loker_status ON tb_loker(status);

CREATE TRIGGER trg_loker_diperbarui
    BEFORE UPDATE ON tb_loker
    FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp_diperbarui();

-- ============================================================================
-- 6. TABEL PAKET MEMBERSHIP (Katalog Langganan Durasi Keanggotaan)
-- ============================================================================
CREATE TABLE tb_paket_membership (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_paket VARCHAR(100) NOT NULL UNIQUE, -- Contoh: 'Silver Wellness (1 Bulan)'
    durasi_hari INTEGER NOT NULL CHECK (durasi_hari > 0), -- 30, 90, 365
    harga NUMERIC(12, 2) NOT NULL CHECK (harga >= 0),
    fasilitas_deskripsi TEXT NOT NULL, -- Akses kolam renang, air sehat, dedicated locker
    status_aktif BOOLEAN NOT NULL DEFAULT true,
    waktu_dibuat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    waktu_diperbarui TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_paket_membership_diperbarui
    BEFORE UPDATE ON tb_paket_membership
    FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp_diperbarui();

-- ============================================================================
-- 7. TABEL KEANGGOTAAN (Masa Aktif Member & Relasi Lemari Loker Tetap)
-- Aturan Integritas:
-- 1. Satu pelanggan hanya boleh memiliki 1 keanggotaan aktif dalam satu masa.
-- 2. Satu loker hanya boleh diikat oleh 1 keanggotaan aktif dalam satu masa.
-- (Menggunakan Partial Unique Index agar riwayat lama tidak memblokir sewa baru).
-- ============================================================================
CREATE TABLE tb_keanggotaan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pelanggan UUID NOT NULL REFERENCES tb_pengguna(id) ON DELETE CASCADE,
    id_paket_membership UUID NOT NULL REFERENCES tb_paket_membership(id) ON DELETE RESTRICT,
    id_loker UUID REFERENCES tb_loker(id) ON DELETE SET NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_berakhir DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'aktif'
        CHECK (status IN ('aktif', 'kedaluwarsa', 'dibatalkan')),
    catatan TEXT,
    waktu_dibuat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    waktu_diperbarui TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_tanggal_keanggotaan CHECK (tanggal_berakhir >= tanggal_mulai)
);

CREATE INDEX idx_keanggotaan_pelanggan ON tb_keanggotaan(id_pelanggan);
CREATE INDEX idx_keanggotaan_status ON tb_keanggotaan(status);
CREATE INDEX idx_keanggotaan_tanggal ON tb_keanggotaan(tanggal_berakhir);

-- PARTIAL UNIQUE INDEX 1: Maksimal 1 membership aktif per pelanggan
CREATE UNIQUE INDEX uq_keanggotaan_aktif_pelanggan
    ON tb_keanggotaan(id_pelanggan)
    WHERE status = 'aktif';

-- PARTIAL UNIQUE INDEX 2: Maksimal 1 penyewa aktif per lemari loker
CREATE UNIQUE INDEX uq_loker_aktif_keanggotaan
    ON tb_keanggotaan(id_loker)
    WHERE status = 'aktif' AND id_loker IS NOT NULL;

CREATE TRIGGER trg_keanggotaan_diperbarui
    BEFORE UPDATE ON tb_keanggotaan
    FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp_diperbarui();

-- ============================================================================
-- 8. TABEL JADWAL SESI (Sesi Kelas dengan Tarif Dinamis & Batas Batal)
-- Aturan Integritas:
-- 1. kapasitas_maksimal harus > 0.
-- 2. jumlah_terisi tidak boleh melebihi kapasitas_maksimal (Hard DB Lock).
-- 3. waktu_selesai harus lebih besar dari waktu_mulai.
-- ============================================================================
CREATE TABLE tb_jadwal_sesi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judul_sesi VARCHAR(150) NOT NULL,
    id_kategori UUID NOT NULL REFERENCES tb_kategori_layanan(id) ON DELETE RESTRICT,
    id_pelatih UUID NOT NULL REFERENCES tb_pengguna(id) ON DELETE RESTRICT,
    id_ruangan UUID NOT NULL REFERENCES tb_ruangan(id) ON DELETE RESTRICT,
    waktu_mulai TIMESTAMP WITH TIME ZONE NOT NULL,
    waktu_selesai TIMESTAMP WITH TIME ZONE NOT NULL,
    kapasitas_maksimal INTEGER NOT NULL CHECK (kapasitas_maksimal > 0),
    jumlah_terisi INTEGER NOT NULL DEFAULT 0 CHECK (jumlah_terisi >= 0),
    harga_non_member NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (harga_non_member >= 0),
    harga_member NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (harga_member >= 0),
    batas_batal_jam INTEGER NOT NULL DEFAULT 24 CHECK (batas_batal_jam >= 0), -- Pilihan: 24, 12, 48, atau 0
    status_sesi VARCHAR(20) NOT NULL DEFAULT 'terjadwal'
        CHECK (status_sesi IN ('terjadwal', 'berlangsung', 'selesai', 'dibatalkan')),
    waktu_dibuat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    waktu_diperbarui TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_waktu_sesi CHECK (waktu_selesai > waktu_mulai),
    CONSTRAINT check_kapasitas_terisi CHECK (jumlah_terisi <= kapasitas_maksimal)
);

CREATE INDEX idx_jadwal_rentang_waktu ON tb_jadwal_sesi(waktu_mulai, waktu_selesai);
CREATE INDEX idx_jadwal_pelatih ON tb_jadwal_sesi(id_pelatih);
CREATE INDEX idx_jadwal_ruangan ON tb_jadwal_sesi(id_ruangan);
CREATE INDEX idx_jadwal_status ON tb_jadwal_sesi(status_sesi);

CREATE TRIGGER trg_jadwal_sesi_diperbarui
    BEFORE UPDATE ON tb_jadwal_sesi
    FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp_diperbarui();

-- ============================================================================
-- 9. TABEL PESANAN (Transaksi Pembayaran Midtrans Snap / Manual Transfer)
-- Fitur Keamanan & Audit:
-- 1. snap_token & id_transaksi_gateway untuk integrasi Midtrans Snap Sandbox.
-- 2. signature_key_terakhir untuk jejak audit validasi SHA-512 webhook Midtrans.
-- 3. payload_gateway untuk menyimpan rekaman data mentah webhook gateway.
-- 4. waktu_kedaluwarsa untuk mekanisme timer kunci kursi sementara 15 menit.
-- ============================================================================
CREATE TABLE tb_pesanan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_pesanan VARCHAR(50) NOT NULL UNIQUE, -- 'ORD-20260908-001' (order_id resmi di Midtrans)
    id_pelanggan UUID NOT NULL REFERENCES tb_pengguna(id) ON DELETE CASCADE,
    tipe_pesanan VARCHAR(20) NOT NULL 
        CHECK (tipe_pesanan IN ('membership', 'sesi')),
    id_paket_membership UUID REFERENCES tb_paket_membership(id) ON DELETE SET NULL,
    id_jadwal UUID REFERENCES tb_jadwal_sesi(id) ON DELETE SET NULL,
    total_bayar NUMERIC(12, 2) NOT NULL CHECK (total_bayar >= 0),
    metode_pembayaran VARCHAR(50), -- 'qris', 'bank_transfer', 'gopay', 'manual_transfer'
    snap_token VARCHAR(255),       -- Token Snap dari Midtrans untuk modal popup
    snap_redirect_url TEXT,        -- URL redirect alternatif dari Midtrans
    id_transaksi_gateway VARCHAR(100), -- transaction_id resmi dari Midtrans
    signature_key_terakhir VARCHAR(255), -- Jejak audit hash SHA-512 webhook
    payload_gateway JSONB,         -- Raw payload JSON dari webhook Midtrans
    waktu_kedaluwarsa TIMESTAMP WITH TIME ZONE, -- Batas bayar kunci kursi (15 menit)
    bukti_transfer VARCHAR(255),   -- URL/Path bukti transfer jika manual
    status_pembayaran VARCHAR(25) NOT NULL DEFAULT 'menunggu_pembayaran'
        CHECK (status_pembayaran IN ('menunggu_pembayaran', 'menunggu_verifikasi', 'lunas', 'kedaluwarsa', 'dibatalkan', 'gagal')),
    diverifikasi_oleh UUID REFERENCES tb_pengguna(id) ON DELETE SET NULL,
    waktu_verifikasi TIMESTAMP WITH TIME ZONE,
    catatan_verifikasi TEXT,
    waktu_dibuat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    waktu_diperbarui TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pesanan_pelanggan ON tb_pesanan(id_pelanggan);
CREATE INDEX idx_pesanan_status ON tb_pesanan(status_pembayaran);
CREATE INDEX idx_pesanan_kode ON tb_pesanan(kode_pesanan);
CREATE INDEX idx_pesanan_kedaluwarsa ON tb_pesanan(waktu_kedaluwarsa) 
    WHERE status_pembayaran = 'menunggu_pembayaran';

CREATE TRIGGER trg_pesanan_diperbarui
    BEFORE UPDATE ON tb_pesanan
    FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp_diperbarui();

-- ============================================================================
-- 10. TABEL RESERVASI SESI (Tiket Booking Sesi, Tarif, & Absensi Pelatih)
-- Aturan Integritas:
-- 1. Pelanggan dilarang memiliki 2 reservasi AKTIF pada sesi yang sama.
-- 2. Menggunakan PARTIAL UNIQUE INDEX agar jika pelanggan membatalkan reservasi
--    atau pembayarannya kedaluwarsa, pelanggan BISA memesan ulang sesi tersebut!
-- ============================================================================
CREATE TABLE tb_reservasi_sesi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_reservasi VARCHAR(50) NOT NULL UNIQUE, -- 'RSV-20260908-001'
    id_pesanan UUID REFERENCES tb_pesanan(id) ON DELETE SET NULL,
    id_jadwal UUID NOT NULL REFERENCES tb_jadwal_sesi(id) ON DELETE CASCADE,
    id_pelanggan UUID NOT NULL REFERENCES tb_pengguna(id) ON DELETE CASCADE,
    tipe_tarif VARCHAR(20) NOT NULL DEFAULT 'non_member'
        CHECK (tipe_tarif IN ('member', 'non_member')),
    harga_dikenakan NUMERIC(12, 2) NOT NULL CHECK (harga_dikenakan >= 0),
    status_reservasi VARCHAR(20) NOT NULL DEFAULT 'menunggu_pembayaran'
        CHECK (status_reservasi IN ('menunggu_pembayaran', 'dipesan', 'hadir', 'tidak_hadir', 'dibatalkan', 'kedaluwarsa')),
    waktu_absensi TIMESTAMP WITH TIME ZONE,
    diabsen_oleh_pelatih_id UUID REFERENCES tb_pengguna(id) ON DELETE SET NULL,
    alasan_batal TEXT,
    waktu_dibuat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    waktu_diperbarui TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reservasi_jadwal ON tb_reservasi_sesi(id_jadwal);
CREATE INDEX idx_reservasi_pelanggan ON tb_reservasi_sesi(id_pelanggan);
CREATE INDEX idx_reservasi_status ON tb_reservasi_sesi(status_reservasi);

-- PARTIAL UNIQUE INDEX: Mencegah pemesanan ganda HANYA untuk status yang masih mengikat kursi.
-- Status 'dibatalkan' dan 'kedaluwarsa' TIDAK diindeks, sehingga pelanggan bebas pesan ulang!
CREATE UNIQUE INDEX uq_reservasi_aktif_pelanggan_sesi
    ON tb_reservasi_sesi(id_jadwal, id_pelanggan)
    WHERE status_reservasi IN ('menunggu_pembayaran', 'dipesan', 'hadir');

CREATE TRIGGER trg_reservasi_sesi_diperbarui
    BEFORE UPDATE ON tb_reservasi_sesi
    FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp_diperbarui();

-- ============================================================================
-- VIEW ANALITIK & OPERASIONAL
-- ============================================================================

-- View 1: Katalog Jadwal Sesi Tersedia (Real-time Sisa Kuota & Status Keterisian)
CREATE OR REPLACE VIEW v_katalog_sesi_tersedia AS
SELECT 
    j.id AS id_jadwal,
    j.judul_sesi,
    k.nama_kategori,
    k.slug AS slug_kategori,
    p.nama_lengkap AS nama_pelatih,
    pp.spesialisasi AS spesialisasi_pelatih,
    r.nama_ruangan,
    r.lokasi AS lokasi_ruangan,
    j.waktu_mulai,
    j.waktu_selesai,
    EXTRACT(EPOCH FROM (j.waktu_selesai - j.waktu_mulai))/60 AS durasi_menit,
    j.kapasitas_maksimal,
    j.jumlah_terisi,
    (j.kapasitas_maksimal - j.jumlah_terisi) AS sisa_kuota,
    CASE 
        WHEN j.jumlah_terisi >= j.kapasitas_maksimal THEN 'PENUH'
        ELSE 'TERSEDIA'
    END AS status_ketersediaan_kuota,
    j.harga_non_member,
    j.harga_member,
    j.batas_batal_jam,
    j.status_sesi
FROM tb_jadwal_sesi j
JOIN tb_kategori_layanan k ON j.id_kategori = k.id
JOIN tb_pengguna p ON j.id_pelatih = p.id
LEFT JOIN tb_profil_pelatih pp ON p.id = pp.id_pengguna
JOIN tb_ruangan r ON j.id_ruangan = r.id;

-- View 2: Status Lemari Loker (Daftar Loker Kosong vs Disewa Member Aktif)
CREATE OR REPLACE VIEW v_status_loker AS
SELECT 
    l.id AS id_loker,
    l.nomor_loker,
    l.lokasi_area,
    l.status AS status_fisik_loker,
    k.id AS id_keanggotaan_aktif,
    u.nama_lengkap AS nama_pemegang_member,
    u.email AS email_pemegang_member,
    k.tanggal_mulai AS masa_mulai_sewa,
    k.tanggal_berakhir AS masa_berakhir_sewa,
    CASE 
        WHEN l.status = 'perawatan' THEN 'DALAM_PERAWATAN'
        WHEN k.id IS NOT NULL THEN 'DISEWA_AKTIF'
        ELSE 'TERSEDIA_UNTUK_MEMBER'
    END AS ketersediaan_operasional
FROM tb_loker l
LEFT JOIN tb_keanggotaan k ON l.id = k.id_loker AND k.status = 'aktif'
LEFT JOIN tb_pengguna u ON k.id_pelanggan = u.id;

-- ============================================================================
-- ILUSTRASI TRANSAKSI ATOMIK KONKURENSI (PESSIMISTIC ROW-LEVEL LOCKING)
-- ============================================================================
/*
-- SKENARIO: Pelanggan memesan sesi secara bersamaan (Mencegah Overbooking)
-- Backend Node/Bun mengeksekusi blok transaksi ACID berikut:

BEGIN;

-- 1. Kunci baris jadwal sesi secara eksklusif (Thread lain harus antre)
SELECT id, kapasitas_maksimal, jumlah_terisi, harga_member, harga_non_member
FROM tb_jadwal_sesi
WHERE id = 'c0000000-0000-0000-0000-000000000001'
FOR UPDATE;

-- 2. Backend memeriksa: JIKA jumlah_terisi >= kapasitas_maksimal THEN ROLLBACK (Kuotapenuh);
--    JIKA lolos, tahan 1 kursi secara instan:
UPDATE tb_jadwal_sesi
SET jumlah_terisi = jumlah_terisi + 1
WHERE id = 'c0000000-0000-0000-0000-000000000001';

-- 3. Catat pesanan berstatus 'menunggu_pembayaran' dengan timer kedaluwarsa 15 menit:
INSERT INTO tb_pesanan (
    kode_pesanan, id_pelanggan, tipe_pesanan, id_jadwal,
    total_bayar, snap_token, waktu_kedaluwarsa, status_pembayaran
) VALUES (
    'ORD-20260908-099', '33333333-3333-3333-3333-333333333333', 'sesi',
    'c0000000-0000-0000-0000-000000000001', 150000, 'mock-snap-token',
    CURRENT_TIMESTAMP + INTERVAL '15 minutes', 'menunggu_pembayaran'
);

-- 4. Terbitkan tiket reservasi sementara:
INSERT INTO tb_reservasi_sesi (
    kode_reservasi, id_pesanan, id_jadwal, id_pelanggan,
    tipe_tarif, harga_dikenakan, status_reservasi
) VALUES (
    'RSV-20260908-099', (SELECT id FROM tb_pesanan WHERE kode_pesanan = 'ORD-20260908-099'),
    'c0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333',
    'non_member', 150000, 'menunggu_pembayaran'
);

COMMIT;
-- Selesai. Kursi aman terkunci, tidak ada race condition, dan constraint CHECK menjamin integritas.
*/

-- ============================================================================
-- DATA AWAL (SEEDING PROTOTYPE LENGKAP & KONSISTEN)
-- ============================================================================

-- 1. Pengguna Awal (Admin, Pelatih, Pelanggan Member, Pelanggan Tamu)
INSERT INTO tb_pengguna (id, nama_lengkap, email, nomor_telepon, kata_sandi_hash, peran)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Admin Wellness Club', 'admin@wellness.com', '081234567890', '$argon2id$v=19$m=65536,t=2,p=1$mock_hash_admin', 'admin'),
('22222222-2222-2222-2222-222222222222', 'Bima Yoga Master', 'trainer.bima@wellness.com', '081234567891', '$argon2id$v=19$m=65536,t=2,p=1$mock_hash_trainer', 'pelatih'),
('33333333-3333-3333-3333-333333333333', 'I Kadek Adi Sunetra', 'kadek.adi@wellness.com', '081234567892', '$argon2id$v=19$m=65536,t=2,p=1$mock_hash_member', 'pelanggan'),
('44444444-4444-4444-4444-444444444444', 'Ni Putu Ayu Lestari', 'putu.ayu@wellness.com', '081234567893', '$argon2id$v=19$m=65536,t=2,p=1$mock_hash_guest', 'pelanggan');

-- 2. Profil Pelatih (Sertifikasi RYT-500 Yoga Alliance)
INSERT INTO tb_profil_pelatih (id, id_pengguna, spesialisasi, sertifikasi, bio, pengalaman_tahun)
VALUES
('a0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Ashtanga & Vinyasa Yoga Flow', 'RYT-500 Yoga Alliance Certified, Sound Bath Healer', 'Instruktur berpengalaman memandu meditasi kesadaran tubuh, pernapasan holistik, dan ketenangan pikiran.', 7);

-- 3. Kategori Layanan Studio
INSERT INTO tb_kategori_layanan (id, nama_kategori, slug, deskripsi, ikon)
VALUES
('b0000000-0000-0000-0000-000000000001', 'Yoga & Breathwork', 'yoga-breathwork', 'Kelas meditasi, olah pernapasan mendalam, dan fleksibilitas tubuh terarah.', 'sparkles'),
('b0000000-0000-0000-0000-000000000002', 'Pilates Core Balance', 'pilates-balance', 'Penguatan postur tubuh, stabilitas tulang belakang, dan otot inti.', 'activity'),
('b0000000-0000-0000-0000-000000000003', 'Recovery Spa & Sauna', 'spa-sauna', 'Terapi relaksasi pemulihan otot, hydrotherapy, dan sauna herbal alami.', 'flame');

-- 4. Ruangan Studio Berkapasitas Ketenangan
INSERT INTO tb_ruangan (id, nama_ruangan, lokasi, kapasitas_maksimal, catatan)
VALUES
('d0000000-0000-0000-0000-000000000001', 'Studio Shanti (Zen Room)', 'Lantai 2 Sayap Timur', 10, 'Lantai kayu jati alami dilengkapi matras premium dan diffuser lavender aromaterapi.'),
('d0000000-0000-0000-0000-000000000002', 'Studio Prana (Pilates Reformer)', 'Lantai 2 Sayap Barat', 8, 'Dilengkapi unit reformer modern dengan kontrol gravitasi presisi.'),
('d0000000-0000-0000-0000-000000000003', 'Ruang Pemulihan Nirvana', 'Lantai 1 Area Kolam', 6, 'Area sauna cemara merah dan kolam rendam garam epsom.');

-- 5. Lemari Loker Pribadi (Dedicated Locker LK-01 s.d. LK-10)
INSERT INTO tb_loker (id, nomor_loker, lokasi_area, status)
VALUES
('e0000000-0000-0000-0000-000000000001', 'LK-01', 'Locker Room Pria', 'digunakan'),
('e0000000-0000-0000-0000-000000000002', 'LK-02', 'Locker Room Pria', 'tersedia'),
('e0000000-0000-0000-0000-000000000003', 'LK-03', 'Locker Room Pria', 'tersedia'),
('e0000000-0000-0000-0000-000000000004', 'LK-04', 'Locker Room Pria', 'tersedia'),
('e0000000-0000-0000-0000-000000000005', 'LK-05', 'Locker Room Pria', 'tersedia'),
('e0000000-0000-0000-0000-000000000006', 'LK-06', 'Locker Room Wanita', 'tersedia'),
('e0000000-0000-0000-0000-000000000007', 'LK-07', 'Locker Room Wanita', 'tersedia'),
('e0000000-0000-0000-0000-000000000008', 'LK-08', 'Locker Room Wanita', 'tersedia'),
('e0000000-0000-0000-0000-000000000009', 'LK-09', 'Locker Room Wanita', 'tersedia'),
('e0000000-0000-0000-0000-000000000010', 'LK-10', 'Locker Room Wanita', 'tersedia');

-- 6. Katalog Paket Membership Masa Aktif
INSERT INTO tb_paket_membership (id, nama_paket, durasi_hari, harga, fasilitas_deskripsi)
VALUES
('f0000000-0000-0000-0000-000000000001', 'Silver Wellness (1 Bulan)', 30, 350000, 'Akses bebas kolam renang & air mineral sehat harian, 1 dedicated locker tetap selama 30 hari, jadwal vision 30 hari ke depan, serta tarif hemat harga member untuk setiap sesi kelas studio.'),
('f0000000-0000-0000-0000-000000000002', 'Gold Serenity (3 Bulan)', 90, 950000, 'Akses bebas kolam renang & air mineral sehat harian, 1 dedicated locker tetap selama 90 hari, jadwal vision 30 hari ke depan, 1 sesi konsultasi kebugaran privat, serta tarif hemat member.');

-- 7. Data Keanggotaan Aktif Member (Kadek Adi memegang LK-01)
INSERT INTO tb_keanggotaan (id, id_pelanggan, id_paket_membership, id_loker, tanggal_mulai, tanggal_berakhir, status)
VALUES
('a1000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'aktif');

-- 8. Jadwal Sesi Kelas Studio (Contoh 2 Hari ke Depan)
INSERT INTO tb_jadwal_sesi (
    id, judul_sesi, id_kategori, id_pelatih, id_ruangan,
    waktu_mulai, waktu_selesai, kapasitas_maksimal, jumlah_terisi,
    harga_non_member, harga_member, batas_batal_jam, status_sesi
) VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'Sunrise Vinyasa Flow & Meditation',
    'b0000000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'd0000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '7 hours',
    CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '8 hours 30 minutes',
    10, 1,
    150000, 75000, 24, 'terjadwal'
);

-- 9. Pesanan Contoh (Pesanan Tiket Sesi Kadek Adi - Lunas via QRIS Midtrans)
INSERT INTO tb_pesanan (
    id, kode_pesanan, id_pelanggan, tipe_pesanan, id_jadwal,
    total_bayar, metode_pembayaran, snap_token, id_transaksi_gateway,
    signature_key_terakhir, status_pembayaran, waktu_verifikasi
) VALUES (
    'b1000000-0000-0000-0000-000000000001',
    'ORD-20260908-001',
    '33333333-3333-3333-3333-333333333333',
    'sesi',
    'c0000000-0000-0000-0000-000000000001',
    75000, -- Tarif member
    'qris',
    'midtrans-snap-token-demo-001',
    'trx-midtrans-20260908-998877',
    'mock_sha512_hash_signature_midtrans_verified',
    'lunas',
    CURRENT_TIMESTAMP
);

-- 10. Tiket Reservasi Sesi (Kadek Adi - Berhasil Dipesan)
INSERT INTO tb_reservasi_sesi (
    id, kode_reservasi, id_pesanan, id_jadwal, id_pelanggan,
    tipe_tarif, harga_dikenakan, status_reservasi
) VALUES (
    'c1000000-0000-0000-0000-000000000001',
    'RSV-20260908-001',
    'b1000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    '33333333-3333-3333-3333-333333333333',
    'member',
    75000,
    'dipesan'
);
