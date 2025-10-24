-- Create schoolyear table for managing academic years
CREATE TABLE IF NOT EXISTS `schoolyear` (
  `SchoolYearID` int(11) NOT NULL AUTO_INCREMENT,
  `YearLabel` varchar(20) NOT NULL,
  `StartDate` date NOT NULL,
  `EndDate` date NOT NULL,
  `IsActive` boolean DEFAULT FALSE,
  `CreatedAt` datetime DEFAULT current_timestamp(),
  `UpdatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`SchoolYearID`),
  UNIQUE KEY `unique_year_label` (`YearLabel`),
  KEY `idx_is_active` (`IsActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Note: Triggers are not created in this migration due to limitations with the migration system
-- The triggers can be created manually if needed:
-- 
-- CREATE TRIGGER `ensure_single_active_year` 
-- BEFORE UPDATE ON `schoolyear`
-- FOR EACH ROW
-- BEGIN
--   IF NEW.IsActive = TRUE AND OLD.IsActive = FALSE THEN
--     UPDATE `schoolyear` SET `IsActive` = FALSE WHERE `SchoolYearID` != NEW.SchoolYearID;
--   END IF;
-- END;
--
-- CREATE TRIGGER `ensure_single_active_year_insert` 
-- BEFORE INSERT ON `schoolyear`
-- FOR EACH ROW
-- BEGIN
--   IF NEW.IsActive = TRUE THEN
--     UPDATE `schoolyear` SET `IsActive` = FALSE;
--   END IF;
-- END;
