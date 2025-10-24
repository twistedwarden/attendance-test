-- Create default school year and migrate existing data

-- Insert default school year 2024-2025
INSERT INTO `schoolyear` (`YearLabel`, `StartDate`, `EndDate`, `IsActive`) 
VALUES ('2024-2025', '2024-08-01', '2025-05-31', TRUE);

-- Get the SchoolYearID of the default year
SET @default_school_year_id = LAST_INSERT_ID();

-- Update all existing records to reference the default school year
UPDATE `studentrecord` SET `SchoolYearID` = @default_school_year_id WHERE `SchoolYearID` IS NULL;
UPDATE `teacherschedule` SET `SchoolYearID` = @default_school_year_id WHERE `SchoolYearID` IS NULL;
UPDATE `section` SET `SchoolYearID` = @default_school_year_id WHERE `SchoolYearID` IS NULL;
UPDATE `attendancelog` SET `SchoolYearID` = @default_school_year_id WHERE `SchoolYearID` IS NULL;
UPDATE `subjectattendance` SET `SchoolYearID` = @default_school_year_id WHERE `SchoolYearID` IS NULL;
UPDATE `enrollment_review` SET `SchoolYearID` = @default_school_year_id WHERE `SchoolYearID` IS NULL;
UPDATE `attendancereport` SET `SchoolYearID` = @default_school_year_id WHERE `SchoolYearID` IS NULL;
UPDATE `excuseletter` SET `SchoolYearID` = @default_school_year_id WHERE `SchoolYearID` IS NULL;

-- Add NOT NULL constraints after migration
ALTER TABLE `studentrecord` MODIFY `SchoolYearID` int(11) NOT NULL;
ALTER TABLE `teacherschedule` MODIFY `SchoolYearID` int(11) NOT NULL;
ALTER TABLE `section` MODIFY `SchoolYearID` int(11) NOT NULL;
ALTER TABLE `attendancelog` MODIFY `SchoolYearID` int(11) NOT NULL;
ALTER TABLE `subjectattendance` MODIFY `SchoolYearID` int(11) NOT NULL;
ALTER TABLE `enrollment_review` MODIFY `SchoolYearID` int(11) NOT NULL;
ALTER TABLE `attendancereport` MODIFY `SchoolYearID` int(11) NOT NULL;
ALTER TABLE `excuseletter` MODIFY `SchoolYearID` int(11) NOT NULL;
