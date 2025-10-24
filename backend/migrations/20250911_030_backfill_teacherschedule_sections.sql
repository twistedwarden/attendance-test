-- Backfill teacher schedules with section data
-- This populates Section and SectionID based on GradeLevel and Subject combinations

-- Update teacher schedules with Section and SectionID based on GradeLevel (if GradeLevel column exists)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'teacherschedule' 
     AND COLUMN_NAME = 'GradeLevel') > 0,
    'UPDATE teacherschedule ts LEFT JOIN section sec ON sec.GradeLevel = ts.GradeLevel AND sec.SectionName = ''A'' SET ts.Section = sec.SectionName, ts.SectionID = sec.SectionID WHERE ts.Section IS NULL AND ts.SectionID IS NULL AND ts.GradeLevel IS NOT NULL',
    'SELECT "GradeLevel column does not exist in teacherschedule, skipping update" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- For schedules without GradeLevel, set default sections based on Subject (if GradeLevel column exists)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'teacherschedule' 
     AND COLUMN_NAME = 'GradeLevel') > 0,
    'UPDATE teacherschedule ts LEFT JOIN section sec ON ((ts.SubjectID = 1 AND sec.GradeLevel = ''1'' AND sec.SectionName = ''A'') OR (ts.SubjectID = 2 AND sec.GradeLevel = ''2'' AND sec.SectionName = ''B'') OR (ts.SubjectID = 3 AND sec.GradeLevel = ''3'' AND sec.SectionName = ''A'')) SET ts.Section = sec.SectionName, ts.SectionID = sec.SectionID, ts.GradeLevel = sec.GradeLevel WHERE ts.Section IS NULL AND ts.SectionID IS NULL AND ts.GradeLevel IS NULL',
    'SELECT "GradeLevel column does not exist in teacherschedule, skipping update" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
