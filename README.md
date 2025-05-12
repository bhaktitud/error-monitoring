# LogRaven - SaaS Error Monitoring

LogRaven adalah platform error monitoring open source yang memungkinkan developer untuk memonitor error aplikasi secara real-time, mengelola project, mengirim error dari berbagai aplikasi, dan mendapatkan notifikasi jika terjadi error.

---

## Fitur Utama
- **User Authentication** (register, login)
- **Project Management** (buat, lihat project)
- **SDK** (kirim error dari aplikasi ke server monitoring)
- **Dashboard** (lihat error, statistik, filter/search, detail event)
- **Notifikasi Email** (jika ada error baru)
- **Team Collaboration** (invite anggota, opsional)
- **Statistik & Visualisasi** (pie/bar chart, filter/search event)

## Fitur Error Monitoring Yang Terimplementasi

### 1. Catch Error
- **Frontend (Browser)**: Menangkap unhandled exceptions, unhandled rejections, console errors, dan network errors
- **Backend (Node.js)**: Middleware Express untuk menangkap error
- **Mobile (React Native)**: Support untuk menangkap error di aplikasi React Native
- **Integration**: React Error Boundary untuk menangkap error di komponen React

### 2. Stack Trace & Metadata
- **Informasi lengkap**: Error message, stack trace, line numbers
- **Browser & OS Info**: Deteksi otomatis browser, versi, OS, device type
- **User Session**: Mendukung tracking user context, URL, referrer
- **Network Info**: Capturing request data, query params, method

### 3. Grouping & Deduplication
- **Smart Fingerprinting**: Grouping berdasarkan error type, stack trace dan normalisasi pesan error
- **Deduplication**: Menghindari duplikasi error dengan algoritma fingerprinting canggih
- **Status Management**: Open, Resolved, Ignored untuk mengelola error
- **Assignment**: Fitur untuk meng-assign error ke anggota tim

### 4. Notifikasi Real-time
- **Email**: Notifikasi email saat terjadi error baru
- **In-App**: Notifikasi real-time di dashboard menggunakan WebSocket
- **Slack**: Webhook integration untuk mengirim alert ke channel Slack
- **Discord**: Webhook ke channel Discord dengan format yang informatif
- **Telegram**: Notifikasi ke bot Telegram dengan format markdown

### 5. Dashboard Dengan Filter
- **Filter Error**: Berdasarkan project, environment, browser, OS
- **Search**: Pencarian berdasarkan error message dan type
- **Pagination**: Navigasi antar halaman untuk daftar error
- **Sorting**: Pengurutan berdasarkan waktu, frekuensi, status
- **Detail View**: Tampilan detail untuk melihat informasi lengkap error

---

## Struktur Folder

```
/ (root)
│
├── backend/    # Source code backend (Express + TypeScript + Prisma)
│
├── frontend/   # Source code frontend (Next.js + React + Tailwind)
│
├── sdk/        # Source code SDK error monitoring (Node.js)
│
├── example/    # Contoh penggunaan SDK di backend Express
│
├── .gitignore  # File ignore untuk git
├── README.md   # Dokumentasi project ini
└── ...
```

### Penjelasan Setiap Folder

#### `/backend`
- API utama (Express + TypeScript)
- Model database dengan Prisma (PostgreSQL)
- Endpoint: auth, project, event
- Notifikasi email (nodemailer)
- File penting: `src/app.ts`, `prisma/schema.prisma`, `.env`

#### `/frontend`
- Dashboard web (Next.js + React + Tailwind CSS)
- Halaman: login, register, list project, detail project (event, statistik, filter)
- Komponen: Navbar, Toast, dsb
- File penting: `pages/`, `components/`, `.env`

#### `/sdk`
- SDK Node.js untuk mengirim error ke backend monitoring
- Fungsi utama: `init`, `captureException`
- Support untuk browser, Node.js, dan React Native
- Bisa di-publish ke npm
- File penting: `index.ts`, `package.json`, `README.md`

#### `/example`
- Contoh backend Express yang mengintegrasikan SDK
- Endpoint `/error` akan throw error dan otomatis dikirim ke monitoring
- File penting: `index.js`, `.env`

---

## Cara Setup Development

### 1. **Clone & Install**
```bash
git clone <repo-url>
cd <repo-folder>

# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install

# Install SDK (jika ingin develop SDK)
cd ../sdk
npm install

# Install example
cd ../example
npm install
```

### 2. **Setup Environment**
- Buat file `.env` di backend, frontend, dan example sesuai contoh di masing-masing folder.
- Pastikan PostgreSQL sudah jalan untuk backend.

### 3. **Jalankan Project**
- **Backend:**
  ```bash
  cd backend
  npx prisma migrate dev --name init
  npm run dev
  ```
- **Frontend:**
  ```bash
  cd frontend
  npm run dev
  ```
- **Example (Demo SDK):**
  ```bash
  cd example
  npm start
  # Akses http://localhost:4000/error untuk trigger error
  ```

---

## Kontribusi
Pull request, issue, dan feedback sangat diterima! Silakan fork dan kembangkan fitur baru.

---

## Lisensi
MIT 