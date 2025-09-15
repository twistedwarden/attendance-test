-- Add status field to studentrecord table

-- Add status column to studentrecord table
ALTER TABLE `studentrecord` 
ADD COLUMN `Status` ENUM('Active','Archived') DEFAULT 'Active' AFTER `ParentID`;

-- Update existing records to have Active status
UPDATE `studentrecord` SET `Status` = 'Active' WHERE `Status` IS NULL;
