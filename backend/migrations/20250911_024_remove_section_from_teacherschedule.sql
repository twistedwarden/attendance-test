-- Remove Section column from teacherschedule table (if it exists)
-- This column is being replaced by a foreign key relationship to the section table

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'teacherschedule' 
     AND COLUMN_NAME = 'Section') > 0,
    'ALTER TABLE `teacherschedule` DROP COLUMN `Section`',
    'SELECT "Section column does not exist, skipping drop" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
