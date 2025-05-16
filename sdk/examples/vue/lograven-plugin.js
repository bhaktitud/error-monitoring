// LogRaven plugin untuk Vue 3
import { init, installVue3, captureException } from '../../src';

export default {
  install: (app, options = {}) => {
    // Inisialisasi LogRaven dengan opsi default atau yang diberikan
    const config = {
      dsn: '6369f64f-261b-4b3e-bd7c-309127deaf3a',
      environment: 'development',
      release: '1.0.0',
      apiUrl: 'http://localhost:3000',
      ...options
    };
    
    // Inisialisasi SDK
    init(config);
    
    // Pasang error handler
    installVue3(app);
    
    // Tambahkan metode global untuk akses di komponen
    app.config.globalProperties.$logRaven = {
      captureException
    };
    
    // Tambahkan plugin ke window untuk troubleshooting
    if (typeof window !== 'undefined') {
      window.$logRaven = { captureException };
    }
    
    console.log('[LogRaven] Plugin Vue berhasil diinisialisasi');
  }
}; 