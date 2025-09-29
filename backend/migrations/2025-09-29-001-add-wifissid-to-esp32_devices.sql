-- Safely add WiFiSSID column to esp32_devices if missing
SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'esp32_devices'
    AND COLUMN_NAME = 'WiFiSSID'
);

SET @ddl := IF(
  @col_exists = 0,
  'ALTER TABLE `esp32_devices` ADD COLUMN `WiFiSSID` varchar(100) DEFAULT NULL COMMENT ''Connected WiFi SSID''',
  'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


