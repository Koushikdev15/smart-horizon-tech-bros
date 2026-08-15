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
import healthProfileRoutes from './routes/healthProfileRoutes';
import doctorRoutes from './routes/doctorRoutes';
import adminDoctorRoutes from './routes/adminDoctorRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import doctorGuidanceRoutes from './routes/doctorGuidanceRoutes';
import adminDoctorGuidanceRoutes from './routes/adminDoctorGuidanceRoutes';
import productRoutes from './routes/productRoutes';
import chatRoutes from './routes/chatRoutes';
import storeRoutes from './routes/storeRoutes';
import complaintRoutes from './routes/complaintRoutes';
import adminComplaintRoutes from './routes/adminComplaintRoutes';
import adminDashboardRoutes from './routes/adminDashboardRoutes';
import orderRoutes from './routes/orderRoutes';
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

// Auth endpoints are a credential-guessing target, so they get a tighter,
// dedicated limit on top of the global one.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Parse JSON
app.use(express.json());

// Logging
app.use(morgan('combined'));

// Routes Placeholder
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'HerbChain AI Backend is running' });
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/collection', collectionRoutes);
app.use('/api/v1/batch', batchRoutes);
app.use('/api/v1/processing', processingRoutes);
app.use('/api/v1/manufacturing', manufacturingRoutes);
app.use('/api/v1/shipment', shipmentRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/government', governmentRoutes);
app.use('/api/v1/health-profile', healthProfileRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/admin/doctors', adminDoctorRoutes);
app.use('/api/v1/admin/audit-logs', auditLogRoutes);
app.use('/api/v1/doctor-guidance', doctorGuidanceRoutes);
app.use('/api/v1/admin/doctor-guidance', adminDoctorGuidanceRoutes);
app.use('/api/v1/products', productRoutes);

// Chat hits an external LLM per message — a tighter limit than the general
// API guards against runaway cost, independent of the auth-specific limiter.
const chatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/v1/chat', chatLimiter, chatRoutes);
app.use('/api/v1/stores', storeRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/admin/complaints', adminComplaintRoutes);
app.use('/api/v1/admin/dashboard', adminDashboardRoutes);
app.use('/api/v1/orders', orderRoutes);

setupSwagger(app);

// Global Error Handler
app.use(errorHandler);

export default app;
