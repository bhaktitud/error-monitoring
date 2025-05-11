# LogRaven SDK

SDK untuk mengirim error ke LogRaven dari berbagai platform.

## Instalasi

```bash
npm install @lograven/sdk
# atau
yarn add @lograven/sdk
```

## Penggunaan

### Node.js (Backend)

```javascript
import { LogRaven } from '@lograven/sdk';

const logRaven = new LogRaven({
  apiKey: 'YOUR_API_KEY',
  projectId: 'YOUR_PROJECT_ID'
});

// Mengirim error
logRaven.captureError(new Error('Something went wrong'));
```

### Next.js

```javascript
// pages/_app.js atau app/layout.js
import { LogRaven } from '@lograven/sdk';

const logRaven = new LogRaven({
  apiKey: process.env.NEXT_PUBLIC_LOGRaven_API_KEY,
  projectId: process.env.NEXT_PUBLIC_LOGRaven_PROJECT_ID
});

// Tambahkan ke window untuk akses global
if (typeof window !== 'undefined') {
  window.LogRaven = logRaven;
}
```

### Vue.js

```javascript
// main.js
import { createApp } from 'vue';
import { LogRaven } from '@lograven/sdk';
import App from './App.vue';

const app = createApp(App);

const logRaven = new LogRaven({
  apiKey: import.meta.env.VITE_LOGRaven_API_KEY,
  projectId: import.meta.env.VITE_LOGRaven_PROJECT_ID
});

// Tambahkan ke global properties
app.config.globalProperties.$logRaven = logRaven;

app.mount('#app');
```

### React

```javascript
// App.jsx
import { LogRaven } from '@lograven/sdk';

const logRaven = new LogRaven({
  apiKey: process.env.REACT_APP_LOGRaven_API_KEY,
  projectId: process.env.REACT_APP_LOGRaven_PROJECT_ID
});

// Gunakan dalam komponen
function App() {
  const handleError = () => {
    try {
      // kode yang mungkin error
    } catch (error) {
      logRaven.captureError(error);
    }
  };

  return <button onClick={handleError}>Test Error</button>;
}
```

## Konfigurasi

```javascript
const logRaven = new LogRaven({
  apiKey: 'YOUR_API_KEY',
  projectId: 'YOUR_PROJECT_ID',
  environment: 'production', // opsional
  release: '1.0.0', // opsional
  // konfigurasi tambahan
});
```

## API

### captureError(error: Error, context?: object)

Mengirim error ke LogRaven dengan konteks tambahan opsional.

### captureMessage(message: string, level?: 'info' | 'warning' | 'error')

Mengirim pesan ke LogRaven dengan level yang ditentukan.

## Lisensi

MIT 