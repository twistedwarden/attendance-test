-- Restore Section column in teacherschedule table (if it doesn't exist)
-- This column is needed for direct teacher-section relationship

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'teacherschedule' 
     AND COLUMN_NAME = 'Section') = 0,
    'ALTER TABLE `teacherschedule` ADD COLUMN `Section` varchar(50) DEFAULT NULL',
    'SELECT "Section column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
