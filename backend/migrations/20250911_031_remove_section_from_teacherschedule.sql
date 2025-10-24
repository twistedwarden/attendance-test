-- Remove Section varchar column from teacherschedule table
-- This eliminates redundancy since we have SectionID foreign key

-- First, ensure all records have SectionID populated (if GradeLevel column exists)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'teacherschedule' 
     AND COLUMN_NAME = 'GradeLevel') > 0,
    'UPDATE teacherschedule ts LEFT JOIN section sec ON sec.SectionName = ts.Section AND sec.GradeLevel = ts.GradeLevel SET ts.SectionID = sec.SectionID WHERE ts.SectionID IS NULL AND ts.Section IS NOT NULL AND ts.GradeLevel IS NOT NULL',
    'SELECT "GradeLevel column does not exist in teacherschedule, skipping update" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Now remove the Section column (if it exists)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'teacherschedule' 
     AND COLUMN_NAME = 'Section') > 0,
    'ALTER TABLE `teacherschedule` DROP COLUMN `Section`',
    'SELECT "Section column does not exist, skipping drop" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
