-- Create section table for managing school sections
CREATE TABLE IF NOT EXISTS `section` (
  `SectionID` int(11) NOT NULL AUTO_INCREMENT,
  `SectionName` varchar(50) NOT NULL,
  `GradeLevel` varchar(50) NOT NULL,
  `Description` text DEFAULT NULL,
  `Capacity` int(11) DEFAULT NULL COMMENT 'Maximum number of students',
  `IsActive` boolean DEFAULT true,
  `CreatedAt` datetime DEFAULT current_timestamp(),
  `UpdatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`SectionID`),
  UNIQUE KEY `unique_section` (`SectionName`, `GradeLevel`),
  KEY `GradeLevel` (`GradeLevel`),
  KEY `IsActive` (`IsActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

