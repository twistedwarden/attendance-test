-- Add enrollment_documents table for storing parent registration documents

CREATE TABLE IF NOT EXISTS `enrollment_documents` (
  `DocumentID` int(11) NOT NULL AUTO_INCREMENT,
  `StudentID` int(11) NOT NULL,
  `RegistrationID` int(11) NOT NULL,
  `Documents` json DEFAULT NULL,
  `AdditionalInfo` text DEFAULT NULL,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`DocumentID`),
  KEY `StudentID` (`StudentID`),
  KEY `RegistrationID` (`RegistrationID`),
  CONSTRAINT `enrollment_documents_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `studentrecord` (`StudentID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
