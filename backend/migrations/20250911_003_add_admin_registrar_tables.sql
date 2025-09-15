-- Create adminrecord table
CREATE TABLE IF NOT EXISTS `adminrecord` (
  `AdminID` int NOT NULL AUTO_INCREMENT,
  `FullName` varchar(150) NOT NULL,
  `ContactInfo` varchar(255) DEFAULT NULL,
  `UserID` int DEFAULT NULL,
  `HireDate` date DEFAULT NULL,
  `Status` enum('Active','Inactive') DEFAULT 'Active',
  PRIMARY KEY (`AdminID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `adminrecord_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `useraccount` (`UserID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create registrarrecord table
CREATE TABLE IF NOT EXISTS `registrarrecord` (
  `RegistrarID` int NOT NULL AUTO_INCREMENT,
  `FullName` varchar(150) NOT NULL,
  `ContactInfo` varchar(255) DEFAULT NULL,
  `UserID` int DEFAULT NULL,
  `HireDate` date DEFAULT NULL,
  `Status` enum('Active','Inactive') DEFAULT 'Active',
  PRIMARY KEY (`RegistrarID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `registrarrecord_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `useraccount` (`UserID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


