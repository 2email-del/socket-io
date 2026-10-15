import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { initSocket } from './socket/index.js';

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL 

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

app.use(notFound);
app.use(errorHandler);

const io = new Server(server, {
  cors: { origin: CLIENT_URL },
});
initSocket(io);

const start = async () => {
  if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
    console.error('JWT_SECRET and MONGO_URI must be set in server/.env');
    process.exit(1);
  }

  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
