# Project Engineering & Business Charter: ZEIRA WELLNESS SANCTUARY

> **Proyek**: Sistem Web Reservasi & Manajemen Paket Wellness Club  
> **Mata Kuliah**: Pemrograman Backend — Universitas Udayana  
> **Pemilik**: Bos Kadzura (I Kadek Adi Sunetra) & Schatten  
> **Status**: BINDING ARCHITECTURAL, BUSINESS & SECURITY STANDARD

---

## 1. Domain Bisnis & Konsep Produk

### 1.1 Apa Itu ZEIRA Wellness Sanctuary?
**ZEIRA Wellness Sanctuary** adalah platform web terpadu untuk reservasi sesi studio dan keanggotaan klub kebugaran holistik (*mindful movement & recovery sanctuary*). Zeira dirancang untuk menghadirkan ketenangan pikiran, presisi gerak, dan pemulihan fisik melalui fasilitas eksklusif:
- **Studio Classes**: *Reformer Pilates*, *Vinyasa Flow & Breathwork*, *Tibetan Sound Bath & Meditation*, serta *Restorative Yin Yoga*.
- **Recovery Amenities**: *Heated Hydro Mineral Pool (34°C)* dan sauna sirkulasi herbal.
- **Dedicated Private Lockers**: Lemari loker pribadi dengan sistem RFID digital eksklusif untuk member.

### 1.2 Model Bisnis Ganda (Dual Business Model)
Platform beroperasi dengan dua pilar monetisasi yang berdampingan:

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
   - Paket langganan durasi (contoh: *Paket Membership 30 Hari* seharga Rp350.000, *Paket Membership 90 Hari* seharga Rp950.000).
   - Member mendapatkan hak istimewa: **1 dedicated locker tetap** selama masa aktif, akses bebas kolam mineral & *herbal hydration bar* setiap hari, hak memesan jadwal **hingga 30 hari ke depan** (*Priority Vision Window*), dan tarif kelas khusus member yang jauh lebih hemat.
2. **Model B: Guest Drop-in (Tamu Umum)**:
   - Pelanggan tanpa membership dapat langsung membeli tiket sesi kelas secara satuan (drop-in pass) dengan tarif reguler (`harga_non_member`).
   - Jendela pemesanan dibatasi **maksimal 7 hari ke depan** dari hari ini.

### 1.3 Keunggulan Kompetitif & Nilai Kritis Sistem
- **Anti-Overbooking Mutlak**: Kapasitas studio dijaga ketat pada level kernel basis data menggunakan *Pessimistic Row-Level Locking* (`SELECT ... FOR UPDATE`) dan `CHECK (jumlah_terisi <= kapasitas_maksimal)`. Tidak ada risiko dua pelanggan berebut kursi terakhir secara bersamaan.
- **Penahanan Kursi 15 Menit (15-Minute Seat Hold)**: Saat checkout dimulai, kursi langsung ditahan sementara. Jika dalam 15 menit pembayaran tidak diselesaikan, kursi otomatis dilepaskan kembali ke publik.
- **Kebijakan Pembatalan Mandiri Fleksibel**: Pelanggan dapat membatalkan tiket sendiri melalui web dengan batas waktu terkonfigurasi per sesi (`batas_batal_jam`). Kursi yang dibatalkan sah langsung dikembalikan ke kuota.
- **Absensi Terverifikasi Pelatih (Trainer Verified Attendance)**: Validasi kehadiran fisik peserta di studio dicatat langsung oleh pelatih di lokasi menggunakan aplikasi web.

---

## 2. Aktor & Matriks Otorisasi (RBAC)

Sistem membagi pengguna ke dalam **3 Peran Utama** pada tabel `tb_pengguna` (`peran`):

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                1. ADMINISTRATOR                                 │
│  • Hak penuh mengelola master data ruangan, kategori layanan, dan lemari loker  │
│  • Mengatur katalog paket membership & menyusun jadwal sesi kelas               │
│  • Mengatur fleksibilitas tarif dinamis (harga member vs non-member)            │
│  • Memantau rekap pesanan, audit finansial Midtrans, dan laporan kehadiran      │
└────────────────────────┬────────────────────────────────────────┬───────────────┘
                         │                                        │
                         ▼                                        ▼
┌─────────────────────────────────┐      ┌────────────────────────────────────────┐
│     2. PELATIH / INSTRUCTOR     │      │         3. PELANGGAN (CUSTOMER)        │
│  • Memantau jadwal mengajar     │      ├───────────────────┬────────────────────┤
│  • Melihat daftar peserta kelas │      │ A. MEMBER AKTIF   │ B. TAMU NON-MEMBER │
│  • Verifikasi absensi fisik di  │      │ • Booking 30 hari │ • Booking 7 hari   │
│    studio (Hadir / Tidak Hadir) │      │ • Tarif diskon    │ • Tarif reguler    │
│  • Menyelesaikan sesi kelas     │      │ • Memiliki loker  │ • Drop-in per sesi │
└─────────────────────────────────┘      └───────────────────┴────────────────────┘
```

### Matriks Otorisasi Hak Akses Fitur:

| Fitur / Modul | Administrator | Pelatih | Member Aktif | Tamu (Non-Member) | Tamu Belum Login |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Katalog Jadwal (1 s.d. 7 Hari ke Depan) | ✅ | ✅ | ✅ | ✅ | ✅ (Read Only) |
| Katalog Jadwal (8 s.d. 30 Hari ke Depan) | ✅ | ✅ | ✅ | ❌ (*Locked*) | ❌ (*Locked*) |
| Pembelian Paket Membership & Pilih Loker | ❌ | ❌ | ✅ (Perpanjang) | ✅ (Daftar Baru) | 🔒 (Wajib Login) |
| Reservasi Sesi dengan Tarif Diskon Member | ❌ | ❌ | ✅ | ❌ | ❌ |
| Reservasi Sesi dengan Tarif Reguler Tamu | ❌ | ❌ | ✅ | ✅ | 🔒 (Wajib Login) |
| Checkout & Pembayaran Midtrans Snap 15 Menit | ❌ | ❌ | ✅ | ✅ | 🔒 (Wajib Login) |
| Batalkan Reservasi Mandiri (Sebelum Batas Jam) | ❌ | ❌ | ✅ | ✅ | 🔒 (Wajib Login) |
| Halaman Tiket Saya & Riwayat Transaksi (`/riwayat`) | ❌ | ❌ | ✅ | ✅ | 🔒 (Wajib Login) |
| Portal Pelatih: Jadwal Hari Ini & Absensi Peserta (`/pelatih`) | ❌ | ✅ | ❌ | ❌ | ❌ |
| Dashboard Admin: Master Ruangan, Kategori, Loker (`/admin`) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Dashboard Admin: Buka/Tutup Jadwal & Atur Kuota/Tarif | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Alur Bisnis Inti (End-to-End Workflows & State Machines)

### 3.1 Alur 1: Pembelian & Aktivasi Membership + Pemilihan Loker Pribadi
1. **Eksplorasi Paket**: Pelanggan memilih paket membership di `/membership` (contoh: *Paket Membership 30 Hari*).
2. **Pemilihan Loker Fisik**: Sistem menampilkan inventaris lemari loker melalui view `v_status_loker`. Pelanggan memilih satu nomor loker yang berstatus `tersedia` (misal: `LK-02` di *Locker Room Pria*).
3. **Inisiasi Pesanan**: Backend membuat pesanan di `tb_pesanan` (`tipe_pesanan = 'membership'`, `status_pembayaran = 'menunggu_pembayaran'`).
4. **Pembayaran Midtrans**: Pelanggan membayar via QRIS/VA melalui Midtrans Snap.
5. **Aktivasi Otomatis via Webhook**:
   - Status pesanan berubah menjadi `lunas`.
   - Data keanggotaan dicatat di `tb_keanggotaan`: `status = 'aktif'`, `tanggal_mulai = CURRENT_DATE`, `tanggal_berakhir = CURRENT_DATE + durasi_hari`.
   - Loker terpilih di `tb_loker` ditandai `status = 'digunakan'`.
6. **Perlindungan Partial Unique Index**:
   - Sistem memastikan 1 pelanggan hanya bisa memiliki **1 membership aktif** (`uq_keanggotaan_aktif_pelanggan`).
   - Sistem memastikan 1 nomor loker hanya bisa disewa oleh **1 member aktif** (`uq_loker_aktif_keanggotaan`). Saat membership kedaluwarsa, loker otomatis bebas disewa orang lain tanpa menghapus data historis.

---

### 3.2 Alur 2: Katalog Jadwal Kelas & Vision Window Law
1. Sistem membaca jadwal dari view `v_katalog_sesi_tersedia`.
2. **Pengecekan Status Pengguna**:
   - Jika pengguna adalah **Member Aktif**: Jadwal dibuka **hingga 30 hari ke depan**. Tampilan menampilkan badge `TARIF MEMBER: Rp 75.000` (atau gratis tergantung sesi).
   - Jika pengguna adalah **Tamu (Non-Member)**: Jadwal dibatasi **maksimal 7 hari ke depan**. Sesi di hari ke-8 s.d. 30 dikunci dengan keterangan *"Eksklusif untuk Member Aktif"*. Tampilan menampilkan `TARIF TAMU: Rp 150.000`.
3. Sisa kuota dihitung dinamis: `sisa_kuota = kapasitas_maksimal - jumlah_terisi`. Jika `sisa_kuota == 0`, tombol berubah menjadi *"Sesi Penuh / Habis"*.

---

### 3.3 Alur 3: Reservasi Sesi, Anti-Overbooking & Kunci Kursi 15 Menit

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
[Dapatkan Snap Token dari Midtrans & Buka Modal Checkout]
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

---

### 3.4 Alur 4: Webhook Midtrans & Verifikasi Kriptografis SHA-512
1. Midtrans mengirim notifikasi HTTP POST ke `/api/webhook/midtrans`.
2. **Validasi Tanda Tangan Wajib**:
   $$\text{Signature} = \text{SHA-512}(\text{order\_id} + \text{status\_code} + \text{gross\_amount} + \text{ServerKey})$$
   Jika signature tidak cocok, kembalikan status HTTP `403 Forbidden` dan tolak payload.
3. **Pembaruan Status Transaksi**:
   - Jika `transaction_status` $\in$ (`'settlement'`, `'capture'`) dan `fraud_status == 'accept'`:
     - `tb_pesanan.status_pembayaran = 'lunas'`
     - `tb_reservasi_sesi.status_reservasi = 'dipesan'` (Tiket sah).
   - Jika `transaction_status` $\in$ (`'expire'`, `'cancel'`, `'deny'`):
     - `tb_pesanan.status_pembayaran = 'kedaluwarsa'` (atau `'dibatalkan'`).
     - `tb_reservasi_sesi.status_reservasi = 'kedaluwarsa'`.
     - Lepaskan kursi secara atomik: `jumlah_terisi = jumlah_terisi - 1`.

---

### 3.5 Alur 5: Kebijakan Pembatalan Mandiri Fleksibel (Flexible Cancellation)
1. Pelanggan membuka tiket di `/riwayat` dan mengklik tombol *"Batalkan Reservasi"*.
2. **Pemeriksaan Syarat Batas Waktu**:
   $$\text{waktu\_mulai\_sesi} - \text{CURRENT\_TIMESTAMP} \ge \text{batas\_batal\_jam}$$
3. **Hasil Evaluasi**:
   - **Sah Membatalkan**: Status tiket diubah menjadi `dibatalkan`, dan sistem otomatis mengembalikan kuota: `UPDATE tb_jadwal_sesi SET jumlah_terisi = jumlah_terisi - 1`.
   - **Tidak Sah (Hangus)**: Jika sisa waktu lebih kecil dari `batas_batal_jam` (misal kelas tinggal 3 jam lagi padahal batas batal 12 jam), pembatalan ditolak sistem demi kepastian operasional instruktur.

---

### 3.6 Alur 6: Absensi & Verifikasi Kehadiran oleh Pelatih (Trainer Attendance)
1. Pelatih masuk ke portal `/pelatih` menggunakan akun pelatih terverifikasi.
2. Sistem menampilkan daftar sesi kelas yang diajar oleh pelatih tersebut pada hari ini.
3. Pelatih membuka daftar hadir peserta yang memegang tiket sah (`status_reservasi = 'dipesan'`).
4. Saat peserta datang di pintu studio:
   - Pelatih mencentang kehadiran $\rightarrow$ status berubah menjadi `'hadir'`, mencatat `diabsen_oleh_pelatih_id` dan `waktu_absensi = CURRENT_TIMESTAMP`.
   - Jika peserta tidak hadir hingga sesi berakhir $\rightarrow$ status ditandai `'tidak_hadir'`.
5. Pelatih menandai sesi kelas selesai (`status_sesi = 'selesai'`).

---

## 4. Skema Basis Data 10 Tabel (PostgreSQL 16 Native)

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
                 ▼                               ▼      │tb_reservasi_sesi │ (Tiket Sah & Absensi)
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

## 5. Golden Tech Stack Constraints (STRICT)

Setiap agen, subagen, dan kontributor WAJIB mematuhi stack berikut tanpa deviasi:

| Komponen | Pilihan Wajib | Aturan & Batasan Keras |
| :--- | :--- | :--- |
| **Package Manager & Runtime** | **Bun** (>= 1.3.x) | **HANYA gunakan Bun**. Dilarang menggunakan `npm`, `yarn`, atau `pnpm`. Jalankan script dengan `bun run dev`, `bun run build`, dan instalasi dependensi dengan `bun add`. |
| **Framework Fullstack** | **Astro** (SSR Mode) | Mode Server-Side Rendering (`output: 'server'`) menggunakan `@astrojs/node`. Gunakan **Astro Actions** untuk mutasi server/form. Dilarang menggunakan Next.js. |
| **Database** | **PostgreSQL 16 Native** | Standar ACID murni. Gunakan `gen_random_uuid()` bawaan PostgreSQL 16 (tanpa ekstensi `uuid-ossp`). Konvensi tabel `tb_*`. |
| **ORM & Migrations** | **Prisma ORM** | Skema terpusat di `prisma/schema.prisma`. Gunakan `bunx prisma studio` untuk inspeksi visual GUI dan `bunx prisma db pull` / `push`. |
| **Styling & Design System** | **Baremetal Pure CSS** | Berbasis panduan resmi [DESIGN.md](file:///C:/laragon/www/zeira-wellness-sanctuary/web/DESIGN.md). **DILARANG memakai Tailwind, CSS-in-JS, atau CDN eksternal**. Desain menganut prinsip *Tactile Atelier Skeuomorphic* (Plus Jakarta Sans, JetBrains Mono) dan sistem ikon Phosphor (<Icon /> SVGs lokal, zero emoji). |
| **Payment Gateway** | **Midtrans Snap Sandbox** | Verifikasi signature notifikasi webhook menggunakan SHA-512. Mekanisme penahanan kursi sementara 15 menit. |
| **Concurrency Control** | **Pessimistic Row Locking** | `SELECT ... FOR UPDATE` via raw SQL di Prisma Interactive Transaction (`tx.$queryRaw`) + Hard Constraint `CHECK (jumlah_terisi <= kapasitas_maksimal)`. Dilarang bergantung pada Redis. |

---

## 6. Directory & Architectural Conventions

Arsitektur menganut **Pemisahan 3-Lapisan (3-Tier)** dengan **Service-in-Root** dan **Per-Folder Routing**:

```
web/
├── prisma/
│   └── schema.prisma                    # 10 tabel DDL Prisma PostgreSQL 16
├── src/
│   ├── db/                              # DATABASE SINGLETON
│   │   └── prisma.ts                    # PrismaClient singleton instance
│   │
├── services/                            # DOMAIN CORE ENGINE (ZERO UI / FRAMEWORK-AGNOSTIC)
│   ├── reservasi/                       # Logic: Kunci 15 menit, anti-overbooking, batal
│   │   ├── reservasi.service.ts
│   │   ├── reservasi.queries.ts
│   │   └── reservasi.types.ts
│   ├── jadwal/                          # Logic: Vision window (30 hari vs 7 hari), kuota
│   ├── membership/                      # Logic: Dedicated locker assignment, status aktif
│   ├── payment/                         # Logic: Midtrans Snap API, SHA-512 webhook
│   └── auth/                            # Logic: Argon2id hash, HTTP-only session
│
├── actions/                             # PRESENTATION MUTATION GATEWAY
│   └── index.ts                         # Astro Actions (Validasi Zod -> panggil services)
│
├── layouts/                             # PRESENTATION SHELL
│   └── SanctuaryLayout.astro            # Master layout: <head>, SEO, Navbar, Footer, Modal
│
├── styles/                              # GLOBAL STYLESHEET
│   └── global.css                       # Baremetal Pure CSS (Skeuomorphic Atelier)
│
└── pages/                               # PRESENTATION ROUTING (PER-FOLDER MANDATORY)
    ├── index.astro                      # URL: / (Landing Page)
    ├── jadwal/
    │   └── index.astro                  # URL: /jadwal (Katalog & Filter Jadwal)
    ├── membership/
    │   └── index.astro                  # URL: /membership (Paket & Loker)
    ├── reservasi/
    │   └── index.astro                  # URL: /reservasi (Form Booking & Checkout)
    ├── riwayat/
    │   └── index.astro                  # URL: /riwayat (Tiket Saya & Batal Mandiri)
    ├── pelatih/
    │   └── index.astro                  # URL: /pelatih (Absensi Kehadiran Kelas)
    ├── admin/
    │   └── index.astro                  # URL: /admin (Master Data, Jadwal, Rekap)
    └── api/
        └── webhook/
            └── midtrans.ts              # URL: POST /api/webhook/midtrans (External Webhook)
```

### Aturan Rute Halaman (Frontend):
1. **Setiap segmen rute WAJIB berupa folder** dengan file `index.astro` di dalamnya. (Dilarang membuat file rute lepas seperti `jadwal.astro` jika merupakan rute utama).
2. Jika ada komponen lokal yang hanya dipakai di rute tertentu, letakkan di subfolder `_components/` pada folder rute tersebut.

---

## 7. Anti-AI-Slop & UI Craft Discipline (STRICT)

1. **Dilarang Keras Badge Pill Melengkung (Eyebrow-Pill)**:
   - Dilarang membuat elemen pill kecil melengkung dengan dot berdenyut dan teks klise hype seperti `SANCTUARY TERBUKA • UMUM & MEMBER AKTIF`, `SINKRONISASI JADWAL STUDIO AKTIF`, atau `ATMOSFER ORGANIK`.
   - **Promosi Sesi / Teaser Live WAJIB Kotak UI Nyata (`.hero-session-card`)**: Dilarang membungkus promosi sesi menjadi badge pill kurus. Gunakan kotak widget UI beneran yang terstruktur (berisi live indicator, waktu sesi, kuota tersisa, nama instruktur) dengan tombol aksi hijau taktikal yang nikmat (`.btn-session-action`).
   - Gunakan judul bersih, sober, dan tipografi berdaulat tanpa ornamen palsu.
2. **Dilarang Tombol CTA Duplikat yang Redundan**:
   - Dilarang menaruh tombol aksi (CTA) yang posisinya persis bersebelahan atau tepat di bawah menu navigasi yang menuju halaman yang sama (misal tombol *Jelajahi Kelas* tepat di bawah link navbar *Jadwal Kelas*).
3. **Navbar Header Action = Keranjang Reservasi**:
   - Tombol di pojok kanan atas header adalah tombol Keranjang/Tiket (`.btn-cart`) dengan ikon Phosphor `shopping-bag` dan badge kuota angka monospaced, yang langsung membuka modal checkout ringkasan reservasi.
4. **Hero Immersive Carousel & Centered Layout**:
   - Hero section landing page menggunakan full-width/full-screen visual carousel dengan 3 slide foto studio kurasi tinggi, posisi teks dan kotak reservasi tepat di center (vertikal & horizontal).
   - Menggunakan tombol navigasi panah melingkar (`carousel-nav-btn`) di sisi kiri-kanan dan indikator titik minimalis (`carousel-dots-bar`) di bawah. Dilarang menjejerkan tab angka 01/02/03 kaku.
   - Setiap slide memiliki kutipan/headline produk spesifik (Reformer, Hydro Mineral Pool 34°C, Zen Dome Sound Bath) yang bervariasi secara kontekstual.
5. **Dilarang Teks Garansi Muluk & Verbose**:
   - Dilarang menyematkan stempel garansi kosong (*ZEIRA SEAL* 100% money-back), deskripsi bento material yang bertele-tele, atau banner concierge WhatsApp yang mengganggu alur.
   - Fokus penuh pada fungsi esensial sistem: katalog jadwal kelas, transparansi kuota kursi real-time, paket membership, dan penahanan kursi 15 menit.
6. **Padding Global Ramping (Fluid Gutter)**:
   - Gunakan `.container` dengan max-width 1260px dan padding horizontal ramping `clamp(0.75rem, 2vw, 1.5rem)` agar layout bernapas lega dan tidak terjepit margin tebal di layar desktop.

---

## 8. Security & Production Hardening Directives (STRICT)

Setiap agen dan kontributor WAJIB mematuhi 7 pilar keamanan produksi berikut:

1. **API Keys & Server-Side Secrets Security**:
   - Seluruh private keys dan credentials sensitif (Midtrans Server Key, Midtrans Client Secret, Database URL, Auth Secret/Session Key) WAJIB hanya berada dan diakses di sisi server (`process.env` / Astro server-side context).
   - **DILARANG KERAS** mengekspos secrets ke client-side runtime, dilarang memberi prefix `PUBLIC_` pada environment variable untuk secret sensitif di Astro, dan dilarang menyisipkan token rahasia ke dalam HTML template, inline scripts, atau atribut DOM.

2. **Strict Environment File Exclusion (.env)**:
   - File konfigurasi rahasia (`.env`, `.env.local`, `.env.production`, `.env.*`) **DILARANG KERAS** di-commit ke Git/GitHub.
   - Hanya file `.env.example` berisi dummy placeholder / key mock tanpa kredensial riil yang boleh dimasukkan ke dalam version control.
   - Aturan `.gitignore` di root maupun direktori `web/` wajib secara konsisten mengabaikan seluruh varian `.env` selain `.env.example`.

3. **Rate Limiting Engine**:
   - Wajib memasang pembatas laju permintaan (*rate limiter*) pada endpoint krusial dan sensitif: alur autentikasi (login, register), endpoint mutasi reservasi/checkout, trigger transaksi Midtrans Snap, serta webhook incoming.
   - Langkah ini mutlak untuk memitigasi serangan brute-force, credential stuffing, dan automated DoS yang dapat memanipulasi penahanan kursi (*seat holding denial-of-service*).

4. **Input Validation & Data Sanitization**:
   - Seluruh input yang berasal dari pengguna (payload form, query params, URL parameters, header custom) WAJIB divalidasi dan disanitasi secara ketat di sisi server via Astro Actions atau API Route handler menggunakan skema validasi deklaratif (**Zod**).
   - Dilarang mempercayai atau langsung mengeksekusi payload mentah tanpa verifikasi tipe data, panjang karakter, dan format regex yang aman. Sanitasi string untuk menangkal SQL Injection, NoSQL injection, serta Stored/Reflected Cross-Site Scripting (XSS).

5. **Authentication & Role-Based Access Control (RBAC) pada Protected Routes**:
   - Seluruh rute privat/terproteksi (seperti dashboard `/admin`, portal `/pelatih`, halaman riwayat tiket pribadi `/riwayat`, serta endpoint mutasi) WAJIB diverifikasi melalui middleware autentikasi dan otorisasi peran (*Role-Based Access Control* murni: `admin`, `pelatih`, `pelanggan`).
   - Manajemen sesi wajib menggunakan cookie aman bertanda `HttpOnly`, `Secure`, dan `SameSite=Lax` (atau `Strict`).
   - Jika pengguna belum terautentikasi atau tidak memiliki hak akses yang sesuai, lakukan redirect otomatis ke portal login atau kembalikan status HTTP `401 Unauthorized` / `403 Forbidden`.

6. **Non-Verbose Error Handling & Zero Stack Trace Leaks**:
   - Pesan kesalahan yang dikirimkan kembali ke UI peramban atau response API **TIDAK BOLEH VERBOSE** dan **DILARANG KERAS** membocorkan informasi internal server (seperti kode error Prisma murni, nama kolom/tabel PostgreSQL, query SQL mentah, path direktori lokal server, atau full stack traces).
   - Selalu tangkap exception menggunakan blok `try...catch` terstandarisasi dan kembalikan pesan kegagalan yang manusiawi dan aman (misalnya: `"Terjadi kendala saat memproses reservasi Anda. Silakan coba beberapa saat lagi."`). Detail stack trace hanya boleh dicatat ke log server internal.

7. **Zero Debug & Superadmin Backdoors**:
   - Seluruh endpoint pengujian sementara (*testing endpoints*), rute inspeksi memori/debug (*debug routes*), bypass autentikasi pengembang, akun superadmin siluman tanpa relasi database, atau kredensial yang di-hardcode di file kode program **WAJIB DIHAPUS / DINONAKTIFKAN** secara total.
   - Semua akses administratif wajib melewati autentikasi formal terverifikasi dengan hash Argon2id dan pencocokan peran pada tabel basis data `tb_pengguna` (`peran = 'admin'`).
