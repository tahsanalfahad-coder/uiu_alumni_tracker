import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import alumniRoutes from './routes/alumni.js';
import jobRoutes from './routes/jobs.js';
import eventRoutes from './routes/events.js';
import mentorshipRoutes from './routes/mentorship.js';
import chatRoutes from './routes/chat.js';
import studentRoutes from './routes/student.js';
import donationRoutes from './routes/donations.js';
import adminRoutes from './routes/admin.js';
import { errorHandler } from './middleware/errorHandler.js';
import { securityHeaders } from './middleware/security.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { corsOriginCheck } from './config/cors.js';

dotenv.config();

const app = express();

app.disable('x-powered-by');
// Behind Render/Vercel/any reverse proxy, req.ip must come from X-Forwarded-For.
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
} else if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(securityHeaders);
app.use(cors({ origin: corsOriginCheck, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'UIU Alumni Portal Backend API', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: { message: `Cannot ${req.method} ${req.originalUrl}`, code: 'NOT_FOUND' }
  });
});

// Central Error Handler
app.use(errorHandler);

export default app;
