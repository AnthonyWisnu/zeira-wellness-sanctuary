# Project Engineering Charter: ZEIRA WELLNESS SANCTUARY

> **Proyek**: Sistem Web Reservasi & Manajemen Paket Wellness Club  
> **Mata Kuliah**: Pemrograman Backend — Universitas Udayana  
> **Pemilik**: Bos Kadzura (I Kadek Adi Sunetra) & Schatten  
> **Status**: BINDING ARCHITECTURAL STANDARD

---

## 1. Golden Tech Stack Constraints (STRICT)

Setiap agen, subagen, dan kontributor WAJIB mematuhi stack berikut tanpa deviasi:

| Komponen | Pilihan Wajib | Aturan & Batasan Keras |
| :--- | :--- | :--- |
| **Package Manager & Runtime** | **Bun** (>= 1.3.x) | **HANYA gunakan Bun**. Dilarang menggunakan `npm`, `yarn`, atau `pnpm`. Jalankan script dengan `bun run dev`, `bun test`, dan instalasi dependensi dengan `bun add`. |
| **Framework Fullstack** | **Astro** (SSR Mode) | Mode Server-Side Rendering (`output: 'server'`). Gunakan **Astro Actions** untuk mutasi server/form. Dilarang menggunakan Next.js. |
| **Database** | **PostgreSQL 16 Native** | Standar ACID murni. Gunakan `gen_random_uuid()` bawaan PostgreSQL 16 (tanpa ekstensi `uuid-ossp`). Konvensi tabel `tb_*`. |
| **ORM & Migrations** | **Prisma ORM** | Skema terpusat di `prisma/schema.prisma`. Gunakan `bunx prisma studio` untuk inspeksi visual GUI dan `bunx prisma db pull` / `push`. |
| **Styling & Design System** | **Baremetal Pure CSS** | Berbasis panduan resmi [DESIGN.md](file:///D:/DEVELOPMENT/github/19_wellnes_bk/web/DESIGN.md). **DILARANG memakai Tailwind, CSS-in-JS, atau CDN eksternal**. Desain menganut prinsip *Tactile Atelier Skeuomorphic* (Plus Jakarta Sans, JetBrains Mono) dan sistem ikon Phosphor (<Icon /> SVGs lokal, zero emoji). |
| **Payment Gateway** | **Midtrans Snap Sandbox** | Verifikasi signature notifikasi webhook menggunakan SHA-512. Mekanisme penahanan kursi sementara 15 menit. |
| **Concurrency Control** | **Pessimistic Row Locking** | `SELECT ... FOR UPDATE` via raw SQL di Prisma Interactive Transaction (`tx.$queryRaw`) + Hard Constraint `CHECK (jumlah_terisi <= kapasitas_maksimal)`. Dilarang bergantung pada Redis. |

---

## 2. Directory & Architectural Conventions

Arsitektur menganut **Pemisahan 3-Lapisan (3-Tier)** dengan **Service-in-Root** dan **Per-Folder Routing**:

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

## 3. Business Logic Laws (Nilai Akademik Kritis)

1. **Vision Window Law**:
   - Pelanggan **Member Aktif**: Dapat melihat & memesan jadwal hingga **30 hari ke depan**.
   - Pelanggan **Non-Member (Tamu)**: Dibatasi maksimal **7 hari ke depan**.
2. **Anti-Overbooking Law**:
   - Sebelum kursi ditambah, WAJIB eksekusi `SELECT ... FOR UPDATE` pada baris `tb_jadwal_sesi`.
   - Jika `jumlah_terisi >= kapasitas_maksimal`, tolak transaksi secara elegan.
3. **15-Minute Seat Hold Law**:
   - Pemesanan awal menaikkan `jumlah_terisi + 1` dan status `menunggu_pembayaran`.
   - Jika pembayaran kedaluwarsa/gagal, server melepaskan kursi (`jumlah_terisi - 1`) dan status menjadi `kedaluwarsa`.
4. **Flexible Cancellation Law**:
   - Pelanggan hanya dapat membatalkan tiket mandiri jika `waktu_mulai - NOW() >= batas_batal_jam`.
   - Jika batal sah, kursi dikembalikan (`jumlah_terisi - 1`).
5. **Trainer Verified Attendance**:
   - Pelatih wajib memverifikasi kehadiran fisik peserta di studio sebelum menandai status `hadir`.

---

## 4. Anti-AI-Slop & UI Craft Discipline (STRICT)

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

