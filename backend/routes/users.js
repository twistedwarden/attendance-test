import express from 'express';
import { 
  getAllUsers, 
  findUserById, 
  updateUser, 
  deleteUser 
} from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateUserUpdate } from '../middleware/validation.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    
    const formattedUsers = users.map(user => ({
      id: user.UserID,
      name: user.Username.split('@')[0],
      role: user.Role.toLowerCase(),
      email: user.Username
    }));

    res.json({
      success: true,
      data: formattedUsers
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user by ID (admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await findUserById(id);

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
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user (admin only)
router.put('/:id', authenticateToken, requireAdmin, validateUserUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    // Check if user exists
    const existingUser = await findUserById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.Username) {
      const userWithEmail = await getAllUsers();
      const emailExists = userWithEmail.find(user => user.Username === email && user.UserID !== parseInt(id));
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken'
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (email) updateData.username = email;
    if (role) updateData.role = role.charAt(0).toUpperCase() + role.slice(1);

    const updatedUser = await updateUser(id, updateData);
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
      message: 'User updated successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await findUserById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (req.user.userId === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const deleted = await deleteUser(id);

    if (deleted) {
      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get users by role (admin only)
router.get('/role/:role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.params;
    const validRoles = ['admin', 'teacher', 'parent'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin, teacher, or parent'
      });
    }

    const allUsers = await getAllUsers();
    const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);
    
    const users = allUsers
      .filter(user => user.Role === roleCapitalized)
      .map(user => ({
        id: user.UserID,
        name: user.Username.split('@')[0],
        role: user.Role.toLowerCase(),
        email: user.Username
      }));

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router; 