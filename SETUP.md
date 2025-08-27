# Attendance System Setup Guide

This guide will help you set up the complete attendance management system with both frontend and backend components.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

## Project Structure

```
attendancev2 - Copy/
├── src/                    # Frontend React application
├── backend/               # Node.js backend API
├── package.json           # Frontend dependencies
└── README.md             # Project documentation
```

## Quick Start

### 1. Frontend Setup

The frontend is already set up and ready to use. To start the frontend:

```bash
# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 2. Backend Setup

Navigate to the backend directory and set it up:

```bash
cd backend

# Make the setup script executable
chmod +x install-and-start.sh

# Run the setup script
./install-and-start.sh
```

Or manually:

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Start the development server
npm run dev
```

The backend will be available at `http://localhost:5000`

## Configuration

### Backend Environment Variables

Edit `backend/.env` file:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Configuration

The frontend is configured to connect to the backend at `http://localhost:5000`. If you change the backend port, update the `API_BASE_URL` in `src/modules/auth/authService.ts`.

## Default Users

The system comes with pre-configured users for testing:

| Email | Password | Role | Name |
|-------|----------|------|------|
| admin@foothills.edu | admin123 | Admin | Admin User |
| sarah.johnson@foothills.edu | teacher123 | Teacher | Mrs. Sarah Johnson |
| michael.chen@foothills.edu | teacher123 | Teacher | Mr. Michael Chen |
| emily.davis@foothills.edu | teacher123 | Teacher | Ms. Emily Davis |
| sarah.johnson@email.com | parent123 | Parent | Sarah Johnson |

## Running the Application

### Development Mode

1. **Start the backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend (in a new terminal):**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Health check: http://localhost:5000/health

### Production Mode

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Start the backend:**
   ```bash
   cd backend
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (Admin only)
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verify token

### User Management (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/role/:role` - Get users by role

### Health Check
- `GET /health` - Server status

## Features

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- React Router for navigation
- Role-based access control
- Responsive design
- Modern UI components

### Backend
- Node.js with Express
- JWT authentication
- bcrypt password hashing
- Role-based middleware
- Input validation
- Rate limiting
- CORS protection
- Security headers
- Error handling

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure the backend CORS_ORIGIN matches your frontend URL
   - Check that both servers are running

2. **Authentication Issues**
   - Verify JWT_SECRET is set in backend .env
   - Check that tokens are being stored properly

3. **Port Conflicts**
   - Change PORT in backend .env if 5000 is in use
   - Update API_BASE_URL in frontend if backend port changes

4. **Database Issues**
   - The backend uses in-memory storage by default
   - Data will be reset when the server restarts

### Logs

- Frontend logs appear in the browser console
- Backend logs appear in the terminal where you started the server

## Development

### Adding New Features

1. **Backend API:**
   - Add routes in `backend/routes/`
   - Update middleware as needed
   - Test with Postman or similar tool

2. **Frontend:**
   - Add components in `src/modules/`
   - Update routing in `src/App.tsx`
   - Test with the running backend

### Database

The current setup uses in-memory storage. For production:

1. Choose a database (PostgreSQL, MongoDB, etc.)
2. Update `backend/config/database.js`
3. Add database connection and models
4. Update environment variables

## Security Considerations

- Change JWT_SECRET in production
- Use HTTPS in production
- Implement proper session management
- Add request logging
- Set up monitoring
- Regular security updates

## Deployment

### Backend Deployment
1. Set NODE_ENV=production
2. Use a process manager (PM2)
3. Set up reverse proxy (nginx)
4. Configure environment variables
5. Set up monitoring and logging

### Frontend Deployment
1. Build the application: `npm run build`
2. Serve static files with nginx or similar
3. Configure CORS for production domain
4. Set up CDN if needed

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify all prerequisites are installed
3. Ensure all environment variables are set
4. Test API endpoints independently

## License

MIT License - see LICENSE file for details. 