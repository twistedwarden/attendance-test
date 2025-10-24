import { body, validationResult } from 'express-validator';
import { pool } from '../config/database.js';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
    });
  }
  next();
};

export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    // Preserve dots and subaddresses so stored usernames/emails match exactly
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false, outlookdotcom_remove_subaddress: false, yahoo_remove_subaddress: false, icloud_remove_subaddress: false }),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];


export const validateUserCreation = [
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be between 1 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be between 1 and 50 characters'),
  body('middleName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Middle name must be less than 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false, outlookdotcom_remove_subaddress: false, yahoo_remove_subaddress: false, icloud_remove_subaddress: false }),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['admin', 'teacher', 'parent', 'registrar', 'superadmin'])
    .withMessage('Role must be admin, teacher, parent, registrar, or superadmin'),
  body('contactInfo')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Contact info must be less than 255 characters'),
  handleValidationErrors
];

export const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false, outlookdotcom_remove_subaddress: false, yahoo_remove_subaddress: false, icloud_remove_subaddress: false }),
  body('role')
    .optional()
    .isIn(['admin', 'teacher', 'parent'])
    .withMessage('Role must be admin, teacher, or parent'),
  handleValidationErrors
];

// ===== SCHOOL YEAR VALIDATION HELPERS =====

// Validate school year format (YYYY-YYYY)
export const validateSchoolYearFormat = (yearLabel) => {
  const yearFormat = /^\d{4}-\d{4}$/;
  return yearFormat.test(yearLabel);
};

// Get active school year (with caching)
let activeSchoolYearCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getActiveSchoolYear = async () => {
  const now = Date.now();
  
  // Return cached result if still valid
  if (activeSchoolYearCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return activeSchoolYearCache;
  }

  try {
    const [activeYear] = await pool.execute(`
      SELECT 
        SchoolYearID as schoolYearId,
        YearLabel as yearLabel,
        StartDate as startDate,
        EndDate as endDate,
        IsActive as isActive
      FROM schoolyear
      WHERE IsActive = TRUE
      LIMIT 1
    `);

    if (activeYear.length === 0) {
      throw new Error('No active school year found');
    }

    const year = activeYear[0];
    activeSchoolYearCache = {
      ...year,
      startDate: new Date(year.startDate).toISOString().split('T')[0],
      endDate: new Date(year.endDate).toISOString().split('T')[0]
    };
    cacheTimestamp = now;

    return activeSchoolYearCache;
  } catch (error) {
    console.error('Error getting active school year:', error);
    throw error;
  }
};

// Clear active school year cache (call when year is activated/deactivated)
export const clearActiveSchoolYearCache = () => {
  activeSchoolYearCache = null;
  cacheTimestamp = null;
};

// Middleware to ensure user can access requested school year
export const requireSchoolYearAccess = (req, res, next) => {
  const { schoolYearId } = req.params;
  const userRole = req.user?.role;

  // Admin and Registrar can access any year
  if (userRole === 'admin' || userRole === 'registrar') {
    return next();
  }

  // For other roles, check if they're trying to access the active year
  getActiveSchoolYear()
    .then(activeYear => {
      if (parseInt(schoolYearId) === activeYear.schoolYearId) {
        return next();
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this school year'
        });
      }
    })
    .catch(error => {
      console.error('Error checking school year access:', error);
      res.status(500).json({
        success: false,
        message: 'Error validating school year access'
      });
    });
};

// Validation for school year creation/update
export const validateSchoolYear = [
  body('yearLabel')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Year label must be in format YYYY-YYYY (e.g., 2024-2025)'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('startDate')
    .custom((value, { req }) => {
      if (req.body.endDate && new Date(value) >= new Date(req.body.endDate)) {
        throw new Error('Start date must be before end date');
      }
      return true;
    }),
  handleValidationErrors
];