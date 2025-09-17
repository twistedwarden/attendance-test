import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'attendance',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function seedUsers() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🌱 Seeding users (one of each type)...');
    
    // Define users to create
    const users = [
      {
        username: 'admin@foothills.edu',
        password: 'admin123',
        role: 'Admin',
        fullName: 'System Administrator',
        contactInfo: '+1 (555) 000-0000'
      },
      {
        username: 'registrar@foothills.edu',
        password: 'registrar123',
        role: 'Registrar',
        fullName: 'School Registrar',
        contactInfo: '+1 (555) 100-1000'
      },
      {
        username: 'teacher@foothills.edu',
        password: 'teacher123',
        role: 'Teacher',
        fullName: 'John Teacher',
        contactInfo: '+1 (555) 200-2000'
      },
      {
        username: 'parent@example.com',
        password: 'parent123',
        role: 'Parent',
        fullName: 'Jane Parent',
        contactInfo: '+1 (555) 300-3000'
      }
    ];

    const createdUserIds = {};

    // Create users
    for (const user of users) {
      console.log(`Creating ${user.role} user: ${user.username}`);
      
      // Check if user already exists
      const [existing] = await connection.execute(
        'SELECT UserID FROM useraccount WHERE Username = ?',
        [user.username]
      );
      
      if (existing.length > 0) {
        console.log(`  ⚠️  User ${user.username} already exists, updating status to Active...`);
        await connection.execute(
          'UPDATE useraccount SET Status = ? WHERE UserID = ?',
          ['Active', existing[0].UserID]
        );
        createdUserIds[user.role] = existing[0].UserID;
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(user.password, 10);
      
      // Insert user
      const [result] = await connection.execute(
        'INSERT INTO useraccount (Username, PasswordHash, Role, Status) VALUES (?, ?, ?, ?)',
        [user.username, passwordHash, user.role, 'Active']
      );
      
      const userId = result.insertId;
      createdUserIds[user.role] = userId;
      console.log(`  ✅ Created ${user.role} user with ID: ${userId}`);
    }

    // Create corresponding records
    console.log('\n📝 Creating corresponding records...');

    // Create admin record
    if (createdUserIds.Admin) {
      const [existing] = await connection.execute(
        'SELECT AdminID FROM adminrecord WHERE UserID = ?',
        [createdUserIds.Admin]
      );
      
      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO adminrecord (FullName, ContactInfo, UserID, HireDate, Status) VALUES (?, ?, ?, ?, ?)',
          [users[0].fullName, users[0].contactInfo, createdUserIds.Admin, new Date().toISOString().slice(0, 10), 'Active']
        );
        console.log('  ✅ Created admin record');
      } else {
        console.log('  ⚠️  Admin record already exists');
      }
    }

    // Create registrar record
    if (createdUserIds.Registrar) {
      const [existing] = await connection.execute(
        'SELECT RegistrarID FROM registrarrecord WHERE UserID = ?',
        [createdUserIds.Registrar]
      );
      
      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO registrarrecord (FullName, ContactInfo, UserID, HireDate, Status) VALUES (?, ?, ?, ?, ?)',
          [users[1].fullName, users[1].contactInfo, createdUserIds.Registrar, new Date().toISOString().slice(0, 10), 'Active']
        );
        console.log('  ✅ Created registrar record');
      } else {
        console.log('  ⚠️  Registrar record already exists');
      }
    }

    // Create teacher record
    if (createdUserIds.Teacher) {
      const [existing] = await connection.execute(
        'SELECT TeacherID FROM teacherrecord WHERE UserID = ?',
        [createdUserIds.Teacher]
      );
      
      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO teacherrecord (FullName, ContactInfo, UserID, HireDate, Status) VALUES (?, ?, ?, ?, ?)',
          [users[2].fullName, users[2].contactInfo, createdUserIds.Teacher, new Date().toISOString().slice(0, 10), 'Active']
        );
        console.log('  ✅ Created teacher record');
      } else {
        console.log('  ⚠️  Teacher record already exists');
      }
    }

    // Create parent record
    if (createdUserIds.Parent) {
      const [existing] = await connection.execute(
        'SELECT ParentID FROM parent WHERE UserID = ?',
        [createdUserIds.Parent]
      );
      
      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO parent (FullName, ContactInfo, UserID) VALUES (?, ?, ?)',
          [users[3].fullName, users[3].contactInfo, createdUserIds.Parent]
        );
        console.log('  ✅ Created parent record');
      } else {
        console.log('  ⚠️  Parent record already exists');
      }
    }

    console.log('\n🎉 User seeding completed successfully!');
    console.log('\n📋 Created users:');
    console.log(`  Admin: ${users[0].username} (ID: ${createdUserIds.Admin})`);
    console.log(`  Registrar: ${users[1].username} (ID: ${createdUserIds.Registrar})`);
    console.log(`  Teacher: ${users[2].username} (ID: ${createdUserIds.Teacher})`);
    console.log(`  Parent: ${users[3].username} (ID: ${createdUserIds.Parent})`);
    console.log('\n🔑 All passwords are: admin123, registrar123, teacher123, parent123 respectively');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

// Run the seeding
seedUsers()
  .then(() => {
    console.log('✅ User seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ User seeding failed:', error);
    process.exit(1);
  });
