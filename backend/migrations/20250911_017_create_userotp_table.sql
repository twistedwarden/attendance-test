-- Create userotp table for storing OTP data during login
CREATE TABLE IF NOT EXISTS `userotp` (
  `UserID` int(11) NOT NULL,
  `OtpCode` varchar(10) NOT NULL,
  `OtpExpiresAt` datetime NOT NULL,
  `CreatedAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserID`),
  FOREIGN KEY (`UserID`) REFERENCES `useraccount`(`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
