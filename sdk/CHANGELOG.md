# Changelog

Semua perubahan besar dicatat di sini.

## [v0.1.35] - 2025-05-20

### Added
- Kompatibilitas browser yang lebih luas:
  - Transpilasi ke ES2015 (ES6) untuk dukungan browser yang lebih luas
  - Konfigurasi browserslist untuk targeting browser spesifik
  - Build UMD untuk penggunaan langsung di browser tanpa bundler
- Integrasi Vue.js:
  - `installVue2` untuk Vue 2.x
  - `installVue3` untuk Vue 3.x
  - Auto-capture error komponen dan lifecycle hooks
- Integrasi Angular:
  - `LogRavenErrorHandler` untuk global error handler
  - `LogRavenHttpInterceptor` untuk menangkap HTTP errors
- Integrasi Fastify:
  - `logRavenFastifyPlugin` untuk plugin Fastify
  - `logRavenFastifyErrorHandler` untuk custom error handler
- PeerDependencies yang ditandai sebagai opsional untuk mengurangi warning instalasi
- Contoh implementasi untuk semua framework baru yang didukung

### Changed
- Perubahan konfigurasi TypeScript untuk menargetkan ES2015 alih-alih ESNext
- Perubahan struktur rollup.config.js untuk mendukung transpilasi babel di build browser
- Ekspor yang lebih granular dengan subpath exports untuk setiap framework
- Dokumentasi yang lebih lengkap untuk setiap framework yang didukung

### Fixed
- Kompatibilitas dengan browser lama melalui transpilasi babel
- Masalah potensial dengan bundling di proyek yang menggunakan versi TypeScript yang berbeda

## [v0.1.34] - 2025-05-15

### Added
- Integrasi NestJS:  
  - `LogRavenInterceptor` untuk request tracking  
  - `LogRavenExceptionFilter` untuk error handling global  
- Integrasi Next.js API Route dengan HOC `withLogRaven`  
- SDK Frontend Browser dengan auto-capture error:  
  - Tangkap `window.onerror`, `unhandledrejection`, `console.error`, `fetch` dan `XHR` errors  
  - Opsi konfigurasi granular untuk enable/disable fitur auto-capture  
- React Integration:  
  - `LogRavenErrorBoundary` component  
  - `withLogRaven` HOC  
  - `useLogRaven` hook  
- Penyesuaian `package.json` dan `tsconfig.json` untuk dukungan ESM dan tipe TypeScript yang lengkap  
- Dokumentasi lengkap untuk semua integrasi utama  

### Fixed
- Perbaikan error build Rollup terkait `@nestjs/common` dan plugin Rollup  
- Penanganan tipe React di TypeScript dengan `jsx` option di `tsconfig.json`  
- Perbaikan import/export modul React untuk kompatibilitas tree shaking  

### Changed
- Modularisasi ekspor React via subpath `@lograven/sdk/react`  
- Update peerDependencies agar sesuai kebutuhan React, NestJS, Express, dan RxJS  

---

## [v0.1.33] - (versi sebelumnya)
- Perbaikan minor dan peningkatan dokumentasi

---

> Untuk info detail dan migrasi, lihat [README.md](./README.md).
