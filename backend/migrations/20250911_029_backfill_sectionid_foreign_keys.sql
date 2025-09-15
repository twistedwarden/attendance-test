-- Backfill SectionID foreign keys in studentrecord and teacherschedule tables
-- This populates the foreign key relationships based on existing Section column values

-- Update studentrecord SectionID based on Section and GradeLevel
UPDATE studentrecord s
LEFT JOIN section sec ON sec.SectionName = s.Section AND sec.GradeLevel = s.GradeLevel
SET s.SectionID = sec.SectionID
WHERE s.SectionID IS NULL AND s.Section IS NOT NULL AND s.GradeLevel IS NOT NULL;

-- Update teacherschedule SectionID based on Section and GradeLevel
UPDATE teacherschedule t
LEFT JOIN section sec ON sec.SectionName = t.Section AND sec.GradeLevel = t.GradeLevel
SET t.SectionID = sec.SectionID
WHERE t.SectionID IS NULL AND t.Section IS NOT NULL AND t.GradeLevel IS NOT NULL;
