-- Remove EnrollmentStatus column and update Status column to handle enrollment statuses
ALTER TABLE `studentrecord` 
DROP COLUMN `EnrollmentStatus`;

-- Update Status column to include enrollment statuses
ALTER TABLE `studentrecord` 
MODIFY COLUMN `Status` ENUM('Active', 'Archived', 'Pending', 'Rejected') NOT NULL DEFAULT 'Pending';
