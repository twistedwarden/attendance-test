-- Add SectionID foreign key to studentrecord table
-- This creates a proper relationship between students and sections

ALTER TABLE `studentrecord` 
ADD COLUMN `SectionID` int(11) DEFAULT NULL AFTER `Section`,
ADD CONSTRAINT `studentrecord_ibfk_section` FOREIGN KEY (`SectionID`) REFERENCES `section` (`SectionID`) ON DELETE SET NULL;
