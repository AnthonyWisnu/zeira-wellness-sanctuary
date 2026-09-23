# ZEIRA Wellness Sanctuary

> **Sistem Web Reservasi & Manajemen Paket Wellness Club Terpadu**  
> **Mata Kuliah**: Pemrograman Backend — Universitas Udayana  
> **Pemilik / Tim**: Bos Kadzura (I Kadek Adi Sunetra) & Schatten  
> **Status**: RATIFIED PRODUCTION-GRADE BACKEND MONOLITH

---

## 1. Domain Bisnis & Konsep Produk

### 1.1 Apa Itu ZEIRA Wellness Sanctuary?
**ZEIRA Wellness Sanctuary** adalah platform web holistik untuk reservasi kelas studio kebugaran (*mindful movement*) dan manajemen keanggotaan klub wellness eksklusif. Platform ini menghadirkan pengalaman presisi, ketenangan, dan pemulihan fisik melalui integrasi fasilitas unggulan:
* **Studio Classes**: *Reformer Pilates Core Alignment*, *Vinyasa Flow & Breathwork*, *Tibetan Sound Bath & Meditation*, serta *Restorative Yin Yoga*.
* **Recovery Amenities**: *Heated Hydro Mineral Pool (34°C)* dan sirkulasi sauna herbal.
* **Dedicated Private Lockers**: Lemari loker pribadi dengan sistem RFID digital eksklusif untuk member.

### 1.2 Model Bisnis Ganda (Dual Business Model)
Platform beroperasi dengan dua pilar monetisasi harmonis:

```
                                 ┌─────────────────────────────────┐
                                 │     PENGUNJUNG / PELANGGAN      │
                                 └────────────────┬────────────────┘
                                                  │
                 ┌────────────────────────────────┴────────────────────────────────┐
                 ▼                                                                 ▼
   ┌───────────────────────────┐                                     ┌───────────────────────────┐
   │    MODEL A: MEMBERSHIP    │                                     │  MODEL B: GUEST DROP-IN   │
   │  (Langganan Masa Aktif)   │                                     │     (Tamu Tiket Sesi)     │
   ├───────────────────────────┤                                     ├───────────────────────────┤
   │ • Durasi: 30 / 90 hari    │                                     │ • Bayar per sesi kelas    │
   │ • Gratis Loker Pribadi    │                                     │ • Tanpa biaya bulanan     │
   │ • Bebas Akses Kolam & Air │                                     │ • Akses fasilitas selama  │
   │ • Vision Window: 30 Hari  │                                     │   kelas berlangsung       │
   │ • Tarif Hemat Sesi Kelas  │                                     │ • Vision Window: 7 Hari   │
   │   (Diskon hingga 50%)     │                                     │ • Tarif Reguler Non-Member│
   └───────────────────────────┘                                     └───────────────────────────┘
```

1. **Model A: Membership Berbasis Durasi Waktu**:
   - Paket langganan durasi (`Paket Membership 30 Hari` seharga Rp350.000, `Paket Membership 90 Hari` seharga Rp950.000).
   - Member mendapatkan hak istimewa: **1 dedicated locker tetap** selama masa aktif, akses bebas kolam mineral & *herbal hydration bar* harian, hak memesan jadwal **hingga 30 hari ke depan** (*Priority Vision Window*), dan tarif kelas khusus member yang jauh lebih hemat.
2. **Model B: Guest Drop-in (Tamu Umum)**:
   - Pelanggan tanpa membership dapat langsung membeli tiket sesi kelas secara satuan (drop-in pass) dengan tarif reguler (`harga_non_member`).
   - Jendela pemesanan dibatasi **maksimal 7 hari ke depan** dari hari ini.

---

## 2. Keunggulan Arsitektur & Keamanan Backend

### 2.1 Anti-Overbooking Mutluk (Pessimistic Row-Level Locking)
Kapasitas studio dijaga ketat pada level kernel basis data menggunakan *Pessimistic Row-Level Locking* (`SELECT ... FOR UPDATE` via Prisma Interactive Transaction `tx.$queryRaw`) dan hard database constraint `CHECK (jumlah_terisi <= kapasitas_maksimal)`. Tidak ada risiko dua pelanggan berebut kursi terakhir secara bersamaan (*zero race conditions*).

```
[Pelanggan Klik 'Pesan Kursi']
            │
            ▼
[Prisma Interactive Transaction (ACID)]
            │
            ├─► 1. SELECT * FROM tb_jadwal_sesi WHERE id = $1 FOR UPDATE;
            │
            ├─► 2. Cek: Apakah jumlah_terisi >= kapasitas_maksimal?
            │      ├─► [YA] ──► ROLLBACK ──► Respon: "Mohon maaf, kursi baru saja habis dipesan"
            │      └─► [TIDAK]
            │
            ├─► 3. Kunci Kursi: UPDATE tb_jadwal_sesi SET jumlah_terisi = jumlah_terisi + 1;
            │
            ├─► 4. Buat Pesanan: tb_pesanan (status: 'menunggu_pembayaran', expired: NOW() + 15m);
            │
            └─► 5. Buat Tiket: tb_reservasi_sesi (status: 'menunggu_pembayaran');
            │
            ▼
[Dapatkan Snap Token dari Midtrans & Tampilkan Modal Checkout]
            │
    ┌───────┴───────────────────────────────────────┐
    ▼                                               ▼
[SUKSES BAYAR < 15 Menit]               [TIDAK BAYAR / LEWAT 15 Menit]
    │                                               │
    ▼                                               ▼
• tb_pesanan: 'lunas'                   • tb_pesanan: 'kedaluwarsa'
• tb_reservasi_sesi: 'dipesan'          • tb_reservasi_sesi: 'kedaluwarsa'
• Kursi TETAP terisi                    • Kembalikan Kursi:
                                          UPDATE tb_jadwal_sesi 
                                          SET jumlah_terisi = jumlah_terisi - 1;
```

### 2.2 Penahanan Kursi 15 Menit (15-Minute Seat Hold)
Saat checkout dimulai, slot kursi studio langsung ditahan sementara. Jika dalam 15 menit pembayaran tidak diselesaikan atau dibatalkan, kursi dilepaskan kembali secara atomik ke publik.

### 2.3 Webhook Midtrans & Verifikasi Kriptografis SHA-512
Midtrans mengirim callback HTTP POST ke `/api/webhook/midtrans`. Sistem memvalidasi tanda tangan kriptografis:
$$\text{Signature} = \text{SHA-512}(\text{order\_id} + \text{status\_code} + \text{gross\_amount} + \text{ServerKey})$$
Jika signature tidak cocok, request ditolak seketika dengan status HTTP `403 Forbidden`. Transaksi dilindungi sifat *idempotent* sehingga duplikasi payload jaringan tidak akan menyebabkan pembaruan status ganda.

### 2.4 Kebijakan Pembatalan Mandiri Fleksibel
Pelanggan dapat membatalkan tiket sendiri melalui portal `/riwayat` jika waktu pelaksanaan masih memenuhi batas waktu terkonfigurasi:
$$\text{waktu\_mulai\_sesi} - \text{CURRENT\_TIMESTAMP} \ge \text{batas\_batal\_jam}$$
Kursi yang dibatalkan sah langsung dikembalikan ke kuota publik secara atomik.

### 2.5 Absensi Terverifikasi Pelatih di Studio
Validasi kehadiran fisik peserta di studio dicatat langsung oleh instruktur di lokasi melalui portal `/pelatih` (`status_reservasi = 'hadir'`, mencatat `diabsen_oleh_pelatih_id` dan `waktu_absensi`).

---

## 3. Matriks Otorisasi Peran (RBAC)

Sistem membagi pengguna ke dalam **3 Peran Utama** pada `tb_pengguna` (`peran`):
1. **Administrator Console (`/admin`)**: Master data studio, kategori layanan, inventaris loker RFID, pembuatan sesi jadwal, dan audit buku besar pembayaran.
2. **Portal Instruktur / Pelatih (`/pelatih`)**: Jadwal mengajar harian, daftar peserta sah per sesi, dan pencatatan presensi fisik.
3. **Portal Pelanggan (`/riwayat`, `/jadwal`, `/membership`)**:
   - **Member Aktif**: Priority booking 30 hari ke depan, tarif hemat member, pemegang 1 dedicated locker fisik.
   - **Tamu Drop-in (Non-Member)**: Booking maksimal 7 hari ke depan, tarif reguler.

| Fitur / Modul | Administrator | Pelatih | Member Aktif | Tamu (Non-Member) | Belum Login |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Katalog Jadwal (1 s.d. 7 Hari ke Depan) | ✅ | ✅ | ✅ | ✅ | ✅ (Read Only) |
| Katalog Jadwal (8 s.d. 30 Hari ke Depan) | ✅ | ✅ | ✅ | ❌ (*Locked*) | ❌ (*Locked*) |
| Pembelian Paket Membership & Pilih Loker | ❌ | ❌ | ✅ (Perpanjang) | ✅ (Daftar Baru) | 🔒 (Wajib Login) |
| Reservasi Sesi dengan Tarif Member | ❌ | ❌ | ✅ | ❌ | ❌ |
| Reservasi Sesi dengan Tarif Reguler Tamu | ❌ | ❌ | ✅ | ✅ | 🔒 (Wajib Login) |
| Checkout & Pembayaran Midtrans Snap 15 Menit | ❌ | ❌ | ✅ | ✅ | 🔒 (Wajib Login) |
| Batalkan Reservasi Mandiri | ❌ | ❌ | ✅ | ✅ | 🔒 (Wajib Login) |
| Halaman Tiket & Loker Saya (`/riwayat`) | ❌ | ❌ | ✅ | ✅ | 🔒 (Wajib Login) |
| Portal Pelatih: Jadwal & Presensi (`/pelatih`) | ❌ | ✅ | ❌ | ❌ | ❌ |
| Dashboard Admin: Master & Jadwal (`/admin`) | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Skema Basis Data 10 Tabel (PostgreSQL 16/18 Native)

Skema menganut standar normalisasi **3NF** murni dengan konvensi tabel `tb_*`, kunci primer UUID native (`gen_random_uuid()`), dan trigger pembaruan waktu otomatis:

```
                    ┌─────────────────────────┐
                    │       tb_pengguna       │ (Akun Autentikasi, Argon2id & RBAC)
                    └────────────┬────────────┘
         ┌───────────────────────┼───────────────────────┐
         │ 1:1                   │ 1:N                   │ 1:N
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│tb_profil_pelatih │    │  tb_keanggotaan  │    │    tb_pesanan    │ (Midtrans & Expiry 15m)
└──────────────────┘    └────────┬─────────┘    └────────┬─────────┘
(Sertifikasi Pelatih)            │                       │ 1:1
                 ┌───────────────┴───────────────┐       ▼
                 │ N:1                           │ 1:1  ┌──────────────────┐
                 ▼                               ▼      │tb_reservasi_sesi │ (Tiket Sah & Presensi)
       ┌──────────────────┐            ┌──────────────────┐└────────┬─────────┘
       │tb_paket_membershp│            │     tb_loker     │         │
       └──────────────────┘            └──────────────────┘         │
       (Katalog Durasi Sewa)           (Lemari Loker Pribadi)       │ N:1
                                                                    │
       ┌──────────────────┐            ┌──────────────────┐         │
       │tb_kategori_layann│            │    tb_ruangan    │         │
       └─────────┬────────┘            └────────┬─────────┘         │
                 │ 1:N                          │ 1:N               │
                 └──────────────┬───────────────┘                   │
                                ▼                                   │
                     ┌──────────────────┐                           │
                     │  tb_jadwal_sesi  │◄──────────────────────────┘
                     └──────────────────┘
                     (Sesi Kelas Studio & Kuota Kursi)
```

### Rangkuman 10 Tabel Relasional:
1. **`tb_pengguna`**: Akun pusat pengguna (`id`, `nama_lengkap`, `email`, `kata_sandi_hash`, `peran`: `admin` | `pelatih` | `pelanggan`, `status_aktif`).
2. **`tb_profil_pelatih`**: Portofolio instruktur (`id_pengguna`, `spesialisasi`, `sertifikasi`, `bio`, `pengalaman_tahun`).
3. **`tb_kategori_layanan`**: Taksonomi kelas (`id`, `nama_kategori`, `slug`, `ikon`, `status_aktif`).
4. **`tb_ruangan`**: Studio fisik (`id`, `nama_ruangan`, `lokasi`, `kapasitas_maksimal`).
5. **`tb_loker`**: Master lemari loker LK-01 s.d. LK-10 (`id`, `nomor_loker`, `lokasi_area`, `status`: `tersedia` | `digunakan` | `perawatan`).
6. **`tb_paket_membership`**: Katalog paket durasi (`id`, `nama_paket`, `durasi_hari`, `harga`, `fasilitas_deskripsi`).
7. **`tb_keanggotaan`**: Masa aktif langganan & hak loker member (`id`, `id_pelanggan`, `id_paket_membership`, `id_loker`, `tanggal_mulai`, `tanggal_berakhir`, `status`: `aktif` | `kedaluwarsa` | `dibatalkan`). Dilindungi 2 *Partial Unique Index*.
8. **`tb_jadwal_sesi`**: Jadwal kelas studio (`id`, `judul_sesi`, `id_kategori`, `id_pelatih`, `id_ruangan`, `waktu_mulai`, `waktu_selesai`, `kapasitas_maksimal`, `jumlah_terisi`, `harga_non_member`, `harga_member`, `batas_batal_jam`, `status_sesi`). Dilindungi constraint `CHECK (jumlah_terisi <= kapasitas_maksimal)`.
9. **`tb_pesanan`**: Buku besar keuangan (`id`, `kode_pesanan`, `id_pelanggan`, `tipe_pesanan`: `membership` | `sesi`, `total_bayar`, `snap_token`, `waktu_kedaluwarsa`, `signature_key_terakhir`, `status_pembayaran`: `menunggu_pembayaran` | `lunas` | `kedaluwarsa` | `dibatalkan` | `gagal`).
10. **`tb_reservasi_sesi`**: Tiket kehadiran & audit absensi (`id`, `kode_reservasi`, `id_pesanan`, `id_jadwal`, `id_pelanggan`, `tipe_tarif`: `member` | `non_member`, `harga_dikenakan`, `status_reservasi`: `menunggu_pembayaran` | `dipesan` | `hadir` | `tidak_hadir` | `dibatalkan` | `kedaluwarsa`, `diabsen_oleh_pelatih_id`, `waktu_absensi`). Dilindungi *Partial Unique Index* untuk tiket aktif.

---

## 5. Golden Tech Stack Constraints

| Komponen | Pilihan Wajib | Aturan & Batasan Keras |
| :--- | :--- | :--- |
| **Package Manager & Runtime** | **Bun** (>= 1.3.x) | HANYA gunakan Bun. Dilarang menggunakan npm/yarn/pnpm. Jalankan script dengan `bun run dev`, `bun run build`, dan instalasi dependensi dengan `bun add`. |
| **Framework Fullstack** | **Astro 5** (SSR Mode) | Mode Server-Side Rendering (`output: 'server'`) menggunakan `@astrojs/node`. Mutasi server menggunakan **Astro Actions** bervalidasi Zod. |
| **Database** | **PostgreSQL 16/18 Native** | Standar ACID murni. Gunakan `gen_random_uuid()` bawaan PostgreSQL (tanpa ekstensi eksternal). Konvensi tabel `tb_*`. |
| **ORM & Migrations** | **Prisma ORM** | Skema terpusat di `web/prisma/schema.prisma` dan singleton di `web/src/db/prisma.ts`. |
| **Styling & Design System** | **Baremetal Pure CSS** | Berbasis panduan [DESIGN.md](file:///D:/DEVELOPMENT/github/19_wellnes_bk/DESIGN.md). Dilarang Tailwind, CSS-in-JS, atau CDN. Desain menganut prinsip *Tactile Atelier Skeuomorphic* (Plus Jakarta Sans, tabular-nums) dan sistem ikon Phosphor (<Icon /> SVG lokal). |
| **Payment Gateway** | **Midtrans Snap Sandbox** | Verifikasi signature notifikasi webhook menggunakan SHA-512. Mekanisme penahanan kursi sementara 15 menit. |
| **Concurrency Control** | **Pessimistic Row Locking** | `SELECT ... FOR UPDATE` via raw SQL di Prisma Interactive Transaction (`tx.$queryRaw`) + Hard Constraint `CHECK (jumlah_terisi <= kapasitas_maksimal)`. |

---

## 6. Struktur Direktori Proyek

```
19_wellnes_bk/
├── .plan/                               # ARSITEKTUR & PERANCANGAN SISTEM
│   ├── db/
│   │   ├── PENJELASAN_SKEMA.md          # 📖 Bedah naratif fungsi 10 tabel relasional
│   │   └── spec.md                      # 📑 Spesifikasi teknis backend, RBAC, & konkurensi
│   ├── flowchart/                       # 📊 Diagram alur proses reservasi & pembayaran
│   ├── usecase-diagram/                 # 📊 Diagram use case 3 peran pengguna
│   └── design/                          # 🎨 Tangkapan layar desain referensi
│
├── database/                            # BASIS DATA POSTGRESQL NATIVE
│   ├── schema.sql                       # 🐘 Skrip DDL Kanonik PostgreSQL (10 Tabel, Triggers, Views)
│   └── seed_extra.sql                   # 🐘 Skrip data penunjang
│
├── web/                                 # APLIKASI WEB FULLSTACK (ASTRO 5 SSR)
│   ├── prisma/
│   │   └── schema.prisma                # Skema Prisma ORM PostgreSQL
│   ├── public/
│   │   └── fonts/                       # Tipografi lokal Plus Jakarta Sans & JetBrains Mono WOFF2
│   ├── scripts/
│   │   ├── seed_rich_demo_data.ts       # Script seeding data demo komprehensif
│   │   └── seed_users.ts                # Script seeding kredensial pengguna
│   ├── services/                        # DOMAIN CORE ENGINE (ZERO UI / FRAMEWORK-AGNOSTIC)
│   │   ├── auth/                        # Service autentikasi Argon2id & session cookie
│   │   ├── admin/                       # Service master data ruangan, loker, kategori
│   │   ├── jadwal/                      # Service vision window (30 hari vs 7 hari)
│   │   ├── membership/                  # Service dedicated locker assignment & aktivasi
│   │   ├── payment/                     # Service Midtrans Snap token & webhook SHA-512
│   │   ├── pelatih/                     # Service presensi fisik peserta kelas
│   │   └── reservasi/                   # Service kunci 15 menit, anti-overbooking, batal
│   ├── src/
│   │   ├── actions/index.ts             # Astro Actions Gateway (Validasi Zod -> panggil service)
│   │   ├── components/Icon.astro        # Komponen ikon Phosphor lokal
│   │   ├── db/prisma.ts                 # PrismaClient singleton instance
│   │   ├── layouts/
│   │   │   ├── DashboardLayout.astro    # Shell dashboard Admin, Pelatih, & Member
│   │   │   └── SanctuaryLayout.astro    # Shell portal publik & modal checkout
│   │   ├── pages/                       # Per-folder routing Astro SSR
│   │   │   ├── admin/index.astro        # Dashboard Administrator
│   │   │   ├── pelatih/index.astro      # Portal Instruktur & Presensi
│   │   │   ├── riwayat/index.astro      # Portal Member & Tiket Saya
│   │   │   ├── jadwal/index.astro       # Katalog Jadwal Kelas Publik
│   │   │   ├── membership/index.astro   # Katalog Paket Membership & Pemilihan Loker
│   │   │   ├── reservasi/index.astro    # Konfirmasi Checkout & Kunci Kursi
│   │   │   ├── login/index.astro        # Portal Masuk Akun
│   │   │   ├── register/index.astro     # Pendaftaran Akun Baru
│   │   │   └── api/webhook/midtrans.ts  # Endpoint Webhook Midtrans SHA-512
│   │   └── styles/global.css            # Baremetal Pure CSS Tactile Atelier
│   ├── astro.config.mjs                 # Konfigurasi Astro SSR (@astrojs/node)
│   └── package.json                     # Konfigurasi dependensi Bun
│
├── AGENTS.md                            # PIAGAM REKAYASA & STANDAR BISNIS BINDING
├── DESIGN.md                            # SISTEM DESAIN TACTILE ATELIER SKEUOMORPHIC
├── PLAN.md                              # MASTER PLAN IMPLEMENTASI & ROADMAP
└── README.md                            # DOKUMENTASI UTAMA PROYEK
```

---

## 7. Panduan Menjalankan Sistem Secara Lokal

### 7.1 Prasyarat Lingkungan
1. **Bun Runtime** (>= 1.3.x): [https://bun.sh](https://bun.sh)
2. **PostgreSQL** (versi 16 atau 18): Terpasang dan berjalan secara lokal.

### 7.2 Langkah Instalasi & Konfigurasi Basis Data

```bash
# 1. Navigasi ke direktori web
cd web

# 2. Pasang seluruh dependensi menggunakan Bun
bun install

# 3. Salin berkas environment
cp .env.example .env
```

Sesuaikan variabel basis data pada `web/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zeira_sanctuary_db?schema=public"
MIDTRANS_SERVER_KEY="SB-Mid-server-YOUR_SANDBOX_KEY"
MIDTRANS_CLIENT_KEY="SB-Mid-client-YOUR_SANDBOX_KEY"
```

Inisialisasi basis data PostgreSQL melalui skrip DDL kanonik:
```bash
# Buat database di PostgreSQL
psql -U postgres -c "CREATE DATABASE zeira_sanctuary_db;"

# Eksekusi DDL kanonik PostgreSQL 16/18
psql -U postgres -d zeira_sanctuary_db -f ../database/schema.sql
```

Generate Prisma Client & Seed Data Demo:
```bash
# Generate Prisma types
bunx prisma generate

# Jalankan seeder akun & data operasional
bun run seed
```

Jalankan server pengembangan:
```bash
bun run dev
```
Aplikasi web siap diakses di `http://localhost:4321`.

---

## 8. Akun Uji Coba Demo (Demo Credentials)

| Peran Akun | Alamat Email | Kata Sandi | Deskripsi Hak Akses |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@zeira.sanctuary` | `password123` | Hak penuh kelola studio, jadwal kelas, tarif, loker RFID, dan buku besar transaksi. |
| **Instruktur / Pelatih** | `sarah.jenkins@zeira.sanctuary` | `password123` | Mengakses jadwal mengajar hari ini, lembar presensi, dan menyelesaikan sesi. |
| **Pelanggan (Member Aktif)** | `kadek.adi@gmail.com` | `password123` | Memiliki Paket Membership 30 Hari aktif, memegang loker LK-02, tarif diskon kelas. |
| **Pelanggan (Tamu Drop-in)** | `guest.dewi@gmail.com` | `password123` | Akun non-member, booking maksimal 7 hari ke depan, tarif reguler. |

---

## 9. Peta Dokumentasi Resmi (Single Source of Truth)

* **Piagam Rekayasa & Standar Bisnis**: [`AGENTS.md`](file:///D:/DEVELOPMENT/github/19_wellnes_bk/AGENTS.md)
* **Sistem Desain & Panduan Gaya**: [`DESIGN.md`](file:///D:/DEVELOPMENT/github/19_wellnes_bk/DESIGN.md)
* **Rencana Implementasi & Roadmap**: [`PLAN.md`](file:///D:/DEVELOPMENT/github/19_wellnes_bk/PLAN.md)
* **Detail Bedah 10 Tabel Database**: [`.plan/db/PENJELASAN_SKEMA.md`](file:///D:/DEVELOPMENT/github/19_wellnes_bk/.plan/db/PENJELASAN_SKEMA.md)
* **Spesifikasi Teknis Konkurensi & Keamanan**: [`.plan/db/spec.md`](file:///D:/DEVELOPMENT/github/19_wellnes_bk/.plan/db/spec.md)
* **Diagram Alur Reservasi (Flowchart)**: [`.plan/flowchart/`](file:///D:/DEVELOPMENT/github/19_wellnes_bk/.plan/flowchart/)
* **Diagram Use Case Sistem**: [`.plan/usecase-diagram/`](file:///D:/DEVELOPMENT/github/19_wellnes_bk/.plan/usecase-diagram/)
