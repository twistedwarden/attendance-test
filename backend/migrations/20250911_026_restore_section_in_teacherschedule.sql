-- Restore Section column in teacherschedule table
-- This column is needed for direct teacher-section relationship

ALTER TABLE `teacherschedule` ADD COLUMN `Section` varchar(50) DEFAULT NULL AFTER `GradeLevel`;
