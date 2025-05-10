import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth';
import projectRoutes from './routes/project';
import eventRoutes from './routes/event';
import groupRoutes from './routes/group';
import webhookRoutes from './routes/webhook';
import statsRoutes from './routes/stats';
import notificationRoutes from './routes/notification';
import planRoutes from './routes/plan';

// Import routes (akan dibuat nanti)
// import authRoutes from './routes/auth';
// import projectRoutes from './routes/project';
// import eventRoutes from './routes/event';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors())

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', groupRoutes);
app.use('/api', webhookRoutes);
app.use('/api', statsRoutes);
app.use('/api', notificationRoutes);
app.use('/api/plans', planRoutes);

app.get('/', (req, res) => {
  res.send('Sentry Clone API running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 