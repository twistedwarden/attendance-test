-- Comprehensive fix for StudentID nullable issue
-- This migration ensures StudentID can be NULL for document uploads before enrollment

-- First, check if the column exists and is NOT NULL
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'enrollment_documents' 
     AND COLUMN_NAME = 'StudentID' 
     AND IS_NULLABLE = 'NO') > 0,
    'ALTER TABLE `enrollment_documents` MODIFY COLUMN `StudentID` int(11) NULL',
    'SELECT "StudentID column is already nullable or does not exist" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop existing foreign key constraint if it exists
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'enrollment_documents' 
     AND CONSTRAINT_NAME = 'enrollment_documents_ibfk_1') > 0,
    'ALTER TABLE `enrollment_documents` DROP FOREIGN KEY `enrollment_documents_ibfk_1`',
    'SELECT "Foreign key constraint does not exist" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add new foreign key constraint that allows NULL values
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'enrollment_documents' 
     AND CONSTRAINT_NAME = 'enrollment_documents_ibfk_1') = 0,
    'ALTER TABLE `enrollment_documents` ADD CONSTRAINT `enrollment_documents_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `studentrecord` (`StudentID`) ON DELETE SET NULL',
    'SELECT "Foreign key constraint already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
