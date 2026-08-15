import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import logger from './utils/logger';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  // Deliberately dynamic: a static `import app from './app'` at the top of
  // this file gets hoisted (and its whole module graph — app.ts, routes,
  // controllers, services, GeminiService's constructor — evaluated) BEFORE
  // dotenv.config() above ever runs, so anything reading process.env at
  // construction time (e.g. GeminiService's API key) silently sees nothing.
  // Dynamic import() is a normal expression, not hoisted, so it only runs
  // here — after dotenv.config() has already populated process.env.
  const { default: app } = await import('./app');
  const { connectDatabase } = await import('./config/database');

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
