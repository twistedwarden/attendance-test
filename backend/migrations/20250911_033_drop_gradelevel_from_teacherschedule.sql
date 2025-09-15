-- Drop GradeLevel column from teacherschedule table
-- Grade level information is now available through the SectionID foreign key relationship

-- First, ensure all records have SectionID populated before dropping GradeLevel
-- This handles any remaining records that might not have SectionID set
UPDATE teacherschedule ts
LEFT JOIN section sec ON sec.SectionID = ts.SectionID
SET ts.SectionID = (
    SELECT s.SectionID 
    FROM section s 
    WHERE s.GradeLevel = ts.GradeLevel 
    LIMIT 1
)
WHERE ts.SectionID IS NULL 
AND ts.GradeLevel IS NOT NULL;

-- Now drop the GradeLevel column
ALTER TABLE `teacherschedule` DROP COLUMN `GradeLevel`;

-- Note: Grade level information can now be obtained by joining with the section table:
-- SELECT ts.*, s.GradeLevel 
-- FROM teacherschedule ts 
-- LEFT JOIN section s ON s.SectionID = ts.SectionID
