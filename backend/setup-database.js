import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const isUnsupportedStatement = (stmt) => {
	const s = stmt.trim().toUpperCase();
	return (
		s.startsWith('LOCK TABLES') ||
		s.startsWith('UNLOCK TABLES') ||
		s.startsWith('DELIMITER') ||
		s.startsWith('SET ') ||
		s.startsWith('/*!') ||
		s.startsWith('ALTER TABLE') && (s.includes('DISABLE KEYS') || s.includes('ENABLE KEYS'))
	);
};

const cleanSqlDump = (raw) => {
	// Remove versioned comments like /*!40101 ... */
	let sql = raw.replace(/\/\*!.*?\*\//gs, '');
	// Remove line comments starting with --
	sql = sql
		.split('\n')
		.filter((line) => !line.trim().startsWith('--'))
		.join('\n');
	return sql;
};

const setupDatabase = async () => {
	let connection;
	
	try {
		console.log('🚀 Setting up MySQL database...');
		
		// Create connection without database first
		connection = await mysql.createConnection({
			host: process.env.DB_HOST || 'localhost',
			port: process.env.DB_PORT || 3306,
			user: process.env.DB_USER || 'root',
			password: process.env.DB_PASSWORD,
			multipleStatements: true,
		});

		console.log('✅ Connected to MySQL server');

		// Create database if it doesn't exist
		const dbName = process.env.DB_NAME || 'attendance';
		await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
		console.log(`✅ Database '${dbName}' created/verified`);

		// Use the database
		await connection.query(`USE \`${dbName}\``);
		console.log(`✅ Using database '${dbName}'`);

		// Read and execute the SQL dump
		const sqlDumpPath = path.join(process.cwd(), 'v1.sql');
		
		if (fs.existsSync(sqlDumpPath)) {
			console.log('📖 Reading SQL dump file...');
			const rawDump = fs.readFileSync(sqlDumpPath, 'utf8');
			const cleaned = cleanSqlDump(rawDump);
			
			// Split the SQL dump into individual statements
			const statements = cleaned
				.split(';')
				.map((stmt) => stmt.trim())
				.filter((stmt) => stmt.length > 0 && !isUnsupportedStatement(stmt));

			console.log(`📝 Executing ${statements.length} SQL statements...`);
			
			for (let i = 0; i < statements.length; i++) {
				const statement = statements[i];
				try {
					await connection.query(statement);
					console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
				} catch (error) {
					// Ignore idempotent errors; log others
					const msg = (error && error.message) || '';
					if (
						!(msg.includes('already exists') ||
						  msg.includes('Duplicate') ||
						  msg.includes('Unknown system variable') ||
						  msg.includes('You have an error in your SQL syntax'))
					) {
						console.warn(`⚠️  Statement ${i + 1} warning:`, msg);
					}
				}
			}
			
			console.log('✅ SQL dump imported successfully');
		} else {
			console.log('⚠️  SQL dump file not found, creating tables manually...');
			
			// Create tables manually if SQL dump is not available
			const createTables = [
				// useraccount must be created before any table with FK to it
				`CREATE TABLE IF NOT EXISTS \`useraccount\` (
				  \`UserID\` int NOT NULL AUTO_INCREMENT,
				  \`Username\` varchar(100) NOT NULL,
				  \`PasswordHash\` varchar(255) NOT NULL,
				  \`Role\` enum('Student','Parent','Teacher','Registrar','Admin','SuperAdmin') NOT NULL,
				  \`Status\` enum('Active','Pending','Disabled') DEFAULT 'Pending',
				  PRIMARY KEY (\`UserID\`),
				  UNIQUE KEY \`Username\` (\`Username\`)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

				// staff records
				`CREATE TABLE IF NOT EXISTS \`teacherrecord\` (
				  \`TeacherID\` int NOT NULL AUTO_INCREMENT,
				  \`FullName\` varchar(150) NOT NULL,
				  \`ContactInfo\` varchar(255) DEFAULT NULL,
				  \`UserID\` int DEFAULT NULL,
				  \`HireDate\` date DEFAULT NULL,
				  \`Status\` enum('Active','Inactive') DEFAULT 'Active',
				  PRIMARY KEY (\`TeacherID\`),
				  KEY \`UserID\` (\`UserID\`),
				  CONSTRAINT \`teacherrecord_ibfk_1\` FOREIGN KEY (\`UserID\`) REFERENCES \`useraccount\` (\`UserID\`)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

				`CREATE TABLE IF NOT EXISTS \`adminrecord\` (
				  \`AdminID\` int NOT NULL AUTO_INCREMENT,
				  \`FullName\` varchar(150) NOT NULL,
				  \`ContactInfo\` varchar(255) DEFAULT NULL,
				  \`UserID\` int DEFAULT NULL,
				  \`HireDate\` date DEFAULT NULL,
				  \`Status\` enum('Active','Inactive') DEFAULT 'Active',
				  PRIMARY KEY (\`AdminID\`),
				  KEY \`UserID\` (\`UserID\`),
				  CONSTRAINT \`adminrecord_ibfk_1\` FOREIGN KEY (\`UserID\`) REFERENCES \`useraccount\` (\`UserID\`)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

				`CREATE TABLE IF NOT EXISTS \`registrarrecord\` (
				  \`RegistrarID\` int NOT NULL AUTO_INCREMENT,
				  \`FullName\` varchar(150) NOT NULL,
				  \`ContactInfo\` varchar(255) DEFAULT NULL,
				  \`UserID\` int DEFAULT NULL,
				  \`HireDate\` date DEFAULT NULL,
				  \`Status\` enum('Active','Inactive') DEFAULT 'Active',
				  PRIMARY KEY (\`RegistrarID\`),
				  KEY \`UserID\` (\`UserID\`),
				  CONSTRAINT \`registrarrecord_ibfk_1\` FOREIGN KEY (\`UserID\`) REFERENCES \`useraccount\` (\`UserID\`)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

				`CREATE TABLE IF NOT EXISTS \`studentrecord\` (
				  \`StudentID\` int NOT NULL AUTO_INCREMENT,
				  \`FullName\` varchar(150) NOT NULL,
				  \`GradeLevel\` varchar(10) NOT NULL,
				  \`Section\` varchar(20) NOT NULL,
				  \`FingerprintTemplate\` blob NOT NULL,
				  \`ParentContact\` int DEFAULT NULL,
				  \`ParentID\` int DEFAULT NULL,
				  PRIMARY KEY (\`StudentID\`),
				  KEY \`ParentID\` (\`ParentID\`),
				  CONSTRAINT \`studentrecord_ibfk_1\` FOREIGN KEY (\`ParentID\`) REFERENCES \`useraccount\` (\`UserID\`)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
				
				`CREATE TABLE IF NOT EXISTS \`attendancelog\` (
				  \`AttendanceID\` int NOT NULL AUTO_INCREMENT,
				  \`StudentID\` int NOT NULL,
				  \`Date\` date NOT NULL,
				  \`TimeIn\` time DEFAULT NULL,
				  \`TimeOut\` time DEFAULT NULL,
				  \`Status\` enum('Present','Absent','Late','Excused') NOT NULL,
				  \`ValidatedBy\` int DEFAULT NULL,
				  PRIMARY KEY (\`AttendanceID\`),
				  KEY \`StudentID\` (\`StudentID\`),
				  KEY \`ValidatedBy\` (\`ValidatedBy\`),
				  CONSTRAINT \`attendancelog_ibfk_1\` FOREIGN KEY (\`StudentID\`) REFERENCES \`studentrecord\` (\`StudentID\`),
				  CONSTRAINT \`attendancelog_ibfk_2\` FOREIGN KEY (\`ValidatedBy\`) REFERENCES \`useraccount\` (\`UserID\`)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
				
				`CREATE TABLE IF NOT EXISTS \`excuseletter\` (
				  \`LetterID\` int NOT NULL AUTO_INCREMENT,
				  \`StudentID\` int NOT NULL,
				  \`DateFiled\` date NOT NULL,
				  \`Reason\` text NOT NULL,
				  \`AttachmentFile\` varchar(255) DEFAULT NULL,
				  \`Status\` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
				  \`ReviewedBy\` int DEFAULT NULL,
				  PRIMARY KEY (\`LetterID\`),
				  KEY \`StudentID\` (\`StudentID\`),
				  KEY \`ReviewedBy\` (\`ReviewedBy\`),
				  CONSTRAINT \`excuseletter_ibfk_1\` FOREIGN KEY (\`StudentID\`) REFERENCES \`studentrecord\` (\`StudentID\`),
				  CONSTRAINT \`excuseletter_ibfk_2\` FOREIGN KEY (\`ReviewedBy\`) REFERENCES \`useraccount\` (\`UserID\`)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
				
				`CREATE TABLE IF NOT EXISTS \`notificationlog\` (
				  \`NotificationID\` int NOT NULL AUTO_INCREMENT,
				  \`RecipientID\` int NOT NULL,
				  \`DateSent\` datetime NOT NULL,
				  \`Message\` text NOT NULL,
				  PRIMARY KEY (\`NotificationID\`),
				  KEY \`RecipientID\` (\`RecipientID\`),
				  CONSTRAINT \`notificationlog_ibfk_1\` FOREIGN KEY (\`RecipientID\`) REFERENCES \`useraccount\` (\`UserID\`)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
			];

			for (const createTable of createTables) {
				await connection.query(createTable);
			}
			
			console.log('✅ Tables created successfully');
		}

		console.log('\n🎉 Database setup completed successfully!');
		console.log('\n📋 Next steps:');
		console.log('1. Update your .env file with the correct database credentials');
		console.log('2. Run: npm run dev');
		console.log('3. The backend will automatically initialize default users');

	} catch (error) {
		console.error('❌ Database setup failed:', error.message);
		console.log('\n💡 Make sure:');
		console.log('- MySQL server is running');
		console.log('- Database credentials are correct in .env file');
		console.log('- You have permission to create databases');
	} finally {
		if (connection) {
			await connection.end();
		}
	}
};

setupDatabase(); 