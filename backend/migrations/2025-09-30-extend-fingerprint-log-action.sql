-- Extend allowed values for fingerprint_log.Action to cover new ESP32 operations
ALTER TABLE `fingerprint_log`
  MODIFY COLUMN `Action` ENUM(
    'enroll',
    'verify',
    'delete',
    'clear',
    'clear_all',
    'command',
    'reset',
    'restart',
    'test_connection',
    'update_settings'
  ) NOT NULL;


