-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3307
-- Generation Time: Sep 02, 2025 at 10:23 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `biometric`
--
CREATE DATABASE IF NOT EXISTS `attendance` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `attendance`;

-- --------------------------------------------------------

--
-- Table structure for table `attendancelog`
--

CREATE TABLE `attendancelog` (
  `AttendanceID` int(11) NOT NULL,
  `StudentID` int(11) NOT NULL,
  `Date` date NOT NULL,
  `TimeIn` time DEFAULT NULL,
  `TimeOut` time DEFAULT NULL,
  `Status` enum('Present','Absent','Late','Excused') NOT NULL,
  `ValidatedBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendancereport`
--

CREATE TABLE `attendancereport` (
  `ReportID` int(11) NOT NULL,
  `GeneratedBy` int(11) NOT NULL,
  `StudentID` int(11) DEFAULT NULL,
  `ScheduleID` int(11) DEFAULT NULL,
  `DateRangeStart` date NOT NULL,
  `DateRangeEnd` date NOT NULL,
  `ReportType` enum('Daily','Weekly','Monthly','Per Subject','Per Section') NOT NULL,
  `GeneratedDate` datetime DEFAULT current_timestamp(),
  `ReportFile` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`ReportFile`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audittrail`
--

CREATE TABLE `audittrail` (
  `AuditID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `Action` text NOT NULL,
  `TableAffected` varchar(100) DEFAULT NULL,
  `RecordID` int(11) DEFAULT NULL,
  `ActionDateTime` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `excuseletter`
--

CREATE TABLE `excuseletter` (
  `LetterID` int(11) NOT NULL,
  `StudentID` int(11) NOT NULL,
  `ParentID` int(11) NOT NULL,
  `DateFiled` date NOT NULL,
  `Reason` text NOT NULL,
  `AttachmentFile` varchar(255) DEFAULT NULL,
  `Status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `ReviewedBy` int(11) DEFAULT NULL,
  `ReviewedDate` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `loginactivity`
--

CREATE TABLE `loginactivity` (
  `LoginID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `LoginTime` datetime DEFAULT current_timestamp(),
  `LogoutTime` datetime DEFAULT NULL,
  `IPAddress` varchar(100) DEFAULT NULL,
  `DeviceInfo` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `NotificationID` int(11) NOT NULL,
  `RecipientID` int(11) NOT NULL,
  `DateSent` datetime DEFAULT current_timestamp(),
  `Message` text NOT NULL,
  `Status` enum('Unread','Read') DEFAULT 'Unread'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `parent`
--

CREATE TABLE `parent` (
  `ParentID` int(11) NOT NULL,
  `FullName` varchar(150) NOT NULL,
  `ContactInfo` varchar(255) DEFAULT NULL,
  `UserID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `registration`
--

CREATE TABLE `registration` (
  `RegistrationID` int(11) NOT NULL,
  `UserType` enum('Parent','Teacher') NOT NULL,
  `FullName` varchar(150) NOT NULL,
  `ContactInfo` varchar(255) DEFAULT NULL,
  `Username` varchar(100) NOT NULL,
  `PasswordHash` varchar(255) NOT NULL,
  `Status` enum('Pending','Approved','Denied') DEFAULT 'Pending',
  `ReviewedBy` int(11) DEFAULT NULL,
  `ReviewedDate` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `studentrecord`
--

CREATE TABLE `studentrecord` (
  `StudentID` int(11) NOT NULL,
  `FullName` varchar(150) NOT NULL,
  `GradeLevel` varchar(50) DEFAULT NULL,
  `Section` varchar(50) DEFAULT NULL,
  `FingerprintTemplate` blob DEFAULT NULL,
  `ParentID` int(11) DEFAULT NULL,
  `CreatedBy` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `studentsubject`
--

CREATE TABLE `studentsubject` (
  `StudentSubjectID` int(11) NOT NULL,
  `StudentID` int(11) NOT NULL,
  `SubjectID` int(11) NOT NULL,
  `TeacherID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subject`
--

CREATE TABLE `subject` (
  `SubjectID` int(11) NOT NULL,
  `SubjectName` varchar(100) NOT NULL,
  `Description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teacherschedule`
--

CREATE TABLE `teacherschedule` (
  `ScheduleID` int(11) NOT NULL,
  `TeacherID` int(11) NOT NULL,
  `SubjectID` int(11) NOT NULL,
  `GradeLevel` varchar(50) DEFAULT NULL,
  `Section` varchar(50) DEFAULT NULL,
  `TimeIn` time NOT NULL,
  `TimeOut` time NOT NULL,
  `DayOfWeek` enum('Mon','Tue','Wed','Thu','Fri','Sat','Sun') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `useraccount`
--

CREATE TABLE `useraccount` (
  `UserID` int(11) NOT NULL,
  `Username` varchar(100) NOT NULL,
  `PasswordHash` varchar(255) NOT NULL,
  `Role` enum('Student','Parent','Teacher','Registrar','Admin','SuperAdmin') NOT NULL,
  `Status` enum('Active','Pending','Disabled') DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendancelog`
--
ALTER TABLE `attendancelog`
  ADD PRIMARY KEY (`AttendanceID`),
  ADD KEY `StudentID` (`StudentID`),
  ADD KEY `ValidatedBy` (`ValidatedBy`);

--
-- Indexes for table `attendancereport`
--
ALTER TABLE `attendancereport`
  ADD PRIMARY KEY (`ReportID`),
  ADD KEY `GeneratedBy` (`GeneratedBy`),
  ADD KEY `StudentID` (`StudentID`),
  ADD KEY `ScheduleID` (`ScheduleID`);

--
-- Indexes for table `audittrail`
--
ALTER TABLE `audittrail`
  ADD PRIMARY KEY (`AuditID`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `excuseletter`
--
ALTER TABLE `excuseletter`
  ADD PRIMARY KEY (`LetterID`),
  ADD KEY `StudentID` (`StudentID`),
  ADD KEY `ParentID` (`ParentID`),
  ADD KEY `ReviewedBy` (`ReviewedBy`);

--
-- Indexes for table `loginactivity`
--
ALTER TABLE `loginactivity`
  ADD PRIMARY KEY (`LoginID`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`NotificationID`),
  ADD KEY `RecipientID` (`RecipientID`);

--
-- Indexes for table `parent`
--
ALTER TABLE `parent`
  ADD PRIMARY KEY (`ParentID`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `registration`
--
ALTER TABLE `registration`
  ADD PRIMARY KEY (`RegistrationID`),
  ADD KEY `ReviewedBy` (`ReviewedBy`);

--
-- Indexes for table `studentrecord`
--
ALTER TABLE `studentrecord`
  ADD PRIMARY KEY (`StudentID`),
  ADD KEY `ParentID` (`ParentID`),
  ADD KEY `CreatedBy` (`CreatedBy`);

--
-- Indexes for table `studentsubject`
--
ALTER TABLE `studentsubject`
  ADD PRIMARY KEY (`StudentSubjectID`),
  ADD KEY `StudentID` (`StudentID`),
  ADD KEY `SubjectID` (`SubjectID`),
  ADD KEY `TeacherID` (`TeacherID`);

--
-- Indexes for table `subject`
--
ALTER TABLE `subject`
  ADD PRIMARY KEY (`SubjectID`),
  ADD UNIQUE KEY `SubjectName` (`SubjectName`);

--
-- Indexes for table `teacherschedule`
--
ALTER TABLE `teacherschedule`
  ADD PRIMARY KEY (`ScheduleID`),
  ADD KEY `TeacherID` (`TeacherID`),
  ADD KEY `SubjectID` (`SubjectID`);

--
-- Indexes for table `useraccount`
--
ALTER TABLE `useraccount`
  ADD PRIMARY KEY (`UserID`),
  ADD UNIQUE KEY `Username` (`Username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendancelog`
--
ALTER TABLE `attendancelog`
  MODIFY `AttendanceID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendancereport`
--
ALTER TABLE `attendancereport`
  MODIFY `ReportID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audittrail`
--
ALTER TABLE `audittrail`
  MODIFY `AuditID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `excuseletter`
--
ALTER TABLE `excuseletter`
  MODIFY `LetterID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `loginactivity`
--
ALTER TABLE `loginactivity`
  MODIFY `LoginID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `NotificationID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `parent`
--
ALTER TABLE `parent`
  MODIFY `ParentID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `registration`
--
ALTER TABLE `registration`
  MODIFY `RegistrationID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `studentrecord`
--
ALTER TABLE `studentrecord`
  MODIFY `StudentID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `studentsubject`
--
ALTER TABLE `studentsubject`
  MODIFY `StudentSubjectID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subject`
--
ALTER TABLE `subject`
  MODIFY `SubjectID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `teacherschedule`
--
ALTER TABLE `teacherschedule`
  MODIFY `ScheduleID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `useraccount`
--
ALTER TABLE `useraccount`
  MODIFY `UserID` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendancelog`
--
ALTER TABLE `attendancelog`
  ADD CONSTRAINT `attendancelog_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `studentrecord` (`StudentID`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendancelog_ibfk_2` FOREIGN KEY (`ValidatedBy`) REFERENCES `useraccount` (`UserID`) ON DELETE SET NULL;

--
-- Constraints for table `attendancereport`
--
ALTER TABLE `attendancereport`
  ADD CONSTRAINT `attendancereport_ibfk_1` FOREIGN KEY (`GeneratedBy`) REFERENCES `useraccount` (`UserID`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendancereport_ibfk_2` FOREIGN KEY (`StudentID`) REFERENCES `studentrecord` (`StudentID`) ON DELETE SET NULL,
  ADD CONSTRAINT `attendancereport_ibfk_3` FOREIGN KEY (`ScheduleID`) REFERENCES `teacherschedule` (`ScheduleID`) ON DELETE SET NULL;

--
-- Constraints for table `audittrail`
--
ALTER TABLE `audittrail`
  ADD CONSTRAINT `audittrail_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `useraccount` (`UserID`) ON DELETE CASCADE;

--
-- Constraints for table `excuseletter`
--
ALTER TABLE `excuseletter`
  ADD CONSTRAINT `excuseletter_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `studentrecord` (`StudentID`) ON DELETE CASCADE,
  ADD CONSTRAINT `excuseletter_ibfk_2` FOREIGN KEY (`ParentID`) REFERENCES `parent` (`ParentID`) ON DELETE CASCADE,
  ADD CONSTRAINT `excuseletter_ibfk_3` FOREIGN KEY (`ReviewedBy`) REFERENCES `useraccount` (`UserID`) ON DELETE SET NULL;

--
-- Constraints for table `loginactivity`
--
ALTER TABLE `loginactivity`
  ADD CONSTRAINT `loginactivity_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `useraccount` (`UserID`) ON DELETE CASCADE;

--
-- Constraints for table `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `notification_ibfk_1` FOREIGN KEY (`RecipientID`) REFERENCES `useraccount` (`UserID`) ON DELETE CASCADE;

--
-- Constraints for table `parent`
--
ALTER TABLE `parent`
  ADD CONSTRAINT `parent_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `useraccount` (`UserID`) ON DELETE CASCADE;

--
-- Constraints for table `registration`
--
ALTER TABLE `registration`
  ADD CONSTRAINT `registration_ibfk_1` FOREIGN KEY (`ReviewedBy`) REFERENCES `useraccount` (`UserID`) ON DELETE SET NULL;

--
-- Constraints for table `studentrecord`
--
ALTER TABLE `studentrecord`
  ADD CONSTRAINT `studentrecord_ibfk_1` FOREIGN KEY (`ParentID`) REFERENCES `parent` (`ParentID`) ON DELETE SET NULL,
  ADD CONSTRAINT `studentrecord_ibfk_2` FOREIGN KEY (`CreatedBy`) REFERENCES `useraccount` (`UserID`) ON DELETE CASCADE;

--
-- Constraints for table `studentsubject`
--
ALTER TABLE `studentsubject`
  ADD CONSTRAINT `studentsubject_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `studentrecord` (`StudentID`) ON DELETE CASCADE,
  ADD CONSTRAINT `studentsubject_ibfk_2` FOREIGN KEY (`SubjectID`) REFERENCES `subject` (`SubjectID`) ON DELETE CASCADE,
  ADD CONSTRAINT `studentsubject_ibfk_3` FOREIGN KEY (`TeacherID`) REFERENCES `useraccount` (`UserID`) ON DELETE CASCADE;

--
-- Constraints for table `teacherschedule`
--
ALTER TABLE `teacherschedule`
  ADD CONSTRAINT `teacherschedule_ibfk_1` FOREIGN KEY (`TeacherID`) REFERENCES `useraccount` (`UserID`) ON DELETE CASCADE,
  ADD CONSTRAINT `teacherschedule_ibfk_2` FOREIGN KEY (`SubjectID`) REFERENCES `subject` (`SubjectID`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
