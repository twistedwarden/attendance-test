-- Backfill SectionID foreign keys in studentrecord and teacherschedule tables
-- This populates the foreign key relationships based on existing Section column values

-- Update studentrecord SectionID based on Section and GradeLevel (if columns exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'studentrecord' 
     AND COLUMN_NAME = 'Section') > 0
    AND
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'studentrecord' 
     AND COLUMN_NAME = 'GradeLevel') > 0,
    'UPDATE studentrecord s LEFT JOIN section sec ON sec.SectionName = s.Section AND sec.GradeLevel = s.GradeLevel SET s.SectionID = sec.SectionID WHERE s.SectionID IS NULL AND s.Section IS NOT NULL AND s.GradeLevel IS NOT NULL',
    'SELECT "Section or GradeLevel column does not exist in studentrecord, skipping update" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update teacherschedule SectionID based on Section (if columns exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'teacherschedule' 
     AND COLUMN_NAME = 'Section') > 0,
    'UPDATE teacherschedule t LEFT JOIN section sec ON sec.SectionName = t.Section SET t.SectionID = sec.SectionID WHERE t.SectionID IS NULL AND t.Section IS NOT NULL',
    'SELECT "Section column does not exist in teacherschedule, skipping update" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
