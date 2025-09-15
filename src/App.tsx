import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider, { useAuth } from './modules/auth/AuthContext';
import LoginPage from './modules/auth/LoginPage';
import RegisterInfo from './modules/auth/RegisterInfo.tsx';
import ParentRegister from './modules/auth/ParentRegister.tsx';
import AdminDashboard from './modules/admin/AdminDashboard';
import TeacherDashboard from './modules/teacher/TeacherDashboard';
import ParentDashboard from './modules/parent/ParentDashboard';
import RegistrarDashboard from './modules/registrar/RegistrarDashboard';

function AppContent() {
  const { user, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route path="/parent-register" element={<ParentRegister />} />
        <Route path="/register" element={<RegisterInfo />} />
        <Route 
          path="/*" 
          element={
            user ? (
              user.role === 'admin' ? <AdminDashboard /> :
              user.role === 'teacher' ? <TeacherDashboard /> :
              user.role === 'parent' ? <ParentDashboard /> :
              user.role === 'registrar' ? <RegistrarDashboard /> :
              <LoginPage />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;