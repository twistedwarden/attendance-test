import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Database connection pool
let pool;

// Initialize database connection
const initializeDatabase = async () => {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'attendance',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Test the connection
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();

    // Initialize with default users if table is empty
    await initializeDefaultUsers();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

// Initialize default users
const initializeDefaultUsers = async () => {
  try {
    // Check if useraccount table has any users
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM useraccount');
    const userCount = rows[0].count;

    if (userCount === 0) {
      console.log('📝 Initializing default users...');
      
      const defaultUsers = [
        {
          username: 'admin@foothills.edu',
          passwordHash: await bcrypt.hash('admin123', 10),
          role: 'Admin'
        },
        {
          username: 'sarah.johnson@foothills.edu',
          passwordHash: await bcrypt.hash('teacher123', 10),
          role: 'Teacher'
        },
        {
          username: 'michael.chen@foothills.edu',
          passwordHash: await bcrypt.hash('teacher123', 10),
          role: 'Teacher'
        },
        {
          username: 'emily.davis@foothills.edu',
          passwordHash: await bcrypt.hash('teacher123', 10),
          role: 'Teacher'
        },
        {
          username: 'sarah.johnson@email.com',
          passwordHash: await bcrypt.hash('parent123', 10),
          role: 'Parent'
        }
      ];

      for (const user of defaultUsers) {
        await pool.execute(
          'INSERT INTO useraccount (Username, PasswordHash, Role) VALUES (?, ?, ?)',
          [user.username, user.passwordHash, user.role]
        );
      }

      console.log('✅ Default users initialized successfully');
    } else {
      console.log(`📊 Found ${userCount} existing users in database`);
    }
  } catch (error) {
    console.error('❌ Error initializing default users:', error.message);
  }
};

// Database operations
export const findUserByEmail = async (email) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM useraccount WHERE Username = ?',
      [email]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
};

export const findUserById = async (id) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM useraccount WHERE UserID = ?',
      [id]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const { username, passwordHash, role } = userData;
    const [result] = await pool.execute(
      'INSERT INTO useraccount (Username, PasswordHash, Role) VALUES (?, ?, ?)',
      [username, passwordHash, role]
    );
    
    const newUser = await findUserById(result.insertId);
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (id, updates) => {
  try {
    const updateFields = [];
    const updateValues = [];
    
    if (updates.username) {
      updateFields.push('Username = ?');
      updateValues.push(updates.username);
    }
    if (updates.passwordHash) {
      updateFields.push('PasswordHash = ?');
      updateValues.push(updates.passwordHash);
    }
    if (updates.role) {
      updateFields.push('Role = ?');
      updateValues.push(updates.role);
    }
    
    if (updateFields.length === 0) {
      return await findUserById(id);
    }
    
    updateValues.push(id);
    const [result] = await pool.execute(
      `UPDATE useraccount SET ${updateFields.join(', ')} WHERE UserID = ?`,
      updateValues
    );
    
    if (result.affectedRows > 0) {
      return await findUserById(id);
    }
    return null;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM useraccount WHERE UserID = ?',
      [id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const [rows] = await pool.execute('SELECT * FROM useraccount ORDER BY UserID');
    return rows;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// Initialize database on startup
initializeDatabase();

// Export the pool for other modules that might need it
export { pool }; 