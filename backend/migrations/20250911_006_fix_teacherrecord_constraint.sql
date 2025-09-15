-- Fix teacherrecord foreign key constraint to allow user deletion
-- This ensures consistency with other role-specific tables

-- Drop the existing foreign key constraint
ALTER TABLE teacherrecord DROP FOREIGN KEY teacherrecord_ibfk_1;

-- Add the constraint with ON DELETE SET NULL
ALTER TABLE teacherrecord ADD CONSTRAINT teacherrecord_ibfk_1 
FOREIGN KEY (UserID) REFERENCES useraccount (UserID) ON DELETE SET NULL;
