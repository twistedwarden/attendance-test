-- Add SectionID foreign key to teacherschedule table
-- This creates a proper relationship between teacher schedules and sections

ALTER TABLE `teacherschedule` 
ADD COLUMN `SectionID` int(11) DEFAULT NULL AFTER `Section`,
ADD CONSTRAINT `teacherschedule_ibfk_section` FOREIGN KEY (`SectionID`) REFERENCES `section` (`SectionID`) ON DELETE SET NULL;
