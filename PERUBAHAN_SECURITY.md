# 🔐 Dokumentasi Perubahan Security Hardening — VidLoot

> **Tanggal**: 21 Oktober 2026  
> **Scope**: Menambal seluruh temuan audit keamanan (4 Kritis, 3 Tinggi, 5 Sedang/Rendah)  
> **Kebijakan**: *Zero-Breakage* — semua fitur yang sudah berjalan (TikTok, Instagram, Facebook, X/Twitter, YouTube, IDM multipart/206/HEAD, proxy thumbnail Instagram, modal iklan 5 detik) **tidak boleh berubah perilakunya**. Semua patch hanya ditambahkan sebagai lapisan validasi di depannya.  
> **Metode**: Verifikasi flag `yt-dlp` dilakukan **sebelum** kode disalin, lalu build TypeScript, lalu smoke test runtime pada server production lokal (port 3111).

---

## 📁 Ringkasan File yang Berubah

| File | Status | Isi Perubahan |
|------|--------|---------------|
| `src/lib/security.ts` | **BARU** | Modul validator keamanan terpusat (SSRF, whitelist platform, CLI URL check) |
| `src/app/api/download-proxy/route.ts` | Diubah | SSRF guard, argument injection, path traversal, cleanup cache, semaphore, validasi Range |
| `src/lib/extractor.ts` | Diubah | Guard argument injection yt-dlp (+ perbaikan regex blocker build lama) |
| `src/app/api/extract/route.ts` | Diubah | Error internal tidak lagi bocor ke client |
| `next.config.mjs` | Diubah | 4 security headers |
| `package.json` + `package-lock.json` | Diubah | 4 dependensi eksperimen dilepas (46 paket turun), `npm audit fix` |

---

## 1. Modul Baru: `src/lib/security.ts` (Pusat Validasi)

Dibuat modular agar dapat dipakai bersama oleh `download-proxy` maupun `extractor` tanpa duplikasi logika. ⚠️ Catatan: modul ini hanya boleh diimpor di server (memakai API Node `dns`/`net`), **jangan** diimpor ke komponen client.

### `isSafeExternalUrl(rawUrl): Promise<boolean>` — Pelindung SSRF
Dipanggil sebelum server men-fetch URL eksternal apa pun. Sesuai spesifikasi, sengaja **tidak** memakai whitelist domain kaku supaya CDN dinamis (TikTok/IG/Facebook — `*.ibytedtos.com`, `*.akamaized.net`, `*.fbcdn.net`, dst.) tidak ikut mampet. Aturannya:

1. **Sintaks**: harus string ≤ 2048 karakter, tanpa whitespace/newline/tab, tidak diawali `-`, harus valid di-`new URL()`.
2. **Protokol**: hanya `http:` / `https:`. `file:`, `ftp:`, `gopher:`, `javascript:`, dll. → **ditolak**.
3. **Userinfo**: `https://user@host` → **ditolak** (anti URL-spoofing).
4. **Port**: hanya `80`, `443`, atau kosong (default). `:3000`, `:8080`, `:22`, `:6379`, dll. → **ditolak**.
5. **Hostname literal yang diblokir**:
   - Loopback: `127.x.x.x`, `localhost`, `*.localhost`, `0.0.0.0/8`
   - Cloud metadata: `169.254.169.254` (link-local `169.254.0.0/16`)
   - RFC 1918: `10/8`, `172.16/12`, `192.168/16`
   - Tambahan pertahanan: CGNAT `100.64/10`, TEST-NET `192.0.2.0/24`, benchmark `198.18/15`, multicast/reserved `224+/4`
   - Nama internal: `.local`, `.internal`, `.home.arpa`, `metadata.google.internal`, `metadata.goog`, `instance-data`
   - IPv6: `::1`, `::`, `0:0:...:1`, `fc00::/7` (ULA), `fe80::/10` (link-local), bentuk v4-mapped `::ffff:127.0.0.1`
6. **Verifikasi DNS**: bila hostname bukan IP literal, node memanggil `dns.lookup(all: true)` — jika **salah satu** record resolve ke IP privat/metadata, URL ditolak (pencegahan DNS-rebinding dasar).
7. **Cache hasil DNS** 5 menit (maks 500 entri) agar request IDM 8–16 thread tidak menghantam resolver berulang-ulang (performa).

### `isSafeCliTargetUrl(rawUrl): boolean` — Pelindung Argument Injection
Untuk URL yang akan dilempar ke `yt-dlp`: wajib diawali `https://`/`http://`, tanpa whitespace/CRLF, ≤ 2048 karakter, tidak diawali `-`. Menutup vektor penyisipan opsi seperti `--exec`, `--config-location`, `--output` di awal "URL".

### `normalizePlatformParam(raw): string` — Pelindung Path Traversal
Whitelist ketat: `youtube | facebook | tiktok | instagram | twitter`. Di luar itu → dipaksa `"media"`. Nilai `platform` dari query tidak pernah lagi digabung mentah ke path file.

### `sanitizeCacheKeyPart(raw, max): string`
Kunci cache hanya boleh `[a-zA-Z0-9_-]`, dibatasi 64 karakter — *belt & braces* di atas whitelist platform.

---

## 2. `src/app/api/download-proxy/route.ts` — Tambalan Terbesar

### 2a. Guard SSRF di pintu masuk (Kritis #1)
```ts
const isInternalLocalFlag = targetUrl === 'local_merge' || targetUrl === 'local';
if (!isInternalLocalFlag && !(await isSafeExternalUrl(targetUrl))) {
  return NextResponse.json({ error: 'Access denied: Dangerous target URL.' }, { status: 403 });
}
```
- `local_merge` / `local` — flag internal yt-dlp — **dikecualikan** sesuai spesifikasi, sehingga muxing YouTube/Facebook tidak terganggu.
- Semua URL lain (termasuk thumbnail Instagram yang lewat proxy ini) tervalidasi identik dengan sebelumnya — CDN publik tetap lolos.

### 2b. Guard URL untuk yt-dlp (Kritis #2)
Di fail lokal-engine, `origUrl` divalidasi dua lapis:
```ts
const origUrl = searchParams.get('origUrl') || targetUrl;
if (!(await isSafeExternalUrl(origUrl)) || !isSafeCliTargetUrl(origUrl)) {
  return NextResponse.json({ error: 'Access denied: Dangerous target URL.' }, { status: 403 });
}
```
Lapis DNS dibutuhkan di sini karena `origUrl` tersimpan di tempat yang bisa mencoba menjadikan yt-dlp sebagai client SSRF ke jaringan internal.

### 2c. Argument injection pada CLI (Kritis #2 dilanjutkan)
Keempat varian argumen `spawn(ytBinary, args)` kini memuat:
```ts
args = [..., '--no-exec', '--no-config-locations', '-o', outputPath, '--', originalUrl]
```
- `--no-exec` → opsi `--exec` (pengeksekusi command shell) dimatikan.
- `--no-config-locations` → tidak memuat file konfigurasi apa pun (pencegahan config dari URL jarak jauh — nama resmi flag ini sesuai help `yt-dlp` ("Do not load any custom configuration files"), padanan dari istilah `--no-config-location` di pesanan).
- `--` → *end-of-options*: semua setelahnya dianggap URL/operand, bukan opsi.
- **Terverifikasi dahulu sebelum dipakai** melalui `yt-dlp.exe -- "--version"` → argumen `--version` ditafsir sebagai URL (`[generic] '--version' is is not a valid URL`), **bukan** dicetak sebagai opsi. Versi binary `2026.08.19` mengenali semua flag (exit 0).

### 2d. Path traversal (Kritis #3)
- `platform` dinormalisasi lewat whitelist SEBELUM dipakai.
- `idKey` disanitasi; hash `md5` fallback otomatis aman (hex).
- Verifikasi path absolut:
```ts
const tempRoot = path.resolve(process.cwd(), '.temp-downloads');
const resolvedOutput = path.resolve(outputPath);
if (!resolvedOutput.startsWith(tempRoot + path.sep)) {
  throw new Error('Invalid cache path for merged media.');
}
```
→ `platform=..%5C..%5Cevil` kini mustahil menulis file di luar folder cache.

### 2e. Anti DoS — Bersihkan cache & self semaphore (Kritis #4)
```ts
const TEMP_MAX_AGE_MS = 30 * 60 * 1000;   // 30 menit
const MAX_CONCURRENT_MERGES = 3;           // batas proses yt-dlp simultan
```
- `cleanupOldTempFiles()`: non-blocking, menghapus `*.mp4|*.mp3|*.webm|*.part|*.ytdl` berumur > 30 menit; dipanggil kali pertama di akhiran setiap permintaan *local-engine merge*; error per-file ditolak (terminal) agar tidak pernah menggadalkan request utama.
- Semaphore in-memory: `activeMerges++` dengan `try/finally` (decrement tetap berjalan meski terjadi error); bila penuh, dilempar error ber-flag `status 429` → handler me-reply `429` + `Retry-After: 15` **tanpa maju ke fallback fetch**, sehingga jumlah proses yt-dlp tak pernah melebihi 3.

### 2f. Validasi Header Range (Sedang #10)
```ts
const rangeMatch = rangeHeader.match(/^bytes=(\d*)-(\d*)\s*$/);
```
- Format didukung: `bytes=0-99`, `bytes=100-`, suffix `bytes=-500` (N byte terakhir).
- `start >= totalSize` atau `start > end` atau format tak valid → **416** dengan `Content-Range: bytes */{totalSize}` — sesuai RFC 7233 §2.1 (start di luar ukuran = unsatisfiable; hanya *end* yang di-clamp).
- Multi-range (`0-1,5-9`) → tak valid → 416; IDM hanya mengirim *single-range*, jadi tak ada dampak.

### 2g. Open redirect ditambal
Dua titik `NextResponse.redirect(targetUrl)` (fallback up-stream gagal & *proxy-stream exception*) kini dipagari validator; bila URL tak aman → `502 Upstream media is unavailable.`

### 2h. Tetap dipertahankan persis
- `getCleanFilename()` tidak disentuh — sanitasi RFC 6266 (`[/\\?%*:|"<>\]` di-strips, newline lenyap lewat `\s+`, `encodeURIComponent`) → penamaan `[VidLoot]_Judul.mp4` & header `Content-Disposition` tetap identik.
- Alur streaming (`Accept-Ranges`, `206 Partial Content`, HEAD untuk IDM) di section remote & lokal tidak diubah perilakunya.

---

## 3. `src/lib/extractor.ts` — Metadata yt-dlp Aman

`getYtDlpJson()`:
```ts
if (!isSafeCliTargetUrl(url)) return resolve(null);
execFile(ytBinary,
  ['-j', '--no-playlist', '--no-exec', '--no-config-locations', ...extraArgs, '--', url],
  { timeout: 15000, maxBuffer: 15 * 1024 * 1024 }, ...)
```
- Guard URL mencegah string liar (`--exec=calc.exe` dll.) menyusup sebagai opsi.
- `--` memastikan URL selalu posisi terakhir sebagai operand.
- `extraArgs` (cookies Instagram) tetap ditaruh SEBELUM `--` — semantik CLI tidak berubah.

**Perbaikan blocker build (bonus)**: dua regex di `getInstagramMetadata` memakai flag `s` (dotAll) yang tidak didukung `target: ES2017` di `tsconfig.json` (blocker bawaan lama). Dikonversi ke karakter class yang semantik **100% identik**, tanpa menyentuh konfigurasi compiler:
```ts
// sebelum: /on Instagram:\s*["“](.*?)["”]?$/s   → gagal build di Es2017
// sesudah: /on Instagram:\s*["“]([\s\S]*?)["”]?$/  → build OK
```

---

## 4. `src/app/api/extract/route.ts` — Error Tidak Bocor (Tinggi #6)

Catch sebelumnya mengirim `error.message` mentah (bocor path/stack infrastruktur). Sekarang:
```ts
console.error('[Extraction Error]:', error);            // detail penuh hanya di log server
return NextResponse.json({
  success: false,
  error: 'Unable to extract video. Please verify the URL and try again.',
}, { status: 500 });
```
- `SyntaxError` (body JSON rusak) → `400 Invalid request body.`
- URL > 2048 karakter → `400 Video URL is too long.` (mitigasi parser-DoS ringan).
- Pesan "user-facing" asli dari `extractVideo()` (mis. "Instagram has restricted…") **tetap** tampil seperti sebelumnya.

---

## 5. `next.config.mjs` — Security Headers (Sedang #9)

```js
async headers() {
  return [{ source: '/:path*', headers: [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-XSS-Protection', value: '1; mode=block' },
  ]}];
}
```
Hasil `curl -I` ✅ keempat header tampil pada semua route. *(Content-Security-Policy sengaja belum dipasang — perlu whitelist domain iklan Adsterra/Monetag terlebih dahulu, agar script iklan pihak ketiga nanti tidak mati oleh CSP strict.)*

---

## 6. `package.json` — Deps Bersih (Tinggi #5/#12)

Empat paket dihapus karena **tidak pernah diimpor di `src/`** (diverifikasi dengan search sebelum di-uninstall):
```bash
npm uninstall @distube/ytdl-core instagram-url-direct youtubei.js yt-dlp-wrap
```
→ 46 paket hilang dari dependency tree. Disusul:
```bash
npm audit fix
```
→ **esbuild high (arbitrary file read saat dev di Windows)** ikut tertutup. Sisa dependensi aktif (`@satorufx/mediadownloader`, `btch-downloader`, `snapsave-media-downloader`) sengaja dipertahankan karena dipakai fallback ekstraktor.

---

## 7. Bukti Hasil Uji (Smoke Test Runtime — server prod lokal `npm run start -p 3111`)

### Build
```
✓ Compiled successfully — 16 route (semua landing page SEO + 2 API route)
Linting & checking validity of types → OK
```

### Negative tests (pencegahan serangan)
| # | Skenario request | Hasil |
|---|------------------|-------|
| 1 | `?url=http://127.0.0.1:8080/secret` | **403** ✅ |
| 2 | `?url=http://169.254.169.254/latest/meta-data/` | **403** ✅ |
| 3 | `?url=file:///c:/windows/win.ini` | **403** ✅ |
| 4 | `?url=javascript:alert(1)` | **403** ✅ |
| 5 | `url=local_merge` tanpa `origUrl` | **403** ✅ (payload liar di blok) |
| 6 | POST `/api/extract` dengan body JSON rusak | **400** ✅ `Invalid request body.` |

### Positive tests (Zero-Breakage — fitur utama tidak berubah)
| # | Yang diuji | Hasil |
|---|------------|-------|
| 7 | Homepage UI + headers | ✅ 200, `nosniff/SAMEORIGIN/strict-origin/1;mode=block` tampil |
| 8 | **HEAD** request ala IDM (cache file lokal 2048 B) | ✅ 200 + `Content-Length: 2048` + `Accept-Ranges: bytes` + `Content-Disposition` |
| 9 | `Range: bytes=abc-` (invalid) | ✅ **416** + `Content-Range: bytes */2048` (dulunya 500) |
| 10 | `Range: bytes=999999-` (start ≥ size) | ✅ **416** per RFC 7233 |
| 11 | `Range: bytes=0-99` | ✅ **206** tepat 100 byte streaming |
| 12 | Tanpa Range | ✅ **200** full 2048 byte |
| 13 | POST `/api/extract` URL non-medsos | ✅ 200 `success:false` + pesan generik (tanpa stack) |

> **Catatan metodologi**: pengujian local-engine IDM memakai file dummy `.temp-downloads/facebook_fb_<md5-8>_720p.mp4` — kunci cache buatan memang jatuh ke hash md5 karena regex Feed Facebook lama tidak mengenali pola `watch/?v=` (perilaku **identik dengan kode asli**, bukan regresi). Dummy dibuat dan dibersihkan otomatis setelah uji.

---

## 8. Keputusan Desain (agar tidak dianggap bug kelak)

1. **DNS gagal dianggap blokir (*deny by default*)**: seandainya resolver sedang bermasalah, `fetch()` bagaimanapun akan gagal juga — jadi 403 bukan kehilangan fitur, melainkan mode *fail-safe*.
2. **Header `Retry-After: 15`** disertakan pada HTTP 429 agar IDM/browser tahu kapan boleh mencoba.
3. **`async` di `isSafeExternalUrl`**: karena verifikasi DNS bersifat asinkron; pemanggilnya melakukan `await`, namun hasilnya disimpan di cache sehingga validasi berikutnya praktis gratis.
4. **Nama flag**: `--no-config-locations` (bukan `--no-config-location`) — bentuk yang disebut dokumentasi resmi yt-dlp; terverifikasi di binary lokal `2026.08.19`.

---

## 9. Sisa Pekerjaan yang Perlu Keputusan Anda (sengaja TIDAK dijalankan demi Zero-Breakage)

| Item | Risiko bila ditunda | Saran |
|------|--------------------|-------|
| 14 vulnerabilities tersisa (9 high) | chain `btch-downloader` (brace-expansion/markdown-it/showdown), `postcss` via Next, chain dev Tailwind | Jadwal perilisan terpisah: Next 16, tailwind 4, `btch-downloader@6.0.38` + regression test download Facebook terlebih dulu |
| `ffmpeg.exe` belum ada di `bin/` | opsi MP3 & mux 1080p jatuh ke fallback (gagal) | Unduh build ffmpeg standalone dan taruh di `bin/ffmpeg.exe` |
| CSP belum dipasang | sebelumnya bisa matikan script iklan pihak ketiga | Pasang bersamaan saat iklan Adsterra/Monetag sudah live (whitelist domain iklannya) |
| Rate-limit middleware global | Terjangkau sebagian — sudah terjaga oleh semaphore + 429 di local engine | Tambahkan `middleware.ts` (mis. 60 req/menit/IP) pada fase berikutnya |

---
*Dokumen ini disusun sebagai laporan fase security hardening 21 Okt 2026. Seluruh perubahan belum di-commit; siap di-commit bila perintah diberikan.*
