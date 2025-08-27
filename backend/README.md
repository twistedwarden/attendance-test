# Attendance System Backend

A monolithic Node.js backend for the attendance management system with JWT authentication, role-based access control, and MySQL database integration.

## Features

- 🔐 JWT-based authentication
- 👥 Role-based access control (Admin, Teacher, Parent)
- 🔒 Password hashing with bcrypt
- 🛡️ Security middleware (Helmet, CORS, Rate limiting)
- ✅ Input validation with express-validator
- 📝 Comprehensive API documentation
- 🚀 Production-ready configuration
- 🗄️ MySQL database integration
- 📊 Complete attendance management system

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MySQL Server (v8.0 or higher)

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=biometricattendancedb
```

5. Set up the MySQL database:
```bash
npm run setup-db
```

6. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## Database Schema

The system uses the following MySQL tables:

### `useraccount`
- `UserID` (Primary Key)
- `Username` (Email address)
- `PasswordHash` (Bcrypt hashed password)
- `Role` (Admin, Teacher, Parent)

### `studentrecord`
- `StudentID` (Primary Key)
- `FullName`
- `GradeLevel`
- `Section`
- `FingerprintTemplate` (BLOB)
- `ParentContact`
- `ParentID` (Foreign Key to useraccount)

### `attendancelog`
- `AttendanceID` (Primary Key)
- `StudentID` (Foreign Key to studentrecord)
- `Date`
- `TimeIn`
- `TimeOut`
- `Status` (Present, Absent, Late, Excused)
- `ValidatedBy` (Foreign Key to useraccount)

### `excuseletter`
- `LetterID` (Primary Key)
- `StudentID` (Foreign Key to studentrecord)
- `DateFiled`
- `Reason`
- `AttachmentFile`
- `Status` (Pending, Approved, Rejected)
- `ReviewedBy` (Foreign Key to useraccount)

### `notificationlog`
- `NotificationID` (Primary Key)
- `RecipientID` (Foreign Key to useraccount)
- `DateSent`
- `Message`

## API Endpoints

### Authentication

#### POST `/api/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "admin@foothills.edu",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "admin",
      "role": "admin",
      "email": "admin@foothills.edu"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST `/api/auth/register`
Register a new user (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@foothills.edu",
  "password": "SecurePass123",
  "role": "teacher"
}
```

#### GET `/api/auth/profile`
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

#### PUT `/api/auth/profile`
Update current user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@foothills.edu"
}
```

#### PUT `/api/auth/change-password`
Change user password.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newSecurePass123"
}
```

#### POST `/api/auth/logout`
Logout (client-side token removal).

**Headers:** `Authorization: Bearer <token>`

#### GET `/api/auth/verify`
Verify JWT token.

**Headers:** `Authorization: Bearer <token>`

### User Management (Admin Only)

#### GET `/api/users`
Get all users.

**Headers:** `Authorization: Bearer <token>`

#### GET `/api/users/:id`
Get user by ID.

**Headers:** `Authorization: Bearer <token>`

#### PUT `/api/users/:id`
Update user by ID.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@foothills.edu",
  "role": "teacher"
}
```

#### DELETE `/api/users/:id`
Delete user by ID.

**Headers:** `Authorization: Bearer <token>`

#### GET `/api/users/role/:role`
Get users by role (admin, teacher, parent).

**Headers:** `Authorization: Bearer <token>`

### Health Check

#### GET `/health`
Check server status.

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

## Default Users

The system comes with pre-configured users for testing:

| Email | Password | Role | Name |
|-------|----------|------|------|
| admin@foothills.edu | admin123 | Admin | Admin User |
| sarah.johnson@foothills.edu | teacher123 | Teacher | Mrs. Sarah Johnson |
| michael.chen@foothills.edu | teacher123 | Teacher | Mr. Michael Chen |
| emily.davis@foothills.edu | teacher123 | Teacher | Ms. Emily Davis |
| sarah.johnson@email.com | parent123 | Parent | Sarah Johnson |

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

For validation errors:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **CORS Protection**: Configurable cross-origin requests
- **Rate Limiting**: Prevents abuse with configurable limits
- **Helmet**: Security headers for Express
- **Input Validation**: Request validation with express-validator
- **Role-based Access**: Different permissions for different user roles
- **SQL Injection Protection**: Parameterized queries with mysql2

## Development

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run setup-db` - Set up MySQL database and tables
- `npm test` - Run tests (not implemented yet)

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | Token expiration | 24h |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:5173 |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `DB_HOST` | MySQL host | localhost |
| `DB_PORT` | MySQL port | 3306 |
| `DB_USER` | MySQL username | root |
| `DB_PASSWORD` | MySQL password | Required |
| `DB_NAME` | MySQL database name | biometricattendancedb |

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong, unique `JWT_SECRET`
3. Configure proper CORS origins
4. Set up a reverse proxy (nginx)
5. Use PM2 or similar process manager
6. Set up proper logging
7. Configure MySQL for production
8. Set up database backups
9. Use SSL/TLS certificates

## Database Management

### Setup
```bash
npm run setup-db
```

### Backup
```bash
mysqldump -u root -p biometricattendancedb > backup.sql
```

### Restore
```bash
mysql -u root -p biometricattendancedb < backup.sql
```

## Contributing

1. Follow the existing code style
2. Add proper error handling
3. Include input validation
4. Test all endpoints
5. Update documentation

## License

MIT 