# Backend LogRaven

## Utility Database untuk Testing

Aplikasi ini menyediakan beberapa utilitas untuk memudahkan development dan testing terkait database:

### Reset Database

Untuk menghapus semua data dari database:

```bash
npm run db:reset
```

Perintah ini akan menghapus semua data dari database dengan urutan yang benar untuk menghindari constraint errors.

### Seed Database

Untuk mengisi database dengan data testing:

```bash
npm run db:seed
```

Perintah ini akan membuat:
- User admin (admin@example.com)
- User regular (user@example.com)
- User belum terverifikasi (unverified@example.com)
- Project untuk admin dan regular user
- Error group dan event untuk project admin
- Webhook untuk project admin

### Reset dan Seed Database

Untuk menghapus semua data dan kemudian mengisi dengan data testing:

```bash
npm run db:reset-and-seed
```

Ini sangat berguna untuk mempersiapkan lingkungan testing atau development dengan kondisi awal yang konsisten.

## Kredensial Testing

Semua user testing menggunakan password yang sama: `password123`

| Email | Role | Terverifikasi |
|---|---|---|
| admin@example.com | Admin | Ya |
| user@example.com | Regular | Ya |
| unverified@example.com | Unverified | Tidak | 