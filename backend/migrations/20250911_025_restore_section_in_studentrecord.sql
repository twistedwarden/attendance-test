-- Restore Section column in studentrecord table
-- This column is needed for direct student-section relationship

ALTER TABLE `studentrecord` ADD COLUMN `Section` varchar(50) DEFAULT NULL AFTER `GradeLevel`;
