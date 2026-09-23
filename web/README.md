# ZEIRA Wellness Sanctuary — Web Application Package

Direktori `web/` ini berisi aplikasi fullstack monolith **ZEIRA Wellness Sanctuary** berbasis **Astro 5 (SSR Mode)** dan **Bun Runtime**.

> Dokumentasi arsitektur lengkap, skema basis data, dan piagam rekayasa tersedia di root repositori: [`../README.md`](file:///D:/DEVELOPMENT/github/19_wellnes_bk/README.md) dan [`../AGENTS.md`](file:///D:/DEVELOPMENT/github/19_wellnes_bk/AGENTS.md).

---

## 🚀 Perintah Operasional (Commands)

Seluruh perintah dijalankan dari dalam direktori `web/` menggunakan **Bun**:

| Perintah | Deskripsi Tindakan |
| :--- | :--- |
| `bun install` | Menginstalasi seluruh dependensi proyek |
| `bun run dev` | Menjalankan server pengembangan lokal di `http://localhost:4321` |
| `bun run build` | Melakukan kompilasi produksi server SSR ke direktori `./dist/` |
| `bun run seed` | Menjalankan database seeder kredensial & transaksi demo |
| `bunx prisma generate` | Men-generate TypeScript types dari `prisma/schema.prisma` |
| `bunx prisma studio` | Membuka antarmuka GUI browser untuk inspeksi data PostgreSQL |

---

## 🏛️ Struktur Direktori Internal `web/`

```text
web/
├── prisma/
│   └── schema.prisma           # Skema DDL Prisma ORM (10 Tabel PostgreSQL)
├── public/
│   ├── favicon.svg             # Favicon sanctuary
│   └── fonts/                  # WOFF2 Plus Jakarta Sans & JetBrains Mono lokal
├── scripts/
│   ├── seed_rich_demo_data.ts  # Seeder data jadwal, loker, dan keanggotaan
│   └── seed_users.ts           # Seeder akun admin, instruktur, dan pelanggan
├── services/                   # DOMAIN ENGINE (Framework-Agnostic / Zero UI)
│   ├── auth/                   # Autentikasi Argon2id & session management
│   ├── admin/                  # Master data studio, kategori, loker
│   ├── jadwal/                 # Katalog jadwal & 30-day/7-day vision window
│   ├── membership/             # Langganan durasi & dedicated locker assignment
│   ├── payment/                # Midtrans Snap API & verifikasi signature SHA-512
│   ├── pelatih/                # Agenda mengajar & presensi kehadiran fisik
│   └── reservasi/              # Anti-overbooking, kunci 15 menit, & pembatalan
├── src/
│   ├── actions/index.ts        # Astro Actions Gateway (Validasi input Zod)
│   ├── components/Icon.astro   # Renderer SVG Phosphor Icon lokal
│   ├── db/prisma.ts            # PrismaClient singleton instance
│   ├── layouts/
│   │   ├── DashboardLayout.astro  # Layout dashboard admin/pelatih/member
│   │   └── SanctuaryLayout.astro  # Layout halaman publik & modal pembayaran
│   ├── pages/                  # Halaman & endpoint API Astro SSR
│   └── styles/global.css       # Baremetal Pure CSS Tactile Atelier
├── astro.config.mjs            # Konfigurasi Astro SSR (@astrojs/node)
└── package.json                # Metadata & dependensi Bun
```
