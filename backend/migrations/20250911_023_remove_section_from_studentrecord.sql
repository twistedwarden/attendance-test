-- Remove Section column from studentrecord table
-- This column is being replaced by a foreign key relationship to the section table

ALTER TABLE `studentrecord` DROP COLUMN `Section`;
