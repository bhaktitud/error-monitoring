# LogRaven SDK

SDK untuk mengirim error ke backend LogRaven.

## Instalasi

```
npm install @lograven/sdk
```

## Cara Pakai

```js
import { init, captureException } from '@lograven/sdk';

// Inisialisasi SDK
init({
  dsn: 'DSN_PROJECT_KAMU', // dapatkan dari dashboard project
  apiUrl: 'http://localhost:3000' // ganti jika backend kamu di server lain
});

// Tangkap error di aplikasi kamu
try {
  // kode yang bisa error
  throw new Error('Contoh error!');
} catch (err) {
  await captureException(err, { userAgent: 'my-app/1.0' });
}
```

## Catatan
- Pastikan DSN benar dan backend sudah jalan.
- SDK ini hanya untuk Node.js (bisa dikembangkan untuk browser/other language). 