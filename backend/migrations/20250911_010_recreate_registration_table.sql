-- Recreate registration table for parent registrations

CREATE TABLE IF NOT EXISTS `registration` (
  `RegistrationID` int(11) NOT NULL AUTO_INCREMENT,
  `UserType` enum('Parent','Teacher') NOT NULL DEFAULT 'Parent',
  `FullName` varchar(255) NOT NULL,
  `ContactInfo` varchar(255) DEFAULT NULL,
  `Username` varchar(255) NOT NULL,
  `PasswordHash` varchar(255) NOT NULL,
  `Status` enum('Pending','Approved','Denied') NOT NULL DEFAULT 'Pending',
  `ReviewedBy` int(11) DEFAULT NULL,
  `ReviewedDate` datetime DEFAULT NULL,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`RegistrationID`),
  UNIQUE KEY `Username` (`Username`),
  KEY `Status` (`Status`),
  KEY `ReviewedBy` (`ReviewedBy`),
  CONSTRAINT `registration_ibfk_1` FOREIGN KEY (`ReviewedBy`) REFERENCES `useraccount` (`UserID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
