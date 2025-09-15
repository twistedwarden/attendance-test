-- Remove registration table and update enrollment_documents
-- This migration removes the registration table and updates enrollment_documents to work without it

-- First, drop the foreign key constraint from enrollment_documents
ALTER TABLE `enrollment_documents` DROP FOREIGN KEY `enrollment_documents_ibfk_2`;

-- Drop the registration table
DROP TABLE IF EXISTS `registration`;

-- Update enrollment_documents to remove RegistrationID column
ALTER TABLE `enrollment_documents` DROP COLUMN `RegistrationID`;

-- Add a new column to track the parent user who submitted the enrollment
ALTER TABLE `enrollment_documents` ADD COLUMN `SubmittedByUserID` int(11) DEFAULT NULL AFTER `StudentID`;

-- Add foreign key constraint for the new column
ALTER TABLE `enrollment_documents` 
ADD CONSTRAINT `enrollment_documents_ibfk_2` FOREIGN KEY (`SubmittedByUserID`) REFERENCES `useraccount` (`UserID`) ON DELETE SET NULL;
