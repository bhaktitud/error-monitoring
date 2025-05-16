import { createApp } from 'vue';
import App from './App.vue';
import LogRavenPlugin from './lograven-plugin';

// Buat app Vue
const app = createApp(App);

// Gunakan LogRaven Plugin
app.use(LogRavenPlugin, {
  // Opsi tambahan jika diperlukan
  release: '1.0.1',
});

// Mount app
app.mount('#app'); 