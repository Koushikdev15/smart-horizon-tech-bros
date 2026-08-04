import mongoose from 'mongoose';
import logger from '../utils/logger';
import { MongoMemoryServer } from 'mongodb-memory-server';

export const connectDatabase = async () => {
  try {
    let mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/herbchain';
    
    // Fallback to in-memory DB since Docker is failing
    const mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();
    
    await mongoose.connect(mongoUri);
    logger.info(`MongoDB connected successfully to in-memory server at ${mongoUri}`);
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};
