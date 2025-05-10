# Error Reporting SDK

Dokumentasi penggunaan SDK Error Reporting di aplikasi frontend-revamp.

## Pendahuluan

SDK Error Reporting memungkinkan aplikasi melaporkan error dan aktivitas pengguna ke server monitoring secara otomatis. SDK ini dirancang untuk:

1. Melaporkan error secara otomatis dengan detail kontekstual
2. Menyimpan breadcrumbs untuk melacak aktivitas pengguna sebelum error
3. Mencatat log pesan dengan tingkat keparahan berbeda
4. Berintegrasi dengan framework seperti Next.js dan Express.js

## Setup

SDK sudah terintegrasi di aplikasi melalui file `/src/lib/error-reporting.ts`. Hanya perlu memastikan variabel lingkungan yang tepat diatur di file `.env`:

```env
NEXT_PUBLIC_ERROR_REPORTING_DSN=project-dsn
NEXT_PUBLIC_ERROR_REPORTING_API=https://error-api.example.com
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## Cara Penggunaan

### Import yang Diperlukan

```typescript
import { 
  reportError, 
  logMessage, 
  trackUserAction, 
  useErrorReporting, 
  setUserContext 
} from '@/lib/error-reporting';
```

### Melaporkan Error

#### Di Handler Try-Catch

```typescript
try {
  // Kode yang mungkin menghasilkan error
} catch (error) {
  if (error instanceof Error) {
    reportError(error, {
      // Konteks tambahan
      component: 'ComponentName',
      action: 'actionName',
      // Data tambahan berguna untuk debugging
      customData: { ... }
    });
    
    // Tampilkan pesan error ke pengguna
    showErrorToast('Terjadi kesalahan');
  }
}
```

#### Penggunaan React Hook

```typescript
// Di functional component
const { reportError, logMessage, trackUserAction } = useErrorReporting();

// Kemudian gunakan dalam handler atau efek
const handleSubmit = async (data) => {
  try {
    // ... logika submit
  } catch (error) {
    if (error instanceof Error) {
      reportError(error, { context: 'form-submission' });
      // Handle UI feedback
    }
  }
};
```

### Melacak Aktivitas Pengguna (Breadcrumbs)

Breadcrumbs membantu melacak tindakan yang dilakukan pengguna sebelum error terjadi:

```typescript
// Melacak aksi navigasi
trackUserAction('page_viewed', { page: 'dashboard' });

// Melacak interaksi pengguna
trackUserAction('button_clicked', { buttonId: 'save', section: 'settings' });

// Melacak perubahan data
trackUserAction('settings_changed', { 
  setting: 'notifications', 
  oldValue: false, 
  newValue: true 
});
```

### Mencatat Pesan (Logging)

Untuk mencatat pesan tanpa error:

```typescript
// Info log
logMessage('User logged in successfully', 'info', { userId: '123' });

// Warning log
logMessage('API request slow', 'warning', { endpoint: '/users', duration: 3500 });

// Error log
logMessage('Failed to load data', 'error', { source: 'UserProfile' });
```

### User Context

Set informasi pengguna saat login:

```typescript
// Di komponen login atau autentikasi
function onLoginSuccess(user) {
  setUserContext({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });
  
  // Lanjutkan dengan navigasi atau logika lain
}
```

## Penggunaan di Middleware (Next.js)

### App Router Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import ErrorReporting from '@/lib/error-reporting';

export async function middleware(request) {
  try {
    // Middleware logic
    // ...
    
    return NextResponse.next();
  } catch (error) {
    // Report error dengan konteks
    ErrorReporting.captureException(error, {
      url: request.url,
      path: request.nextUrl.pathname,
    });
    
    // Tetap lanjutkan request agar tidak memblokir pengguna
    return NextResponse.next();
  }
}
```

### Next.js API Routes

Untuk Pages Router API routes:

```typescript
// pages/api/example.js
import ErrorReporting from '@/lib/error-reporting';

export default ErrorReporting.nextApiMiddleware(async (req, res) => {
  // Handler API - error akan ditangkap secara otomatis
  const data = await fetchSomeData();
  return res.status(200).json({ data });
});
```

Untuk App Router Route Handlers:

```typescript
// app/api/example/route.ts
import { NextResponse } from 'next/server';
import { withErrorReporting } from '@/lib/error-reporting';

export const GET = withErrorReporting(
  async (request) => {
    // Handler logic
    return NextResponse.json({ message: 'Success' });
  }
);
```

## Praktik Terbaik

1. **Selalu berikan konteks**: Tambahkan detail component, action, dan data relevan saat melaporkan error
2. **Gunakan breadcrumbs**: Tambahkan breadcrumb di titik-titik penting untuk membantu debugging
3. **Sanitasi data sensitif**: Jangan kirim password, token, atau informasi sensitif lainnya
4. **Set user context**: Selalu set user context setelah login untuk mengidentifikasi pengguna terkait error
5. **Log pesan informatif**: Gunakan logMessage untuk mencatat peristiwa penting dalam aplikasi

## Contoh Implementasi

Lihat contoh implementasi lengkap di:
- `/src/app/settings/page.tsx` - Contoh penggunaan di halaman settings
- `/src/lib/error-reporting.ts` - Implementasi wrapper SDK

## FAQ

### Q: Kapan harus menggunakan reportError vs logMessage?
A: Gunakan `reportError` untuk error asli yang memengaruhi fungsionalitas aplikasi. Gunakan `logMessage` untuk mencatat peristiwa atau informasi yang tidak mengganggu pengalaman pengguna.

### Q: Bagaimana cara melihat hasil error reporting?
A: Error dan log dapat dilihat di dashboard Error Reporting di [https://errors.example.com](https://errors.example.com) (Gunakan kredensial admin).

### Q: Bagaimana jika saya ingin menonaktifkan error reporting di development?
A: Anda dapat menset `NEXT_PUBLIC_ERROR_REPORTING_DSN=null` di file `.env.development`. 