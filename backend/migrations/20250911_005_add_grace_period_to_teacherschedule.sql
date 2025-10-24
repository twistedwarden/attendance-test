-- Add grace period column to teacherschedule table (if it doesn't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'teacherschedule' 
     AND COLUMN_NAME = 'GracePeriod') = 0,
    'ALTER TABLE `teacherschedule` ADD COLUMN `GracePeriod` int(11) DEFAULT 15 COMMENT ''Grace period in minutes for late arrivals'' AFTER `DayOfWeek`',
    'SELECT "GracePeriod column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
