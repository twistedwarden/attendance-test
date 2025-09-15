-- Create notification_read_status table to track which notifications have been read by parents
CREATE TABLE IF NOT EXISTS `notification_read_status` (
  `ReadStatusID` int NOT NULL AUTO_INCREMENT,
  `ParentID` int NOT NULL,
  `ReviewID` int NOT NULL,
  `ReadAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ReadStatusID`),
  UNIQUE KEY `unique_parent_review` (`ParentID`, `ReviewID`),
  CONSTRAINT `notification_read_status_ibfk_1` FOREIGN KEY (`ParentID`) REFERENCES `parent` (`ParentID`) ON DELETE CASCADE,
  CONSTRAINT `notification_read_status_ibfk_2` FOREIGN KEY (`ReviewID`) REFERENCES `enrollment_review` (`ReviewID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
