-- Add grace period column to teacherschedule table
ALTER TABLE `teacherschedule` 
ADD COLUMN `GracePeriod` int(11) DEFAULT 15 COMMENT 'Grace period in minutes for late arrivals' AFTER `DayOfWeek`;
