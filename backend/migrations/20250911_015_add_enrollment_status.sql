-- Add enrollment status field to studentrecord table (if it doesn't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'studentrecord' 
     AND COLUMN_NAME = 'EnrollmentStatus') = 0,
    'ALTER TABLE `studentrecord` ADD COLUMN `EnrollmentStatus` ENUM(''enrolled'', ''pending'', ''rejected'') NOT NULL DEFAULT ''pending''',
    'SELECT "EnrollmentStatus column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
