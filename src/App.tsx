import { AuthProvider, useAuth } from './modules/auth';
import LoginPage from './modules/auth/LoginPage';
import AdminDashboard from './modules/admin/AdminDashboard';
import TeacherDashboard from './modules/teacher/TeacherDashboard';

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  if (user.role === 'teacher') {
    return <TeacherDashboard />;
  }

  return <LoginPage />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;