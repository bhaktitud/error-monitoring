# LogRaven SDK

SDK untuk integrasi dengan LogRaven Error Monitoring Platform.

## Instalasi

```bash
npm install @lograven/sdk
```

## Penggunaan Dasar

### Express (Node.js)

```ts
import express from 'express';
import { init, logRavenRequestTracker, logRavenErrorHandler } from '@lograven/sdk';

init({ dsn: 'your-dsn' });

const app = express();

app.use(logRavenRequestTracker());

app.get('/error', () => {
  throw new Error('Oops!');
});

app.use(logRavenErrorHandler());
```

### NestJS

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { init, LogRavenInterceptor, LogRavenExceptionFilter } from '@lograven/sdk';

async function bootstrap() {
  init({ dsn: 'your-dsn' });
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new LogRavenInterceptor());
  app.useGlobalFilters(new LogRavenExceptionFilter());

  await app.listen(3000);
}
bootstrap();
```

### Next.js API Route

```ts
// pages/api/example.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { withLogRaven } from '@lograven/sdk';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  throw new Error('Contoh error');
}

export default withLogRaven(handler);
```

## API Utama

### Inisialisasi SDK
```ts
init({
  dsn: 'your-dsn',
  environment: 'production',
  release: '1.0.0'
});
```

### Tangkap Error
```ts
try {
  throw new Error('Something went wrong');
} catch (err) {
  captureException(err);
}
```

### Konteks Tambahan
```ts
setUser({ id: 'user123', email: 'user@example.com' });
setTags({ feature: 'checkout' });
addBreadcrumb('ui', 'Clicked submit');
```



---

Untuk dokumentasi lengkap (React, React Native, Vue, Browser, konfigurasi lanjut), silakan lihat [dokumentasi resmi](https://lograven.docs.example.com).
