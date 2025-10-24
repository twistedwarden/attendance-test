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

-- Add additional columns to studentrecord for enrollment details (if they don't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'studentrecord' 
     AND COLUMN_NAME = 'EnrollmentDate') = 0,
    'ALTER TABLE `studentrecord` ADD COLUMN `EnrollmentDate` datetime DEFAULT NULL AFTER `Address`',
    'SELECT "EnrollmentDate column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'studentrecord' 
     AND COLUMN_NAME = 'EnrollmentStatus') = 0,
    'ALTER TABLE `studentrecord` ADD COLUMN `EnrollmentStatus` enum(''pending'', ''approved'', ''declined'', ''enrolled'') NOT NULL DEFAULT ''pending'' AFTER `EnrollmentDate`',
    'SELECT "EnrollmentStatus column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update enrollment_documents table to include more document types (if they don't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'enrollment_documents' 
     AND COLUMN_NAME = 'DocumentType') = 0,
    'ALTER TABLE `enrollment_documents` ADD COLUMN `DocumentType` varchar(100) DEFAULT ''general'' AFTER `DocumentID`',
    'SELECT "DocumentType column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'enrollment_documents' 
     AND COLUMN_NAME = 'FileName') = 0,
    'ALTER TABLE `enrollment_documents` ADD COLUMN `FileName` varchar(255) DEFAULT NULL AFTER `DocumentType`',
    'SELECT "FileName column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'enrollment_documents' 
     AND COLUMN_NAME = 'FileSize') = 0,
    'ALTER TABLE `enrollment_documents` ADD COLUMN `FileSize` int(11) DEFAULT NULL AFTER `FileName`',
    'SELECT "FileSize column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'enrollment_documents' 
     AND COLUMN_NAME = 'MimeType') = 0,
    'ALTER TABLE `enrollment_documents` ADD COLUMN `MimeType` varchar(100) DEFAULT NULL AFTER `FileSize`',
    'SELECT "MimeType column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create index for better performance (if they don't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'studentrecord' 
     AND INDEX_NAME = 'idx_enrollment_status') = 0,
    'CREATE INDEX `idx_enrollment_status` ON `studentrecord` (`EnrollmentStatus`)',
    'SELECT "Index idx_enrollment_status already exists, skipping create" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'enrollment_review' 
     AND INDEX_NAME = 'idx_enrollment_review_status') = 0,
    'CREATE INDEX `idx_enrollment_review_status` ON `enrollment_review` (`Status`)',
    'SELECT "Index idx_enrollment_review_status already exists, skipping create" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'enrollment_review' 
     AND INDEX_NAME = 'idx_enrollment_review_student') = 0,
    'CREATE INDEX `idx_enrollment_review_student` ON `enrollment_review` (`StudentID`, `Status`)',
    'SELECT "Index idx_enrollment_review_student already exists, skipping create" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
