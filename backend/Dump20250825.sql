-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: biometricattendancedb
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `attendancelog`
--

DROP TABLE IF EXISTS `attendancelog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendancelog` (
  `AttendanceID` int NOT NULL AUTO_INCREMENT,
  `StudentID` int NOT NULL,
  `Date` date NOT NULL,
  `TimeIn` time DEFAULT NULL,
  `TimeOut` time DEFAULT NULL,
  `Status` enum('Present','Absent','Late','Excused') NOT NULL,
  `ValidatedBy` int DEFAULT NULL,
  PRIMARY KEY (`AttendanceID`),
  KEY `StudentID` (`StudentID`),
  KEY `ValidatedBy` (`ValidatedBy`),
  CONSTRAINT `attendancelog_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `studentrecord` (`StudentID`),
  CONSTRAINT `attendancelog_ibfk_2` FOREIGN KEY (`ValidatedBy`) REFERENCES `useraccount` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendancelog`
--

LOCK TABLES `attendancelog` WRITE;
/*!40000 ALTER TABLE `attendancelog` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendancelog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `excuseletter`
--

DROP TABLE IF EXISTS `excuseletter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `excuseletter` (
  `LetterID` int NOT NULL AUTO_INCREMENT,
  `StudentID` int NOT NULL,
  `DateFiled` date NOT NULL,
  `Reason` text NOT NULL,
  `AttachmentFile` varchar(255) DEFAULT NULL,
  `Status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `ReviewedBy` int DEFAULT NULL,
  PRIMARY KEY (`LetterID`),
  KEY `StudentID` (`StudentID`),
  KEY `ReviewedBy` (`ReviewedBy`),
  CONSTRAINT `excuseletter_ibfk_1` FOREIGN KEY (`StudentID`) REFERENCES `studentrecord` (`StudentID`),
  CONSTRAINT `excuseletter_ibfk_2` FOREIGN KEY (`ReviewedBy`) REFERENCES `useraccount` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `excuseletter`
--

LOCK TABLES `excuseletter` WRITE;
/*!40000 ALTER TABLE `excuseletter` DISABLE KEYS */;
/*!40000 ALTER TABLE `excuseletter` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificationlog`
--

DROP TABLE IF EXISTS `notificationlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificationlog` (
  `NotificationID` int NOT NULL AUTO_INCREMENT,
  `RecipientID` int NOT NULL,
  `DateSent` datetime NOT NULL,
  `Message` text NOT NULL,
  PRIMARY KEY (`NotificationID`),
  KEY `RecipientID` (`RecipientID`),
  CONSTRAINT `notificationlog_ibfk_1` FOREIGN KEY (`RecipientID`) REFERENCES `useraccount` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificationlog`
--

LOCK TABLES `notificationlog` WRITE;
/*!40000 ALTER TABLE `notificationlog` DISABLE KEYS */;
/*!40000 ALTER TABLE `notificationlog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `studentrecord`
--

DROP TABLE IF EXISTS `studentrecord`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `studentrecord` (
  `StudentID` int NOT NULL AUTO_INCREMENT,
  `FullName` varchar(150) NOT NULL,
  `GradeLevel` varchar(10) NOT NULL,
  `Section` varchar(20) NOT NULL,
  `FingerprintTemplate` blob NOT NULL,
  `ParentContact` int DEFAULT NULL,
  `ParentID` int DEFAULT NULL,
  PRIMARY KEY (`StudentID`),
  KEY `ParentID` (`ParentID`),
  CONSTRAINT `studentrecord_ibfk_1` FOREIGN KEY (`ParentID`) REFERENCES `useraccount` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `studentrecord`
--

LOCK TABLES `studentrecord` WRITE;
/*!40000 ALTER TABLE `studentrecord` DISABLE KEYS */;
/*!40000 ALTER TABLE `studentrecord` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `useraccount`
--

DROP TABLE IF EXISTS `useraccount`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `useraccount` (
  `UserID` int NOT NULL AUTO_INCREMENT,
  `Username` varchar(100) NOT NULL,
  `PasswordHash` varchar(100) NOT NULL,
  `Role` enum('Teacher','Admin','Parent') NOT NULL,
  PRIMARY KEY (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `useraccount`
--

LOCK TABLES `useraccount` WRITE;
/*!40000 ALTER TABLE `useraccount` DISABLE KEYS */;
/*!40000 ALTER TABLE `useraccount` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'biometricattendancedb'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-25 22:37:52
