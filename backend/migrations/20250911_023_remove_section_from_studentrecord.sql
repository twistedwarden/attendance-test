-- Remove Section column from studentrecord table (if it exists)
-- This column is being replaced by a foreign key relationship to the section table

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'studentrecord' 
     AND COLUMN_NAME = 'Section') > 0,
    'ALTER TABLE `studentrecord` DROP COLUMN `Section`',
    'SELECT "Section column does not exist, skipping drop" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
