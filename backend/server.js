import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import parentRoutes from './routes/parent.js';
import teacherRoutes from './routes/teacher.js';
import registrarRoutes from './routes/registrar.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security middleware (allow embedding by frontend for document preview)
const allowedFrameAncestor = process.env.CORS_ORIGIN || 'http://localhost:5173';
const defaultDirectives = helmet.contentSecurityPolicy?.getDefaultDirectives
  ? helmet.contentSecurityPolicy.getDefaultDirectives()
  : { "default-src": ["'self'"] };
defaultDirectives["frame-ancestors"] = ["'self'", allowedFrameAncestor];

app.use(helmet({
  contentSecurityPolicy: { directives: defaultDirectives },
  frameguard: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Behind reverse proxies (e.g., Render), trust the first proxy so
// express-rate-limit can correctly read X-Forwarded-* headers.
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/registrar', registrarRoutes);
// Load fingerprint API routes dynamically so deployment doesn't fail
// when the sibling `fp-api` package is not installed in this environment.
try {
  const fpModule = await import('../fp-api/routes/fingerprint.js');
  const fingerprintRoutes = fpModule.default || fpModule;
  app.use('/api/fingerprint', fingerprintRoutes);
  console.log('Fingerprint API routes loaded');
} catch (err) {
  console.warn('Fingerprint API not available. Continuing without it. Reason:', err?.message || err);
}

// Serve React build (dist) in production when available
if ((process.env.NODE_ENV || 'development') === 'production') {
  const clientDist = path.join(__dirname, '../dist');
  const indexHtml = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexHtml)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res) => {
      res.sendFile(indexHtml);
    });
    console.log('Serving static frontend from', clientDist);
  } else {
    console.warn('Static frontend not found at', indexHtml, '- continuing without serving client');
  }
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.errors
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
}); 