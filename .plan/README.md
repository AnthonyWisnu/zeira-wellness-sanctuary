# Indeks Perancangan Arsitektur (.plan)
## Wellness Club Web Platform

Direktori `.plan/` ini merupakan pusat dokumentasi rancang bangun sistem, arsitektur data, dan diagram alur resmi aplikasi web reservasi Wellness Club:

```
.plan/
├── db/                                      # Arsitektur & Model Fisik Basis Data
│   ├── PENJELASAN_SKEMA.md                 # 📖 Panduan naratif & bedah fungsi 10 tabel relasional
│   ├── schema.sql                          # 🐘 Skrip DDL PostgreSQL 16 Native (DDL, Triggers, Views, Seeding)
│   └── spec.md                             # 📑 Spesifikasi teknis backend, RBAC, & kontrol konkurensi
├── flowchart/                               # Perancangan Alur Sistem
│   ├── flowchart_reservasi.png             # 📊 Diagram alur proses reservasi & pembayaran (300 DPI)
│   ├── flowchart_reservasi.svg             # 🎨 Berkas vektor SVG
│   ├── flowchart_reservasi.mmd             # 💻 Kode sumber Mermaid diagram
│   └── flowchart_reservasi.txt             # 📝 Salinan teks kode Mermaid
└── usecase-diagram/                         # Perancangan Model Fungsional
    ├── usecase_diagram.png                 # 📊 Diagram Use Case 3 aktor pengguna (300 DPI)
    ├── usecase_diagram.svg                 # 🎨 Berkas vektor SVG
    ├── usecase_diagram.mmd                 # 💻 Kode sumber Mermaid diagram
    └── usecase_diagram.txt                 # 📝 Salinan teks kode Mermaid
```

---

### Dokumen Rekomendasi untuk Dibaca:
* **Penjelasan Lengkap Skema Database**: Baca [`db/PENJELASAN_SKEMA.md`](file:///D:/DEVELOPMENT/github/19_wellnes_bk/.plan/db/PENJELASAN_SKEMA.md) untuk memahami analogi dunia nyata, fungsi tiap kolom, dan alasan di balik penggunaan *Partial Unique Indexes* serta *Pessimistic Locking*.
* **Spesifikasi Arsitektur Sistem**: Baca [`db/spec.md`](file:///D:/DEVELOPMENT/github/19_wellnes_bk/.plan/db/spec.md) untuk rincian stack teknologi Next.js 16/Bun, RBAC, dan audit Midtrans Snap.
