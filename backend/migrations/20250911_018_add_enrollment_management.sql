-- Add enrollment management tables and columns
-- This migration adds tables for managing student enrollments with approval/decline functionality

-- Add enrollment_review table for tracking enrollment decisions
CREATE TABLE IF NOT EXISTS `enrollment_review` (
  `ReviewID` int(11) NOT NULL AUTO_INCREMENT,
  `StudentID` int(11) NOT NULL,
  `SubmittedByUserID` int(11) NOT NULL,
  `ReviewedByUserID` int(11) DEFAULT NULL,
  `Status` enum('pending', 'approved', 'declined') NOT NULL DEFAULT 'pending',
  `ReviewDate` datetime DEFAULT NULL,
  `DeclineReason` text DEFAULT NULL,
  `Notes` text DEFAULT NULL,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ReviewID`),
  KEY `StudentID` (`StudentID`),
  KEY `SubmittedByUserID` (`SubmittedByUserID`),
  KEY `ReviewedByUserID` (`ReviewedByUserID`),
  CONSTRAINT `enrollment_review_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `studentrecord` (`StudentID`) ON DELETE CASCADE,
  CONSTRAINT `enrollment_review_ibfk_2` FOREIGN KEY (`SubmittedByUserID`) REFERENCES `useraccount` (`UserID`) ON DELETE CASCADE,
  CONSTRAINT `enrollment_review_ibfk_3` FOREIGN KEY (`ReviewedByUserID`) REFERENCES `useraccount` (`UserID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add additional columns to studentrecord for enrollment details
ALTER TABLE `studentrecord` 
ADD COLUMN `EnrollmentDate` datetime DEFAULT NULL AFTER `Address`,
ADD COLUMN `EnrollmentStatus` enum('pending', 'approved', 'declined', 'enrolled') NOT NULL DEFAULT 'pending' AFTER `EnrollmentDate`;

-- Update enrollment_documents table to include more document types
ALTER TABLE `enrollment_documents` 
ADD COLUMN `DocumentType` varchar(100) DEFAULT 'general' AFTER `DocumentID`,
ADD COLUMN `FileName` varchar(255) DEFAULT NULL AFTER `DocumentType`,
ADD COLUMN `FileSize` int(11) DEFAULT NULL AFTER `FileName`,
ADD COLUMN `MimeType` varchar(100) DEFAULT NULL AFTER `FileSize`;

-- Create index for better performance
CREATE INDEX `idx_enrollment_status` ON `studentrecord` (`EnrollmentStatus`);
CREATE INDEX `idx_enrollment_review_status` ON `enrollment_review` (`Status`);
CREATE INDEX `idx_enrollment_review_student` ON `enrollment_review` (`StudentID`, `Status`);
