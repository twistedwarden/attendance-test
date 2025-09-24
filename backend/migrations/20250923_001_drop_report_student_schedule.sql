-- Drop StudentID and ScheduleID from attendancereport (and related FKs)
-- Safe to run multiple times: guard with INFORMATION_SCHEMA checks where possible

-- Drop foreign keys if they exist
SET @fk2 := (SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendancereport' AND REFERENCED_TABLE_NAME = 'studentrecord' LIMIT 1);
SET @fk3 := (SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendancereport' AND REFERENCED_TABLE_NAME = 'teacherschedule' LIMIT 1);

SET @sql := IF(@fk2 IS NOT NULL, CONCAT('ALTER TABLE attendancereport DROP FOREIGN KEY ', @fk2), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(@fk3 IS NOT NULL, CONCAT('ALTER TABLE attendancereport DROP FOREIGN KEY ', @fk3), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Drop columns if they exist
SET @has_student := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendancereport' AND COLUMN_NAME = 'StudentID'
);
SET @has_schedule := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendancereport' AND COLUMN_NAME = 'ScheduleID'
);

SET @sql := IF(@has_student = 1, 'ALTER TABLE attendancereport DROP COLUMN StudentID', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(@has_schedule = 1, 'ALTER TABLE attendancereport DROP COLUMN ScheduleID', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


