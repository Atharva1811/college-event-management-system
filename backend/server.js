import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Load environment variables
dotenv.config();

import connectDB, { isConnected, getDbStatus } from './config/db.js';
import { validateEmailEnv, getEmailConfigStatus } from './services/emailService.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Initialize DB connection
connectDB();

// Validate server-side email & Brevo environment configuration at startup
validateEmailEnv();

// Security and utility middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));

// Production-safe CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'https://atharva1811.github.io',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server health checks)
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.endsWith('.github.io') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.endsWith('.onrender.com') ||
        process.env.NODE_ENV !== 'production';

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy: Origin not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
  const dbStatus = getDbStatus();
  const emailStatus = getEmailConfigStatus();
  res.status(200).json({
    success: true,
    message: 'CEMS API is running',
    data: {
      status: 'healthy',
      system: 'College Event Management System (CEMS) API',
      database: dbStatus.isConnected ? 'Connected' : 'Disconnected',
      databaseDetails: {
        configured: dbStatus.isConfigured,
        readyState: dbStatus.readyState,
        error: dbStatus.error,
      },
      emailService: {
        provider: 'Brevo',
        configured: emailStatus.isConfigured,
        senderConfigured: emailStatus.hasSenderEmail,
        senderEmail: emailStatus.senderEmail || 'no-reply@cems.edu (default)',
        frontendUrlConfigured: emailStatus.hasFrontendUrl,
      },
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
app.use('/api/notifications', notificationRoutes);
app.use('/api/locations', locationRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 [CEMS Server] running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`🔗 [CEMS Health] http://localhost:${PORT}/api/health\n`);
});

export default app;
