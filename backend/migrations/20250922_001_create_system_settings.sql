-- Create system_settings table to store feature toggles and global config
CREATE TABLE IF NOT EXISTS `system_settings` (
  `SettingKey` varchar(100) NOT NULL,
  `SettingValue` varchar(255) NOT NULL,
  `UpdatedBy` int(11) DEFAULT NULL,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`SettingKey`),
  KEY `UpdatedBy` (`UpdatedBy`),
  CONSTRAINT `system_settings_ibfk_1` FOREIGN KEY (`UpdatedBy`) REFERENCES `useraccount` (`UserID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Seed default enrollment toggle to enabled
INSERT INTO `system_settings` (`SettingKey`, `SettingValue`) VALUES ('enrollment_enabled', 'true')
ON DUPLICATE KEY UPDATE `SettingValue` = `SettingValue`;


