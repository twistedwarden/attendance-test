-- Remove Section column from teacherschedule table
-- This column is being replaced by a foreign key relationship to the section table

ALTER TABLE `teacherschedule` DROP COLUMN `Section`;
