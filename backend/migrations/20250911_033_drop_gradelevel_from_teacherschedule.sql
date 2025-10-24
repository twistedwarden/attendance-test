-- Drop GradeLevel column from teacherschedule table (if it exists)
-- Grade level information is now available through the SectionID foreign key relationship

-- First, ensure all records have SectionID populated before dropping GradeLevel (if GradeLevel column exists)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'teacherschedule' 
     AND COLUMN_NAME = 'GradeLevel') > 0,
    'UPDATE teacherschedule ts LEFT JOIN section sec ON sec.SectionID = ts.SectionID SET ts.SectionID = (SELECT s.SectionID FROM section s WHERE s.GradeLevel = ts.GradeLevel LIMIT 1) WHERE ts.SectionID IS NULL AND ts.GradeLevel IS NOT NULL',
    'SELECT "GradeLevel column does not exist in teacherschedule, skipping update" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Now drop the GradeLevel column (if it exists)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'teacherschedule' 
     AND COLUMN_NAME = 'GradeLevel') > 0,
    'ALTER TABLE `teacherschedule` DROP COLUMN `GradeLevel`',
    'SELECT "GradeLevel column does not exist, skipping drop" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Note: Grade level information can now be obtained by joining with the section table:
-- SELECT ts.*, s.GradeLevel 
-- FROM teacherschedule ts 
-- LEFT JOIN section s ON s.SectionID = ts.SectionID
