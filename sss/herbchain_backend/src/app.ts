import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import collectionRoutes from './routes/collectionRoutes';
import batchRoutes from './routes/batchRoutes';
import processingRoutes from './routes/processingRoutes';
import manufacturingRoutes from './routes/manufacturingRoutes';
import shipmentRoutes from './routes/shipmentRoutes';
import publicRoutes from './routes/publicRoutes';
import governmentRoutes from './routes/governmentRoutes';
import { setupSwagger } from './swagger/swagger';

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Parse JSON
app.use(express.json());

// Logging
app.use(morgan('combined'));

// Routes Placeholder
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'HerbChain AI Backend is running' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/collection', collectionRoutes);
app.use('/api/v1/batch', batchRoutes);
app.use('/api/v1/processing', processingRoutes);
app.use('/api/v1/manufacturing', manufacturingRoutes);
app.use('/api/v1/shipment', shipmentRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/government', governmentRoutes);

setupSwagger(app);

// Global Error Handler
app.use(errorHandler);

export default app;
