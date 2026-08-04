import mongoose from 'mongoose';
import logger from '../utils/logger';
import { MongoMemoryServer } from 'mongodb-memory-server';

export const connectDatabase = async () => {
  let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/herbchain';
  
  try {
    logger.info(`Attempting database connection to ${mongoUri}...`);
    // Connect with a short timeout so it doesn't hang forever if MongoDB is offline
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    logger.info(`MongoDB connected successfully to ${mongoUri}`);
  } catch (localError) {
    logger.warn(`Local MongoDB not available: ${(localError as Error).message}. Attempting MongoMemoryServer fallback...`);
    try {
      const mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
      await mongoose.connect(mongoUri);
      logger.info(`MongoDB connected successfully to in-memory server at ${mongoUri}`);
    } catch (memError) {
      logger.error(`Failed to start MongoMemoryServer: ${(memError as Error).message}.`);
      logger.warn('Backend server will continue starting, but database queries may fail or remain pending.');
    }
  }
};
