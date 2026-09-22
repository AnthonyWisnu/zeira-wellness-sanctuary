# Design System Specification: ZEIRA TACTILE ATELIER

> **File Sumber Resmi**: `web/src/styles/global.css`, `web/src/layouts/SanctuaryLayout.astro`  
> **Lokasi Target**: `web/DESIGN.md`  
> **Status**: BINDING VISUAL & COMPUTED STYLE STANDARD FOR ALL AGENTS  
> **Prinsip**: *Baremetal Pure CSS, Neo-Classical Skeuomorphic Tactile Craft, Zero Tailwind, Zero External UI Frameworks, Zero CDN, Zero AI-Slop (No Curved Eyebrow Pills, No Fake Seals, No Slop Emojis).*

---

## 1. Filosofi & Karakter Visual

Sistem desain **ZEIRA SANCTUARY** dibangun di atas estetika **Tactile Atelier Skeuomorphic** untuk layar resolusi tinggi (High-DPI / Retina). Desain ini mengawinkan presisi fisik material nyata (kriya Apple era iOS 6 / OS X Mavericks yang disempurnakan secara sub-pixel) dengan ketenangan arsitektural studio kebugaran holistik (*mindful movement sanctuary*).

### Ciri Khas Fisik (Optical Depth Cues):
1. **Pencahayaan Konsisten 90° (Directional Key Light):** Seluruh elemen berorientasi pada sumber cahaya tegak lurus dari atas. Bagian atas kartu/tombol menerima pantulan cahaya tipis (*top specular highlight*), sedangkan bagian bawah memiliki bayangan kompresi (*structural drop shadow*).
2. **Material Nyata (Natural Substrates):** 
   - Kertas linen unbleached Jepang / Alabaster warm stone (`#F2EFE9` & `#FAF8F5`).
   - Kulit botanical lumut hutan (*Lustrous Forest Moss* `#213D2C`).
   - Kuningan / perunggu sampanye bertekstur kuas (*Brushed Champagne Brass* `#C49B58`).
   - Tinta arang obsidian (*Obsidian Charcoal* `#181C19`).
3. **Tekstur Huruf Tertekan (Debossed / Letterpress Typography):**
   - Teks pada latar terang memiliki bayangan pantul putih halus di bawahnya: `text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8)`.
   - Teks pada tombol hijau gelap memiliki bayangan tenggelam di atasnya: `text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.45)`.
4. **Tipografi Berdaulat (Sovereign Typography):**
   - Menggunakan **Plus Jakarta Sans** (100% lokal WOFF2) sebagai single source of truth untuk display/headline dan body teks antarmuka. Karakter font tegak, tegas, elegan, dan proporsional geometris (menghindari font yang melebar atau gepeng).
   - Menggunakan **JetBrains Mono** (100% lokal WOFF2) untuk angka tabular, kuota kursi, countdown timer, dan harga mata uang.
5. **Ikonografi Vektor Murni (Phosphor Icons - Zero Emoji):**
   - Anti-AI-slop mutlak: Dilarang keras menggunakan emoticon/emoji warna-warni (🧘, 🔲, ♨️, 🎟️, 🔒, dsb.).
   - Seluruh ikon menggunakan Phosphor Icons SVG lokal beresolusi tajam via komponen `<Icon name="..." />` yang membaca langsung dari disk `@phosphor-icons/core`.

---

## 2. Token Desain (Computed Variables)

Semua token didefinisikan secara global pada `:root` di `web/src/styles/global.css`:

```css
:root {
  /* Surface & Canvas Substrates */
  --bg-canvas: #F2EFE9;             /* Kanvas linen dasar seluruh halaman */
  --surface-plate: #FAF8F5;          /* Permukaan kartu/panel resting */
  --surface-plate-raised: #FFFFFF;   /* Permukaan terangkat/hover */
  --surface-recessed: #EBE7DF;       /* Palung cekung (input, toggle track, wells) */
  
  /* Text & Contrast Hierarchy */
  --text-main: #181C19;              /* Teks utama (kontras tinggi, bukan hitam mati) */
  --text-muted: #555B55;             /* Teks sekunder/deskripsi */
  --text-subtle: #79807A;            /* Teks metadata, keterangan waktu, label kecil */
  --text-inverse: #FAF8F5;           /* Teks pada permukaan gelap */

  /* Primary Accent: Lustrous Forest Moss */
  --color-primary: #213D2C;          /* Hijau lumut hutan utama */
  --color-primary-light: #2D523B;    /* Gradien atas tombol */
  --color-primary-dark: #162B1F;     /* Gradien bawah tombol */
  --color-primary-border: #13241A;   /* Batas luar tombol */

  /* Secondary Accent: Brushed Champagne Brass / Gold */
  --color-brass: #C49B58;            /* Kuningan sampanye mewah */
  --color-brass-light: #DFB876;      /* Kilau emas terang */
  --color-brass-dark: #9E7A3A;       /* Bayangan bevel kuningan */
  --color-brass-bg: #FDF6EB;         /* Latar belakang badge emas lembut */

  /* Borders & Mechanical Dividers */
  --border-hairline: #E2DED6;        /* Garis pemisah hairline presisi */
  --border-light: rgba(255, 255, 255, 0.85); /* Specular highlight rim atas */
  --border-bevel-shelf: rgba(0, 0, 0, 0.08); /* Bevel shadow batas bawah */

  /* Optical Elevation Shadows */
  --shadow-convex: 0 10px 25px -4px rgba(28, 48, 36, 0.07), 0 2px 6px -1px rgba(0, 0, 0, 0.04), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9);
  --shadow-convex-hover: 0 16px 32px -6px rgba(28, 48, 36, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.06), inset 0 1px 1px 0 rgba(255, 255, 255, 0.95);
  --shadow-recessed: inset 0 2px 4px 0 rgba(24, 28, 25, 0.09), inset 0 1px 2px 0 rgba(0, 0, 0, 0.06), 0 1px 0 rgba(255, 255, 255, 0.9);
  --shadow-button-primary: 0 4px 12px rgba(27, 51, 36, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.4);
  --shadow-button-brass: 0 4px 12px rgba(158, 122, 58, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(0, 0, 0, 0.2);

  /* Typography Families (100% Local Self-Hosted WOFF2) */
  --font-display: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-body: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', SFMono-Regular, Consolas, monospace;

  /* Corner Radii */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
}
```

---

## 3. Sistem Tipografi (Sovereign Local Typography)

Font di-host **100% secara lokal** di folder `web/public/fonts/` dengan format WOFF2 teroptimasi. Tidak ada koneksi eksternal ke Google Fonts atau CDN pihak ketiga demi kedaulatan data, latency 0ms, dan privasi penuh.

### Deklarasi `@font-face` di `global.css`:
```css
@font-face {
  font-family: 'Plus Jakarta Sans';
  src: url('/fonts/plus-jakarta-sans/PlusJakartaSans-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Plus Jakarta Sans';
  src: url('/fonts/plus-jakarta-sans/PlusJakartaSans-ExtraBold.woff2') format('woff2');
  font-weight: 800;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'JetBrains Mono';
  src: url('/fonts/jetbrains-mono/JetBrainsMono-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

### Skala & Hierarki Teks:

| Tingkat / Peran | Font Family | Ukuran & Weight | Line Height & Spacing | Kasus Penggunaan |
| :--- | :--- | :--- | :--- | :--- |
| **Brand Logo Wordmark** | `'Plus Jakarta Sans'` | `1.2rem` (800 ExtraBold) | Tracking `0.06em` | Header brand "ZEIRA" |
| **Hero Title** | `'Plus Jakarta Sans'` | `clamp(2rem, 3.5vw, 3.5rem)` (800) | `1.15`, Tracking `-0.025em` | Headline utama dalam Hero Carousel |
| **Section Heading** | `'Plus Jakarta Sans'` | `1.8rem` – `2.2rem` (700 Bold) | `1.2`, Tracking `-0.015em` | Judul bab / seksi halaman |
| **Card Title** | `'Plus Jakarta Sans'` | `1.15rem` – `1.35rem` (700 Bold) | `1.3` | Nama kelas, paket membership, nama studio |
| **Body Standard** | `'Plus Jakarta Sans'` | `15px` / `0.9375rem` (400 Regular) | `1.6` | Deskripsi, paragraf, FAQ |
| **Interactive Labels** | `'Plus Jakarta Sans'` | `14px` / `0.875rem` (600 SemiBold) | `1.2` | Teks tombol, navigasi kapsul, tab carousel |
| **Data & Financial Meta** | `'JetBrains Mono'` | `0.7rem` – `1.25rem` (600/700) | Tabular Numbers | Harga (`Rp 350.000`), sisa kursi, jam (`07:30 WIB`), timer |
| **Eyebrow Tag / Badge** | `'Plus Jakarta Sans'` | `0.68rem` – `0.75rem` (700 Bold) | Tracking `0.1em`, Uppercase | `PAPAN RESERVASI`, `STUDIO 01` |

---

## 4. Sistem Ikonografi Berdaulat (Phosphor Icons Engine)

Komponen `<Icon />` di `web/src/components/Icon.astro` menyematkan SVG inline langsung dari package lokal `@phosphor-icons/core`:

```astro
---
import Icon from '../../components/Icon.astro';
---

<!-- Contoh Penggunaan -->
<Icon name="shopping-bag" size={20} />
<Icon name="ticket" size={24} />
<Icon name="lock-simple" size={16} />
<Icon name="lightning" size={14} />
<Icon name="waves" size={18} />
<Icon name="squares-four" size={20} />
<Icon name="yin-yang" size={16} />
```

### Kamus Ikon Standar ZEIRA:
- `shopping-bag`: Tombol keranjang reservasi aktif di header.
- `ticket`: Tiket sesi, drop-in non-member, voucher.
- `lock-simple` / `lock-key`: Reservasi terkunci, gembok loker RFID, seat hold 15 menit.
- `squares-four`: Studio Reformer, tata letak apparatus, grid bento.
- `waves`: Heated Mineral Pool, hydrotherapy, sauna, sirkulasi air.
- `yin-yang`: Yoga Zen Dome, breathwork, sound healing, meditasi.
- `lightning`: Slot hampir penuh (urgensi elegan), instant seat lock.
- `users`: Waiting list, kuota peserta bersama.
- `hourglass`: Waktu tunggu, timer checkout 15 menit.
- `calendar-blank`: Kalender jadwal kelas, vision window booking 30 hari.

---

## 5. Anatomi Komponen Standar (Component Signatures)

Setiap agen wajib mempertahankan struktur markup semantik BEM:

### 5.1 Header & Navigasi Kapsul (`.header`)
```html
<header class="header">
  <div class="container header__inner">
    <a href="/" class="brand">
      <span class="brand__name">ZEIRA</span>
      <span class="brand__tag">Sanctuary</span>
    </a>

    <nav class="nav-capsule">
      <a href="/" class="nav-link nav-link--active">Home</a>
      <a href="/jadwal" class="nav-link">Jadwal Kelas</a>
      <a href="/membership" class="nav-link">Membership</a>
    </nav>

    <div class="header__actions">
      <div class="status-badge">
        <span class="status-badge__dot"></span>
        <span>STATUS: MEMBER</span>
      </div>
      <button class="btn-cart" data-trigger="modal" aria-label="Keranjang Reservasi">
        <Icon name="shopping-bag" size="1.2rem" />
        <span class="cart-badge">1</span>
      </button>
      <div class="user-avatar">
        <img src="..." alt="User Avatar">
      </div>
    </div>
  </div>
</header>
```

### 5.2 Hero Immersive Carousel (`.hero-carousel`)
```html
<section class="hero-carousel" id="home-hero-carousel">
  <div class="hero-carousel__slides">
    <div class="hero-carousel__slide is-active" data-slide-index="0">
      <img src="..." class="hero-carousel__img" alt="Reformer Atelier" />
      <div class="hero-carousel__scrim"></div>
    </div>
    <!-- Slide 1, Slide 2 -->
  </div>

  <div class="hero-carousel__overlay">
    <div class="container">
      <div class="hero-carousel__location">
        <span>BATAVIA SANCTUARY • JAKARTA PUSAT</span>
      </div>
      <h1 class="hero-carousel__title">Ketenangan Pikiran & Presisi Gerak dalam Satu Sanctuary.</h1>
      <p class="hero-carousel__sub">Studio mindful movement eksklusif di Batavia...</p>

      <div class="carousel-control-bar" role="tablist">
        <button class="carousel-tab is-active" data-slide-target="0">
          <span class="carousel-tab__num">01</span>
          <span class="carousel-tab__label">Reformer Atelier</span>
        </button>
        <!-- Tab 02, Tab 03 -->
      </div>
    </div>
  </div>
</section>
```

### 5.3 Tombol Taktil (Tactile Buttons)
1. **Primary Button (`.btn-primary`):**
   - Background: `linear-gradient(180deg, var(--color-primary-light) 0%, var(--color-primary) 100%)`
   - Shadow: `var(--shadow-button-primary)`
   - Border: `1px solid var(--color-primary-border)`
   - Text: `#FAF8F5` dengan `text-shadow: 0 -1px 0 rgba(0,0,0,0.45)`

2. **Secondary Button (`.btn-secondary`):**
   - Background: `#FAF8F5`
   - Shadow: `0 2px 4px rgba(0,0,0,0.04), inset 0 1px 0 #FFF`
   - Border: `1px solid var(--border-hairline)`

3. **Cart Button (`.btn-cart`):**
   - Background: `#FAF8F5`, dimensions `40px x 40px`, border-radius `var(--radius-md)`
   - Position relative with floating notification badge `.cart-badge`.

### 5.4 Kartu Taktil (`.surface-card`)
Kartu dasar untuk bento grid, daftar jadwal, dan kartu pass:
```css
.surface-card {
  background-color: var(--surface-plate);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-hairline);
  box-shadow: var(--shadow-convex);
  padding: 1.5rem;
  position: relative;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.surface-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-convex-hover);
}
```

---

## 6. Larangan Keras (Negative Constraints untuk Semua Agen)

1. **DILARANG MENGGUNAKAN EMOJI DI SEMUA UI:**
   - Dilarang menyisipkan emoji seperti `🧘, 🔲, ♨️, 🎟️, 🔒, 📊, ⚡`. Gunakan `<Icon name="..." />` Phosphor Icons.
2. **DILARANG MENGGUNAKAN BADGE PILL MELENGKUNG (EYEBROW-PILL):**
   - Dilarang membuat badge kecil lonjong dengan dot berdenyut berisi teks marketing klise (`SANCTUARY TERBUKA`, `SINKRONISASI JADWAL`, dsb.).
   - **Promosi Sesi WAJIB Kotak UI Nyata (`.hero-session-card`)**: Dilarang membungkus promosi sesi menjadi badge pill kurus melengkung. Gunakan kotak widget UI beneran yang terstruktur dengan info instruktur, kuota, live dot, dan tombol aksi hijau taktikal yang nikmat (`.btn-session-action`).
3. **DILARANG TOMBOL CTA DUPLIKAT YANG BERDEKATAN DENGAN NAVBAR:**
   - Dilarang menempatkan tombol CTA menuju halaman yang sama tepat di bawah menu navbar.
4. **DILARANG STEMPEL GARANSI KOSONG & FLUFF VERBOSE:**
   - Dilarang menambahkan stempel garansi 100% uang kembali (*ZEIRA SEAL*), deskripsi bento bertele-tele, atau banner concierge WhatsApp yang repetitif.
5. **DILARANG MENGGUNAKAN TAILWIND ATAU CLASS UTILITY ASING:**
   - Dilarang menulis `<div class="bg-gray-100 p-4 rounded-xl flex items-center">`.
   - Gunakan nama kelas semantik BEM yang terdaftar di `global.css` (`surface-card`, `container`, `schedule-item`, dsb.).
6. **DILARANG MENGGUNAKAN WARNA HITAM MURNI (#000000) ATAU PUTIH MURNI (#FFFFFF) DI BODY:**
   - Kanvas dasar WAJIB `#F2EFE9` (`--bg-canvas`).
   - Teks hitam WAJIB `#181C19` (`--text-main`).
7. **DILARANG MENGGUNAKAN WARNA AI-SLOP (PURPLE/VIOLET GRADIENT):**
   - Palet hanya boleh berputar di: **Lustrous Forest Moss (`#213D2C`)**, **Champagne Brass (`#C49B58`)**, dan **Linen Alabaster (`#F2EFE9`)**.
8. **DILARANG MEMBUAT TOMBOL FLAT TANPA KEDALAMAN TAKTIL:**
   - Setiap tombol interaktif wajib memiliki: specular catchlight (`inset 0 1px 0`), drop shadow halus, dan `text-shadow` letterpress.
9. **DILARANG MENGGUNAKAN CDN EKSTERNAL:**
   - Seluruh aset (font WOFF2, ikon SVG, file CSS, skrip) wajib disimpan dan disajikan secara lokal.

---

*Dokumen ini merupakan hukum desain absolut proyek ZEIRA SANCTUARY. Semua penambahan halaman baru wajib tunduk pada token dan komponen di atas.*
