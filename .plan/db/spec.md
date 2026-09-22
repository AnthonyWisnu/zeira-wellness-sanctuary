# Technical Specification: Wellness Club Platform

> **Document Version**: 2.2.0 (Physical Data Model & Concurrency Hardened)  
> **Status**: RATIFIED  
> **Target Audience**: Backend Programming Academic Course & Production-Grade Architecture  
> **Maintainer**: Bos Kadzura & Schatten  

---

## 1. Executive Summary & Core Identity

Sistem web platform terpadu untuk **Wellness Club** yang menangani siklus hidup kebugaran, relaksasi, dan ketenangan:
* **Model Keanggotaan Masa Aktif**: Langganan durasi (1 bulan, 3 bulan, dsb.) dengan hak istimewa *dedicated locker*, akses bebas kolam renang & air mineral sehat harian, serta *jadwal vision* 30 hari ke depan. Akses gym berbayar/tiket mandiri.
* **Non-Member Drop-in Pass**: Pelanggan umum/tamu dapat membeli tiket per sesi studio tanpa paksaan membership (*jadwal vision* 7 hari ke depan).
* **Payment Gateway Modern**: Integrasi **Midtrans Snap Sandbox** dengan antarmuka modal checkout (QRIS, Virtual Account Bank) dan webhook HTTP POST asinkron dengan verifikasi tanda tangan kriptografis SHA-512.
* **Mekanisme Kunci Kursi 15 Menit**: Slot kursi studio ditahan sementara saat proses pemesanan dimulai dengan batas waktu kedaluwarsa 15 menit (`menunggu_pembayaran`); kursi dilepaskan otomatis (`jumlah_terisi - 1`) jika pembayaran kedaluwarsa atau dibatalkan.
* **Penjadwalan Kelas Studio & Anti-Overbooking**: Kontrol konkurensi kapasitas kursi berbasis *pessimistic row-level locking* (`SELECT ... FOR UPDATE`) + Hard DB Constraint (`CHECK (jumlah_terisi <= kapasitas_maksimal)`) guna menjaga kuota kelas secara mutlak dari benturan reservasi serentak.
* **Fleksibilitas Tarif Sesi Admin**: Setiap jadwal kelas studio memiliki konfigurasi tarif dinamis (`harga_non_member` & `harga_member`).
* **Kebijakan Pembatalan Fleksibel**: Batas waktu pembatalan (`batas_batal_jam`) yang dapat dikonfigurasi per sesi (misal: 24 jam, 12 jam, 48 jam, atau non-refundable / 0 jam).
* **Absensi Kehadiran Terverifikasi**: Validasi check-in kehadiran di studio langsung oleh Pelatih (Trainer).

---

## 2. Tech Stack & Architectural Constraints

| Layer / Concern | Technology Selection | Architectural Rationale |
| :--- | :--- | :--- |
| **Runtime** | **Bun** (>= 1.3.x) | *Zero Node.js friction*. Menggunakan native Bun test runner, native password hashing (`Bun.password.hash(..., 'argon2id')`), dan startup latency ultra-cepat. |
| **Framework** | **Next.js 16 (App Router)** | Fullstack monolith modern. Memisahkan Server Components (RSC), Route Handlers (`/api`), dan Server Actions. Terletak terisolasi di direktori `web/`. |
| **Language** | **TypeScript** (strict: true) | Jaminan *type safety* menyeluruh dari skema basis data Drizzle hingga response DTO. |
| **Payment Gateway** | **Midtrans Snap Sandbox** | Layanan gateway pembayaran standar Indonesia (QRIS, VA Transfer) dengan validasi webhook SHA-512 & penanganan idempotensi. |
| **Concurrency Control**| **Pessimistic Row-Level Locking** | `SELECT ... FOR UPDATE` dalam transaksi ACID PostgreSQL 16 untuk mencegah race condition / overbooking tanpa beban ketergantungan Redis. |
| **Styling** | **Baremetal Pure CSS** | *Zero Tailwind, Zero CSS-in-JS, Zero CDN*. Mengikuti arsitektur colocation: satu komponen satu folder, CSS scoped murni, metodologi BEM (`__part`, `--variant`), zero bloat. |
| **Database** | **PostgreSQL 16** | Standar industri untuk kepatuhan ACID, *row-level locking* (`FOR UPDATE`), dan performa relasional. *Native gen_random_uuid()* tanpa modul ekstensi eksternal. |
| **ORM & Migrations** | **Drizzle ORM + Drizzle Kit** | *Zero header friction*, tanpa binary Rust Prisma yang berat. Syntax SQL-like, zero overhead startup di Bun, type inference 100% native. |
| **Validation** | **Zod** | Validasi payload input di boundary API/Action sebelum dialirkan ke layer business logic / service. |
| **Auth & Security** | **HTTP-only Cookie Session + Bun Crypto** | Hashing password via Argon2id. Session token ditandatangani via native crypto dan disimpan di HTTP-only secure cookie. |

---

## 3. Role-Based Access Control (RBAC) Specification

Sistem membagi akses ke dalam **3 Peran Pengguna (Role)**:

```
┌─────────────────────────────────────────────────────────────┐
│                            ADMIN                            │
│  - Kelola Master Ruangan, Kategori, & Lemari Loker          │
│  - Kelola Paket Membership & Jadwal Sesi Kelas              │
│  - Atur Tarif Sesi (Member vs Non-Member) & Batas Batal     │
│  - Verifikasi Pembayaran & Rekap Transaksi                  │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      PELATIH / TRAINER       │ │     PELANGGAN (MEMBER/TAMU)│
│  - Monitoring jadwal sesi    │ │  - Beli Membership & Loker │
│  - Daftar peserta terdaftar  │ │  - Reservasi Sesi Kelas    │
│  - Verifikasi absensi hadir  │ │  - Batalkan Reservasi      │
│  - Selesaikan sesi kelas     │ │  - Akses Kolam & Fasilitas │
└──────────────────────────────┘ └────────────────────────────┘
```

### Authorization Matrix

| Fitur / Modul | Admin | Pelatih | Member | Tamu (Non-Member) |
| :--- | :---: | :---: | :---: | :---: |
| Lihat Jadwal (1 Minggu ke Depan) | ✅ | ✅ | ✅ | ✅ |
| Lihat Jadwal (30 Hari ke Depan) | ✅ | ✅ | ✅ | ❌ |
| Beli Paket Membership & Pilih Loker | ❌ | ❌ | ✅ (Perpanjang) | ✅ (Daftar Baru) |
| Reservasi Sesi dengan Harga Member | ❌ | ❌ | ✅ | ❌ |
| Reservasi Sesi dengan Harga Drop-in | ❌ | ❌ | ✅ | ✅ |
| Batalkan Reservasi (Sebelum Batas Waktu) | ❌ | ❌ | ✅ | ✅ |
| Verifikasi Kehadiran / Absensi di Kelas | ❌ | ✅ | ❌ | ❌ |
| Kelola Master Loker, Ruangan, Jadwal | ✅ | ❌ | ❌ | ❌ |
| Verifikasi Pembayaran Pesanan | ✅ | ❌ | ❌ | ❌ |

---

## 4. Physical Data Model (PDM) & Relasi 10 Tabel

Basis data dirancang dengan normalisasi tingkat ketiga (3NF) dan penegakan integritas data ketat di level PostgreSQL:

```
                    ┌───────────────────┐
                    │    tb_pengguna    │
                    └─────────┬─────────┘
         ┌────────────────────┼────────────────────┐
         │ (1:1)              │ (1:N)              │ (1:N)
         ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│tb_profil_pelatih │ │  tb_keanggotaan  │ │    tb_pesanan    │
└──────────────────┘ └────────┬─────────┘ └────────┬─────────┘
                              │                    │
          ┌───────────────────┼──────────┐         │ (1:1)
          │ (N:1)             │ (1:1)    │         ▼
          ▼                   ▼          │ ┌──────────────────┐
┌──────────────────┐ ┌──────────────────┐│ │tb_reservasi_sesi│
│tb_paket_membershp│ │     tb_loker     ││ └────────┬─────────┘
└──────────────────┘ └──────────────────┘│          │
                                         │          │ (N:1)
┌──────────────────┐ ┌──────────────────┐│          │
│tb_kategori_layann│ │    tb_ruangan    ││          │
└────────┬─────────┘ └────────┬─────────┘│          │
         │ (1:N)              │ (1:N)    │          │
         └──────────┬─────────┴──────────┘          │
                    ▼                               │
         ┌──────────────────┐                       │
         │  tb_jadwal_sesi  │◄──────────────────────┘
         └──────────────────┘
```

### Rincian 10 Tabel & Atribut Kunci:

1. **`tb_pengguna`**: Akun pengguna sentral (Admin, Pelatih, Pelanggan) dengan sandi ber-hash Argon2id.
2. **`tb_profil_pelatih`**: Data portofolio, sertifikasi (RYT-500, dsb.), bio, dan tahun pengalaman pelatih.
3. **`tb_kategori_layanan`**: Taksonomi kelas (Yoga, Pilates, Spa & Sauna) beserta ikon dan slug.
4. **`tb_ruangan`**: Studio fisik dengan batas kuota kapasitas penjaga ketenangan.
5. **`tb_loker`**: Master lemari loker pribadi (LK-01 s.d. LK-10) untuk fasilitas eksklusif member.
6. **`tb_paket_membership`**: Katalog paket langganan durasi masa aktif (Silver 1 Bulan, Gold 3 Bulan).
7. **`tb_keanggotaan`**: Relasi masa aktif member pelanggan dengan lemari loker terpilih.
8. **`tb_jadwal_sesi`**: Jadwal sesi studio, kapasitas maksimal, jumlah terisi, tarif berjenjang, dan batas batal.
9. **`tb_pesanan`**: Transaksi pembayaran (Midtrans Snap token, expiry 15 menit, signature webhook, dan audit trail).
10. **`tb_reservasi_sesi`**: Tiket reservasi sesi per pelanggan beserta pencatatan absensi pelatih.

---

## 5. Keputusan Desain & Mitigasi Cacat Integritas (Crucial Fixes)

### 5.1 Cacat Constraint Keras vs Partial Unique Index pada Reservasi
* **Masalah Skema Konvensional**: 
  Jika menggunakan `CONSTRAINT UNIQUE (id_jadwal, id_pelanggan)`, pelanggan yang pernah mencoba booking namun gagal bayar dalam 15 menit (tiket berstatus `kedaluwarsa`) atau membatalkan tiketnya (`dibatalkan`) akan **terblokir selamanya** untuk memesan sesi yang sama.
* **Solusi PostgreSQL 16 (Partial Unique Index)**:
  ```sql
  CREATE UNIQUE INDEX uq_reservasi_aktif_pelanggan_sesi
      ON tb_reservasi_sesi(id_jadwal, id_pelanggan)
      WHERE status_reservasi IN ('menunggu_pembayaran', 'dipesan', 'hadir');
  ```
  Status `dibatalkan` dan `kedaluwarsa` dikecualikan dari indeks unik ini, sehingga pelanggan bebas melakukan pemesanan ulang.

### 5.2 Pengikatan Lemari Loker & Membership Aktif
* **Masalah Skema Konvensional**:
  Memberikan `id_loker UUID UNIQUE` pada `tb_keanggotaan` akan menyebabkan nomor loker tersebut tidak pernah bisa disewa oleh member lain di masa depan meskipun keanggotaan pemegang sebelumnya sudah kedaluwarsa.
* **Solusi PostgreSQL 16 (Partial Unique Index)**:
  ```sql
  CREATE UNIQUE INDEX uq_keanggotaan_aktif_pelanggan
      ON tb_keanggotaan(id_pelanggan)
      WHERE status = 'aktif';

  CREATE UNIQUE INDEX uq_loker_aktif_keanggotaan
      ON tb_keanggotaan(id_loker)
      WHERE status = 'aktif' AND id_loker IS NOT NULL;
  ```
  Menjamin 1 pelanggan hanya memegang 1 membership aktif, dan 1 loker hanya dipegang oleh 1 member aktif secara bersamaan, tanpa mengorbankan riwayat keanggotaan masa lalu.

### 5.3 Mekanisme Kunci Kursi 15 Menit & Pencegahan Overbooking (Pessimistic Locking)
Ketika pelanggan menekan tombol "Bayar Sekarang", backend membungkus alur dalam transaksi database:
```sql
BEGIN;

-- 1. Kunci baris jadwal sesi (eksklusif)
SELECT id, kapasitas_maksimal, jumlah_terisi
FROM tb_jadwal_sesi
WHERE id = :id_jadwal
FOR UPDATE;

-- 2. Validasi sisa kuota
-- Jika jumlah_terisi >= kapasitas_maksimal -> ROLLBACK & lempar error "Sesi Penuh".

-- 3. Tahan kuota sementara (+1)
UPDATE tb_jadwal_sesi 
SET jumlah_terisi = jumlah_terisi + 1 
WHERE id = :id_jadwal;

-- 4. Buat pesanan (expiry 15 menit) & tiket reservasi status 'menunggu_pembayaran'
INSERT INTO tb_pesanan (...);
INSERT INTO tb_reservasi_sesi (...);

COMMIT;
```
Didukung dengan `CONSTRAINT check_kapasitas_terisi CHECK (jumlah_terisi <= kapasitas_maksimal)`, overbooking secara fisik mustahil terjadi pada level mesin PostgreSQL.

### 5.4 Audit Webhook Midtrans & Idempotensi
* Kolom `signature_key_terakhir` pada `tb_pesanan` menyimpan hash SHA-512 dari webhook Midtrans (`SHA512(order_id + status_code + gross_amount + ServerKey)`).
* Kolom `payload_gateway` bertipe `JSONB` menyimpan raw JSON callback sebagai bukti audit forensik transaksi.
* Jika webhook ganda (duplikasi jaringan) diterima, sistem mengecek `status_pembayaran`: bila sudah `lunas`, sistem langsung merespons `200 OK` tanpa mengubah status atau menambah kuota ulang (Idempotent).
