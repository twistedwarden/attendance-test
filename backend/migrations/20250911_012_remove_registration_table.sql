-- Remove registration table and update enrollment_documents
-- This migration removes the registration table and updates enrollment_documents to work without it

-- First, drop the foreign key constraint from enrollment_documents (if it exists)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'enrollment_documents' 
     AND CONSTRAINT_NAME = 'enrollment_documents_ibfk_2') > 0,
    'ALTER TABLE `enrollment_documents` DROP FOREIGN KEY `enrollment_documents_ibfk_2`',
    'SELECT "Foreign key enrollment_documents_ibfk_2 does not exist, skipping drop" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop the registration table
DROP TABLE IF EXISTS `registration`;

-- Update enrollment_documents to remove RegistrationID column (if it exists)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'enrollment_documents' 
     AND COLUMN_NAME = 'RegistrationID') > 0,
    'ALTER TABLE `enrollment_documents` DROP COLUMN `RegistrationID`',
    'SELECT "RegistrationID column does not exist, skipping drop" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add a new column to track the parent user who submitted the enrollment (if it doesn't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'enrollment_documents' 
     AND COLUMN_NAME = 'SubmittedByUserID') = 0,
    'ALTER TABLE `enrollment_documents` ADD COLUMN `SubmittedByUserID` int(11) DEFAULT NULL AFTER `StudentID`',
    'SELECT "SubmittedByUserID column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint for the new column (if it doesn't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'enrollment_documents' 
     AND CONSTRAINT_NAME = 'enrollment_documents_ibfk_2') = 0
    AND
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'enrollment_documents' 
     AND COLUMN_NAME = 'SubmittedByUserID') > 0,
    'ALTER TABLE `enrollment_documents` ADD CONSTRAINT `enrollment_documents_ibfk_2` FOREIGN KEY (`SubmittedByUserID`) REFERENCES `useraccount` (`UserID`) ON DELETE SET NULL',
    'SELECT "Foreign key already exists or SubmittedByUserID column does not exist, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
