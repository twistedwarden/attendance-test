-- Remove Section varchar column from teacherschedule table
-- This eliminates redundancy since we have SectionID foreign key

-- First, ensure all records have SectionID populated
UPDATE teacherschedule ts
LEFT JOIN section sec ON sec.SectionName = ts.Section AND sec.GradeLevel = ts.GradeLevel
SET ts.SectionID = sec.SectionID
WHERE ts.SectionID IS NULL AND ts.Section IS NOT NULL AND ts.GradeLevel IS NOT NULL;

-- Now remove the Section column
ALTER TABLE `teacherschedule` DROP COLUMN `Section`;
