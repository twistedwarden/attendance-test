-- Add enrollment status field to studentrecord table
ALTER TABLE `studentrecord` 
ADD COLUMN `EnrollmentStatus` ENUM('enrolled', 'pending', 'rejected') NOT NULL DEFAULT 'pending';
