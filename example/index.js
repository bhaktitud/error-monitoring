import express from 'express';
import dotenv from 'dotenv';
import { init, captureException } from '@bhaktixdev/error-monitor-sdk';

dotenv.config();

init({
  dsn: process.env.ERROR_MONITOR_DSN,
  apiUrl: process.env.ERROR_MONITOR_API_URL
});

const app = express();
const PORT = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.send('Example Express backend running!');
});

app.get('/error', async (req, res) => {
  try {
    throw new Error('Contoh error dari endpoint /error');
  } catch (err) {
    await captureException(err, { userAgent: req.headers['user-agent'] });
    res.status(500).send('Error sudah dikirim ke monitoring!');
  }
});

app.get('/not-found', async (req, res) => {
    try {
      throw new Error('Contoh error dari endpoint /not-found');
    } catch (err) {
      await captureException(err, { userAgent: req.headers['user-agent'] });
      res.status(404).send('Error sudah dikirim ke monitoring!');
    }
  });

app.listen(PORT, () => {
  console.log(`Example backend running on port ${PORT}`);
}); 