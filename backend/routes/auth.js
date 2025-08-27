import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  findUserByEmail, 
  createUser, 
  updateUser,
  findUserById 
} from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateLogin, validateRegistration, validateUserUpdate } from '../middleware/validation.js';

const router = express.Router();

// Login route
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email (Username in database)
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.PasswordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.UserID, email: user.Username, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Format user data for response
    const userResponse = {
      id: user.UserID,
      name: user.Username.split('@')[0], // Extract name from email
      role: user.Role.toLowerCase(),
      email: user.Username
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
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

// Register route (admin only)
router.post('/register', authenticateToken, requireAdmin, validateRegistration, async (req, res) => {
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
    console.error('Registration error:', error);
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

    const userResponse = {
      id: user.UserID,
      name: user.Username.split('@')[0],
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

    // Prepare update data
    const updateData = {};
    if (email) updateData.username = email;

    const updatedUser = await updateUser(userId, updateData);
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userResponse = {
      id: updatedUser.UserID,
      name: name || updatedUser.Username.split('@')[0],
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

    const userResponse = {
      id: user.UserID,
      name: user.Username.split('@')[0],
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

export default router; 