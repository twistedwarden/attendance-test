-- Migration: Add enhancements to fingerprint tables
-- Created: 2024-01-01
-- Description: Adds additional features and optimizations for fingerprint system

USE attendance;

-- Add additional columns to fingerprint_log for better tracking
ALTER TABLE fingerprint_log 
ADD COLUMN IF NOT EXISTS ResponseTime INT NULL COMMENT 'Response time in milliseconds',
ADD COLUMN IF NOT EXISTS TemplateSize INT NULL COMMENT 'Size of fingerprint template in bytes',
ADD COLUMN IF NOT EXISTS UserAgent VARCHAR(255) NULL COMMENT 'ESP32 user agent string';

-- Add additional columns to esp32_devices for better device management
ALTER TABLE esp32_devices
ADD COLUMN IF NOT EXISTS FirmwareVersion VARCHAR(50) NULL COMMENT 'ESP32 firmware version',
ADD COLUMN IF NOT EXISTS HardwareVersion VARCHAR(50) NULL COMMENT 'ESP32 hardware version',
ADD COLUMN IF NOT EXISTS MACAddress VARCHAR(17) NULL COMMENT 'ESP32 MAC address',
ADD COLUMN IF NOT EXISTS WiFiSSID VARCHAR(100) NULL COMMENT 'Connected WiFi SSID',
ADD COLUMN IF NOT EXISTS BatteryLevel TINYINT NULL COMMENT 'Battery level percentage (0-100)',
ADD COLUMN IF NOT EXISTS Temperature DECIMAL(5,2) NULL COMMENT 'Device temperature in Celsius',
ADD COLUMN IF NOT EXISTS Uptime BIGINT NULL COMMENT 'Device uptime in seconds';

-- Create table for fingerprint templates backup (optional)
CREATE TABLE IF NOT EXISTS fingerprint_template_backup (
  BackupID INT AUTO_INCREMENT PRIMARY KEY,
  StudentID INT NOT NULL,
  TemplateData LONGBLOB NOT NULL,
  TemplateSize INT NOT NULL,
  BackupDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  BackupReason VARCHAR(100) NULL,
  CreatedBy VARCHAR(50) NULL,
  INDEX idx_student_id (StudentID),
  INDEX idx_backup_date (BackupDate),
  FOREIGN KEY (StudentID) REFERENCES studentrecord(StudentID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create table for attendance events from ESP32
CREATE TABLE IF NOT EXISTS esp32_attendance_events (
  EventID INT AUTO_INCREMENT PRIMARY KEY,
  StudentID INT NOT NULL,
  ESP32DeviceID VARCHAR(50) NOT NULL,
  EventType ENUM('time_in', 'time_out', 'break_start', 'break_end') NOT NULL,
  EventTimestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  Location VARCHAR(100) NULL,
  Notes TEXT NULL,
  INDEX idx_student_id (StudentID),
  INDEX idx_device_id (ESP32DeviceID),
  INDEX idx_event_timestamp (EventTimestamp),
  INDEX idx_event_type (EventType),
  FOREIGN KEY (StudentID) REFERENCES studentrecord(StudentID) ON DELETE CASCADE,
  FOREIGN KEY (ESP32DeviceID) REFERENCES esp32_devices(DeviceID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create table for device alerts and notifications
CREATE TABLE IF NOT EXISTS esp32_device_alerts (
  AlertID INT AUTO_INCREMENT PRIMARY KEY,
  DeviceID VARCHAR(50) NOT NULL,
  AlertType ENUM('low_battery', 'high_temperature', 'connection_lost', 'hardware_error', 'maintenance_required') NOT NULL,
  AlertLevel ENUM('info', 'warning', 'error', 'critical') NOT NULL,
  Message TEXT NOT NULL,
  IsResolved BOOLEAN DEFAULT FALSE,
  CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  ResolvedAt DATETIME NULL,
  ResolvedBy VARCHAR(50) NULL,
  INDEX idx_device_id (DeviceID),
  INDEX idx_alert_type (AlertType),
  INDEX idx_alert_level (AlertLevel),
  INDEX idx_is_resolved (IsResolved),
  INDEX idx_created_at (CreatedAt),
  FOREIGN KEY (DeviceID) REFERENCES esp32_devices(DeviceID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create updated views with new information
CREATE OR REPLACE VIEW fingerprint_operations_detailed AS
SELECT 
  fl.LogID,
  fl.StudentID,
  sr.FullName as StudentName,
  fl.ESP32DeviceID,
  ed.DeviceName,
  ed.Location as DeviceLocation,
  fl.Action,
  fl.Status,
  fl.Timestamp,
  fl.ResponseTime,
  fl.TemplateSize,
  fl.ErrorMessage,
  fl.DeviceIP
FROM fingerprint_log fl
LEFT JOIN studentrecord sr ON sr.StudentID = fl.StudentID
LEFT JOIN esp32_devices ed ON ed.DeviceID = fl.ESP32DeviceID
ORDER BY fl.Timestamp DESC;

CREATE OR REPLACE VIEW device_health_summary AS
SELECT 
  d.DeviceID,
  d.DeviceName,
  d.Location,
  d.Status,
  d.LastSeen,
  d.FirmwareVersion,
  d.HardwareVersion,
  d.BatteryLevel,
  d.Temperature,
  d.Uptime,
  COUNT(fl.LogID) as TotalOperations,
  COUNT(CASE WHEN fl.Timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 END) as OperationsLastHour,
  COUNT(CASE WHEN fl.Timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as OperationsLast24Hours,
  COUNT(CASE WHEN fl.Status = 'success' AND fl.Timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as SuccessfulOperationsLast24Hours,
  COUNT(CASE WHEN fl.Status = 'error' AND fl.Timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as ErrorOperationsLast24Hours,
  CASE 
    WHEN d.LastSeen < DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 'offline'
    WHEN d.BatteryLevel < 20 THEN 'low_battery'
    WHEN d.Temperature > 60 THEN 'overheating'
    WHEN d.Status = 'maintenance' THEN 'maintenance'
    ELSE 'healthy'
  END as HealthStatus
FROM esp32_devices d
LEFT JOIN fingerprint_log fl ON d.DeviceID = fl.ESP32DeviceID
GROUP BY d.DeviceID, d.DeviceName, d.Location, d.Status, d.LastSeen, 
         d.FirmwareVersion, d.HardwareVersion, d.BatteryLevel, d.Temperature, d.Uptime
ORDER BY d.LastSeen DESC;

-- Create stored procedure for cleaning up old logs
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CleanupOldFingerprintLogs(IN days_to_keep INT)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  -- Archive old logs before deletion
  INSERT INTO fingerprint_template_backup (StudentID, TemplateData, TemplateSize, BackupReason, CreatedBy)
  SELECT DISTINCT 
    fl.StudentID, 
    sr.FingerprintTemplate, 
    LENGTH(sr.FingerprintTemplate),
    'Archive before cleanup',
    'system'
  FROM fingerprint_log fl
  JOIN studentrecord sr ON sr.StudentID = fl.StudentID
  WHERE fl.Timestamp < DATE_SUB(NOW(), INTERVAL days_to_keep DAY)
    AND sr.FingerprintTemplate IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM fingerprint_template_backup ftb 
      WHERE ftb.StudentID = fl.StudentID 
        AND ftb.BackupDate >= DATE_SUB(NOW(), INTERVAL 1 DAY)
    );
  
  -- Delete old logs
  DELETE FROM fingerprint_log 
  WHERE Timestamp < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
  
  COMMIT;
  
  SELECT ROW_COUNT() as DeletedLogs;
END //
DELIMITER ;

-- Create trigger to automatically create device alerts
DELIMITER //
CREATE TRIGGER IF NOT EXISTS tr_device_health_check
AFTER UPDATE ON esp32_devices
FOR EACH ROW
BEGIN
  -- Check for low battery
  IF NEW.BatteryLevel < 20 AND (OLD.BatteryLevel IS NULL OR OLD.BatteryLevel >= 20) THEN
    INSERT INTO esp32_device_alerts (DeviceID, AlertType, AlertLevel, Message)
    VALUES (NEW.DeviceID, 'low_battery', 'warning', CONCAT('Battery level is low: ', NEW.BatteryLevel, '%'));
  END IF;
  
  -- Check for high temperature
  IF NEW.Temperature > 60 AND (OLD.Temperature IS NULL OR OLD.Temperature <= 60) THEN
    INSERT INTO esp32_device_alerts (DeviceID, AlertType, AlertLevel, Message)
    VALUES (NEW.DeviceID, 'high_temperature', 'warning', CONCAT('Device temperature is high: ', NEW.Temperature, '°C'));
  END IF;
  
  -- Check for connection lost (no updates for more than 1 hour)
  IF NEW.LastSeen < DATE_SUB(NOW(), INTERVAL 1 HOUR) AND OLD.LastSeen >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN
    INSERT INTO esp32_device_alerts (DeviceID, AlertType, AlertLevel, Message)
    VALUES (NEW.DeviceID, 'connection_lost', 'error', 'Device has not been seen for more than 1 hour');
  END IF;
END //
DELIMITER ;
