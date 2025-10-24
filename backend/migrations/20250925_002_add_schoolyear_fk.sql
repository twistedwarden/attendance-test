-- Add SchoolYearID foreign key to all relevant tables

-- Add to studentrecord table
ALTER TABLE `studentrecord` 
ADD COLUMN `SchoolYearID` int(11) DEFAULT NULL,
ADD KEY `SchoolYearID` (`SchoolYearID`),
ADD CONSTRAINT `studentrecord_ibfk_schoolyear` FOREIGN KEY (`SchoolYearID`) REFERENCES `schoolyear` (`SchoolYearID`) ON DELETE RESTRICT;

-- Add to teacherschedule table
ALTER TABLE `teacherschedule` 
ADD COLUMN `SchoolYearID` int(11) DEFAULT NULL,
ADD KEY `SchoolYearID` (`SchoolYearID`),
ADD CONSTRAINT `teacherschedule_ibfk_schoolyear` FOREIGN KEY (`SchoolYearID`) REFERENCES `schoolyear` (`SchoolYearID`) ON DELETE RESTRICT;

-- Add to section table
ALTER TABLE `section` 
ADD COLUMN `SchoolYearID` int(11) DEFAULT NULL,
ADD KEY `SchoolYearID` (`SchoolYearID`),
ADD CONSTRAINT `section_ibfk_schoolyear` FOREIGN KEY (`SchoolYearID`) REFERENCES `schoolyear` (`SchoolYearID`) ON DELETE RESTRICT;

-- Add to attendancelog table
ALTER TABLE `attendancelog` 
ADD COLUMN `SchoolYearID` int(11) DEFAULT NULL,
ADD KEY `SchoolYearID` (`SchoolYearID`),
ADD CONSTRAINT `attendancelog_ibfk_schoolyear` FOREIGN KEY (`SchoolYearID`) REFERENCES `schoolyear` (`SchoolYearID`) ON DELETE RESTRICT;

-- Add to subjectattendance table
ALTER TABLE `subjectattendance` 
ADD COLUMN `SchoolYearID` int(11) DEFAULT NULL,
ADD KEY `SchoolYearID` (`SchoolYearID`),
ADD CONSTRAINT `subjectattendance_ibfk_schoolyear` FOREIGN KEY (`SchoolYearID`) REFERENCES `schoolyear` (`SchoolYearID`) ON DELETE RESTRICT;

-- Add to enrollment_review table
ALTER TABLE `enrollment_review` 
ADD COLUMN `SchoolYearID` int(11) DEFAULT NULL,
ADD KEY `SchoolYearID` (`SchoolYearID`),
ADD CONSTRAINT `enrollment_review_ibfk_schoolyear` FOREIGN KEY (`SchoolYearID`) REFERENCES `schoolyear` (`SchoolYearID`) ON DELETE RESTRICT;

-- Add to attendancereport table
ALTER TABLE `attendancereport` 
ADD COLUMN `SchoolYearID` int(11) DEFAULT NULL,
ADD KEY `SchoolYearID` (`SchoolYearID`),
ADD CONSTRAINT `attendancereport_ibfk_schoolyear` FOREIGN KEY (`SchoolYearID`) REFERENCES `schoolyear` (`SchoolYearID`) ON DELETE RESTRICT;

-- Add to excuseletter table
ALTER TABLE `excuseletter` 
ADD COLUMN `SchoolYearID` int(11) DEFAULT NULL,
ADD KEY `SchoolYearID` (`SchoolYearID`),
ADD CONSTRAINT `excuseletter_ibfk_schoolyear` FOREIGN KEY (`SchoolYearID`) REFERENCES `schoolyear` (`SchoolYearID`) ON DELETE RESTRICT;
