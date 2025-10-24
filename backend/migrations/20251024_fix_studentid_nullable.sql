-- Fix StudentID column to allow NULL values for document uploads before enrollment
-- This allows documents to be uploaded before the student record is created

-- Make StudentID nullable in enrollment_documents table
ALTER TABLE `enrollment_documents` 
MODIFY COLUMN `StudentID` int(11) NULL;

-- Update the foreign key constraint to allow NULL values
ALTER TABLE `enrollment_documents` 
DROP FOREIGN KEY IF EXISTS `enrollment_documents_ibfk_1`;

-- Re-add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE `enrollment_documents` 
ADD CONSTRAINT `enrollment_documents_ibfk_1` 
FOREIGN KEY (`StudentID`) REFERENCES `studentrecord` (`StudentID`) 
ON DELETE SET NULL;
