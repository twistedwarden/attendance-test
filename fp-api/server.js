import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import fingerprintRoutes from './routes/fingerprint.js';
import { getFingerprintLogs } from './config/database.js';

// Load environment variables
dotenv.config();

// Debug: Check if environment variables are loaded
console.log('🔍 Environment Debug:');
console.log('ESP32_API_KEY:', process.env.ESP32_API_KEY ? 'SET' : 'NOT SET');
console.log('PORT:', process.env.PORT || 'DEFAULT (5001)');
console.log('NODE_ENV:', process.env.NODE_ENV || 'DEFAULT');

// Temporary fix: Set API key if not loaded from .env
if (!process.env.ESP32_API_KEY) {
  process.env.ESP32_API_KEY = '765a6c3504ca79e2cdbd9197fbe9f99d';
  console.log('⚠️  Using hardcoded API key for testing');
}

const app = express();
const PORT = process.env.PORT || 5001;

// Security middleware
app.use(helmet());

// CORS configuration - more permissive for ESP32 devices
app.use(cors({
  origin: true, // Allow all origins for ESP32 devices
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Device-ID']
}));

// Rate limiting - more generous for ESP32 devices
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Higher limit for ESP32
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware - support larger payloads for fingerprint data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Health check endpoint (public)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Fingerprint API Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API routes
app.use('/api/fingerprint', fingerprintRoutes);

// Admin endpoints (for debugging and monitoring)
app.get('/api/admin/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const logs = await getFingerprintLogs(limit, offset);
    
    res.json({
      success: true,
      logs,
      pagination: {
        limit,
        offset,
        total: logs.length
      }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs',
      error: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    availableEndpoints: [
      'GET /health',
      'GET /api/fingerprint/health',
      'POST /api/fingerprint/device/register',
      'POST /api/fingerprint/device/status',
      'GET /api/fingerprint/devices',
      'POST /api/fingerprint/enroll',
      'POST /api/fingerprint/verify',
      'DELETE /api/fingerprint/delete',
      'POST /api/fingerprint/lookup',
      'GET /api/admin/logs'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.errors
    });
  }

  // Handle database errors
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry error'
    });
  }

  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record not found'
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
  console.log(`🔐 Fingerprint API Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 API Key configured: ${process.env.ESP32_API_KEY ? 'Yes' : 'No'}`);
  console.log(`📊 Rate limit: ${process.env.RATE_LIMIT_MAX_REQUESTS || 1000} requests per ${(process.env.RATE_LIMIT_WINDOW_MS || 900000) / 1000 / 60} minutes`);
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

