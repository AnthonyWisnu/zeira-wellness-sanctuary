# Engineering & Implementation Roadmap: ZEIRA WELLNESS SANCTUARY
> **File Acuan Kerja AI AGENTS**: Berurutan & Bertahap  
> **Status**: APPROVED EXECUTION BLUEPRINT (LOCAL DEV ONLY — STRICT NO PUSH)  
> **Branch**: `dev`

---

## 🎯 Ringkasan Tujuan
Membangun platform *fullstack* lengkap **ZEIRA Wellness Sanctuary** di atas kerangka UI yang sudah ada, melengkapi seluruh fungsionalitas backend, basis data PostgreSQL 16, Prisma ORM, Astro SSR (Astro Actions), sistem autentikasi RBAC (Admin, Pelatih, Member, Tamu), alur reservasi anti-overbooking 15 menit, hingga 3 portal dashboard utama (`/admin`, `/pelatih`, `/riwayat`).

---

## 🗺️ Tahapan Pengerjaan (Step-by-Step Execution Phases)

```
┌────────────────────────────────────────────────────────────────────────┐
│ FASE 1: BASIS DATA & PRISMA ORM MODELING                               │
│ 1.1 Buat DB PostgreSQL `zeira_sanctuary_db` & jalankan `schema.sql`     │
│ 1.2 Buat `web/prisma/schema.prisma` (10 Tabel, Relasi & Indeks Parsial)│
│ 1.3 Generate Prisma Client & Buat Database Singleton `prisma.ts`       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ FASE 2: SSR ENGINE, MIDDLEWARE & AUTENTIKASI (RBAC)                    │
│ 2.1 Konfigurasi Astro SSR Mode (`@astrojs/node` standalone)            │
│ 2.2 Auth Service (Argon2id Hash, Signed Session Token, Cookie HttpOnly)│
│ 2.3 Middleware Astro (`src/middleware.ts`) untuk proteksi rute RBAC    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ FASE 3: DOMAIN CORE SERVICES ENGINE (3-TIER SERVICE LAYER)             │
│ 3.1 `services/jadwal`: Vision Window (30 hari member vs 7 hari tamu)   │
│ 3.2 `services/membership`: Paket membership, dedicated locker lock     │
│ 3.3 `services/reservasi`: Anti-overbooking FOR UPDATE & 15m hold lock  │
│ 3.4 `services/payment`: Midtrans Snap sandbox & SHA-512 webhook        │
│ 3.5 `services/pelatih`: Verifikasi absensi fisik & rekap sesi          │
│ 3.6 `services/admin`: CRUD master data, buka/tutup sesi, rekap pesanan │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ FASE 4: ASTRO ACTIONS GATEWAY & SANITASI INPUT                         │
│ 4.1 Buat `src/actions/index.ts` dengan validasi Zod deklaratif         │
│ 4.2 Actions: Auth (Login/Register/Logout), Booking Kursi, Batal Mandiri│
│ 4.3 Actions: Absensi Pelatih, Mutasi Master Data Admin                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ FASE 5: IMPLEMENTASI DASHBOARD & HALAMAN PORTAL LENGKAP                │
│ 5.1 Portal Autentikasi: `/login/index.astro` & `/register/index.astro` │
│ 5.2 Hubungkan `/` dan `/jadwal/index.astro` ke live database service   │
│ 5.3 Hubungkan `/membership/index.astro` ke live inventory loker & paket│
│ 5.4 Form Checkout Sesi: `/reservasi/index.astro` (Timer 15 Menit)      │
│ 5.5 Dashboard Pelanggan: `/riwayat/index.astro` (Tiket & Batal Mandiri)│
│ 5.6 Dashboard Pelatih: `/pelatih/index.astro` (Absensi Fisik Peserta)  │
│ 5.7 Dashboard Admin: `/admin/index.astro` (Ruangan, Loker, Jadwal, Rekap│
│ 5.8 Webhook Midtrans: `/api/webhook/midtrans.ts` (Validasi SHA-512)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ FASE 6: AUDIT INTEGRASI, UJI COBA BUILD & SEEDING                      │
│ 6.1 Verifikasi seeding akun default (Admin, Pelatih, Member, Tamu)     │
│ 6.2 Uji coba build produksi (`bun run build`)                          │
│ 6.3 Verifikasi manual 7 pilar keamanan & pastikan TIDAK DI-PUSH        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Rincian Detail Setiap Fase

### Fase 1: Basis Data & Prisma ORM Modeling
- **Output File**:
  - `web/.env`: Konfigurasi `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zeira_sanctuary_db?schema=public"`, `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `SESSION_SECRET`.
  - `web/prisma/schema.prisma`: DDL 10 tabel PostgreSQL 16 murni sesuai standar [AGENTS.md](file:///C:/laragon/www/zeira-wellness-sanctuary/AGENTS.md).
  - `web/src/db/prisma.ts`: Singleton PrismaClient yang ramah HMR (Hot Module Replacement) di Bun runtime.
- **Validasi**:
  - Eksekusi `database/schema.sql` ke server PostgreSQL lokal.
  - Jalankan `bunx prisma generate` tanpa ada error relasi.

---

### Fase 2: SSR Engine, Middleware & Autentikasi (RBAC)
- **Output File**:
  - `web/astro.config.mjs`: Konfigurasi `output: 'server'` dengan adapter `@astrojs/node({ mode: 'standalone' })`.
  - `web/src/middleware.ts`: Interseptor permintaan HTTP global untuk membaca session token dari HttpOnly cookie, memverifikasi payload peran (`admin`, `pelatih`, `pelanggan`), dan melakukan proteksi rute:
    - `/admin/*` $\rightarrow$ Hanya peran `admin`.
    - `/pelatih/*` $\rightarrow$ Hanya peran `pelatih`.
    - `/riwayat/*`, `/reservasi/*` $\rightarrow$ Wajib login (semua peran yang terdaftar).
- **Validasi**:
  - Akses rute `/admin` tanpa login otomatis dialihkan ke `/login`.

---

### Fase 3: Domain Core Engine (Service-in-Root Architecture)
Arsitektur menganut *Clean Architecture* tanpa dependensi UI:
1. **`services/auth/`**:
   - `auth.service.ts`: Fungsi `masuk()`, `daftar()`, `verifikasiSesi()`. Menggunakan `Bun.password.hash(..., { algorithm: 'argon2id' })`.
2. **`services/jadwal/`**:
   - `jadwal.service.ts`: Query view `v_katalog_sesi_tersedia` dengan penegakan **Vision Window Law** (Member: 30 hari ke depan, Non-Member: 7 hari ke depan).
3. **`services/membership/`**:
   - `membership.service.ts`: Alokasi dedicated locker LK-01 s.d. LK-10, aktivasi status membership, pencegahan double membership aktif per pelanggan.
4. **`services/reservasi/`**:
   - `reservasi.service.ts`: Kunci kursi atomik via Prisma Interactive Transaction (`tx.$queryRaw` `SELECT ... FOR UPDATE`), penambahan kursi `jumlah_terisi + 1`, inisiasi pesanan status `menunggu_pembayaran` 15 menit, dan rollback kuota saat batal/kedaluwarsa.
5. **`services/payment/`**:
   - `payment.service.ts`: Mock / real Midtrans Snap client, kalkulasi hash SHA-512 untuk validasi webhook notifikasi.
6. **`services/pelatih/`**:
   - `pelatih.service.ts`: Verifikasi kehadiran peserta (`hadir` / `tidak_hadir`) dan audit waktu absensi.
7. **`services/admin/`**:
   - `admin.service.ts`: Pengaturan master ruangan, loker, kategori layanan, jadwal kelas studio, dan audit rekapitulasi pesanan.

---

### Fase 4: Astro Actions Gateway & Sanitasi Zod
- **Output File**: `web/src/actions/index.ts`
- **Aksi Server yang Diekspos**:
  - `auth`: `loginAction`, `registerAction`, `logoutAction`.
  - `reservasi`: `pesanSesiAction`, `batalkanSesiAction`.
  - `membership`: `beliMembershipAction`.
  - `pelatih`: `catatAbsensiAction`, `selesaikanSesiAction`.
  - `admin`: `simpanJadwalAction`, `hapusJadwalAction`, `simpanRuanganAction`, `simpanLokerAction`.
- **Validasi**: Seluruh input wajib divalidasi skema Zod ketat dan lolos sanitasi string.

---

### Fase 5: Implementasi UI & Halaman Portal Lengkap
Menerapkan gaya visual **Tactile Atelier Skeuomorphic** (Baremetal Pure CSS di `global.css`, Phosphor Icons `<Icon />`, zero emoji):

1. **Halaman Autentikasi** (`/login/index.astro` & `/register/index.astro`):
   - Form login taktil elegan dengan tombol cepat (*quick-switch demo accounts*):
     - `admin@zeira.sanctuary` (Administrator)
     - `sarah.jenkins@zeira.sanctuary` (Pelatih Master)
     - `kadek.adi@gmail.com` (Member Aktif)
     - `budi.santoso@gmail.com` (Tamu Non-Member)
2. **Katalog & Landing Page Dinamis** (`/` & `/jadwal/index.astro`):
   - Menampilkan data jadwal riil dari database.
   - Badge harga kontekstual (Harga Member vs Harga Non-Member).
   - Penguncian otomatis jadwal hari ke-8 s.d. 30 untuk non-member.
3. **Pemesanan & Pilihan Loker** (`/membership/index.astro`):
   - Visualisasi loker fisik LK-01 s.d. LK-10 (Tersedia vs Sedang Digunakan).
4. **Form Checkout Kursi** (`/reservasi/index.astro`):
   - Countdown timer 15 menit penahanan kursi.
   - Ringkasan pesanan & simulasi pembayaran Midtrans Snap.
5. **Dashboard Riwayat & Tiket Saya** (`/riwayat/index.astro`):
   - Kartu tiket taktil dengan status `Dipesan`, `Hadir`, `Dibatalkan`.
   - Tombol pembatalan mandiri yang mengevaluasi `batas_batal_jam`.
   - Kartu info keanggotaan aktif & nomor lemari loker pribadi member.
6. **Portal Pelatih** (`/pelatih/index.astro`):
   - Ringkasan kelas yang diajar pelatih hari ini.
   - Lembar absensi interaktif: centang Hadir / Tidak Hadir untuk memverifikasi tiket fisik di pintu studio.
7. **Dashboard Administrator** (`/admin/index.astro`):
   - Kartu metrik pendapatan, total member aktif, dan okupansi loker.
   - Tab Manajemen Jadwal Studio (Buat jadwal baru, set kapasitas, harga member vs non-member, batas pembatalan jam).
   - Tab Master Ruangan & Kategori.
   - Tab Audit Pesanan & Log Midtrans.
8. **Endpoint Webhook** (`/api/webhook/midtrans.ts`):
   - Handler HTTP POST untuk sinkronisasi otomatis status pembayaran Midtrans via SHA-512.

---

### Fase 6: Verifikasi, Seeding & Audit Lokal (Strict No Push)
- Jalankan seeding data lengkap ke PostgreSQL.
- Uji alur pemesanan serentak (anti-overbooking).
- Uji alur pembatalan mandiri sebelum dan sesudah batas jam.
- Uji alur absensi pelatih di studio.
- Jalankan `bun run build` untuk menjamin zero build/type error.
- **Sesuai instruksi: Seluruh pekerjaan tetap berada di branch `dev` lokal dan TIDAK DI-PUSH.**

---
*Roadmap ini adalah acuan kerja mutlak bagi AI Agents dalam mengimplementasikan sistem ZEIRA Sanctuary secara terstruktur.*
