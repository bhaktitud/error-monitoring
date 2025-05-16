import Fastify from 'fastify';
// Import LogRaven SDK dengan ES modules
import * as LogRavenSDK from '@lograven/sdk';
const { init, logRavenFastifyPlugin, logRavenFastifyErrorHandler } = LogRavenSDK;

// Inisialisasi SDK LogRaven
init({
  dsn: '6369f64f-261b-4b3e-bd7c-309127deaf3a', 
  environment: 'development',
  release: '1.0.0',
  apiUrl: "http://localhost:3000"
});

// Buat instance Fastify
const app = Fastify({
  logger: true
});

// Daftarkan plugin LogRaven
app.register(logRavenFastifyPlugin);

// Definisikan endpoint untuk contoh
app.get('/', async (request, reply) => {
  return { hello: 'world' };
});

// Endpoint yang menghasilkan error
app.get('/error', async (request, reply) => {
  throw new Error('Contoh error di Fastify');
});

// Endpoint dengan error handler kustom
app.get('/custom-error', {
  handler: async (request, reply) => {
    throw new Error('Contoh error dengan handler kustom');
  },
  errorHandler: logRavenFastifyErrorHandler
});

// Jalankan server
const start = async () => {
  try {
    await app.listen({ port: 5555 });
    console.log('Server berjalan di http://localhost:5555');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start(); 