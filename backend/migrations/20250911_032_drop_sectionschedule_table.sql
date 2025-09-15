-- Drop sectionschedule table as we're consolidating to use only teacherschedule
-- The teacherschedule table already has all necessary fields including SectionID, GradeLevel, etc.

-- First, drop the foreign key constraints
ALTER TABLE `sectionschedule` DROP FOREIGN KEY `sectionschedule_ibfk_1`;
ALTER TABLE `sectionschedule` DROP FOREIGN KEY `sectionschedule_ibfk_2`;

-- Drop the table
DROP TABLE IF EXISTS `sectionschedule`;

-- Note: All scheduling functionality will now use the teacherschedule table
-- which already has the necessary fields: TeacherID, SubjectID, GradeLevel, Section, SectionID, TimeIn, TimeOut, DayOfWeek, GracePeriod
