-- Update sectionschedule table to reference section table
-- First, add the SectionID column
ALTER TABLE `sectionschedule` 
ADD COLUMN `SectionID` int(11) DEFAULT NULL AFTER `SubjectID`;

-- Add foreign key constraint
ALTER TABLE `sectionschedule` 
ADD CONSTRAINT `sectionschedule_ibfk_2` FOREIGN KEY (`SectionID`) REFERENCES `section` (`SectionID`) ON DELETE CASCADE;

-- Add index for better performance
ALTER TABLE `sectionschedule` 
ADD KEY `SectionID` (`SectionID`);

-- Note: The GradeLevel and Section columns will remain for backward compatibility
-- but SectionID will be the primary reference going forward

