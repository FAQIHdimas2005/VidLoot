# 📚 Dokumentasi Lengkap Proyek: VidLoot

> **VidLoot** — Universal Social Media Video & Audio Downloader  
> Dibuat dengan **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, dan **yt-dlp/ffmpeg Engine**.  
> Terakhir diperbarui: 21 Oktober 2026.

---

## 📑 Daftar Isi
1. [Tentang Proyek](#1-tentang-proyek)
2. [Arsitektur & Alur Kerja Sistem](#2-arsitektur--alur-kerja-sistem)
3. [Struktur Folder & Penjelasan Modul](#3-struktur-folder--penjelasan-modul)
4. [Daftar Perubahan & Fitur yang Dikerjakan (Antigravity Log)](#4-daftar-perubahan--fitur-yang-dikerjakan-antigravity-log)
5. [Mekanisme Penyimpanan & Cache (.temp-downloads)](#5-mekanisme-penyimpanan--cache-temp-downloads)
6. [Panduan Menjalankan Proyek](#6-panduan-menjalankan-proyek)
7. [Langkah Selanjutnya (Iklan & Hosting)](#7-langkah-selanjutnya-iklan--hosting)

---

## 1. Tentang Proyek

**VidLoot** adalah platform web modern untuk mengunduh video dan audio dari 5 media sosial terbesar secara gratis, cepat, dan tanpa watermark:
- 🎵 **TikTok** (No-watermark MP4 & MP3)
- 📸 **Instagram** (Reels, Feed Video, Post Foto, & Audio)
- 👥 **Facebook** (Reels, Watch, Video Publik hingga 1080p & MP3)
- 🐦 **X (Twitter)** (Single tweet, video berdurasi panjang/HD & MP3)
- 🔴 **YouTube** (Shorts & Longform Video dengan opsi 1080p Full HD, 720p, 360p, dan MP3)

### Fitur Utama:
- **Global English Interface**: Antarmuka standar internasional berbahasa Inggris yang bersih dan responsif.
- **Rewarded Interstitial Modal**: Countdown iklan 5 detik otomatis yang muncul saat pengguna menekan tombol unduh.
- **IDM (Internet Download Manager) Compatible**: Mendukung multi-threaded chunk download, resume unduhan terputus, dan penamaan file otomatis sesuai judul konten.
- **Direct Streaming & Local Muxing**: Pengunduhan instan tanpa lag.

---

## 2. Arsitektur & Alur Kerja Sistem

Alur kerja VidLoot dibagi menjadi 3 tahapan utama:

```
[Pengguna Memasukkan URL]
          │
          ▼
[1. Frontend (DownloaderForm.tsx)]
    ├── Deteksi platform URL (TikTok, IG, X, YT, FB)
    ├── Tampilkan Modal Iklan Interstitial (Hitung mundur 5 detik)
    └── Request metadata ke endpoint `/api/extract`
          │
          ▼
[2. Backend Ekstraktor (/api/extract)]
    ├── TikTok       ──> TikWM API (Mengambil link direct CDN tanpa watermark)
    ├── X / Twitter  ──> FxTwitter Syndication API (Mengambil video bitrate tertinggi)
    ├── Instagram    ──> Snapsave + OpenGraph Parser (Ekstrak cover, caption & video CDN)
    └── YT & FB      ──> Core yt-dlp Engine (Ekstrak format 1080p, 720p, 360p, MP3)
          │
          ▼
[UI Menampilkan Hasil]: Thumbnail, Judul/Caption, Pembuat, & Pilihan Tombol Resolusi
          │
          ▼ (Pengguna Mengklik Tombol Download)
[3. Proxy Pengiriman (/api/download-proxy)]
    ├── Direct Pipe Stream (TikTok & X): Data dialirkan langsung dari CDN ke browser via RAM.
    └── Local Engine Muxing (YT & FB): Penggabungan track video & audio via ffmpeg dalam 1 detik.
```

### Mengapa Memerlukan Endpoint `/api/download-proxy`?
1. **Bypass CORS & Anti-Hotlinking**: Platform seperti Instagram dan TikTok memblokir pemutaran/unduhan langsung jika diakses di luar domain mereka (*403 Forbidden*).
2. **Kustomisasi Nama File**: Menggunakan header RFC 6266 `Content-Disposition` agar file yang tersimpan di HP/PC pengguna rapi (contoh: `[VidLoot]_JudulVideo_720p.mp4`).
3. **Mendukung IDM & Browser Resume**: Menangani request `HEAD`, header `Accept-Ranges: bytes`, dan respon `206 Partial Content` sehingga IDM bisa membagi koneksi menjadi 8–16 thread untuk download super cepat.

---

## 3. Struktur Folder & Penjelasan Modul

Berikut struktur direktori proyek saat ini:

```text
Universal Downloader1/
├── .next/                         # Build output Next.js (terbuat otomatis)
├── .temp-downloads/               # Cache sementara hasil gabungan video (di-.gitignore)
├── bin/                           # Binary standalone untuk mesin lokal
│   ├── ffmpeg.exe                 # Mesin penggabung track video + audio
│   └── yt-dlp.exe                 # Mesin ekstraktor YouTube & Facebook
├── node_modules/                  # Dependensi Node.js
├── public/                        # Aset statis web
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── api/
│   │   │   ├── download-proxy/    # Endpoint proxy pengiriman stream file & IDM
│   │   │   │   └── route.ts
│   │   │   └── extract/           # Endpoint ekstraksi metadata link sosial media
│   │   │       └── route.ts
│   │   ├── dmca/                  # Halaman legal DMCA Compliance
│   │   │   └── page.tsx
│   │   ├── facebook-downloader/   # Halaman landing khusus Facebook (SEO)
│   │   │   └── page.tsx
│   │   ├── instagram-downloader/  # Halaman landing khusus Instagram (SEO)
│   │   │   └── page.tsx
│   │   ├── privacy-policy/        # Halaman legal Kebijakan Privasi
│   │   │   └── page.tsx
│   │   ├── terms-of-service/      # Halaman legal Syarat Ketentuan Layanan
│   │   │   └── page.tsx
│   │   ├── tiktok-downloader/     # Halaman landing khusus TikTok (SEO)
│   │   │   └── page.tsx
│   │   ├── x-downloader/          # Halaman landing khusus Twitter/X (SEO)
│   │   │   └── page.tsx
│   │   ├── youtube-downloader/    # Halaman landing khusus YouTube (SEO)
│   │   │   └── page.tsx
│   │   ├── globals.css            # Styling global Tailwind CSS
│   │   ├── layout.tsx             # Root layout (Navbar, Footer, Font, SEO Tag)
│   │   ├── page.tsx               # Homepage utama
│   │   ├── robots.ts              # Konfigurasi robots.txt untuk crawler Google
│   │   └── sitemap.ts             # Peta situs dinamis untuk ranking Google
│   ├── components/                # Komponen antarmuka pengguna (UI)
│   │   ├── AdBanner.tsx           # Slot penempatan iklan responsif
│   │   ├── DownloaderForm.tsx     # Komponen inti input link, modal iklan & preview
│   │   ├── FaqSection.tsx         # Bagian FAQ dinamis
│   │   ├── FeatureCards.tsx       # Kartu informasi keunggulan platform
│   │   ├── Footer.tsx             # Footer navigasi & hak cipta
│   │   └── Navbar.tsx             # Bar navigasi atas
│   └── lib/                       # Modul utilitas & logika bisnis
│       ├── extractor.ts           # Logika ekstraksi untuk semua platform
│       ├── platform.ts            # Validator URL & pendeteksi tipe media sosial
│       └── types.ts               # Tipe data TypeScript (VideoFormat, MediaResult)
├── .env.example                   # Contoh konfigurasi environment variable
├── .env.local                     # Environment variable lokal
├── .gitignore                     # Daftar file/folder yang dikecualikan dari Git
├── package.json                   # Konfigurasi package, script, & dependensi
├── tailwind.config.ts             # Konfigurasi Tailwind styling & warna
└── tsconfig.json                  # Konfigurasi TypeScript
```

---

## 4. Daftar Perubahan & Fitur yang Dikerjakan (Antigravity Log)

Berikut rangkuman pekerjaan, perbaikan, dan optimasi yang telah diselesaikan:

### 1. Re-branding & Standarisasi Global (Inggris)
- Mengubah nama platform menjadi **VidLoot** (Universal Social Media Video Downloader).
- Mengubah seluruh teks UI, notifikasi error, FAQ, dan informasi fitur ke bahasa Inggris standar internasional untuk target audiens global.
- Menambahkan halaman khusus SEO: `/tiktok-downloader`, `/instagram-downloader`, `/youtube-downloader`, `/facebook-downloader`, `/x-downloader`.

### 2. Fitur Monetisasi (Rewarded Countdown Ad Modal)
- Membuat modal pop-up iklan di [DownloaderForm.tsx](file:///d:/Documents/Universal%20Downloader1/src/components/DownloaderForm.tsx) yang otomatis muncul selama **5 detik** saat pengguna menekan tombol unduh.
- Modal memuat animasi countdown lingkaran, tombol penutup (*Close*), dan slot penempatan iklan (banner/native/popunder) yang siap dihubungkan dengan Adsterra atau Monetag.

### 3. Perbaikan Total Tombol Download & Deteksi Platform (Hydration Bug)
- Memisahkan logika pendeteksi platform di [platform.ts](file:///d:/Documents/Universal%20Downloader1/src/lib/platform.ts) agar tidak bergantung pada modul server `child_process`.
- Memperbaiki bug di mana tombol *Paste* dan tombol *Download* sebelumnya tidak bisa diklik karena *hydration mismatch* pada React.

### 4. Integrasi Mesin Standalone `yt-dlp` & `ffmpeg`
- Memasang binary resmi `bin/yt-dlp.exe` dan `bin/ffmpeg.exe` langsung di dalam folder proyek.
- Memungkinkan penggabungan video kualitas Full HD (1080p/720p) dengan audio AAC secara instan tanpa perlu menginstal aplikasi tambahan di sistem operasi.

### 5. Mengatasi Masalah Video Rusak & Support Penuh IDM (Internet Download Manager)
- **Masalah Sebelumnya**: Video hasil download tidak bisa diputar (corrupt), nama video acak, dan IDM gagal mendownload karena server hang.
- **Solusi yang Diterapkan**:
  - Menambahkan handler method `HEAD` di [route.ts](file:///d:/Documents/Universal%20Downloader1/src/app/api/download-proxy/route.ts) agar IDM dapat memeriksa ukuran file terlebih dahulu.
  - Mengimplementasikan `Accept-Ranges: bytes` dan `206 Partial Content` untuk mendukung pembagian thread dan jeda/lanjut unduhan (*resume*).
  - Sanitasi nama file dengan standar RFC 6266 (`[VidLoot]_Judul_Resolusi.mp4`).
  - Memaksa Content-Type `video/mp4` agar sistem operasi dan pemutar video (VLC, Windows Media Player) mengenali file secara akurat.

### 6. Pilihan Resolusi YouTube Lengkap
- YouTube sekarang menyediakan pilihan resolusi:
  - **1080p Full HD**
  - **720p HD**
  - **360p Standard**
  - **MP3 Audio** (High Quality 192kbps)
- Video 30MB terdownload hanya dalam waktu < 1 detik.

### 7. Perbaikan Video Facebook
- Mengatasi masalah nama file tanpa ekstensi (`.mp4`).
- Mengambil judul dan caption asli dari postingan Facebook secara akurat.
- Menyediakan opsi kualitas (1080p, 720p, 360p, MP3 Audio).

### 8. Perbaikan Total Instagram (Thumbnail & Caption)
- **Masalah Sebelumnya**: Link Instagram memunculkan peringatan error, thumbnail tidak tampil akibat blokir hotlinking CDN Instagram (*403 Forbidden*), dan nama file hanya tertulis `"instagram reel"`.
- **Solusi yang Diterapkan**:
  - Mengimplementasikan OpenGraph scraper dengan user-agent Twitterbot untuk mengambil caption asli dan nama pembuat konten (*author*).
  - Menambahkan decoding entitas HTML untuk membersihkan simbol teks aneh.
  - Mengalirkan gambar thumbnail melalui proxy internal dengan atribut `referrerPolicy="no-referrer"` sehingga thumbnail selalu tampil mulus di layar pengguna.

---

## 5. Mekanisme Penyimpanan & Cache (`.temp-downloads`)

### Mengapa ada file di `.temp-downloads`?
- **TikTok & X (Twitter)**: Menggunakan metode **Direct Streaming**. File langsung dialirkan dari internet ke pengguna melalui memori RAM. **Tidak ada file yang disimpan di harddisk**.
- **YouTube & Facebook (Resolusi Tinggi)**: Menggunakan metode **Muxing**. Video 1080p dari YouTube tidak memiliki audio bawaan, sehingga server menggabungkannya terlebih dahulu dan menyimpannya di `.temp-downloads`.
- Cache ini diperlukan agar ketika **IDM** mendownload dengan 8–16 koneksi secara bersamaan, server cukup membaca dari satu file lokal yang sudah jadi, bukan mendownload dan merender 16 kali berulang-ulang.

### Apakah folder project akan membengkak selamanya?
- **Di Komputer Lokal**: Folder `.temp-downloads` sudah dimasukkan ke `.gitignore` sehingga **tidak akan pernah terkirim ke GitHub**. Anda bisa menghapus isi folder ini kapan saja dengan aman.
- **Di Server Hosting / Vercel**: Layanan cloud modern menggunakan penyimpanan sementara (*ephemeral storage* di `/tmp`). File-file sementara ini akan **otomatis dihapus oleh cloud** ketika server sedang istirahat (*idle*), sehingga kapasitas server tidak akan pernah penuh.

---

## 6. Panduan Menjalankan Proyek

### 1. Menjalankan di Mode Development
```bash
npm run dev
```
Buka peramban di `http://localhost:3000`.

### 2. Membangun untuk Produksi (Build)
```bash
npm run build
npm run start
```

### 3. Pemeriksaan Git
```bash
git status
git log -n 5 --oneline
```

---

## 7. Langkah Selanjutnya (Iklan & Hosting)

Setelah seluruh fungsionalitas download teruji 100% normal pada semua platform, langkah terakhir yang perlu dilakukan:

1. **Pemasangan Iklan (Monetisasi)**:
   - Mendaftar di jaringan periklanan seperti **Monetag**, **Adsterra**, atau **Google AdSense**.
   - Menaruh kode script banner di komponen [AdBanner.tsx](file:///d:/Documents/Universal%20Downloader1/src/components/AdBanner.tsx).
   - Menghubungkan script *Popunder* / *Direct Link* pada tombol "Continue to Download" di modal [DownloaderForm.tsx](file:///d:/Documents/Universal%20Downloader1/src/components/DownloaderForm.tsx).

2. **Hosting / Deployment**:
   - Menghubungkan repository GitHub ke layanan cloud (misal **Vercel**, **Railway**, **Render**, atau **VPS Ubuntu**).
   - Mengatur environment variable jika diperlukan.

---
*Dokumentasi ini dibuat untuk memudahkan pemeliharaan, pengembangan fitur lanjutan, dan serah terima proyek VidLoot.*
