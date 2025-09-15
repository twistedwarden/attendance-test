-- Core schema initialization without `registration`

-- useraccount
CREATE TABLE IF NOT EXISTS `useraccount` (
  `UserID` int(11) NOT NULL AUTO_INCREMENT,
  `Username` varchar(100) NOT NULL,
  `PasswordHash` varchar(255) NOT NULL,
  `Role` enum('Student','Parent','Teacher','Registrar','Admin','SuperAdmin') NOT NULL,
  `Status` enum('Active','Pending','Disabled') DEFAULT 'Pending',
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `Username` (`Username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- parent
CREATE TABLE IF NOT EXISTS `parent` (
  `ParentID` int(11) NOT NULL AUTO_INCREMENT,
  `FullName` varchar(150) NOT NULL,
  `ContactInfo` varchar(255) DEFAULT NULL,
  `UserID` int(11) NOT NULL,
  PRIMARY KEY (`ParentID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `parent_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `useraccount` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- subject
CREATE TABLE IF NOT EXISTS `subject` (
  `SubjectID` int(11) NOT NULL AUTO_INCREMENT,
  `SubjectName` varchar(100) NOT NULL,
  `Description` text DEFAULT NULL,
  PRIMARY KEY (`SubjectID`),
  UNIQUE KEY `SubjectName` (`SubjectName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- teacherschedule
CREATE TABLE IF NOT EXISTS `teacherschedule` (
  `ScheduleID` int(11) NOT NULL AUTO_INCREMENT,
  `TeacherID` int(11) NOT NULL,
  `SubjectID` int(11) NOT NULL,
  `GradeLevel` varchar(50) DEFAULT NULL,
  `Section` varchar(50) DEFAULT NULL,
  `TimeIn` time NOT NULL,
  `TimeOut` time NOT NULL,
  `DayOfWeek` enum('Mon','Tue','Wed','Thu','Fri','Sat','Sun') NOT NULL,
  PRIMARY KEY (`ScheduleID`),
  KEY `TeacherID` (`TeacherID`),
  KEY `SubjectID` (`SubjectID`),
  CONSTRAINT `teacherschedule_ibfk_1` FOREIGN KEY (`TeacherID`) REFERENCES `useraccount` (`UserID`) ON DELETE CASCADE,
  CONSTRAINT `teacherschedule_ibfk_2` FOREIGN KEY (`SubjectID`) REFERENCES `subject` (`SubjectID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- studentrecord
CREATE TABLE IF NOT EXISTS `studentrecord` (
  `StudentID` int(11) NOT NULL AUTO_INCREMENT,
  `FullName` varchar(150) NOT NULL,
  `GradeLevel` varchar(50) DEFAULT NULL,
  `Section` varchar(50) DEFAULT NULL,
  `FingerprintTemplate` blob DEFAULT NULL,
  `ParentID` int(11) DEFAULT NULL,
  `CreatedBy` int(11) NOT NULL,
  PRIMARY KEY (`StudentID`),
  KEY `ParentID` (`ParentID`),
  KEY `CreatedBy` (`CreatedBy`),
  CONSTRAINT `studentrecord_ibfk_1` FOREIGN KEY (`ParentID`) REFERENCES `parent` (`ParentID`) ON DELETE SET NULL,
  CONSTRAINT `studentrecord_ibfk_2` FOREIGN KEY (`CreatedBy`) REFERENCES `useraccount` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- studentsubject
CREATE TABLE IF NOT EXISTS `studentsubject` (
  `StudentSubjectID` int(11) NOT NULL AUTO_INCREMENT,
  `StudentID` int(11) NOT NULL,
  `SubjectID` int(11) NOT NULL,
  `TeacherID` int(11) NOT NULL,
  PRIMARY KEY (`StudentSubjectID`),
  KEY `StudentID` (`StudentID`),
  KEY `SubjectID` (`SubjectID`),
  KEY `TeacherID` (`TeacherID`),
  CONSTRAINT `studentsubject_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `studentrecord` (`StudentID`) ON DELETE CASCADE,
  CONSTRAINT `studentsubject_ibfk_2` FOREIGN KEY (`SubjectID`) REFERENCES `subject` (`SubjectID`) ON DELETE CASCADE,
  CONSTRAINT `studentsubject_ibfk_3` FOREIGN KEY (`TeacherID`) REFERENCES `useraccount` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- attendancelog
CREATE TABLE IF NOT EXISTS `attendancelog` (
  `AttendanceID` int(11) NOT NULL AUTO_INCREMENT,
  `StudentID` int(11) NOT NULL,
  `Date` date NOT NULL,
  `TimeIn` time DEFAULT NULL,
  `TimeOut` time DEFAULT NULL,
  `Status` enum('Present','Absent','Late','Excused') NOT NULL,
  `ValidatedBy` int(11) DEFAULT NULL,
  PRIMARY KEY (`AttendanceID`),
  KEY `StudentID` (`StudentID`),
  KEY `ValidatedBy` (`ValidatedBy`),
  CONSTRAINT `attendancelog_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `studentrecord` (`StudentID`) ON DELETE CASCADE,
  CONSTRAINT `attendancelog_ibfk_2` FOREIGN KEY (`ValidatedBy`) REFERENCES `useraccount` (`UserID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- excuseletter
CREATE TABLE IF NOT EXISTS `excuseletter` (
  `LetterID` int(11) NOT NULL AUTO_INCREMENT,
  `StudentID` int(11) NOT NULL,
  `ParentID` int(11) NOT NULL,
  `DateFiled` date NOT NULL,
  `Reason` text NOT NULL,
  `AttachmentFile` varchar(255) DEFAULT NULL,
  `Status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `ReviewedBy` int(11) DEFAULT NULL,
  `ReviewedDate` datetime DEFAULT NULL,
  PRIMARY KEY (`LetterID`),
  KEY `StudentID` (`StudentID`),
  KEY `ParentID` (`ParentID`),
  KEY `ReviewedBy` (`ReviewedBy`),
  CONSTRAINT `excuseletter_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `studentrecord` (`StudentID`) ON DELETE CASCADE,
  CONSTRAINT `excuseletter_ibfk_2` FOREIGN KEY (`ParentID`) REFERENCES `parent` (`ParentID`) ON DELETE CASCADE,
  CONSTRAINT `excuseletter_ibfk_3` FOREIGN KEY (`ReviewedBy`) REFERENCES `useraccount` (`UserID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- notification (preferred)
CREATE TABLE IF NOT EXISTS `notification` (
  `NotificationID` int(11) NOT NULL AUTO_INCREMENT,
  `RecipientID` int(11) NOT NULL,
  `DateSent` datetime DEFAULT current_timestamp(),
  `Message` text NOT NULL,
  `Status` enum('Unread','Read') DEFAULT 'Unread',
  PRIMARY KEY (`NotificationID`),
  KEY `RecipientID` (`RecipientID`),
  CONSTRAINT `notification_ibfk_1` FOREIGN KEY (`RecipientID`) REFERENCES `useraccount` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Fallback notificationlog (if app uses it instead of notification)
CREATE TABLE IF NOT EXISTS `notificationlog` (
  `NotificationID` int NOT NULL AUTO_INCREMENT,
  `RecipientID` int NOT NULL,
  `DateSent` datetime NOT NULL,
  `Message` text NOT NULL,
  PRIMARY KEY (`NotificationID`),
  KEY `RecipientID` (`RecipientID`),
  CONSTRAINT `notificationlog_ibfk_1` FOREIGN KEY (`RecipientID`) REFERENCES `useraccount` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- attendancereport
CREATE TABLE IF NOT EXISTS `attendancereport` (
  `ReportID` int(11) NOT NULL AUTO_INCREMENT,
  `GeneratedBy` int(11) NOT NULL,
  `StudentID` int(11) DEFAULT NULL,
  `ScheduleID` int(11) DEFAULT NULL,
  `DateRangeStart` date NOT NULL,
  `DateRangeEnd` date NOT NULL,
  `ReportType` enum('Daily','Weekly','Monthly','Per Subject','Per Section') NOT NULL,
  `GeneratedDate` datetime DEFAULT current_timestamp(),
  `ReportFile` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`ReportFile`)),
  PRIMARY KEY (`ReportID`),
  KEY `GeneratedBy` (`GeneratedBy`),
  KEY `StudentID` (`StudentID`),
  KEY `ScheduleID` (`ScheduleID`),
  CONSTRAINT `attendancereport_ibfk_1` FOREIGN KEY (`GeneratedBy`) REFERENCES `useraccount` (`UserID`) ON DELETE CASCADE,
  CONSTRAINT `attendancereport_ibfk_2` FOREIGN KEY (`StudentID`) REFERENCES `studentrecord` (`StudentID`) ON DELETE SET NULL,
  CONSTRAINT `attendancereport_ibfk_3` FOREIGN KEY (`ScheduleID`) REFERENCES `teacherschedule` (`ScheduleID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- audittrail
CREATE TABLE IF NOT EXISTS `audittrail` (
  `AuditID` int(11) NOT NULL AUTO_INCREMENT,
  `UserID` int(11) NOT NULL,
  `Action` text NOT NULL,
  `TableAffected` varchar(100) DEFAULT NULL,
  `RecordID` int(11) DEFAULT NULL,
  `ActionDateTime` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`AuditID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `audittrail_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `useraccount` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- loginactivity
CREATE TABLE IF NOT EXISTS `loginactivity` (
  `LoginID` int(11) NOT NULL AUTO_INCREMENT,
  `UserID` int(11) NOT NULL,
  `LoginTime` datetime DEFAULT current_timestamp(),
  `LogoutTime` datetime DEFAULT NULL,
  `IPAddress` varchar(100) DEFAULT NULL,
  `DeviceInfo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`LoginID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `loginactivity_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `useraccount` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


