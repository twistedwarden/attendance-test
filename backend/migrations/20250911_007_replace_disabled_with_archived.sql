-- Replace 'Disabled' with 'Archived' in useraccount Status enum
-- This migration updates the enum values to use more appropriate terminology

-- First, update any existing 'Disabled' records to 'Archived'
UPDATE useraccount SET Status = 'Archived' WHERE Status = 'Disabled';

-- Modify the enum to replace 'Disabled' with 'Archived'
ALTER TABLE useraccount MODIFY COLUMN Status ENUM('Active','Pending','Archived') DEFAULT 'Pending';
