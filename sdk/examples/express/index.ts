import express from 'express';
import { logRavenRequestTracker, logRavenErrorHandler } from '../../src/adapters/express';
import { init } from '../../src/core/init';

init({
  dsn: 'your-dsn-here',
  environment: 'development',
  release: 'example-0.1.0',
  apiUrl: 'http://localhost:3000',
});

const app = express();
app.use(express.json());
app.use(logRavenRequestTracker());

app.get('/', (_req, res) => {
  res.send('LogRaven Express Example');
});

app.get('/error', (_req, _res) => {
  throw new Error('Contoh error di Express');
});

app.use(logRavenErrorHandler());

app.listen(3000, () => {
  console.log('Listening on http://localhost:3000');
});
