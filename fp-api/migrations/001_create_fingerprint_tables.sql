-- Migration: Create fingerprint tables for ESP32 integration
-- Created: 2024-01-01
-- Description: Creates tables for fingerprint logging and ESP32 device management

USE attendance;

-- Create fingerprint_log table for tracking ESP32 interactions
CREATE TABLE IF NOT EXISTS fingerprint_log (
  LogID INT AUTO_INCREMENT PRIMARY KEY,
  StudentID INT NULL,
  ESP32DeviceID VARCHAR(50) NOT NULL,
  Action ENUM('enroll', 'verify', 'delete') NOT NULL,
  Status ENUM('success', 'failed', 'error') NOT NULL,
  Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  ErrorMessage TEXT NULL,
  DeviceIP VARCHAR(45) NULL,
  INDEX idx_student_id (StudentID),
  INDEX idx_device_id (ESP32DeviceID),
  INDEX idx_timestamp (Timestamp),
  INDEX idx_action (Action),
  INDEX idx_status (Status),
  FOREIGN KEY (StudentID) REFERENCES studentrecord(StudentID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create esp32_devices table for device management
CREATE TABLE IF NOT EXISTS esp32_devices (
  DeviceID VARCHAR(50) PRIMARY KEY,
  DeviceName VARCHAR(100) NOT NULL,
  Location VARCHAR(100) NULL,
  Status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  LastSeen DATETIME DEFAULT CURRENT_TIMESTAMP,
  CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (Status),
  INDEX idx_last_seen (LastSeen)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create index on studentrecord.FingerprintTemplate for faster lookups
-- (This assumes the column already exists from the main schema)
CREATE INDEX IF NOT EXISTS idx_fingerprint_template ON studentrecord(FingerprintTemplate(255));

-- Insert some sample ESP32 devices for testing
INSERT IGNORE INTO esp32_devices (DeviceID, DeviceName, Location, Status) VALUES
('ESP32_001', 'Main Entrance Device', 'Main Entrance', 'active'),
('ESP32_002', 'Library Device', 'Library', 'active'),
('ESP32_003', 'Cafeteria Device', 'Cafeteria', 'inactive');

-- Create a view for easy monitoring of fingerprint operations
CREATE OR REPLACE VIEW fingerprint_operations_summary AS
SELECT 
  DATE(Timestamp) as Date,
  Action,
  Status,
  COUNT(*) as Count,
  COUNT(DISTINCT ESP32DeviceID) as DeviceCount,
  COUNT(DISTINCT StudentID) as StudentCount
FROM fingerprint_log
GROUP BY DATE(Timestamp), Action, Status
ORDER BY Date DESC, Action, Status;

-- Create a view for device status monitoring
CREATE OR REPLACE VIEW device_status_summary AS
SELECT 
  d.DeviceID,
  d.DeviceName,
  d.Location,
  d.Status,
  d.LastSeen,
  COUNT(fl.LogID) as TotalOperations,
  COUNT(CASE WHEN fl.Status = 'success' THEN 1 END) as SuccessfulOperations,
  COUNT(CASE WHEN fl.Status = 'failed' THEN 1 END) as FailedOperations,
  COUNT(CASE WHEN fl.Status = 'error' THEN 1 END) as ErrorOperations,
  MAX(fl.Timestamp) as LastOperation
FROM esp32_devices d
LEFT JOIN fingerprint_log fl ON d.DeviceID = fl.ESP32DeviceID
GROUP BY d.DeviceID, d.DeviceName, d.Location, d.Status, d.LastSeen
ORDER BY d.LastSeen DESC;
