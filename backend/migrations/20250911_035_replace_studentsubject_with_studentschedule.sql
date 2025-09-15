-- Replace studentsubject with studentschedule for better data model
-- This creates a direct link between students and their schedules

-- Create studentschedule table
CREATE TABLE IF NOT EXISTS `studentschedule` (
  `StudentScheduleID` int(11) NOT NULL AUTO_INCREMENT,
  `StudentID` int(11) NOT NULL,
  `ScheduleID` int(11) NOT NULL,
  `CreatedAt` datetime DEFAULT current_timestamp(),
  `CreatedBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`StudentScheduleID`),
  UNIQUE KEY `unique_student_schedule` (`StudentID`, `ScheduleID`),
  KEY `StudentID` (`StudentID`),
  KEY `ScheduleID` (`ScheduleID`),
  KEY `CreatedBy` (`CreatedBy`),
  CONSTRAINT `studentschedule_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `studentrecord` (`StudentID`) ON DELETE CASCADE,
  CONSTRAINT `studentschedule_ibfk_2` FOREIGN KEY (`ScheduleID`) REFERENCES `teacherschedule` (`ScheduleID`) ON DELETE CASCADE,
  CONSTRAINT `studentschedule_ibfk_3` FOREIGN KEY (`CreatedBy`) REFERENCES `useraccount` (`UserID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Migrate data from studentsubject to studentschedule
-- This will create studentschedule entries based on matching studentsubject records
INSERT INTO `studentschedule` (`StudentID`, `ScheduleID`, `CreatedBy`)
SELECT 
  ss.StudentID,
  ts.ScheduleID,
  ss.TeacherID as CreatedBy
FROM `studentsubject` ss
JOIN `teacherschedule` ts ON ts.TeacherID = ss.TeacherID AND ts.SubjectID = ss.SubjectID
JOIN `studentrecord` sr ON sr.StudentID = ss.StudentID
JOIN `section` sec ON sec.SectionID = ts.SectionID
WHERE sec.GradeLevel = sr.GradeLevel 
  AND sec.SectionName = sr.Section;

-- Drop the old studentsubject table
DROP TABLE IF EXISTS `studentsubject`;

-- Note: After this migration:
-- 1. Students are directly linked to their schedules via studentschedule
-- 2. The teacher is accessible through the schedule (teacherschedule.TeacherID)
-- 3. Subject information is accessible through the schedule (teacherschedule.SubjectID)
-- 4. All schedule details (time, day, etc.) are directly available
