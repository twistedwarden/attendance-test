import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const MIGRATIONS_DIR = path.join(process.cwd(), 'migrations');

const ensureMigrationsTable = async (conn) => {
	await conn.query(`CREATE TABLE IF NOT EXISTS \`schema_migrations\` (
	  \`id\` int NOT NULL AUTO_INCREMENT,
	  \`filename\` varchar(255) NOT NULL,
	  \`applied_at\` datetime NOT NULL,
	  PRIMARY KEY (\`id\`),
	  UNIQUE KEY \`filename_unique\` (\`filename\`)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`);
};

const getApplied = async (conn) => {
	try {
		const [rows] = await conn.query('SELECT filename FROM schema_migrations');
		return new Set(rows.map(r => r.filename));
	} catch (e) {
		return new Set();
	}
};

const run = async () => {
	const connection = await mysql.createConnection({
		host: process.env.DB_HOST || 'localhost',
		port: process.env.DB_PORT || 3306,
		user: process.env.DB_USER || 'root',
		password: process.env.DB_PASSWORD,
		multipleStatements: true,
	});

	const dbName = process.env.DB_NAME || 'biometricattendancedb';
	await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
	await connection.query(`USE \`${dbName}\``);

	await ensureMigrationsTable(connection);
	const applied = await getApplied(connection);

	if (!fs.existsSync(MIGRATIONS_DIR)) {
		console.log('No migrations directory found. Skipping.');
		await connection.end();
		return;
	}

	const files = fs.readdirSync(MIGRATIONS_DIR)
		.filter(f => f.endsWith('.sql'))
		.sort();

	for (const file of files) {
		if (applied.has(file)) continue;
		const full = path.join(MIGRATIONS_DIR, file);
		const sql = fs.readFileSync(full, 'utf8');
		console.log(`Applying migration: ${file}`);
		await connection.query(sql);
		await connection.query('INSERT INTO schema_migrations (filename, applied_at) VALUES (?, NOW())', [file]);
		console.log(`Applied: ${file}`);
	}

	await connection.end();
	console.log('Migrations complete.');
};

run().catch(err => {
	console.error('Migration failed:', err.message);
	process.exitCode = 1;
});


