-- Drop registration table if it exists
DROP TABLE IF EXISTS `registration`;

-- Add Status column to useraccount if it doesn't exist -- First check if column exists, then add it
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'useraccount' 
  AND COLUMN_NAME = 'Status';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `useraccount` ADD COLUMN `Status` ENUM(''Active'',''Pending'',''Disabled'') DEFAULT ''Pending'' AFTER `Role`', 
  'SELECT ''Column Status already exists'' as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


