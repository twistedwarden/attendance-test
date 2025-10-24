-- Add status field to studentrecord table

-- Add status column to studentrecord table (if it doesn't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'studentrecord' 
     AND COLUMN_NAME = 'Status') = 0,
    'ALTER TABLE `studentrecord` ADD COLUMN `Status` ENUM(''Active'',''Archived'') DEFAULT ''Active'' AFTER `ParentID`',
    'SELECT "Status column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing records to have Active status (only if column was just added)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'studentrecord' 
     AND COLUMN_NAME = 'Status') > 0,
    'UPDATE `studentrecord` SET `Status` = ''Active'' WHERE `Status` IS NULL',
    'SELECT "Status column does not exist, skipping update" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
