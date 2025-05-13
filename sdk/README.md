# LogRaven SDK

SDK untuk integrasi dengan LogRaven Error Monitoring Platform.

## Instalasi

```bash
npm install @lograven/sdk
```

## Penggunaan Dasar

### Node.js (Backend)

```javascript
const LogRaven = require('@lograven/sdk');

// Inisialisasi SDK dengan DSN dari project LogRaven Anda
LogRaven.init({
  dsn: 'YOUR_DSN_HERE',
  environment: 'production', // atau 'development', 'staging', etc.
  release: '1.0.0' // versi aplikasi Anda
});

// Tambahkan middleware untuk Express
const app = express();
app.use(LogRaven.withErrorMonitoring());

// Contoh pengiriman error manual
try {
  throw new Error('Contoh error manual');
} catch (error) {
  LogRaven.captureException(error);
}

// Menangkap pesan (tanpa error)
LogRaven.captureMessage('Pesan penting', 'info');
```

### Browser (Frontend)

```javascript
import * as LogRaven from '@lograven/sdk';

// Inisialisasi SDK di aplikasi frontend
LogRaven.init({
  dsn: 'YOUR_DSN_HERE',
  environment: 'production',
  release: '1.0.0',
  sdk: {
    captureUnhandledErrors: true,
    captureConsoleErrors: true,
    captureNetworkErrors: true
  }
});

// Track user saat login
LogRaven.setUser({
  id: 'user123',
  email: 'user@example.com',
  username: 'username',
  // bisa tambah field custom lainnya
});

// Track breadcrumbs untuk melihat langkah user sebelum error
LogRaven.addBreadcrumb({
  category: 'ui',
  message: 'User klik tombol submit',
  data: { formData: true }
});

// Tangkap error manual
try {
  // Simulasi error
  const items = null;
  const count = items.length; // Ini akan error
} catch (error) {
  LogRaven.captureException(error, {
    extraContext: { page: 'homepage' }
  });
}
```

### React

```jsx
import React from 'react';
import * as LogRaven from '@lograven/sdk';

// Error boundary untuk menangkap error di komponen React
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error, info) {
    // Kirim error ke LogRaven
    LogRaven.captureException(error, {
      extraContext: {
        componentStack: info.componentStack,
        reactComponent: true,
        componentName: this.props.componentName || 'UnknownComponent'
      }
    });
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Terjadi kesalahan.</div>;
    }
    return this.props.children;
  }
}

// Penggunaan:
function App() {
  return (
    <ErrorBoundary 
      componentName="App" 
      fallback={<div>Maaf, terjadi kesalahan. Refresh halaman.</div>}
    >
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### React Native

```javascript
import * as LogRaven from '@lograven/sdk';

// Inisialisasi khusus React Native
LogRaven.initReactNative({
  dsn: 'YOUR_DSN_HERE',
  environment: 'production',
  release: '1.0.0'
});

// Untuk menambahkan context di setiap screen
function HomeScreen() {
  React.useEffect(() => {
    // Set tags untuk environment
    LogRaven.setTags({
      screen: 'HomeScreen',
      networkState: 'connected'
    });
    
    // Track breadcrumb
    LogRaven.addBreadcrumb({
      category: 'navigation',
      message: 'User masuk ke HomeScreen'
    });
  }, []);
  
  // ...
}
```

## Konfigurasi Lanjutan

### Opsi SDK Lengkap

```javascript
LogRaven.init({
  dsn: 'YOUR_DSN_HERE',
  apiUrl: 'https://api.example.com', // Opsional, default: endpoint dari dsn
  environment: 'production',
  release: '1.0.0',
  sdk: {
    captureUnhandledRejections: true, // Tangkap unhandled promise rejections
    captureUncaughtExceptions: true, // Tangkap uncaught exceptions
    captureUnhandledErrors: true, // Untuk browser
    captureConsoleErrors: true, // Tangkap console.error
    captureNetworkErrors: true, // Tangkap error fetch/XHR
    breadcrumbs: true, // Aktifkan breadcrumb tracking
    maxBreadcrumbs: 100, // Jumlah maksimal breadcrumbs yang disimpan
    
    // Hook untuk mengubah data sebelum dikirim
    beforeSend: (payload, error) => {
      // Contoh: Cek apakah error dari library tertentu yang bisa diabaikan
      if (error.message.includes('IgnorableError')) {
        return null; // Abaikan error ini
      }
      
      // Contoh: Tambahkan data tambahan
      payload.extraContext.custom = 'nilai tambahan';
      return payload;
    }
  }
});
```

### Filter Sensitif Data

LogRaven secara otomatis memfilter header sensitif dan field dalam request seperti password, token, dll. Anda juga bisa mengimplementasikan filter custom dengan `beforeSend`:

```javascript
LogRaven.init({
  dsn: 'YOUR_DSN_HERE',
  sdk: {
    beforeSend: (payload, error) => {
      // Hapus semua data sensitif dari payload
      if (payload.userContext && payload.userContext.creditCard) {
        payload.userContext.creditCard = '[REDACTED]';
      }
      return payload;
    }
  }
});
```

## API Reference

### Core

- `init(options)` - Inisialisasi SDK
- `initReactNative(options)` - Inisialisasi SDK untuk React Native
- `captureException(error, options)` - Tangkap exception
- `captureMessage(message, level, options)` - Tangkap pesan

### Context

- `setUser(user)` - Set informasi user
- `setTags(tags)` - Set tags yang akan disertakan di semua error
- `addBreadcrumb(breadcrumb)` - Tambahkan breadcrumb

### Integration

- `withErrorMonitoring()` - Middleware untuk Express
- `withErrorBoundary(Component, options)` - HOC untuk React

## Langkah Integrasi Tambahan

### Tambahan untuk Next.js

Buat file `pages/_app.js` (atau `.tsx` untuk TypeScript):

```javascript
import * as LogRaven from '@lograven/sdk';

// Inisialisasi hanya di sisi client
if (typeof window !== 'undefined') {
  LogRaven.init({
    dsn: process.env.NEXT_PUBLIC_LOGRAVEN_DSN,
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_VERSION || '1.0.0'
  });
}

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}

export default MyApp
```

### Tambahan untuk Vue.js

```javascript
import * as LogRaven from '@lograven/sdk';
import Vue from 'vue';

LogRaven.init({
  dsn: 'YOUR_DSN_HERE',
  environment: process.env.NODE_ENV
});

// Error handler global untuk Vue
Vue.config.errorHandler = (error, vm, info) => {
  LogRaven.captureException(error, {
    extraContext: {
      vueInfo: info,
      componentName: vm.$options.name || 'AnonymousComponent'
    }
  });
};
```

## Troubleshooting

Jika Anda menghadapi masalah:

1. Pastikan DSN yang digunakan benar
2. Periksa koneksi ke server LogRaven
3. Lihat apakah ada CORS issue jika digunakan di browser
4. Cek firewall/network rules yang mungkin memblokir koneksi

## Referensi

Untuk informasi lebih lanjut, kunjungi [dokumentasi resmi LogRaven](https://lograven.docs.example.com) atau lihat [contoh integrasi](https://github.com/lograven/examples). 

## Fitur Source Maps

LogRaven SDK mendukung source maps untuk membantu Anda melacak error di kode asli, bukan kode yang telah di-minify atau di-bundle.

### Mengaktifkan Source Maps

Untuk mengaktifkan fitur source maps, tambahkan opsi `useSourceMaps: true` saat menginisialisasi SDK:

```javascript
import { init } from '@lograven/sdk';

init({
  dsn: 'YOUR_DSN',
  environment: 'production',
  release: '1.0.0',
  sdk: {
    useSourceMaps: true
  }
});
```

### Mengupload Source Maps

Anda bisa mengupload source maps ke server LogRaven agar error yang dilaporkan bisa diterjemahkan ke lokasi kode asli:

```javascript
import { uploadSourceMap } from '@lograven/sdk';

await uploadSourceMap({
  dsn: 'YOUR_DSN',
  release: '1.0.0',
  sourceMap: sourceMapContent, // String atau objek JSON
  sourceFile: 'app.js',        // Nama file JavaScript yang dikompresi
  minifiedFile: 'app.min.js'   // Opsional, nama file minified jika berbeda dengan sourceFile
});
```

### Transformasi Stack Trace Manual

Jika Anda memerlukan transformasi stack trace secara manual, Anda bisa menggunakan fungsi `transformStackTrace`:

```javascript
import { transformStackTrace } from '@lograven/sdk';

const originalStackTrace = error.stack;
const transformedStackTrace = await transformStackTrace(originalStackTrace);
console.log(transformedStackTrace);
```

### Cara Kerja Integrasi Source Maps

Ketika opsi `useSourceMaps` diaktifkan, SDK akan secara otomatis:
1. Mentransformasi stack trace error yang ditangkap sebelum mengirimkannya ke server
2. Mencari source maps yang sesuai untuk file JavaScript yang terlibat dalam error
3. Menggunakan source map untuk memetakan lokasi error ke file sumber asli

Integrasi source maps juga bekerja untuk:
- Error XHR dan fetch
- Error yang ditangkap melalui window.onerror
- Error yang dilaporkan melalui console.error 