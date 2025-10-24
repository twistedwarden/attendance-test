-- Add SectionID foreign key to teacherschedule table (if it doesn't exist)
-- This creates a proper relationship between teacher schedules and sections

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'teacherschedule' 
     AND COLUMN_NAME = 'SectionID') = 0,
    'ALTER TABLE `teacherschedule` ADD COLUMN `SectionID` int(11) DEFAULT NULL',
    'SELECT "SectionID column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint (if it doesn't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'teacherschedule' 
     AND CONSTRAINT_NAME = 'teacherschedule_ibfk_section') = 0
    AND
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'teacherschedule' 
     AND COLUMN_NAME = 'SectionID') > 0,
    'ALTER TABLE `teacherschedule` ADD CONSTRAINT `teacherschedule_ibfk_section` FOREIGN KEY (`SectionID`) REFERENCES `section` (`SectionID`) ON DELETE SET NULL',
    'SELECT "Foreign key already exists or SectionID column does not exist, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
