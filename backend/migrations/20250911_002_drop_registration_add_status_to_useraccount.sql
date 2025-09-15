-- Drop registration table if it exists
DROP TABLE IF EXISTS `registration`;

-- Add Status column to useraccount if it does not exist
ALTER TABLE `useraccount`
  ADD COLUMN IF NOT EXISTS `Status` ENUM('Active','Pending','Disabled') DEFAULT 'Pending' AFTER `Role`;


