-- Add constraints to prevent schedule overlaps
-- This migration adds unique constraints to prevent:
-- 1. Teachers from being assigned to multiple classes at the same time
-- 2. Sections from being scheduled for multiple subjects at the same time

-- First, remove any existing duplicate schedules that would violate the new constraints
-- This is a safety measure in case there are already conflicting schedules

-- Remove duplicate teacher schedules (keep the one with the lowest ScheduleID)
DELETE ts1 FROM teacherschedule ts1
INNER JOIN teacherschedule ts2 
WHERE ts1.ScheduleID > ts2.ScheduleID 
AND ts1.TeacherID = ts2.TeacherID 
AND ts1.DayOfWeek = ts2.DayOfWeek
AND ts1.TimeIn = ts2.TimeIn 
AND ts1.TimeOut = ts2.TimeOut;

-- Remove duplicate section schedules (keep the one with the lowest ScheduleID)
DELETE ts1 FROM teacherschedule ts1
INNER JOIN teacherschedule ts2 
WHERE ts1.ScheduleID > ts2.ScheduleID 
AND ts1.SectionID = ts2.SectionID 
AND ts1.SectionID IS NOT NULL
AND ts1.DayOfWeek = ts2.DayOfWeek
AND ts1.TimeIn = ts2.TimeIn 
AND ts1.TimeOut = ts2.TimeOut;

-- Add unique constraint to prevent teacher overlaps
-- This ensures a teacher cannot be assigned to multiple classes at the same time
ALTER TABLE `teacherschedule` 
ADD CONSTRAINT `unique_teacher_time` 
UNIQUE (`TeacherID`, `DayOfWeek`, `TimeIn`, `TimeOut`);

-- Add unique constraint to prevent section overlaps
-- This ensures a section cannot be scheduled for multiple subjects at the same time
ALTER TABLE `teacherschedule` 
ADD CONSTRAINT `unique_section_time` 
UNIQUE (`SectionID`, `DayOfWeek`, `TimeIn`, `TimeOut`);

-- Add index for better performance on overlap checks
CREATE INDEX `idx_teacher_day_time` ON `teacherschedule` (`TeacherID`, `DayOfWeek`, `TimeIn`, `TimeOut`);
CREATE INDEX `idx_section_day_time` ON `teacherschedule` (`SectionID`, `DayOfWeek`, `TimeIn`, `TimeOut`);

-- Note: These constraints will prevent:
-- 1. A teacher from being assigned to multiple classes at the same time on the same day
-- 2. A section from being scheduled for multiple subjects at the same time on the same day
-- 3. Duplicate schedule entries for the same teacher/section, day, and time

-- The application-level validation in scheduleValidation.js provides more detailed
-- overlap checking for time ranges that partially overlap (e.g., 9:00-10:00 vs 9:30-10:30)
