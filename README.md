# KH Portfolio

Portofolio bertema Kingdom Hearts (menu gaya game) milik M. Baihaqi Alawi.

## Status

- **Hanya untuk desktop/laptop** dengan lebar layar minimal 1024px. Belum disesuaikan untuk Android atau layar kecil lainnya.
- Setiap halaman memakai `viewport width=1024` dan `body` memiliki `min-width: 1024px`, jadi di layar kecil tampilan tidak menyesuaikan dan bisa terpotong.

## Halaman

| File | Isi |
|---|---|
| `index.html` | Menu utama |
| `projects.html` | Daftar proyek |
| `skills.html` | Keahlian |
| `about.html` | Tentang saya |
| `contact.html` | Kontak |

## Menjalankan secara lokal

- **Dibuka langsung dari file (`file://`)** bisa dipakai, tetapi perpindahan halaman memakai navigasi browser biasa, dan wallpaper animasi memakai data tertanam dari `assets/data/wallpaper-textures.js`.
- **Lewat server HTTP** untuk pengalaman penuh, misalnya dengan `python3 -m http.server` di dalam folder ini, lalu buka `http://localhost:8000`.

## Mengubah isi

- **Proyek**: edit array `PROJECTS` di `assets/js/pages/projects.js`. Setiap entri berisi `id`, `title`, `category`, `description`, dan `url`. `url` wajib memakai `https://`. Entri yang tidak valid dilewati dan dicatat di konsol. Daftar tautan di blok `<noscript>` pada `projects.html` (untuk pengunjung tanpa JavaScript) juga perlu diperbarui secara manual agar sama dengan `PROJECTS`.
- **Keahlian**: edit `assets/data/skills.js`.
- **Wallpaper animasi**: jika gambar `projects-kingdom-wallpaper.webp` atau `skills-kingdom-wallpaper.webp` diganti, jalankan `python3 tools/embed-wallpaper-textures.py` untuk membuat ulang `assets/data/wallpaper-textures.js`.

## Struktur folder

```
assets/
  audio/     Efek suara menu, konfirmasi, dan kembali
  css/       Stylesheet per halaman
  data/      Data keahlian dan tekstur wallpaper
  effects/   Wallpaper (js/effects)
  fonts/     Font KH Menu
  images/    Gambar wallpaper, logo, dan foto profil
  js/core/   Navigasi antarhalaman dan efek suara konfirmasi
  js/pages/  Logika untuk setiap halaman
tools/       Skrip pembantu (regenerasi tekstur wallpaper)
```
