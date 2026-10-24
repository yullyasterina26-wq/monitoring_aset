# Aplikasi Operator Mobile - Sistem Informasi Manajemen Aset (SIMA)
### Unit Airport Technology - PT Angkasa Pura Indonesia Kantor Cabang Bandara Supadio (PNK)

Aplikasi mobile-first untuk operator lapangan yang terpisah dari backend Laravel. Backend Laravel dan basis data MySQL tetap menjadi **satu-satunya sumber data utama** melalui HTTP REST API (Sanctum), tanpa koneksi langsung ke MySQL.

---

## 📌 Ringkasan Fitur Aplikasi

1. **Dashboard Operasional**: Ringkasan data operasional real-time dari `GET /api/operasional/dashboard`, statistik ketersediaan aset, peminjaman aktif, pengajuan mutasi pending, dan log aktivitas terkini.
2. **Pindai QR / Barcode Fisik**:
   - Pemindaian label QR aset di lapangan menggunakan kamera belakang perangkat.
   - Izin kamera hanya diminta saat operator menekan tombol scan.
   - Perlindungan anti-scan berulang dan pengamanan terhadap URL eksternal berbahaya (hanya mengekstrak kode aset).
   - Opsi input kode aset manual (misalnya `AST-001`).
   - Endpoint publik `GET /api/assets/by-code/{kode_aset}` untuk lookup instan tanpa harus login terlebih dahulu.
3. **Katalog & Pencarian Aset**:
   - `GET /api/assets` dengan pagination responsif (maksimal 50 item per halaman).
   - Filter dinamis berdasarkan kata kunci (nama, kode, serial number, lokasi), kategori (`GET /api/categories`), dan kondisi fisik aset.
4. **Detail Aset & Riwayat Lengkap**:
   - Menampilkan spesifikasi aset publik: kode, nama, kategori, kondisi, merek/model, nomor seri, ukuran, lokasi, unit, dan tahun pengadaan.
   - Tab Riwayat Aset dimuat dari `GET /api/assets/{id}/history` (dilindungi token otentikasi login).
5. **Pengajuan Peminjaman Aset**:
   - Formulir pengajuan peminjaman lewat `POST /api/loans` dengan status awal `Menunggu`.
   - Menampilkan status transparan bahwa verifikasi, persetujuan, serah terima (BAST), dan pengembalian dilakukan oleh admin pada sistem utama.
6. **Pengajuan Mutasi Aset**:
   - Formulir pemindahan lokasi aset melalui `POST /api/mutations`.
   - Validasi otomatis: lokasi asal terkunci sesuai posisi fisik aset saat ini.
   - Mendukung lampiran dokumen/surat permohonan via `multipart/form-data`.
7. **Pemeriksaan Fisik Aset**:
   - Pencatatan kondisi berkala di lapangan via `POST /api/operasional/pemeriksaan` (`aset_id`, `kondisi_baru`, `keterangan`).
   - Riwayat inspeksi tersimpan di `GET /api/operasional/pemeriksaan`.
8. **Riwayat Aktivitas Terpadu**:
   - Tab 1: Log aktivitas akun operator sendiri (`GET /api/me/activities`).
   - Tab 2: Riwayat pergerakan aset operasional (`GET /api/operasional/aktivitas`).
9. **Konfigurasi Server API Fleksibel**:
   - Base URL API dapat disesuaikan langsung lewat modal antarmuka tanpa perlu re-build aplikasi.
   - Uji koneksi interaktif ke backend Laravel dengan diagnostik status jaringan.

---

## ⚙️ Kebutuhan Sistem

- **Node.js**: Versi 18.x atau lebih baru (disarankan LTS 20.x).
- **Package Manager**: npm (bawaan Node.js).
- **Backend Laravel**: Proyek backend `Manajement_Aset` yang telah menjalankan migrasi database dan API Sanctum.
- **Jaringan**: Komputer server dan perangkat ponsel/tablet terhubung ke jaringan Wi-Fi lokal yang sama.

---

## 🚀 Panduan Menjalankan Pengembangan Lokal (LAN Wi-Fi)

### 1. Menjalankan Backend Laravel

Buka terminal PowerShell pada direktori backend Laravel (`d:\Manajement_Aset`):

```powershell
# 1. Jalankan artisan serve dengan binding host ke seluruh interface jaringan
php artisan serve --host=0.0.0.0 --port=8000
```

> **PENTING: Jangan gunakan `--host=127.0.0.1`** karena hanya akan dapat diakses dari komputer itu sendiri. Binding ke `0.0.0.0` mengizinkan ponsel di jaringan Wi-Fi untuk mengakses API.

#### Mengatur Konfigurasi `.env` Backend:
Pastikan variabel `APP_URL` pada file `.env` Laravel diarahkan ke alamat IP komputer server pada jaringan Wi-Fi, contoh:
```env
APP_URL=http://192.168.1.10:8000
```
Setelah mengubah `.env`, jalankan pembersihan cache:
```powershell
php artisan config:clear
```

#### Cara Mengetahui Alamat IP Komputer:
1. Buka PowerShell dan ketik:
   ```powershell
   ipconfig
   ```
2. Temukan adaptor **Wireless LAN adapter Wi-Fi** dan catat nilai **IPv4 Address** (contoh: `192.168.1.10`).

#### Mengizinkan Port 8000 pada Firewall Windows:
Jika ponsel tidak dapat terhubung ke Laravel, izinkan port 8000 pada Windows Defender Firewall:
```powershell
# Jalankan PowerShell sebagai Administrator:
netsh advfirewall firewall add rule name="Laravel API Port 8000" dir=in action=allow protocol=TCP localport=8000
```

---

### 2. Menjalankan Frontend Operator Mobile

Buka terminal di direktori `d:\Monitoring Aset`:

```powershell
cd "d:\Monitoring Aset"

# 1. Instal dependensi (jika belum)
npm install

# 2. Jalankan dev server Vite
npm run dev
```

Dev server akan aktif dan menampilkan alamat akses:
```text
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.10:5173/
```

- **Akses Desktop**: Buka browser di komputer: `http://localhost:5173`.
- **Akses Ponsel/Mobile**: Buka browser di ponsel (Chrome/Safari): `http://192.168.1.10:5173`.

---

## 🌐 Konfigurasi Base URL API

Base URL API backend dapat diatur melalui dua cara:

### Cara 1: Lewat Antarmuka Aplikasi (Disarankan untuk Mobile)
1. Buka aplikasi di ponsel.
2. Pada layar Login atau di Header atas, klik tombol **Server**.
3. Masukkan URL API Laravel, contoh: `http://192.168.1.10:8000/api`.
4. Klik tombol **Uji** untuk memverifikasi respons server.
5. Jika berhasil, klik **Simpan & Terapkan**. Pengaturan akan disimpan di `localStorage` ponsel tanpa merusak kode sumber.

### Cara 2: Lewat File Environment (`.env`)
Edit file `.env` pada root direktori frontend:
```env
# Default untuk proxy browser lokal
VITE_API_BASE_URL=/api

# Atau langsung arahkan ke IP server LAN
# VITE_API_BASE_URL=http://192.168.1.10:8000/api
```

---

## 🔐 Autentikasi dan Hak Akses (Role)

- **Endpoint Login**: `POST /api/login` dengan JSON `{ "email": "...", "password": "..." }`.
- **Ketentuan Role**:
  - API hanya menerima akun aktif (`is_active = true`) dengan role **`operator`** atau **`admin`**.
  - **Akun dengan role `user` TIDAK DAPAT login ke aplikasi ini**. Admin sistem utama harus mempromosikan role akun menjadi `operator` terlebih dahulu melalui dashboard web admin.
- **Penyimpanan Token**: Token Sanctum disimpan secara aman di `localStorage` perangkat. Kata sandi tidak pernah disimpan di sisi klien.
- **Header Permintaan**: Setiap permintaan privat otomatis menyertakan:
  ```http
  Authorization: Bearer <token>
  Accept: application/json
  ```
- **Sesi Kedaluwarsa (401 Unauthorized)**: Jika token habis masa berlaku atau tidak valid, aplikasi otomatis menghapus sesi lokal dan mengarahkan pengguna kembali ke halaman Login.
- **Logout**: Tombol Keluar memanggil `POST /api/logout` untuk mencabut token sesi saat ini dari server backend.

---

## 📷 Akses Kamera & Pemindaian QR di Ponsel

- Pemindaian menggunakan library standar `html5-qrcode` yang mengakses kamera belakang (`facingMode: "environment"`).
- **Konteks Keamanan Browser (WebRTC)**:
  - Browser modern di ponsel (Chrome/Safari) membatasi akses kamera hanya pada origin yang aman: `localhost`, `127.0.0.1`, atau `https://`.
  - Jika mengakses via HTTP LAN (misal `http://192.168.1.10:5173`), beberapa browser ponsel mungkin memblokir kamera.
  - **Solusi**:
    1. Gunakan opsi **Ketik Kode** (manual lookup) yang selalu berfungsi di segala jaringan.
    2. Atau aktifkan flag Chrome mobile `unsafely-treat-insecure-origin-as-secure` untuk IP server Anda (`chrome://flags`).
    3. Atau gunakan tunneling HTTPS lokal (misal: `ngrok http 5173`).

---

## Menghubungkan jaringan Wi-Fi berbeda

IP Wi-Fi seperti `192.168.x.x` hanya dapat dijangkau dari jaringan lokal yang sama. Untuk menjalankan frontend dan backend pada jaringan berbeda, hubungkan kedua komputer ke VPN privat yang sama (misalnya Tailscale), lalu arahkan proxy frontend ke alamat VPN backend.

1. Pasang dan login ke Tailscale pada komputer yang menjalankan Laravel dan komputer/perangkat yang membuka frontend. Keduanya harus berada pada tailnet yang sama.
2. Pada komputer backend, jalankan `tailscale ip -4` untuk mendapatkan IP Tailscale. IP ini tetap sama saat Wi-Fi berubah.
3. Jalankan Laravel dengan `php artisan serve --host=0.0.0.0 --port=8000` dan izinkan TCP port 8000 dari jaringan Tailscale pada firewall Windows.
4. Salin `.env.example` menjadi `.env` bila belum ada, lalu set `API_PROXY_TARGET=http://IP-TAILSCALE-BACKEND:8000` pada frontend. Biarkan `VITE_API_BASE_URL=/api` agar request browser melewati proxy Vite.
5. Jika sebelumnya URL server diubah lewat menu **Pengaturan Server**, reset/hapus URL tersimpan agar aplikasi memakai `/api` melalui proxy Vite.
6. Jalankan ulang frontend dengan `npm run dev -- --host`. Akses frontend melalui IP Tailscale komputer frontend pada port 5173; dari komputer yang sama dapat tetap memakai `http://localhost:5173`.

> Vite membaca `API_PROXY_TARGET` saat startup. Jika nilainya berubah, restart dev server. Pengaturan server di aplikasi tetap tersedia untuk mengganti URL API secara manual. Untuk penggunaan produksi atau akses kamera browser di ponsel, gunakan domain HTTPS dan server hosting/VPN yang sesuai; jangan mengekspos port Laravel langsung ke internet.

Panduan langkah lengkap dan contoh aturan firewall ada di `D:\Manajement_Aset\docs\network-sync.md`.

## 📡 Daftar Endpoint API yang Terintegrasi

| Method | Endpoint | Keterangan & Hak Akses |
| :--- | :--- | :--- |
| `POST` | `/api/login` | Otentikasi login operator/admin |
| `POST` | `/api/logout` | Mengakhiri sesi dan mencabut token |
| `GET` | `/api/me` | Profil akun pengguna yang sedang login |
| `GET` | `/api/me/activities` | Log aktivitas akun operator sendiri |
| `GET` | `/api/categories` | Daftar kategori aset (Publik) |
| `GET` | `/api/assets` | Pencarian aset dengan pagination & filter (Publik) |
| `GET` | `/api/assets/by-code/{kode}` | Lookup QR / barcode kode aset (Publik) |
| `GET` | `/api/assets/{id}` | Detail data aset publik |
| `GET` | `/api/assets/{id}/history` | Riwayat lengkap mutasi & servis aset (Wajib login) |
| `GET` | `/api/operasional/dashboard` | Statistik operasional & aktivitas terbaru |
| `GET` | `/api/operasional/aktivitas` | Riwayat seluruh aktivitas aset operasional |
| `GET` | `/api/operasional/pemeriksaan` | Daftar riwayat pemeriksaan fisik aset |
| `POST` | `/api/operasional/pemeriksaan` | Catat hasil pemeriksaan fisik kondisi baru |
| `GET` | `/api/loans` | Daftar pengajuan peminjaman milik sendiri |
| `POST` | `/api/loans` | Buat pengajuan peminjaman aset baru |
| `GET` | `/api/loans/{id}` | Detail pengajuan peminjaman |
| `GET` | `/api/mutations` | Daftar pengajuan mutasi milik sendiri |
| `POST` | `/api/mutations` | Buat pengajuan mutasi aset (dukung dokumen file) |
| `GET` | `/api/mutations/{id}` | Detail pengajuan mutasi |
| `GET` | `/api/operasional/laporan/*` | Rekapitulasi kondisi, kategori, lokasi, & pemeriksaan |

---

## 🧪 Pemeriksaan Kualitas & Build

Aplikasi telah divalidasi dan lulus uji pemeriksaan:

```powershell
# 1. Jalankan linter ESLint (0 error)
npm run lint

# 2. Jalankan build produksi Vite (0 error)
npm run build
```
Hasil build produksi siap didistribusikan pada folder `dist/`.
