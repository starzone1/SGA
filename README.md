# SGA News Portal

Aplikasi Portal Berita SGA News dibuat menggunakan React, TypeScript, Tailwind CSS, dan Firebase.

---

## 📌 Mengapa `index.html` Putih saat Diklik Langsung?
Aplikasi ini dibuat menggunakan framework modern (**React + Vite + TypeScript**). File `index.html` tidak bisa dibuka langsung dengan *double-click* dari file explorer karena membutuhkan proses kompilasi TypeScript (`.tsx`) dan server web lokal.

---

## 🚀 Cara Menjalankan di Laptop / Komputer Lokal

### Syarat Utama:
Aplikasi ini membutuhkan **Node.js** terinstall di komputer Anda.

### Langkah-langkah:
1. **Download & Install Node.js**
   - Buka browser dan kunjungi: [https://nodejs.org](https://nodejs.org)
   - Download dan install versi **LTS** (Recommended for Most Users).
   - Jalankan installer sampai selesai.

2. **Buka Terminal / CMD di Folder Project**
   - Buka folder `sga-news-portal` di File Explorer Anda.
   - Klik pada address bar folder di bagian atas, ketik `cmd`, lalu tekan **Enter**.
   - Atau klik kanan di dalam folder -> pilih **Open in Terminal**.

3. **Install Dependencies**
   Jalankan perintah berikut di CMD:
   ```bash
   npm install
   ```

4. **Jalankan Aplikasi**
   Setelah install selesai, jalankan:
   ```bash
   npm run dev
   ```
   Buka alamat URL yang muncul di terminal (misalnya `http://localhost:3000` atau `http://localhost:5173`) di browser Chrome Anda.

---

## 🌐 Cara Deploy Gratis ke Internet (Vercel / GitHub)

Jika ingin aplikasi bisa diakses online langsung tanpa perlu install apa-apa di laptop:

1. Import / Upload folder project ini ke **GitHub** atau **Vercel** ([https://vercel.com](https://vercel.com)).
2. Vercel secara otomatis membaca file `vercel.json` dan melakukan build.
3. Website Anda langsung aktif dan dapat diakses publik melalui link domain gratis dari Vercel!
