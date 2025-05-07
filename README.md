# Sentry Clone - SaaS Error Monitoring

Sentry Clone adalah platform error monitoring open source yang terinspirasi dari Sentry.io. Project ini memungkinkan developer untuk memonitor error aplikasi secara real-time, mengelola project, mengirim error dari berbagai aplikasi, dan mendapatkan notifikasi jika terjadi error.

---

## Fitur Utama
- **User Authentication** (register, login)
- **Project Management** (buat, lihat project)
- **SDK** (kirim error dari aplikasi ke server monitoring)
- **Dashboard** (lihat error, statistik, filter/search, detail event)
- **Notifikasi Email** (jika ada error baru)
- **Team Collaboration** (invite anggota, opsional)
- **Statistik & Visualisasi** (pie/bar chart, filter/search event)

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
- Bisa di-publish ke npm
- File penting: `index.js`, `package.json`, `README.md`

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