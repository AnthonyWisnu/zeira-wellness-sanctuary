# Panduan & Penjelasan Lengkap Skema Basis Data (PostgreSQL 16)
## Wellness Club Web Platform

Dokumen ini membedah arsitektur basis data **Wellness Club** secara menyeluruh, ramah dibaca, dan berorientasi pada logika bisnis riil. Setiap tabel dirancang dalam normalisasi ketiga (3NF), menggunakan tipe data native modern PostgreSQL 16 (tanpa ekstensi eksternal), serta dilengkapi perlindungan integritas data tingkat tinggi (*Partial Unique Indexes* dan *Pessimistic Locking Concurrency*).

---

## 🗺️ Peta Besar Arsitektur Basis Data (ERD Sederhana)

```
                    ┌─────────────────────────┐
                    │       tb_pengguna       │ (Akun Autentikasi & RBAC)
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
                 ▼                               ▼      │tb_reservasi_sesi │ (Tiket & Absensi)
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
                     (Sesi Kelas Studio & Kuota)
```

---

## 🏛️ Bedah Detail 10 Tabel Relasional

---

### 1. `tb_pengguna`
* **Peran Utama**: Pusat identitas, autentikasi, dan otorisasi seluruh manusia yang berinteraksi dengan sistem (*Single Source of Identity*).
* **Analog Dunia Nyata**: KTP / Paspor digital yang dibawa setiap orang ketika masuk ke gerbang klub kebugaran.
* **Kolom Kunci & Logika**:
  * `id (UUID)`: Kunci primer unik berbasis native PostgreSQL (`gen_random_uuid()`).
  * `nama_lengkap (VARCHAR 150)`: Nama resmi pelanggan, pelatih, atau admin.
  * `email (VARCHAR 255 UNIQUE)`: Identitas unik untuk login sistem.
  * `kata_sandi_hash (VARCHAR 255)`: Hash keamanan tinggi (menggunakan algoritma Argon2id).
  * `peran (VARCHAR 20)`: Hak akses sistem, dikunci ketat via CHECK constraint: `'admin'`, `'pelatih'`, atau `'pelanggan'`.
  * `status_aktif (BOOLEAN)`: Tombol sakelar (*kill-switch*) instan jika akun dinonaktifkan oleh administrator.
* **Relasi**:
  * `1:1` ke `tb_profil_pelatih` (hanya jika perannya adalah pelatih).
  * `1:N` ke `tb_keanggotaan` (pelanggan memiliki riwayat langganan membership).
  * `1:N` ke `tb_pesanan` (pelanggan membuat pesanan pembayaran).
  * `1:N` ke `tb_reservasi_sesi` (pelanggan memesan tiket kelas studio).

---

### 2. `tb_profil_pelatih`
* **Peran Utama**: Menyimpan portofolio, latar belakang profesional, sertifikasi kebugaran, dan pengalaman instruktur.
* **Analog Dunia Nyata**: Portofolio CV instruktur berlisensi internasional (misal: RYT-500 Yoga Alliance) yang dipajang di lobi klub untuk membangun kredibilitas.
* **Kolom Kunci & Logika**:
  * `id_pengguna (UUID UNIQUE)`: Kunci asing yang merujuk ke akun pengguna di `tb_pengguna` dengan aturan `ON DELETE CASCADE`.
  * `spesialisasi (VARCHAR 150)`: Bidang keahlian pelatih (contoh: *Ashtanga & Vinyasa Yoga Flow*, *STOTT Pilates*).
  * `sertifikasi (TEXT)`: Lisensi resmi yang dipegang pelatih.
  * `bio (TEXT)`: Deskripsi naratif filosofi latihan sang instruktur.
  * `pengalaman_tahun (INTEGER)`: Lama jam terbang pelatih (wajib `>= 0`).

---

### 3. `tb_kategori_layanan`
* **Peran Utama**: Taksonomi pengelompokan jenis kelas studio dan fasilitas relaksasi klub.
* **Analog Dunia Nyata**: Papan petunjuk zona klub (misal: Zona Yoga Ketenangan, Zona Pilates Postur, atau Zona Spa & Sauna Pemulihan).
* **Kolom Kunci & Logika**:
  * `nama_kategori (VARCHAR 100 UNIQUE)`: Nama resmi jenis layanan (contoh: *Yoga & Breathwork*).
  * `slug (VARCHAR 100 UNIQUE)`: Format URL ramah SEO (contoh: `yoga-breathwork`).
  * `ikon (VARCHAR 50)`: Penanda visual untuk antarmuka web (contoh: `sparkles`, `activity`, `flame`).
  * `status_aktif (BOOLEAN)`: Memungkinkan admin mengarsipkan sementara kategori yang sedang libur.
* **Relasi**: Direferensikan oleh `tb_jadwal_sesi` (1 kategori menaungi banyak jadwal kelas).

---

### 4. `tb_ruangan`
* **Peran Utama**: Manajemen studio fisik tempat kelas diadakan, sekaligus penjaga batas kapasitas kenyamanan dan ketenangan.
* **Analog Dunia Nyata**: Ruang studio akustik kayu jati atau ruang sauna dengan jumlah matras/kursi terbatas agar suasana tetap hening dan privat.
* **Kolom Kunci & Logika**:
  * `nama_ruangan (VARCHAR 100 UNIQUE)`: Nama studio (contoh: *Studio Shanti (Zen Room)*).
  * `lokasi (VARCHAR 100)`: Posisi fisik studio (contoh: *Lantai 2 Sayap Timur*).
  * `kapasitas_maksimal (INTEGER CHECK > 0)`: Jumlah matras/kapasitas mutlak studio. Ini menjadi patokan batas atas saat admin membuat jadwal sesi.
* **Relasi**: Direferensikan oleh `tb_jadwal_sesi` (`ON DELETE RESTRICT` untuk mencegah studio dihapus jika masih ada jadwal kelas aktif di dalamnya).

---

### 5. `tb_loker`
* **Peran Utama**: Master inventaris lemari loker pribadi (*Dedicated Locker*) yang dapat dipilih oleh member saat berlangganan paket.
* **Analog Dunia Nyata**: Deretan lemari loker fisik bernomor (LK-01 s.d. LK-10) di ruang ganti yang memiliki kunci khusus dan tidak boleh dipakai bergantian sembarangan.
* **Kolom Kunci & Logika**:
  * `nomor_loker (VARCHAR 20 UNIQUE)`: Label fisik loker (contoh: `LK-01`, `LK-02`).
  * `lokasi_area (VARCHAR 50)`: Area penempatan (contoh: *Locker Room Pria*, *Locker Room Wanita*).
  * `status (VARCHAR 20)`: Kondisi fisik loker (`'tersedia'`, `'digunakan'`, `'perawatan'`).
* **Keunggulan Arsitektur**: Tabel ini murni bertindak sebagai master fisik fasilitas. Status siapa yang sedang menyewa diatur secara dinamis oleh `tb_keanggotaan` melalui *Partial Unique Index*.

---

### 6. `tb_paket_membership`
* **Peran Utama**: Katalog produk langganan berbasis durasi waktu (bukan kuota per kedatangan).
* **Analog Dunia Nyata**: Brosur paket langganan keanggotaan klub (Paket Silver 1 Bulan seharga Rp350.000, Paket Gold 3 Bulan seharga Rp950.000).
* **Kolom Kunci & Logika**:
  * `nama_paket (VARCHAR 100 UNIQUE)`: Nama paket langganan.
  * `durasi_hari (INTEGER CHECK > 0)`: Masa aktif hak istimewa (contoh: 30 hari, 90 hari, 365 hari).
  * `harga (NUMERIC(12, 2) CHECK >= 0)`: Biaya pendaftaran paket.
  * `fasilitas_deskripsi (TEXT)`: Hak eksklusif member (akses kolam renang bebas, air mineral gratis harian, 1 dedicated locker tetap, jendela booking kelas 30 hari ke depan, dan tarif diskon sesi kelas).

---

### 7. `tb_keanggotaan`
* **Peran Utama**: Mencatat masa aktif status member seorang pelanggan beserta hak kepemilikan eksklusif atas 1 lemari loker tertentu selama masa langganan tersebut.
* **Analog Dunia Nyata**: Kartu Member fisik yang tertera stempel tanggal kedaluwarsa dan nomor lemari loker pribadi yang menjadi hak eksklusif sang member.
* **Kolom Kunci & Logika**:
  * `id_pelanggan (UUID)`: Akun pelanggan pemegang keanggotaan.
  * `id_paket_membership (UUID)`: Paket langganan yang dibeli.
  * `id_loker (UUID NULLABLE)`: Nomor lemari loker yang dipilih member saat checkout.
  * `tanggal_mulai (DATE)` & `tanggal_berakhir (DATE)`: Rentang waktu berlakunya hak istimewa membership.
  * `status (VARCHAR 20)`: `'aktif'`, `'kedaluwarsa'`, atau `'dibatalkan'`.
* **🛡️ Kunci Integritas Tingkat Dewa (Partial Unique Index)**:
  * **Aturan 1 (Satu Member = Satu Langganan Aktif)**:
    ```sql
    CREATE UNIQUE INDEX uq_keanggotaan_aktif_pelanggan ON tb_keanggotaan(id_pelanggan) WHERE status = 'aktif';
    ```
  * **Aturan 2 (Satu Loker = Satu Penyewa Aktif)**:
    ```sql
    CREATE UNIQUE INDEX uq_loker_aktif_keanggotaan ON tb_keanggotaan(id_loker) WHERE status = 'aktif' AND id_loker IS NOT NULL;
    ```
    *Mengapa ini brilian?* Jika menggunakan constraint `UNIQUE` biasa pada kolom `id_loker`, lemari loker LK-01 **tidak akan pernah bisa disewa lagi** oleh member baru selamanya setelah masa aktif member lama kedaluwarsa! Dengan indeks parsial ini, riwayat sewa masa lalu tetap tersimpan utuh, namun saat membership lama berstatus `kedaluwarsa`, loker LK-01 langsung otomatis bebas disewa kembali.

---

### 8. `tb_jadwal_sesi`
* **Peran Utama**: Jadwal pelaksanaan kelas studio spesifik lengkap dengan penguncian kuota kursi anti-overbooking dan pengaturan tarif dinamis admin.
* **Analog Dunia Nyata**: Jadwal papan pengumuman kelas *Sunrise Vinyasa Flow* hari Sabtu pukul 07.00 di Studio Shanti bersama Pelatih Bima, dengan kapasitas 10 matras.
* **Kolom Kunci & Logika**:
  * `judul_sesi (VARCHAR 150)`: Topik kelas yang akan diajarkan.
  * `id_kategori`, `id_pelatih`, `id_ruangan`: Kunci asing penentu jenis kelas, instruktur, dan studionya.
  * `waktu_mulai` & `waktu_selesai`: Jadwal pelaksanaan kelas (waktu selesai wajib `> waktu_mulai`).
  * `kapasitas_maksimal (INTEGER)`: Batas kuota kursi/matras studio (contoh: 10 orang).
  * `jumlah_terisi (INTEGER)`: Kursi yang sedang dipesan/ditahan saat ini.
  * `harga_non_member` & `harga_member`: Fleksibilitas tarif ganda admin. Member mendapatkan harga spesial (misal Rp75.000) dan Non-Member dikenakan tarif tamu (misal Rp150.000).
  * `batas_batal_jam (INTEGER)`: Batas waktu minimal pembatalan mandiri sebelum kelas dimulai (contoh: 24 jam, 12 jam, 48 jam, atau 0 jam / non-refundable).
  * `status_sesi`: `'terjadwal'`, `'berlangsung'`, `'selesai'`, `'dibatalkan'`.
* **🛡️ Kunci Integritas Mutlak (Hard DB Lock)**:
  ```sql
  CONSTRAINT check_kapasitas_terisi CHECK (jumlah_terisi <= kapasitas_maksimal)
  ```
  Menjamin secara fisik pada level kernel PostgreSQL bahwa kapasitas studio tidak akan pernah jebol atau kelebihan muatan meskipun server diserang ribuan klik pemesanan bersamaan.

---

### 9. `tb_pesanan`
* **Peran Utama**: Buku besar transaksi keuangan (*financial ledger*) yang menangani integrasi pembayaran digital Midtrans Snap (QRIS, Virtual Account) maupun transfer bank manual.
* **Analog Dunia Nyata**: Lembar invoice kasir klub yang berisi kode pembayaran, nominal total, batas waktu bayar 15 menit, dan bukti validasi bank.
* **Kolom Kunci & Logika**:
  * `kode_pesanan (VARCHAR 50 UNIQUE)`: Nomor pesanan unik (contoh: `ORD-20260908-001`) yang dikirimkan ke Midtrans sebagai `order_id`.
  * `tipe_pesanan`: Menandai apakah pembayaran ini untuk `'membership'` atau tiket `'sesi'`.
  * `total_bayar (NUMERIC(12, 2))`: Nominal rupiah bersih yang harus dibayar.
  * `snap_token (VARCHAR 255)`: Kunci token checkout dari Midtrans untuk menampilkan modal popup di aplikasi web Next.js.
  * `waktu_kedaluwarsa (TIMESTAMPTZ)`: Batas waktu pembayaran (stempel waktu saat klik checkout + 15 menit). Digunakan untuk mekanisme penahanan kursi sementara.
  * `signature_key_terakhir (VARCHAR 255)`: Jejak audit tanda tangan kriptografis SHA-512 dari webhook Midtrans sebagai bukti verifikasi keaslian transaksi.
  * `payload_gateway (JSONB)`: Arsip mentah seluruh respons JSON dari payment gateway untuk audit forensik bila terjadi sengketa pembayaran.
  * `status_pembayaran`: `'menunggu_pembayaran'`, `'menunggu_verifikasi'`, `'lunas'`, `'kedaluwarsa'`, `'dibatalkan'`, `'gagal'`.

---

### 10. `tb_reservasi_sesi`
* **Peran Utama**: Tiket sah kehadiran kelas studio yang dipegang oleh pelanggan, memuat harga yang dikenakan, serta pencatatan absensi fisik oleh instruktur.
* **Analog Dunia Nyata**: Boarding pass kelas kebugaran bertuliskan nomor tiket `RSV-20260908-001` yang discan atau diabsen langsung oleh instruktur di pintu masuk studio.
* **Kolom Kunci & Logika**:
  * `kode_reservasi (VARCHAR 50 UNIQUE)`: Kode tiket reservasi pelanggan.
  * `id_pesanan`: Relasi ke faktur pembayaran di `tb_pesanan`.
  * `id_jadwal` & `id_pelanggan`: Sesi kelas mana yang dipesan dan siapa pesertanya.
  * `tipe_tarif`: Menyimpan status apakah saat memesan pelanggan membayar tarif `'member'` atau `'non_member'`.
  * `status_reservasi`: `'menunggu_pembayaran'`, `'dipesan'` (sah), `'hadir'` (sudah diabsen), `'tidak_hadir'`, `'dibatalkan'`, `'kedaluwarsa'`.
  * `waktu_absensi` & `diabsen_oleh_pelatih_id`: Rekaman audit saat pelatih mencentang absensi kehadiran peserta di dalam kelas.
* **🛡️ Kunci Integritas Tingkat Dewa (Partial Unique Index)**:
  ```sql
  CREATE UNIQUE INDEX uq_reservasi_aktif_pelanggan_sesi
      ON tb_reservasi_sesi(id_jadwal, id_pelanggan)
      WHERE status_reservasi IN ('menunggu_pembayaran', 'dipesan', 'hadir');
  ```
  *Mengapa ini brilian?* Jika menggunakan `UNIQUE (id_jadwal, id_pelanggan)` konvensional, pelanggan yang pernah gagal bayar dalam 15 menit (tiketnya `kedaluwarsa`) atau pernah membatalkan tiketnya sendiri (`dibatalkan`) akan **terblokir selamanya** untuk memesan ulang kelas tersebut! Dengan Partial Index ini, indeks unik hanya mengunci tiket yang masih aktif mengikat kursi, sehingga pelanggan yang batal atau hangus pembayarannya bebas memesan ulang tiket baru.

---

## ⚡ Fitur Khusus & Logika Tingkat Tinggi

### 1. Mekanisme Kunci Kursi 15 Menit & Anti-Overbooking
Ketika pelanggan menekan tombol checkout di antarmuka web, backend Node/Bun menjalankan transaksi atomik berikut:
1. **Penguncian Baris (`SELECT ... FOR UPDATE`)**: Mengunci baris jadwal kelas di `tb_jadwal_sesi` secara eksklusif. Antrean request pemesan lain akan ditahan sejenak sampai transaksi ini selesai.
2. **Pengecekan Kuota**: Jika `jumlah_terisi >= kapasitas_maksimal`, transaksi langsung di-ROLLBACK dan sistem menampilkan pesan bersahabat: *"Mohon maaf, kursi baru saja habis dipesan"*.
3. **Penahanan Kursi Instan**: Jika kuota tersedia, kuota dinaikkan langsung (`jumlah_terisi = jumlah_terisi + 1`).
4. **Pembuatan Pesanan & Tiket Sementara**: Membuat baris di `tb_pesanan` dan `tb_reservasi_sesi` dengan status `menunggu_pembayaran` dan `waktu_kedaluwarsa = NOW() + 15 menit`.
5. **Pelepasan Kursi Otomatis**: Jika setelah 15 menit Midtrans mengabarkan pembayaran gagal/expired, atau pelanggan menekan tombol batal, status diubah menjadi `kedaluwarsa`/`dibatalkan`, dan sistem otomatis mengembalikan kuota kursi studio (`jumlah_terisi = jumlah_terisi - 1`).

---

### 2. Otomasi Trigger Timestamp (`waktu_diperbarui`)
Seluruh 10 tabel dilengkapi trigger PostgreSQL otomatis:
```sql
CREATE TRIGGER trg_[nama_tabel]_diperbarui
    BEFORE UPDATE ON [nama_tabel]
    FOR EACH ROW EXECUTE FUNCTION fn_set_timestamp_diperbarui();
```
Setiap kali ada pembaruan data (misal status pesanan berubah, absensi dicatat, atau profil diedit), kolom `waktu_diperbarui` otomatis terisi stempel waktu server tanpa bergantung pada kedisiplinan kode backend.

---

### 3. Dua View Operasional Siap Pakai
Untuk mempermudah antarmuka web membaca data tanpa menulis kueri JOIN yang rumit berulang kali:
1. **`v_katalog_sesi_tersedia`**: 
   Menampilkan daftar lengkap jadwal sesi kelas, nama pelatih, spesialisasi, ruangan, durasi menit, serta kalkulasi otomatis `sisa_kuota` dan status `TERSEDIA` vs `PENUH`.
2. **`v_status_loker`**: 
   Menampilkan daftar loker LK-01 s.d. LK-10, kondisi fisiknya, nama member yang sedang menyewanya, masa berlaku sewa, dan status operasional (`DISEWA_AKTIF`, `DALAM_PERAWATAN`, atau `TERSEDIA_UNTUK_MEMBER`).

---

## 📊 Matriks Ringkasan 10 Tabel

| No | Nama Tabel | Entitas Bisnis | Relasi Utama | Aturan Khusus / Constraint Utama |
|---|---|---|---|---|
| 1 | `tb_pengguna` | Akun Pengguna | Induk seluruh entitas aktor | Email unik, peran: `admin`/`pelatih`/`pelanggan` |
| 2 | `tb_profil_pelatih` | Portofolio Trainer | `1:1` ke `tb_pengguna` | CASCADE on delete, sertifikasi RYT, pengalaman `>= 0` |
| 3 | `tb_kategori_layanan` | Kategori Kelas | `1:N` ke `tb_jadwal_sesi` | Nama & slug unik, penanda ikon UI |
| 4 | `tb_ruangan` | Studio Fasilitas | `1:N` ke `tb_jadwal_sesi` | Kapasitas maksimal `> 0`, RESTRICT on delete |
| 5 | `tb_loker` | Lemari Loker LK-01 s.d. 10 | Direferensikan `tb_keanggotaan` | Nomor unik, status fisik loker |
| 6 | `tb_paket_membership` | Katalog Durasi Sewa | `1:N` ke `tb_keanggotaan` | Durasi hari `> 0`, harga `>= 0`, RESTRICT on delete |
| 7 | `tb_keanggotaan` | Masa Langganan & Loker | Pelanggan, Paket, Loker | **Partial Index**: 1 member aktif, 1 loker aktif |
| 8 | `tb_jadwal_sesi` | Jadwal Kelas Studio | Kategori, Pelatih, Ruangan | **Hard DB Check**: `jumlah_terisi <= kapasitas_maksimal` |
| 9 | `tb_pesanan` | Transaksi Pembayaran | Pelanggan, Jadwal, Paket | Expiry 15 menit, signature SHA-512, payload JSONB |
| 10 | `tb_reservasi_sesi` | Tiket Booking & Absensi | Pesanan, Jadwal, Pelanggan | **Partial Index**: Bebas pesan ulang jika batal/expired |
