import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  findUserByEmail, 
  createUser, 
  updateUser,
  findUserById,
  setUserOtp,
  consumeUserOtp,
  createStudent,
  createParentProfile,
  storeOtp,
  verifyOtp,
  clearOtp,
  storeEnrollmentDocuments,
  createParentUserAndProfile,
  pool
} from '../config/database.js';
import { authenticateToken, requireAdmin, requireRole } from '../middleware/auth.js';
import { validateLogin, validateUserCreation, validateUserUpdate } from '../middleware/validation.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Helper: resolve display name from role-specific tables
const getDisplayName = async (userId, role) => {
  try {
    const normalizedRole = String(role || '').toLowerCase();
    switch (normalizedRole) {
      case 'admin': {
        const [rows] = await pool.execute(
          'SELECT FullName FROM adminrecord WHERE UserID = ? LIMIT 1',
          [userId]
        );
        if (rows.length && rows[0].FullName) return rows[0].FullName;
        break;
      }
      case 'teacher': {
        const [rows] = await pool.execute(
          'SELECT FullName FROM teacherrecord WHERE UserID = ? LIMIT 1',
          [userId]
        );
        if (rows.length && rows[0].FullName) return rows[0].FullName;
        break;
      }
      case 'registrar': {
        const [rows] = await pool.execute(
          'SELECT FullName FROM registrarrecord WHERE UserID = ? LIMIT 1',
          [userId]
        );
        if (rows.length && rows[0].FullName) return rows[0].FullName;
        break;
      }
      case 'parent': {
        const [rows] = await pool.execute(
          'SELECT FullName FROM parent WHERE UserID = ? LIMIT 1',
          [userId]
        );
        if (rows.length && rows[0].FullName) return rows[0].FullName;
        break;
      }
    }
  } catch (e) {
    // ignore and fallback
  }
  return null;
};

// Email sending function
const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || 'Attendance System';

  const subject = 'Your OTP Code';
  const html = `<p>Your OTP code is: <b>${otp}</b></p><p>This code will expire in 10 minutes.</p>`;

  await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: email,
    subject,
    html,
  });
};

// Registration OTP email
const sendRegistrationOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || 'Attendance System';

  const subject = 'Your Registration OTP Code';
  const html = `<p>Use this code to complete your registration: <b>${otp}</b></p><p>This code will expire in 10 minutes.</p>`;

  await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: email,
    subject,
    html,
  });
};

// Simple login route for testing (bypasses OTP) - DISABLED
// This route has been disabled to enforce OTP authentication for all users
/*
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.PasswordHash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.UserID, email: user.Username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userResponse = {
      id: user.UserID,
      name: user.Username.split('@')[0],
      role: user.Role.toLowerCase(),
      email: user.Username
    };

    res.json({
      success: true,
      data: {
        user: userResponse,
        token: token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});
*/

// Login route (step 1: verify password and send OTP)
router.post('/login-with-otp', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.PasswordHash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresInMin = Number(process.env.OTP_EXP_MINUTES || 10);
    const expiresAt = new Date(Date.now() + expiresInMin * 60 * 1000);

    await setUserOtp(user.UserID, otp, expiresAt);

    await sendOtpEmail(email, otp);

    res.json({ success: true, message: 'OTP sent to email', data: { userId: user.UserID } });
  } catch (error) {
    console.error('Login-with-OTP error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Verify OTP (step 2: issue JWT)
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ success: false, message: 'userId and otp are required' });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const result = await consumeUserOtp(userId, otp);
    if (!result.valid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const token = jwt.sign(
      { userId: user.UserID, email: user.Username, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const displayName = (await getDisplayName(user.UserID, user.Role)) || user.Username.split('@')[0];
    const userResponse = {
      id: user.UserID,
      name: displayName,
      role: user.Role.toLowerCase(),
      email: user.Username,
    };

    res.json({ success: true, message: 'Login successful', data: { user: userResponse, token } });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Register route (admin only)
router.post('/register', authenticateToken, requireAdmin, validateUserCreation, async (req, res) => {
  try {
    const { name, email, password, role, section, gradeLevel } = req.body;

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userData = {
      username: email,
      passwordHash: hashedPassword,
      role: role.charAt(0).toUpperCase() + role.slice(1) // Capitalize first letter
    };

    const newUser = await createUser(userData);

    // Format user data for response
    const userResponse = {
      id: newUser.UserID,
      name: name,
      role: newUser.Role.toLowerCase(),
      email: newUser.Username
    };

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const displayName = (await getDisplayName(user.UserID, user.Role)) || user.Username.split('@')[0];
    const userResponse = {
      id: user.UserID,
      name: displayName,
      role: user.Role.toLowerCase(),
      email: user.Username
    };

    res.json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, validateUserUpdate, async (req, res) => {
  try {
    const { name, email, section, gradeLevel } = req.body;
    const userId = req.user.userId;

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const existingUser = await findUserByEmail(email);
      if (existingUser && existingUser.UserID !== userId) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken'
        });
      }
    }

    // Prepare update data. Only Admin can change name (handled in role-specific tables)
    const updateData = {};
    if (email) updateData.username = email;

    // If non-admin attempts to change name, reject
    if (typeof name !== 'undefined' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can change name'
      });
    }

    // If admin provided a name, update adminrecord
    if (typeof name !== 'undefined' && req.user.role === 'admin') {
      try {
        await pool.execute('UPDATE adminrecord SET FullName = ? WHERE UserID = ?', [name, userId]);
      } catch (e) {
        // Do not fail profile update if name table update fails
      }
    }

    const updatedUser = await updateUser(userId, updateData);
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const displayName = (await getDisplayName(updatedUser.UserID, updatedUser.Role)) || name || updatedUser.Username.split('@')[0];
    const userResponse = {
      id: updatedUser.UserID,
      name: displayName,
      role: updatedUser.Role.toLowerCase(),
      email: updatedUser.Username
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get current user with password
    const user = await findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.PasswordHash);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await updateUser(user.UserID, { passwordHash: hashedNewPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout route (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  // In a real application, you might want to blacklist the token
  // For now, we'll just return success - the client should remove the token
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Verify token route
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const user = await findUserById(req.user.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const displayName = (await getDisplayName(user.UserID, user.Role)) || user.Username.split('@')[0];
    const userResponse = {
      id: user.UserID,
      name: displayName,
      role: user.Role.toLowerCase(),
      email: user.Username
    };

    res.json({
      success: true,
      message: 'Token is valid',
      data: userResponse
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});



// Student enrollment (authenticated parent endpoint)
router.post('/enroll-student', authenticateToken, requireRole(['parent']), async (req, res) => {
  try {
    const { 
      studentName, 
      dateOfBirth,
      gender,
      placeOfBirth,
      nationality,
      address,
      gradeLevel, 
      documents = [],
      additionalInfo = null 
    } = req.body;

    // Validation
    if (!studentName) {
      return res.status(400).json({
        success: false,
        message: 'Student name is required'
      });
    }

    // Create student record and link to parent immediately
    const student = await createStudent({
      fullName: studentName,
      dateOfBirth: dateOfBirth || null,
      gender: gender || 'Other',
      placeOfBirth: placeOfBirth || null,
      nationality: nationality || 'Filipino',
      address: address || null,
      gradeLevel: gradeLevel || null,
      section: null, // Section will be assigned by admin later
      parentId: req.user.parentId, // Link to authenticated parent
      createdBy: req.user.userId // Parent who created the student
    });

    // Store enrollment documents and info
    await storeEnrollmentDocuments(student.StudentID, {
      submittedByUserId: req.user.userId,
      documents,
      additionalInfo
    });

    res.status(201).json({
      success: true,
      message: 'Student enrollment submitted successfully',
      data: {
        studentId: student.StudentID,
        studentName: student.FullName,
        status: 'Pending Approval'
      }
    });
  } catch (error) {
    console.error('Student enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


// Parent-specific endpoints (require authentication)
// Get parent profile details
router.get('/parent/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get parent record
    const [parentRows] = await pool.execute(
      'SELECT p.*, u.Username as Email FROM parent p JOIN useraccount u ON p.UserID = u.UserID WHERE p.UserID = ?',
      [userId]
    );
    
    if (parentRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parent profile not found'
      });
    }
    
    const parent = parentRows[0];
    res.json({
      success: true,
      data: {
        ParentID: parent.ParentID,
        FullName: parent.FullName,
        ContactInfo: parent.ContactInfo,
        Email: parent.Email
      }
    });
  } catch (error) {
    console.error('Get parent profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get students linked to parent
router.get('/parent/students', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get parent ID
    const [parentRows] = await pool.execute(
      'SELECT ParentID FROM parent WHERE UserID = ?',
      [userId]
    );
    
    if (parentRows.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const parentId = parentRows[0].ParentID;
    
    // Get students linked to this parent
    const [studentRows] = await pool.execute(
      'SELECT StudentID, FullName, GradeLevel, SectionID, ParentID, Status FROM studentrecord WHERE ParentID = ? ORDER BY StudentID',
      [parentId]
    );
    
    res.json({
      success: true,
      data: studentRows
    });
  } catch (error) {
    console.error('Get parent students error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get attendance records for a specific student
router.get('/parent/attendance/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 30 } = req.query;
    const userId = req.user.userId;
    
    // Verify parent has access to this student
    const [parentRows] = await pool.execute(
      'SELECT p.ParentID FROM parent p JOIN studentrecord s ON p.ParentID = s.ParentID WHERE p.UserID = ? AND s.StudentID = ?',
      [userId, studentId]
    );
    
    if (parentRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this student'
      });
    }
    
    // Get attendance records
    const [attendanceRows] = await pool.execute(
      `SELECT sa.AttendanceID, sa.StudentID, sa.Date, sa.TimeIn, sa.TimeOut, sa.Status 
       FROM subjectattendance sa 
       WHERE sa.StudentID = ? 
       ORDER BY sa.Date DESC 
       LIMIT ?`,
      [studentId, parseInt(limit)]
    );
    
    res.json({
      success: true,
      data: attendanceRows
    });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get attendance statistics for a student
router.get('/parent/attendance-stats/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const userId = req.user.userId;
    
    // Verify parent has access to this student
    const [parentRows] = await pool.execute(
      'SELECT p.ParentID FROM parent p JOIN studentrecord s ON p.ParentID = s.ParentID WHERE p.UserID = ? AND s.StudentID = ?',
      [userId, studentId]
    );
    
    if (parentRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this student'
      });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];
    
    // Get today's status
    const [todayRows] = await pool.execute(
      'SELECT Status FROM subjectattendance WHERE StudentID = ? AND Date = ? ORDER BY TimeIn DESC LIMIT 1',
      [studentId, today]
    );
    
    // Get weekly attendance
    const [weeklyRows] = await pool.execute(
      'SELECT Status FROM subjectattendance WHERE StudentID = ? AND Date >= ? ORDER BY Date DESC',
      [studentId, oneWeekAgoStr]
    );
    
    const todayStatus = todayRows.length > 0 ? todayRows[0].Status : 'No Record';
    
    const presentDays = weeklyRows.filter(row => 
      row.Status === 'Present' || row.Status === 'Late'
    ).length;
    
    const weeklyPercentage = weeklyRows.length > 0 
      ? Math.round((presentDays / weeklyRows.length) * 100)
      : 0;
    
    res.json({
      success: true,
      data: {
        todayStatus,
        weeklyPercentage
      }
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router; 

// Parent registration (public) - start registration and send OTP
router.post('/register-parent-start', async (req, res) => {
  try {
    const { firstName, middleName = '', lastName, relationship = 'Guardian', contactNumber = null, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check if user already exists
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

    // Generate and store OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresInMin = Number(process.env.OTP_EXP_MINUTES || 10);
    const expiry = new Date(Date.now() + expiresInMin * 60 * 1000);

    await storeOtp(email, otp, expiry, 'parent_register', { fullName, relationship, contactNumber, password });

    await sendRegistrationOtpEmail(email, otp);

    return res.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('Register parent start error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Parent registration (public) - verify OTP and create account
router.post('/register-parent-verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const otpRecord = await verifyOtp(email, otp, 'parent_register');
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const { fullName, relationship = 'Guardian', contactNumber = null, password } = otpRecord.data || {};
    if (!fullName || !password) {
      return res.status(400).json({ success: false, message: 'Registration data missing or expired' });
    }

    // Create parent user and profile
    const { userId } = await createParentUserAndProfile({ fullName, contactInfo: contactNumber, email, password });
    // Update relationship on parent record
    await pool.execute('UPDATE parent SET Relationship = ? WHERE UserID = ?', [relationship, userId]);

    await clearOtp(email, 'parent_register');

    return res.status(201).json({
      success: true,
      message: 'Registration complete. No student linked yet; please enroll a student.',
    });
  } catch (error) {
    console.error('Register parent verify error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});