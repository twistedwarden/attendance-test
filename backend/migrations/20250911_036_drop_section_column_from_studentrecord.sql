-- Drop Section column from studentrecord table
-- The SectionID foreign key provides the same information through the section table

-- First, ensure all records have SectionID populated before dropping Section column
-- This handles any remaining records that might not have SectionID set
UPDATE studentrecord sr
LEFT JOIN section s ON s.SectionID = sr.SectionID
SET sr.SectionID = (
    SELECT sec.SectionID 
    FROM section sec 
    WHERE sec.SectionName = sr.Section 
    LIMIT 1
)
WHERE sr.SectionID IS NULL 
AND sr.Section IS NOT NULL 
AND sr.Section != '';

-- Now drop the redundant Section column
ALTER TABLE `studentrecord` DROP COLUMN `Section`;

-- Note: Section information can now be obtained by joining with the section table:
-- SELECT sr.*, s.SectionName, s.GradeLevel 
-- FROM studentrecord sr 
-- LEFT JOIN section s ON s.SectionID = sr.SectionID
