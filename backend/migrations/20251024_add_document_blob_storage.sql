-- Add BLOB storage columns to enrollment_documents table for compressed file storage
-- This migration enables storing documents as compressed BLOBs in the database

-- Add columns for file storage (using conditional logic for MySQL compatibility)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'enrollment_documents' 
     AND COLUMN_NAME = 'FileData') = 0,
    'ALTER TABLE `enrollment_documents` ADD COLUMN `FileData` LONGBLOB DEFAULT NULL AFTER `Documents`',
    'SELECT "FileData column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'enrollment_documents' 
     AND COLUMN_NAME = 'FileName') = 0,
    'ALTER TABLE `enrollment_documents` ADD COLUMN `FileName` VARCHAR(255) DEFAULT NULL AFTER `FileData`',
    'SELECT "FileName column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'enrollment_documents' 
     AND COLUMN_NAME = 'FileSize') = 0,
    'ALTER TABLE `enrollment_documents` ADD COLUMN `FileSize` INT DEFAULT NULL AFTER `FileName`',
    'SELECT "FileSize column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'enrollment_documents' 
     AND COLUMN_NAME = 'MimeType') = 0,
    'ALTER TABLE `enrollment_documents` ADD COLUMN `MimeType` VARCHAR(100) DEFAULT NULL AFTER `FileSize`',
    'SELECT "MimeType column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'enrollment_documents' 
     AND COLUMN_NAME = 'IsCompressed') = 0,
    'ALTER TABLE `enrollment_documents` ADD COLUMN `IsCompressed` BOOLEAN DEFAULT FALSE AFTER `MimeType`',
    'SELECT "IsCompressed column already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for better performance on file lookups (if it doesn't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'enrollment_documents' 
     AND INDEX_NAME = 'idx_document_file') = 0,
    'ALTER TABLE `enrollment_documents` ADD INDEX `idx_document_file` (`FileName`, `FileSize`)',
    'SELECT "idx_document_file index already exists, skipping add" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add comment to document the new structure
ALTER TABLE `enrollment_documents` 
COMMENT = 'Stores enrollment documents with optional compressed BLOB storage';
