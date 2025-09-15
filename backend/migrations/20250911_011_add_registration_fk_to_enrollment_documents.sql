-- Add foreign key constraint from enrollment_documents to registration table

ALTER TABLE `enrollment_documents` 
ADD CONSTRAINT `enrollment_documents_ibfk_2` 
FOREIGN KEY (`RegistrationID`) REFERENCES `registration` (`RegistrationID`) ON DELETE CASCADE;
