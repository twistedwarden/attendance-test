import jwt from 'jsonwebtoken';
import { findUserById, pool } from '../config/database.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await findUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token - user not found' 
      });
    }

    // Get additional user data based on role
    let additionalData = {};
    if (user.Role.toLowerCase() === 'parent') {
      const [parentData] = await pool.execute(
        'SELECT ParentID FROM parent WHERE UserID = ?',
        [user.UserID]
      );
      if (parentData.length > 0) {
        additionalData.parentId = parentData[0].ParentID;
      }
    }

    // Format user data for request
    req.user = {
      userId: user.UserID,
      email: user.Username,
      role: user.Role.toLowerCase(),
      ...additionalData
    };
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireTeacher = requireRole(['admin', 'teacher']);
export const requireParent = requireRole(['admin', 'teacher', 'parent']); 