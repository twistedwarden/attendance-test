-- Backfill teacher schedules with section data
-- This populates Section and SectionID based on GradeLevel and Subject combinations

-- Update teacher schedules with Section and SectionID based on GradeLevel
UPDATE teacherschedule ts
LEFT JOIN section sec ON sec.GradeLevel = ts.GradeLevel AND sec.SectionName = 'A'
SET ts.Section = sec.SectionName, ts.SectionID = sec.SectionID
WHERE ts.Section IS NULL AND ts.SectionID IS NULL AND ts.GradeLevel IS NOT NULL;

-- For schedules without GradeLevel, set default sections based on Subject
-- Mathematics -> Grade 1-A, Science -> Grade 2-B, English -> Grade 3-A
UPDATE teacherschedule ts
LEFT JOIN section sec ON (
  (ts.SubjectID = 1 AND sec.GradeLevel = '1' AND sec.SectionName = 'A') OR  -- Mathematics -> Grade 1-A
  (ts.SubjectID = 2 AND sec.GradeLevel = '2' AND sec.SectionName = 'B') OR  -- Science -> Grade 2-B  
  (ts.SubjectID = 3 AND sec.GradeLevel = '3' AND sec.SectionName = 'A')     -- English -> Grade 3-A
)
SET ts.Section = sec.SectionName, ts.SectionID = sec.SectionID, ts.GradeLevel = sec.GradeLevel
WHERE ts.Section IS NULL AND ts.SectionID IS NULL AND ts.GradeLevel IS NULL;
