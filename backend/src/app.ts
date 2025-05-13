import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { setupExpress } from './config/express';
import { setupSocketIO } from './config/socket';
import { setupRoutes } from './config/routes';

// Buat Express app terlebih dahulu
const app = setupExpress();

// Buat HTTP server dengan app Express
const httpServer = createServer(app);

// Setup Socket.IO dengan HTTP server
const io = setupSocketIO(httpServer);

// Set io ke app setelah Socket.IO diinisialisasi
app.set('io', io);

// Setup Routes
setupRoutes(app, io);

// Jalankan server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
}); 