import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import { connectDatabase } from './config/database';
import logger from './utils/logger';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDatabase();

  const server = http.createServer(app);
  
  // Socket.IO Setup
  const io = new Server(server, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    logger.info(`New WebSocket connection: ${socket.id}`);
    
    socket.on('disconnect', () => {
      logger.info(`WebSocket disconnected: ${socket.id}`);
    });
  });

  // Attach io to global context if needed for services
  (global as any).io = io;

  server.listen(PORT, () => {
    logger.info(`HerbChain AI Server running on port ${PORT}`);
  });
};

startServer();
