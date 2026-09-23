# Indeks Perancangan Arsitektur (.plan)
## ZEIRA Wellness Sanctuary Platform

Direktori `.plan/` ini merupakan pusat dokumentasi rancang bangun sistem, arsitektur data, diagram alur, dan aset visual resmi aplikasi web reservasi ZEIRA Wellness Sanctuary:

```
.plan/
├── db/                                      # Arsitektur & Model Fisik Basis Data
│   ├── PENJELASAN_SKEMA.md                 # 📖 Panduan naratif & bedah fungsi 10 tabel relasional
│   └── spec.md                             # 📑 Spesifikasi teknis backend, RBAC, & kontrol konkurensi
├── flowchart/                               # Perancangan Alur Sistem
│   ├── flowchart_reservasi.png             # 📊 Diagram alur proses reservasi & pembayaran (300 DPI)
│   ├── flowchart_reservasi.svg             # 🎨 Berkas vektor SVG
│   ├── flowchart_reservasi.mmd             # 💻 Kode sumber Mermaid diagram
│   └── flowchart_reservasi.txt             # 📝 Salinan teks kode Mermaid
├── usecase-diagram/                         # Perancangan Model Fungsional
│   ├── usecase_diagram.png                 # 📊 Diagram Use Case 3 aktor pengguna (300 DPI)
│   ├── usecase_diagram.svg                 # 🎨 Berkas vektor SVG
│   ├── usecase_diagram.mmd                 # 💻 Kode sumber Mermaid diagram
│   └── usecase_diagram.txt                 # 📝 Salinan teks kode Mermaid
└── design/                                  # Aset Tangkapan Layar Desain Referensi
    ├── zeira_sanctuary_home_skeuomorphic/home_skeuomorphic_preview.png
    ├── zeira_sanctuary_jadwal_kelas_vertical_list/jadwal_kelas_preview.png
    └── zeira_sanctuary_membership_tanpa_drama/membership_passbook_preview.png
```

> **Catatan Sumber Kebenaran DDL**: Skrip DDL PostgreSQL 16/18 Native yang aktif dan kanonik berada di direktori [`database/schema.sql`](file:///D:/DEVELOPMENT/github/19_wellnes_bk/database/schema.sql) dan skema ORM berada di [`web/prisma/schema.prisma`](file:///D:/DEVELOPMENT/github/19_wellnes_bk/web/prisma/schema.prisma).

---

### Dokumen Rekomendasi untuk Dibaca:
* **Penjelasan Lengkap Skema Database**: Baca [`db/PENJELASAN_SKEMA.md`](file:///D:/DEVELOPMENT/github/19_wellnes_bk/.plan/db/PENJELASAN_SKEMA.md) untuk memahami analogi dunia nyata, fungsi tiap kolom, dan alasan di balik penggunaan *Partial Unique Indexes* serta *Pessimistic Locking*.
* **Spesifikasi Arsitektur Sistem**: Baca [`db/spec.md`](file:///D:/DEVELOPMENT/github/19_wellnes_bk/.plan/db/spec.md) untuk rincian stack teknologi Astro 5 SSR/Bun/Prisma, RBAC, dan audit Midtrans Snap.
* **Piagam Rekayasa & Standar Bisnis**: Baca [`AGENTS.md`](file:///D:/DEVELOPMENT/github/19_wellnes_bk/AGENTS.md) di direktori utama proyek.
