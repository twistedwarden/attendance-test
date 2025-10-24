-- Add foreign key constraint from enrollment_documents to registration table (if both exist)

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'enrollment_documents' 
     AND COLUMN_NAME = 'RegistrationID') > 0
    AND
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'registration') > 0,
    'ALTER TABLE `enrollment_documents` ADD CONSTRAINT `enrollment_documents_ibfk_2` FOREIGN KEY (`RegistrationID`) REFERENCES `registration` (`RegistrationID`) ON DELETE CASCADE',
    'SELECT "RegistrationID column or registration table does not exist, skipping foreign key" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
