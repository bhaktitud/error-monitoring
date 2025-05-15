import Fastify from 'fastify';
import { init, logRavenFastifyPlugin, logRavenFastifyErrorHandler } from '../../src';

// Inisialisasi SDK LogRaven
init({
  dsn: 'YOUR_DSN_HERE', 
  environment: 'development',
  release: '1.0.0'
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
    await app.listen({ port: 3000 });
    console.log('Server berjalan di http://localhost:3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start(); 