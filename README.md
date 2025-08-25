# Attendance System v2

A modular React TypeScript application for managing student attendance at Foothills Christian School.

## Project Structure

The project is organized into modular components with clear separation of concerns:

```
src/
├── modules/
│   ├── auth/           # Authentication module
│   │   ├── AuthContext.tsx    # React context for auth state
│   │   ├── AuthService.ts     # Authentication service
│   │   ├── LoginPage.tsx      # Login page component
│   │   ├── mockData.ts        # Mock user data
│   │   └── index.ts           # Module exports
│   │
│   ├── admin/          # Admin module
│   │   ├── AdminDashboard.tsx     # Main admin dashboard
│   │   ├── AdminSidebar.tsx       # Admin navigation
│   │   ├── AdminHeader.tsx        # Admin header
│   │   ├── DashboardOverview.tsx  # Dashboard overview
│   │   ├── AttendanceLog.tsx      # Attendance management
│   │   ├── StudentsSection.tsx    # Student management
│   │   ├── GradeOverview.tsx      # Grade management
│   │   ├── NotificationsSection.tsx # Notifications
│   │   ├── ReportsSection.tsx     # Reports
│   │   ├── DeviceStatus.tsx       # Device monitoring
│   │   ├── SettingsSection.tsx    # Settings
│   │   └── index.ts               # Module exports
│   │
│   ├── teacher/        # Teacher module
│   │   ├── TeacherDashboard.tsx       # Main teacher dashboard
│   │   ├── TeacherSidebar.tsx         # Teacher navigation
│   │   ├── TeacherHeader.tsx          # Teacher header
│   │   ├── TeacherAttendanceView.tsx # Attendance view
│   │   ├── TeacherStudentsView.tsx   # Student view
│   │   ├── TeacherReportsView.tsx    # Reports view
│   │   ├── TeacherNotificationsView.tsx # Notifications view
│   │   └── index.ts                   # Module exports
│   │
│   └── shared/         # Shared components
│       ├── StatsCard.tsx              # Reusable stats card
│       └── index.ts                   # Module exports
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

## Features

### Authentication
- Mock authentication system with demo accounts
- Role-based access control (Admin/Teacher)
- Persistent session management
- Secure login/logout functionality

### Admin Dashboard
- **Dashboard Overview**: School statistics and quick actions
- **Attendance Management**: Comprehensive attendance tracking and logs
- **Student Management**: Student registration, fingerprint management, and status tracking
- **Grade Management**: Grade-level analysis and performance metrics
- **Notifications**: Parent communication management with delivery status
- **Reports & Analytics**: Custom report generation (PDF, CSV, Excel)
- **Device Status**: Real-time monitoring of attendance scanners
- **System Settings**: School schedule, notification preferences, and security settings

### Teacher Dashboard
- **Attendance View**: Class-specific attendance management with filtering
- **Student Management**: Class roster and individual student tracking
- **Reports**: Class-specific attendance reports and analytics
- **Notifications**: Communication with parents and administrators

### Shared Components
- **StatsCard**: Reusable statistics display component
- **Responsive Design**: Mobile-first approach with collapsible navigation

## Demo Accounts

### Admin Account
- Email: `admin@foothills.edu`
- Password: `admin123`

### Teacher Accounts
- Email: `sarah.johnson@foothills.edu` (Grade 1, Section A)
- Password: `teacher123`
- Email: `michael.chen@foothills.edu` (Grade 2, Section B)
- Password: `teacher123`
- Email: `emily.davis@foothills.edu` (Grade 3, Section A)
- Password: `teacher123`

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to the application
4. Use one of the demo accounts to log in

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite
- **State Management**: React Context API

## Development

### Adding New Features
1. Create components in the appropriate module directory
2. Export them from the module's `index.ts` file
3. Import and use them in the relevant dashboard

### Authentication Flow
1. User visits the application
2. If not authenticated, shows login page
3. After successful login, redirects to appropriate dashboard based on role
4. Admin users see the full admin interface
5. Teacher users see the teacher-specific interface

### Component Migration Status
✅ **Completed**: All components have been migrated from `src/components/` to their respective modules
✅ **Admin Module**: 11 components fully functional
✅ **Teacher Module**: 7 components fully functional  
✅ **Shared Module**: 1 reusable component
✅ **TypeScript**: All imports resolved and compilation successful

### Mock Data
The application currently uses mock data for demonstration purposes. In a production environment, this would be replaced with:
- Real API endpoints
- Database integration
- JWT token authentication
- Secure password hashing

## Future Enhancements

- [ ] Real API integration
- [ ] Database setup
- [ ] User management system
- [ ] Advanced reporting
- [ ] Mobile responsiveness improvements
- [ ] Real-time notifications
- [ ] Data export functionality
- [ ] Advanced search and filtering
- [ ] Student photo management
- [ ] Bulk operations for admin
- [ ] Attendance history tracking

## Contributing

1. Follow the modular structure
2. Use TypeScript for type safety
3. Follow the existing component patterns
4. Add proper error handling
5. Include responsive design considerations
6. Place components in appropriate modules (admin/teacher/shared) 