import express from 'express';
import { 
  enrollFingerprint, 
  verifyFingerprint, 
  deleteFingerprint, 
  getStudentByFingerprint,
  registerESP32Device,
  updateESP32DeviceStatus,
  getESP32Devices
} from '../config/database.js';
import { 
  validateESP32APIKey, 
  validateDeviceId, 
  validateFingerprintTemplate, 
  validateStudentId,
  logESP32Request 
} from '../middleware/auth.js';

const router = express.Router();

// Apply middleware to all routes
router.use(validateESP32APIKey);
router.use(validateDeviceId);
router.use(logESP32Request);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Fingerprint API is running',
    timestamp: new Date().toISOString(),
    deviceId: req.deviceId
  });
});

// Register ESP32 device
router.post('/device/register', async (req, res) => {
  try {
    const { deviceName, location } = req.body;
    
    if (!deviceName) {
      return res.status(400).json({
        success: false,
        message: 'Device name is required'
      });
    }

    await registerESP32Device(req.deviceId, deviceName, location || 'Unknown');
    
    res.json({
      success: true,
      message: 'Device registered successfully',
      deviceId: req.deviceId
    });
  } catch (error) {
    console.error('Device registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register device',
      error: error.message
    });
  }
});

// Update device status
router.post('/device/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['active', 'inactive', 'maintenance'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (active, inactive, maintenance)'
      });
    }

    const updated = await updateESP32DeviceStatus(req.deviceId, status);
    
    if (updated) {
      res.json({
        success: true,
        message: 'Device status updated successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
  } catch (error) {
    console.error('Device status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update device status',
      error: error.message
    });
  }
});

// Get device list (for admin purposes)
router.get('/devices', async (req, res) => {
  try {
    const devices = await getESP32Devices();
    res.json({
      success: true,
      devices
    });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch devices',
      error: error.message
    });
  }
});

// Enroll fingerprint
router.post('/enroll', validateFingerprintTemplate, validateStudentId, async (req, res) => {
  try {
    const { fingerprintTemplate, studentId } = req.body;
    
    // Convert base64 to buffer if needed
    let templateBuffer;
    if (typeof fingerprintTemplate === 'string') {
      templateBuffer = Buffer.from(fingerprintTemplate, 'base64');
    } else {
      templateBuffer = fingerprintTemplate;
    }

    const result = await enrollFingerprint(
      studentId, 
      templateBuffer, 
      req.deviceId, 
      req.deviceIP
    );
    
    res.json({
      success: true,
      message: 'Fingerprint enrolled successfully',
      studentId
    });
  } catch (error) {
    console.error('Fingerprint enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll fingerprint',
      error: error.message
    });
  }
});

// Verify fingerprint
router.post('/verify', validateFingerprintTemplate, async (req, res) => {
  try {
    const { fingerprintTemplate } = req.body;
    
    // Convert base64 to buffer if needed
    let templateBuffer;
    if (typeof fingerprintTemplate === 'string') {
      templateBuffer = Buffer.from(fingerprintTemplate, 'base64');
    } else {
      templateBuffer = fingerprintTemplate;
    }

    const result = await verifyFingerprint(
      templateBuffer, 
      req.deviceId, 
      req.deviceIP
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Fingerprint verified successfully',
        student: result.student
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Fingerprint not found',
        student: null
      });
    }
  } catch (error) {
    console.error('Fingerprint verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify fingerprint',
      error: error.message
    });
  }
});

// Delete fingerprint
router.delete('/delete', validateStudentId, async (req, res) => {
  try {
    const { studentId } = req.body;
    
    const result = await deleteFingerprint(
      studentId, 
      req.deviceId, 
      req.deviceIP
    );
    
    res.json({
      success: true,
      message: 'Fingerprint deleted successfully',
      studentId
    });
  } catch (error) {
    console.error('Fingerprint deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete fingerprint',
      error: error.message
    });
  }
});

// Get student by fingerprint (for debugging)
router.post('/lookup', validateFingerprintTemplate, async (req, res) => {
  try {
    const { fingerprintTemplate } = req.body;
    
    // Convert base64 to buffer if needed
    let templateBuffer;
    if (typeof fingerprintTemplate === 'string') {
      templateBuffer = Buffer.from(fingerprintTemplate, 'base64');
    } else {
      templateBuffer = fingerprintTemplate;
    }

    const student = await getStudentByFingerprint(templateBuffer);
    
    if (student) {
      res.json({
        success: true,
        student: {
          studentId: student.StudentID,
          fullName: student.FullName,
          gradeLevel: student.GradeLevel
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No student found with this fingerprint',
        student: null
      });
    }
  } catch (error) {
    console.error('Fingerprint lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to lookup fingerprint',
      error: error.message
    });
  }
});

export default router;

