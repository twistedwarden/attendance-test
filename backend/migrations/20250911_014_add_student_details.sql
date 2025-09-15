-- Add additional student information fields
ALTER TABLE `studentrecord` 
ADD COLUMN `DateOfBirth` DATE,
ADD COLUMN `Gender` ENUM('Male', 'Female', 'Other') NOT NULL DEFAULT 'Other',
ADD COLUMN `PlaceOfBirth` VARCHAR(255),
ADD COLUMN `Nationality` VARCHAR(100) DEFAULT 'Filipino',
ADD COLUMN `Address` TEXT;

-- Add relationship field to parent table
ALTER TABLE `parent` 
ADD COLUMN `Relationship` ENUM('Father', 'Mother', 'Guardian') NOT NULL DEFAULT 'Guardian';
