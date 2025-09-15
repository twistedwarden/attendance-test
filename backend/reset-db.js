import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
	const connection = await mysql.createConnection({
		host: process.env.DB_HOST || 'localhost',
		port: process.env.DB_PORT || 3306,
		user: process.env.DB_USER || 'root',
		password: process.env.DB_PASSWORD,
		multipleStatements: true,
	});

	let dbName = (process.env.DB_NAME || 'attendance').trim();
	if (!dbName) dbName = 'attendance';

	console.log('Resetting database:', dbName);
	await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
	await connection.query(`CREATE DATABASE \`${dbName}\``);
	await connection.end();
	console.log('Database reset complete.');
};

run().catch((e) => {
	console.error('Reset failed:', e?.message || e);
	process.exitCode = 1;
});


