-- Migrate existing data to use existing school years

-- Get the first active school year ID (or the first school year if none are active)
SET @default_school_year_id = (
  SELECT SchoolYearID FROM `schoolyear` 
  WHERE `IsActive` = TRUE 
  ORDER BY `SchoolYearID` ASC 
  LIMIT 1
);

-- If no active school year exists, use the first school year
SET @default_school_year_id = IFNULL(@default_school_year_id, (
  SELECT SchoolYearID FROM `schoolyear` 
  ORDER BY `SchoolYearID` ASC 
  LIMIT 1
));

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
-- Need to drop and recreate foreign keys to modify columns

-- Drop foreign key constraints temporarily
ALTER TABLE `studentrecord` DROP FOREIGN KEY `studentrecord_ibfk_schoolyear`;
ALTER TABLE `teacherschedule` DROP FOREIGN KEY `teacherschedule_ibfk_schoolyear`;
ALTER TABLE `section` DROP FOREIGN KEY `section_ibfk_schoolyear`;
ALTER TABLE `attendancelog` DROP FOREIGN KEY `attendancelog_ibfk_schoolyear`;
ALTER TABLE `subjectattendance` DROP FOREIGN KEY `subjectattendance_ibfk_schoolyear`;
ALTER TABLE `enrollment_review` DROP FOREIGN KEY `enrollment_review_ibfk_schoolyear`;
ALTER TABLE `attendancereport` DROP FOREIGN KEY `attendancereport_ibfk_schoolyear`;
ALTER TABLE `excuseletter` DROP FOREIGN KEY `excuseletter_ibfk_schoolyear`;

-- Modify columns to NOT NULL
ALTER TABLE `studentrecord` MODIFY `SchoolYearID` int(11) NOT NULL;
ALTER TABLE `teacherschedule` MODIFY `SchoolYearID` int(11) NOT NULL;
ALTER TABLE `section` MODIFY `SchoolYearID` int(11) NOT NULL;
ALTER TABLE `attendancelog` MODIFY `SchoolYearID` int(11) NOT NULL;
ALTER TABLE `subjectattendance` MODIFY `SchoolYearID` int(11) NOT NULL;
ALTER TABLE `enrollment_review` MODIFY `SchoolYearID` int(11) NOT NULL;
ALTER TABLE `attendancereport` MODIFY `SchoolYearID` int(11) NOT NULL;
ALTER TABLE `excuseletter` MODIFY `SchoolYearID` int(11) NOT NULL;

-- Recreate foreign key constraints
ALTER TABLE `studentrecord` ADD CONSTRAINT `studentrecord_ibfk_schoolyear` FOREIGN KEY (`SchoolYearID`) REFERENCES `schoolyear` (`SchoolYearID`) ON DELETE RESTRICT;
ALTER TABLE `teacherschedule` ADD CONSTRAINT `teacherschedule_ibfk_schoolyear` FOREIGN KEY (`SchoolYearID`) REFERENCES `schoolyear` (`SchoolYearID`) ON DELETE RESTRICT;
ALTER TABLE `section` ADD CONSTRAINT `section_ibfk_schoolyear` FOREIGN KEY (`SchoolYearID`) REFERENCES `schoolyear` (`SchoolYearID`) ON DELETE RESTRICT;
ALTER TABLE `attendancelog` ADD CONSTRAINT `attendancelog_ibfk_schoolyear` FOREIGN KEY (`SchoolYearID`) REFERENCES `schoolyear` (`SchoolYearID`) ON DELETE RESTRICT;
ALTER TABLE `subjectattendance` ADD CONSTRAINT `subjectattendance_ibfk_schoolyear` FOREIGN KEY (`SchoolYearID`) REFERENCES `schoolyear` (`SchoolYearID`) ON DELETE RESTRICT;
ALTER TABLE `enrollment_review` ADD CONSTRAINT `enrollment_review_ibfk_schoolyear` FOREIGN KEY (`SchoolYearID`) REFERENCES `schoolyear` (`SchoolYearID`) ON DELETE RESTRICT;
ALTER TABLE `attendancereport` ADD CONSTRAINT `attendancereport_ibfk_schoolyear` FOREIGN KEY (`SchoolYearID`) REFERENCES `schoolyear` (`SchoolYearID`) ON DELETE RESTRICT;
ALTER TABLE `excuseletter` ADD CONSTRAINT `excuseletter_ibfk_schoolyear` FOREIGN KEY (`SchoolYearID`) REFERENCES `schoolyear` (`SchoolYearID`) ON DELETE RESTRICT;
