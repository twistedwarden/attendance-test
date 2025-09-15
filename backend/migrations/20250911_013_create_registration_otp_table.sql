-- Create registration OTP table for storing OTP data during registration
CREATE TABLE IF NOT EXISTS `registration_otp` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `otp` varchar(10) NOT NULL,
  `expiry_date` datetime NOT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'registration',
  `data` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `email_type` (`email`, `type`),
  KEY `expiry_date` (`expiry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
