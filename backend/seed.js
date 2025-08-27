import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const getPool = async () => {
	return mysql.createPool({
		host: process.env.DB_HOST || 'localhost',
		port: process.env.DB_PORT || 3306,
		user: process.env.DB_USER || 'root',
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME || 'biometricattendancedb',
		waitForConnections: true,
		connectionLimit: 10,
	});
};

const ensureTables = async (pool) => {
	await pool.query(`CREATE TABLE IF NOT EXISTS \`useraccount\` (
	\`UserID\` int NOT NULL AUTO_INCREMENT,
	\`Username\` varchar(100) NOT NULL,
	\`PasswordHash\` varchar(100) NOT NULL,
	\`Role\` enum('Teacher','Admin','Parent') NOT NULL,
	PRIMARY KEY (\`UserID\`)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`);

	await pool.query(`CREATE TABLE IF NOT EXISTS \`studentrecord\` (
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
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`);
};

const upsertUser = async (pool, { username, password, role }) => {
	const [rows] = await pool.query('SELECT UserID FROM useraccount WHERE Username = ?', [username]);
	if (rows.length > 0) {
		return rows[0].UserID;
	}
	const hash = await bcrypt.hash(password, 10);
	const [res] = await pool.query(
		'INSERT INTO useraccount (Username, PasswordHash, Role) VALUES (?, ?, ?)',
		[username, hash, role]
	);
	return res.insertId;
};

const insertStudent = async (pool, { fullName, gradeLevel, section, parentId }) => {
	const dummyFingerprint = Buffer.from('');
	await pool.query(
		'INSERT INTO studentrecord (FullName, GradeLevel, Section, FingerprintTemplate, ParentContact, ParentID) VALUES (?, ?, ?, ?, ?, ?)',
		[fullName, gradeLevel, section, dummyFingerprint, null, parentId || null]
	);
};

const seed = async () => {
	const pool = await getPool();
	try {
		console.log('🌱 Seeding database...');
		await ensureTables(pool);

		// Users
		const adminId = await upsertUser(pool, {
			username: 'admin@foothills.edu',
			password: 'admin123',
			role: 'Admin',
		});
		const teacher1Id = await upsertUser(pool, {
			username: 'sarah.johnson@foothills.edu',
			password: 'teacher123',
			role: 'Teacher',
		});
		const teacher2Id = await upsertUser(pool, {
			username: 'michael.chen@foothills.edu',
			password: 'teacher123',
			role: 'Teacher',
		});
		const teacher3Id = await upsertUser(pool, {
			username: 'emily.davis@foothills.edu',
			password: 'teacher123',
			role: 'Teacher',
		});
		const parentId = await upsertUser(pool, {
			username: 'sarah.johnson@email.com',
			password: 'parent123',
			role: 'Parent',
		});

		console.log('✅ Users seeded');

		// Students (sample)
		await insertStudent(pool, {
			fullName: 'Ava Johnson',
			gradeLevel: '1',
			section: 'A',
			parentId,
		});
		await insertStudent(pool, {
			fullName: 'Liam Chen',
			gradeLevel: '2',
			section: 'B',
			parentId: null,
		});
		await insertStudent(pool, {
			fullName: 'Noah Davis',
			gradeLevel: '3',
			section: 'A',
			parentId: null,
		});

		console.log('✅ Sample students seeded');
		console.log('🎉 Seeding complete');
	} catch (e) {
		console.error('❌ Seeding failed:', e.message);
		process.exitCode = 1;
	} finally {
		await pool.end();
	}
};

seed(); 