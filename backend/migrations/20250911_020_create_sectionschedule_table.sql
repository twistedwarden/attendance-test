-- Create sectionschedule table for managing section-based schedules
CREATE TABLE IF NOT EXISTS `sectionschedule` (
  `SectionScheduleID` int(11) NOT NULL AUTO_INCREMENT,
  `GradeLevel` varchar(50) NOT NULL,
  `Section` varchar(50) NOT NULL,
  `SubjectID` int(11) NOT NULL,
  `TimeIn` time NOT NULL,
  `TimeOut` time NOT NULL,
  `DayOfWeek` enum('Mon','Tue','Wed','Thu','Fri','Sat','Sun') NOT NULL,
  `GracePeriod` int(11) DEFAULT 15 COMMENT 'Grace period in minutes for late arrivals',
  `IsActive` boolean DEFAULT true,
  `CreatedAt` datetime DEFAULT current_timestamp(),
  `UpdatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`SectionScheduleID`),
  UNIQUE KEY `unique_schedule` (`GradeLevel`, `Section`, `SubjectID`, `DayOfWeek`),
  KEY `SubjectID` (`SubjectID`),
  KEY `GradeSection` (`GradeLevel`, `Section`),
  CONSTRAINT `sectionschedule_ibfk_1` FOREIGN KEY (`SubjectID`) REFERENCES `subject` (`SubjectID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

