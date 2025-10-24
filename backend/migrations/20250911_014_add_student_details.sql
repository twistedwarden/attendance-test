-- Add additional student information fields (if they don't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'studentrecord' 
     AND COLUMN_NAME = 'DateOfBirth') = 0,
    'ALTER TABLE `studentrecord` ADD COLUMN `DateOfBirth` DATE',
    'SELECT "DateOfBirth column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'studentrecord' 
     AND COLUMN_NAME = 'Gender') = 0,
    'ALTER TABLE `studentrecord` ADD COLUMN `Gender` ENUM(''Male'', ''Female'', ''Other'') NOT NULL DEFAULT ''Other''',
    'SELECT "Gender column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'studentrecord' 
     AND COLUMN_NAME = 'PlaceOfBirth') = 0,
    'ALTER TABLE `studentrecord` ADD COLUMN `PlaceOfBirth` VARCHAR(255)',
    'SELECT "PlaceOfBirth column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'studentrecord' 
     AND COLUMN_NAME = 'Nationality') = 0,
    'ALTER TABLE `studentrecord` ADD COLUMN `Nationality` VARCHAR(100) DEFAULT ''Filipino''',
    'SELECT "Nationality column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'studentrecord' 
     AND COLUMN_NAME = 'Address') = 0,
    'ALTER TABLE `studentrecord` ADD COLUMN `Address` TEXT',
    'SELECT "Address column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add relationship field to parent table (if it doesn't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'parent' 
     AND COLUMN_NAME = 'Relationship') = 0,
    'ALTER TABLE `parent` ADD COLUMN `Relationship` ENUM(''Father'', ''Mother'', ''Guardian'') NOT NULL DEFAULT ''Guardian''',
    'SELECT "Relationship column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
