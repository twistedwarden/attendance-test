-- Fix StudentID column to allow NULL values for document uploads before enrollment
-- This allows documents to be uploaded before the student record is created

-- Make StudentID nullable in enrollment_documents table
ALTER TABLE `enrollment_documents` 
MODIFY COLUMN `StudentID` int(11) NULL;

-- Drop existing foreign key constraint (using conditional logic for MySQL compatibility)
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

-- Re-add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE `enrollment_documents` 
ADD CONSTRAINT `enrollment_documents_ibfk_1` 
FOREIGN KEY (`StudentID`) REFERENCES `studentrecord` (`StudentID`) 
ON DELETE SET NULL;
