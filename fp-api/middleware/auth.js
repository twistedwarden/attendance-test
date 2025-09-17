import { body, validationResult } from 'express-validator';

// ESP32 API Key validation middleware
export const validateESP32APIKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  const expectedKey = process.env.ESP32_API_KEY;

  if (!expectedKey) {
    return res.status(500).json({
      success: false,
      message: 'ESP32 API key not configured on server'
    });
  }

  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing ESP32 API key'
    });
  }

  next();
};

// Device ID validation middleware
export const validateDeviceId = (req, res, next) => {
  const deviceId = req.headers['x-device-id'] || req.body.deviceId;

  if (!deviceId) {
    return res.status(400).json({
      success: false,
      message: 'Device ID is required'
    });
  }

  // Basic device ID format validation (alphanumeric, 3-50 chars)
  if (!/^[a-zA-Z0-9_-]{3,50}$/.test(deviceId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid device ID format'
    });
  }

  req.deviceId = deviceId;
  next();
};

// Fingerprint template validation
export const validateFingerprintTemplate = [
  body('fingerprintTemplate')
    .notEmpty()
    .withMessage('Fingerprint template is required')
    .isLength({ min: 1, max: parseInt(process.env.FP_TEMPLATE_SIZE_LIMIT) || 1024 })
    .withMessage(`Fingerprint template must be between 1 and ${process.env.FP_TEMPLATE_SIZE_LIMIT || 1024} bytes`),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Student ID validation
export const validateStudentId = [
  body('studentId')
    .isInt({ min: 1 })
    .withMessage('Valid student ID is required'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Request logging middleware
export const logESP32Request = (req, res, next) => {
  const deviceIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  req.deviceIP = deviceIP;
  
  console.log(`ESP32 Request: ${req.method} ${req.path} from ${deviceIP} (Device: ${req.deviceId || 'unknown'})`);
  next();
};

