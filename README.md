# Attendance Management System

A comprehensive attendance management system with role-based access control for schools, featuring a modern React frontend and a secure Node.js backend.

## 🚀 Features

### Frontend (React + TypeScript)
- **Modern UI**: Built with React 18, TypeScript, and Tailwind CSS
- **Role-based Access**: Separate dashboards for Admin, Teacher, and Parent
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Live attendance tracking and notifications
- **Beautiful Components**: Modern UI with shadcn/ui components

### Backend (Node.js + Express)
- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: Admin, Teacher, and Parent permissions
- **Password Security**: bcrypt hashing with salt rounds
- **API Security**: CORS, rate limiting, and security headers
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Proper error responses and logging

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Node.js Backend│    │  In-Memory DB   │
│   (Port 5173)   │◄──►│   (Port 5000)   │◄──►│   (Development) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **React Router** for navigation
- **shadcn/ui** for components
- **React Hook Form** for forms
- **Zod** for validation

### Backend
- **Node.js** with Express
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for validation
- **Helmet** for security headers
- **CORS** for cross-origin requests
- **Rate Limiting** for API protection

## 📦 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### 1. Clone and Setup
```bash
git clone <repository-url>
cd attendancev2
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Start development server
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 🔐 Default Users

| Email | Password | Role | Name |
|-------|----------|------|------|
| admin@foothills.edu | admin123 | Admin | Admin User |
| sarah.johnson@foothills.edu | teacher123 | Teacher | Mrs. Sarah Johnson |
| michael.chen@foothills.edu | teacher123 | Teacher | Mr. Michael Chen |
| emily.davis@foothills.edu | teacher123 | Teacher | Ms. Emily Davis |
| sarah.johnson@email.com | parent123 | Parent | Sarah Johnson |

## 📋 User Roles & Permissions

### 👨‍💼 Admin
- Manage all users (create, read, update, delete)
- View system-wide attendance reports
- Access to all features and data
- System configuration and settings

### 👩‍🏫 Teacher
- View and manage attendance for assigned classes
- Generate attendance reports for their sections
- Update student attendance records
- Access to teacher-specific dashboard

### 👨‍👩‍👧‍👦 Parent
- View attendance records for their children
- Receive attendance notifications
- Access to parent-specific dashboard
- View attendance history and trends

## 🔌 API Endpoints

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

## 🎨 UI Components

The system includes modern, accessible UI components:

- **Cards**: Information display and organization
- **Buttons**: Primary, secondary, and ghost variants
- **Forms**: Validated input fields with error handling
- **Tables**: Sortable and filterable data tables
- **Modals**: Confirmation dialogs and forms
- **Navigation**: Sidebar and header navigation
- **Charts**: Attendance visualization and analytics

## 🔒 Security Features

- **JWT Authentication**: Secure token-based sessions
- **Password Hashing**: bcrypt with salt rounds
- **CORS Protection**: Configurable cross-origin requests
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Server-side request validation
- **Security Headers**: Helmet.js protection
- **Role-based Access**: Granular permission control

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- Different screen sizes and orientations

## 🚀 Deployment

### Frontend
```bash
npm run build
# Serve the dist folder with nginx or similar
```

### Backend
```bash
cd backend
npm start
# Use PM2 or similar for production
```

## 🔧 Development

### Adding New Features
1. **Backend**: Add routes in `backend/routes/`
2. **Frontend**: Add components in `src/modules/`
3. **Testing**: Test API endpoints and UI components
4. **Documentation**: Update README and API docs

### Database
Currently uses in-memory storage for development. For production:
1. Choose a database (PostgreSQL, MongoDB, etc.)
2. Update `backend/config/database.js`
3. Add proper database models and connections

## 📚 Documentation

- [Frontend Setup](./README.md)
- [Backend Setup](./backend/README.md)
- [API Documentation](./backend/README.md#api-endpoints)
- [Deployment Guide](./SETUP.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues or questions:
1. Check the documentation
2. Review the logs
3. Test API endpoints independently
4. Create an issue with detailed information

---

**Built with ❤️ for modern education management** 