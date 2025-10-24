-- Add SectionID foreign key to studentrecord table (if it doesn't exist)
-- This creates a proper relationship between students and sections

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'studentrecord' 
     AND COLUMN_NAME = 'SectionID') = 0,
    'ALTER TABLE `studentrecord` ADD COLUMN `SectionID` int(11) DEFAULT NULL',
    'SELECT "SectionID column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint (if it doesn't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'studentrecord' 
     AND CONSTRAINT_NAME = 'studentrecord_ibfk_section') = 0
    AND
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'studentrecord' 
     AND COLUMN_NAME = 'SectionID') > 0,
    'ALTER TABLE `studentrecord` ADD CONSTRAINT `studentrecord_ibfk_section` FOREIGN KEY (`SectionID`) REFERENCES `section` (`SectionID`) ON DELETE SET NULL',
    'SELECT "Foreign key already exists or SectionID column does not exist, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
