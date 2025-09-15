CREATE TABLE IF NOT EXISTS `teacherrecord` (
  `TeacherID` int NOT NULL AUTO_INCREMENT,
  `FullName` varchar(150) NOT NULL,
  `ContactInfo` varchar(255) DEFAULT NULL,
  `UserID` int DEFAULT NULL,
  `HireDate` date DEFAULT NULL,
  `Status` enum('Active','Inactive') DEFAULT 'Active',
  PRIMARY KEY (`TeacherID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `teacherrecord_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `useraccount` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


