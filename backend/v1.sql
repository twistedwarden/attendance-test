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

-- --------------------------------------------------------

--
-- Table structure for table `fingerprint_log`
--

CREATE TABLE `fingerprint_log` (
  `LogID` int(11) NOT NULL,
  `StudentID` int(11) DEFAULT NULL,
  `ESP32DeviceID` varchar(50) NOT NULL,
  `Action` enum('enroll','verify','delete') NOT NULL,
  `Status` enum('success','failed','error') NOT NULL,
  `Timestamp` datetime DEFAULT current_timestamp(),
  `ErrorMessage` text DEFAULT NULL,
  `DeviceIP` varchar(45) DEFAULT NULL,
  `ResponseTime` int(11) DEFAULT NULL COMMENT 'Response time in milliseconds',
  `TemplateSize` int(11) DEFAULT NULL COMMENT 'Size of fingerprint template in bytes',
  `UserAgent` varchar(255) DEFAULT NULL COMMENT 'ESP32 user agent string'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `esp32_devices`
--

CREATE TABLE `esp32_devices` (
  `DeviceID` varchar(50) NOT NULL,
  `DeviceName` varchar(100) NOT NULL,
  `Location` varchar(100) DEFAULT NULL,
  `Status` enum('active','inactive','maintenance') DEFAULT 'active',
  `LastSeen` datetime DEFAULT current_timestamp(),
  `CreatedAt` datetime DEFAULT current_timestamp(),
  `UpdatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `FirmwareVersion` varchar(50) DEFAULT NULL COMMENT 'ESP32 firmware version',
  `HardwareVersion` varchar(50) DEFAULT NULL COMMENT 'ESP32 hardware version',
  `MACAddress` varchar(17) DEFAULT NULL COMMENT 'ESP32 MAC address',
  `WiFiSSID` varchar(100) DEFAULT NULL COMMENT 'Connected WiFi SSID',
  `BatteryLevel` tinyint(4) DEFAULT NULL COMMENT 'Battery level percentage (0-100)',
  `Temperature` decimal(5,2) DEFAULT NULL COMMENT 'Device temperature in Celsius',
  `Uptime` bigint(20) DEFAULT NULL COMMENT 'Device uptime in seconds'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fingerprint_template_backup`
--

CREATE TABLE `fingerprint_template_backup` (
  `BackupID` int(11) NOT NULL,
  `StudentID` int(11) NOT NULL,
  `TemplateData` longblob NOT NULL,
  `TemplateSize` int(11) NOT NULL,
  `BackupDate` datetime DEFAULT current_timestamp(),
  `BackupReason` varchar(100) DEFAULT NULL,
  `CreatedBy` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `esp32_attendance_events`
--

CREATE TABLE `esp32_attendance_events` (
  `EventID` int(11) NOT NULL,
  `StudentID` int(11) NOT NULL,
  `ESP32DeviceID` varchar(50) NOT NULL,
  `EventType` enum('time_in','time_out','break_start','break_end') NOT NULL,
  `EventTimestamp` datetime DEFAULT current_timestamp(),
  `Location` varchar(100) DEFAULT NULL,
  `Notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `esp32_device_alerts`
--

CREATE TABLE `esp32_device_alerts` (
  `AlertID` int(11) NOT NULL,
  `DeviceID` varchar(50) NOT NULL,
  `AlertType` enum('low_battery','high_temperature','connection_lost','hardware_error','maintenance_required') NOT NULL,
  `AlertLevel` enum('info','warning','error','critical') NOT NULL,
  `Message` text NOT NULL,
  `IsResolved` tinyint(1) DEFAULT 0,
  `CreatedAt` datetime DEFAULT current_timestamp(),
  `ResolvedAt` datetime DEFAULT NULL,
  `ResolvedBy` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fingerprint_migrations`
--

CREATE TABLE `fingerprint_migrations` (
  `id` int(11) NOT NULL,
  `migration_file` varchar(255) NOT NULL,
  `executed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fingerprint_log`
--
ALTER TABLE `fingerprint_log`
  ADD PRIMARY KEY (`LogID`),
  ADD KEY `idx_student_id` (`StudentID`),
  ADD KEY `idx_device_id` (`ESP32DeviceID`),
  ADD KEY `idx_timestamp` (`Timestamp`),
  ADD KEY `idx_action` (`Action`),
  ADD KEY `idx_status` (`Status`);

--
-- Indexes for table `esp32_devices`
--
ALTER TABLE `esp32_devices`
  ADD PRIMARY KEY (`DeviceID`),
  ADD KEY `idx_status` (`Status`),
  ADD KEY `idx_last_seen` (`LastSeen`);

--
-- Indexes for table `fingerprint_template_backup`
--
ALTER TABLE `fingerprint_template_backup`
  ADD PRIMARY KEY (`BackupID`),
  ADD KEY `idx_student_id` (`StudentID`),
  ADD KEY `idx_backup_date` (`BackupDate`);

--
-- Indexes for table `esp32_attendance_events`
--
ALTER TABLE `esp32_attendance_events`
  ADD PRIMARY KEY (`EventID`),
  ADD KEY `idx_student_id` (`StudentID`),
  ADD KEY `idx_device_id` (`ESP32DeviceID`),
  ADD KEY `idx_event_timestamp` (`EventTimestamp`),
  ADD KEY `idx_event_type` (`EventType`);

--
-- Indexes for table `esp32_device_alerts`
--
ALTER TABLE `esp32_device_alerts`
  ADD PRIMARY KEY (`AlertID`),
  ADD KEY `idx_device_id` (`DeviceID`),
  ADD KEY `idx_alert_type` (`AlertType`),
  ADD KEY `idx_alert_level` (`AlertLevel`),
  ADD KEY `idx_is_resolved` (`IsResolved`),
  ADD KEY `idx_created_at` (`CreatedAt`);

--
-- Indexes for table `fingerprint_migrations`
--
ALTER TABLE `fingerprint_migrations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `migration_file` (`migration_file`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fingerprint_log`
--
ALTER TABLE `fingerprint_log`
  MODIFY `LogID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `fingerprint_template_backup`
--
ALTER TABLE `fingerprint_template_backup`
  MODIFY `BackupID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `esp32_attendance_events`
--
ALTER TABLE `esp32_attendance_events`
  MODIFY `EventID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `esp32_device_alerts`
--
ALTER TABLE `esp32_device_alerts`
  MODIFY `AlertID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `fingerprint_migrations`
--
ALTER TABLE `fingerprint_migrations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `fingerprint_log`
--
ALTER TABLE `fingerprint_log`
  ADD CONSTRAINT `fingerprint_log_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `studentrecord` (`StudentID`) ON DELETE CASCADE;

--
-- Constraints for table `fingerprint_template_backup`
--
ALTER TABLE `fingerprint_template_backup`
  ADD CONSTRAINT `fingerprint_template_backup_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `studentrecord` (`StudentID`) ON DELETE CASCADE;

--
-- Constraints for table `esp32_attendance_events`
--
ALTER TABLE `esp32_attendance_events`
  ADD CONSTRAINT `esp32_attendance_events_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `studentrecord` (`StudentID`) ON DELETE CASCADE,
  ADD CONSTRAINT `esp32_attendance_events_ibfk_2` FOREIGN KEY (`ESP32DeviceID`) REFERENCES `esp32_devices` (`DeviceID`) ON DELETE CASCADE;

--
-- Constraints for table `esp32_device_alerts`
--
ALTER TABLE `esp32_device_alerts`
  ADD CONSTRAINT `esp32_device_alerts_ibfk_1` FOREIGN KEY (`DeviceID`) REFERENCES `esp32_devices` (`DeviceID`) ON DELETE CASCADE;

-- --------------------------------------------------------

--
-- Create index on studentrecord.FingerprintTemplate for faster lookups
--
CREATE INDEX IF NOT EXISTS `idx_fingerprint_template` ON `studentrecord`(`FingerprintTemplate`(255));

-- --------------------------------------------------------

--
-- Insert sample ESP32 devices for testing
--
INSERT INTO `esp32_devices` (`DeviceID`, `DeviceName`, `Location`, `Status`) VALUES
('ESP32_001', 'Main Entrance Device', 'Main Entrance', 'active'),
('ESP32_002', 'Library Device', 'Library', 'active'),
('ESP32_003', 'Cafeteria Device', 'Cafeteria', 'inactive');

-- --------------------------------------------------------

--
-- Create views for easy monitoring
--

CREATE OR REPLACE VIEW `fingerprint_operations_summary` AS
SELECT 
  DATE(`Timestamp`) as `Date`,
  `Action`,
  `Status`,
  COUNT(*) as `Count`,
  COUNT(DISTINCT `ESP32DeviceID`) as `DeviceCount`,
  COUNT(DISTINCT `StudentID`) as `StudentCount`
FROM `fingerprint_log`
GROUP BY DATE(`Timestamp`), `Action`, `Status`
ORDER BY `Date` DESC, `Action`, `Status`;

CREATE OR REPLACE VIEW `device_status_summary` AS
SELECT 
  d.`DeviceID`,
  d.`DeviceName`,
  d.`Location`,
  d.`Status`,
  d.`LastSeen`,
  COUNT(fl.`LogID`) as `TotalOperations`,
  COUNT(CASE WHEN fl.`Status` = 'success' THEN 1 END) as `SuccessfulOperations`,
  COUNT(CASE WHEN fl.`Status` = 'failed' THEN 1 END) as `FailedOperations`,
  COUNT(CASE WHEN fl.`Status` = 'error' THEN 1 END) as `ErrorOperations`,
  MAX(fl.`Timestamp`) as `LastOperation`
FROM `esp32_devices` d
LEFT JOIN `fingerprint_log` fl ON d.`DeviceID` = fl.`ESP32DeviceID`
GROUP BY d.`DeviceID`, d.`DeviceName`, d.`Location`, d.`Status`, d.`LastSeen`
ORDER BY d.`LastSeen` DESC;

CREATE OR REPLACE VIEW `fingerprint_operations_detailed` AS
SELECT 
  fl.`LogID`,
  fl.`StudentID`,
  sr.`FullName` as `StudentName`,
  fl.`ESP32DeviceID`,
  ed.`DeviceName`,
  ed.`Location` as `DeviceLocation`,
  fl.`Action`,
  fl.`Status`,
  fl.`Timestamp`,
  fl.`ResponseTime`,
  fl.`TemplateSize`,
  fl.`ErrorMessage`,
  fl.`DeviceIP`
FROM `fingerprint_log` fl
LEFT JOIN `studentrecord` sr ON sr.`StudentID` = fl.`StudentID`
LEFT JOIN `esp32_devices` ed ON ed.`DeviceID` = fl.`ESP32DeviceID`
ORDER BY fl.`Timestamp` DESC;

CREATE OR REPLACE VIEW `device_health_summary` AS
SELECT 
  d.`DeviceID`,
  d.`DeviceName`,
  d.`Location`,
  d.`Status`,
  d.`LastSeen`,
  d.`FirmwareVersion`,
  d.`HardwareVersion`,
  d.`BatteryLevel`,
  d.`Temperature`,
  d.`Uptime`,
  COUNT(fl.`LogID`) as `TotalOperations`,
  COUNT(CASE WHEN fl.`Timestamp` >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 END) as `OperationsLastHour`,
  COUNT(CASE WHEN fl.`Timestamp` >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as `OperationsLast24Hours`,
  COUNT(CASE WHEN fl.`Status` = 'success' AND fl.`Timestamp` >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as `SuccessfulOperationsLast24Hours`,
  COUNT(CASE WHEN fl.`Status` = 'error' AND fl.`Timestamp` >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as `ErrorOperationsLast24Hours`,
  CASE 
    WHEN d.`LastSeen` < DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 'offline'
    WHEN d.`BatteryLevel` < 20 THEN 'low_battery'
    WHEN d.`Temperature` > 60 THEN 'overheating'
    WHEN d.`Status` = 'maintenance' THEN 'maintenance'
    ELSE 'healthy'
  END as `HealthStatus`
FROM `esp32_devices` d
LEFT JOIN `fingerprint_log` fl ON d.`DeviceID` = fl.`ESP32DeviceID`
GROUP BY d.`DeviceID`, d.`DeviceName`, d.`Location`, d.`Status`, d.`LastSeen`, 
         d.`FirmwareVersion`, d.`HardwareVersion`, d.`BatteryLevel`, d.`Temperature`, d.`Uptime`
ORDER BY d.`LastSeen` DESC;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
