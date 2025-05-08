# UI Dashboard Error Monitoring

UI Dashboard untuk aplikasi Error Monitoring berdasarkan dokumentasi API di `/backend/API_DOCUMENTATION.md`. UI ini terinspirasi oleh Sentry dan dibuat menggunakan Next.js dan Tailwind CSS.

## Struktur UI

UI Dashboard dibagi menjadi beberapa halaman utama:

1. **Halaman Projects**
   - Menampilkan daftar proyek yang dimiliki pengguna
   - Tombol untuk membuat proyek baru

2. **Halaman Create Project**
   - Form untuk membuat proyek baru

3. **Halaman Project Detail**
   - Informasi tentang proyek (nama, DSN)
   - Daftar Error Groups terbaru
   - Link ke halaman lain terkait proyek

4. **Halaman Error Group Detail**
   - Informasi detail tentang Error Group
   - Daftar Events (kejadian error) dalam grup tersebut
   - Fitur untuk mengubah status (open, resolved, ignored)
   - Sistem komentar untuk diskusi

5. **Halaman Webhooks**
   - Mengelola webhook untuk notifikasi eksternal
   - Form untuk menambah, mengedit, dan menghapus webhook

## Komponen UI yang Dibuat

1. **ErrorCard**
   - Menampilkan informasi singkat tentang Error Group
   - Menampilkan status, jumlah kejadian, dan waktu terlihat

2. **EventDetail**
   - Menampilkan detail lengkap tentang event error
   - Termasuk stacktrace, user agent, dan informasi konteks

3. **Comment**
   - Komponen untuk menampilkan komentar pada Error Group
   - Avatar dan informasi pengirim

4. **SidebarNav**
   - Navigasi sidebar untuk menjelajahi halaman-halaman proyek

5. **DashboardLayout**
   - Layout utama yang digunakan di semua halaman dashboard

6. **UI Components**
   - Badge, Button, Card, Avatar, dll.

## Fitur Dashboard

1. **Monitoring Error**
   - Melihat dan mengelola Error Groups
   - Melihat detail error event

2. **Management Error**
   - Menandai error sebagai resolved atau ignored
   - Assign error ke anggota tim

3. **Kolaborasi**
   - Sistem komentar untuk diskusi tentang error

4. **Integrasi**
   - Webhook untuk integrasi dengan sistem eksternal

## Cara Penggunaan

1. Clone repositori
2. Install dependencies dengan `npm install`
3. Jalankan aplikasi dengan `npm run dev`
4. Buka `http://localhost:3000` di browser

## Screenshot

Gambar-gambar mockup UI ada di direktori `/screenshots` (jika ada).

## Teknologi yang Digunakan

- **Next.js 15** - Framework React
- **Tailwind CSS** - Untuk styling
- **React Icons** - Untuk ikon
- **ShadCN UI** - Untuk komponen UI
- **TypeScript** - Untuk type safety 