import { createApp } from 'vue';
import { init, installVue3 } from '../../src';

// Komponen App sederhana
const App = {
  template: `
    <div>
      <h1>Contoh LogRaven dengan Vue 3</h1>
      <button @click="triggerError">Klik untuk Trigger Error</button>
    </div>
  `,
  methods: {
    triggerError() {
      // Ini akan memicu error yang akan ditangkap oleh LogRaven
      throw new Error('Error yang disengaja dari komponen Vue');
    }
  }
};

// Inisialisasi LogRaven SDK
init({
  dsn: 'YOUR_DSN_HERE',
  environment: 'development',
  release: '1.0.0'
});

// Buat app Vue
const app = createApp(App);

// Pasang LogRaven ke Vue
installVue3(app);

// Mount app
app.mount('#app'); 