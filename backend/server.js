import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Load environment variables
dotenv.config();

import connectDB, { isConnected } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Initialize DB connection
connectDB();

// Security and utility middlewares
app.use(helmet());
// Production-safe CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server health checks)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy: Origin not allowed'));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Root endpoint for simple API status check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'College Event Management System (CEMS) API is operational',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Production-verified Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CEMS API is running',
    data: {
      status: 'healthy',
      system: 'College Event Management System (CEMS) API',
      database: isConnected() ? 'Connected' : 'Disconnected (Mock Mode Active)',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/registrations', attendanceRoutes);
app.use('/api/registrations', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 [CEMS Server] running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`🔗 [CEMS Health] http://localhost:${PORT}/api/health\n`);
});

export default app;
