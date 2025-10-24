-- Add subjectattendance table with status
-- Remove status from attendancelog table

-- Create subjectattendance table
CREATE TABLE IF NOT EXISTS `subjectattendance` (
  `SubjectAttendanceID` int(11) NOT NULL AUTO_INCREMENT,
  `StudentID` int(11) NOT NULL,
  `SubjectID` int(11) NOT NULL,
  `Date` date NOT NULL,
  `Status` enum('Present','Absent','Late','Excused') NOT NULL,
  `ValidatedBy` int(11) DEFAULT NULL,
  `CreatedAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`SubjectAttendanceID`),
  KEY `StudentID` (`StudentID`),
  KEY `SubjectID` (`SubjectID`),
  KEY `ValidatedBy` (`ValidatedBy`),
  CONSTRAINT `subjectattendance_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `studentrecord` (`StudentID`) ON DELETE CASCADE,
  CONSTRAINT `subjectattendance_ibfk_2` FOREIGN KEY (`SubjectID`) REFERENCES `subject` (`SubjectID`) ON DELETE CASCADE,
  CONSTRAINT `subjectattendance_ibfk_3` FOREIGN KEY (`ValidatedBy`) REFERENCES `useraccount` (`UserID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Remove status column from attendancelog table (if it exists)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'attendancelog' 
     AND COLUMN_NAME = 'Status') > 0,
    'ALTER TABLE `attendancelog` DROP COLUMN `Status`',
    'SELECT "Status column does not exist, skipping drop" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
