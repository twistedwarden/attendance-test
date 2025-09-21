import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import TeacherService, { TeacherSchedule, TeacherStudent } from './api/teacherService';
import TeacherSidebar from './TeacherSidebar';
import TeacherHeader from './TeacherHeader';
import TeacherAttendanceView from './TeacherAttendanceView';
import TeacherStudentsView from './TeacherStudentsView';
import TeacherReportsView from './TeacherReportsView';
import TeacherNotificationsView from './TeacherNotificationsView';
import { TeacherExcuseLetterView } from './components/TeacherExcuseLetterView';
import AccountSettings from '../admin/components/AccountSettings';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('attendance');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [schedules, setSchedules] = useState<TeacherSchedule[]>([]);
  const [students, setStudents] = useState<TeacherStudent[]>([]);

  useEffect(() => {
    const loadTeacherData = async () => {
      try {
        const [schedulesData, studentsData] = await Promise.all([
          TeacherService.getSchedules(),
          TeacherService.getStudents(1) // Default to first schedule, will be updated
        ]);
        setSchedules(schedulesData);
        setStudents(studentsData);
      } catch (error) {
        console.error('Error loading teacher data:', error);
      }
    };

    if (user?.role === 'teacher') {
      loadTeacherData();
    }
  }, [user]);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'attendance':
        return <TeacherAttendanceView />;
      case 'students':
        return <TeacherStudentsView />;
      case 'reports':
        return <TeacherReportsView />;
      case 'notifications':
        return <TeacherNotificationsView />;
      case 'excuse-letters':
        return <TeacherExcuseLetterView schedules={schedules as any} students={students} />;
      case 'settings':
        return <AccountSettings showNameField={false} />;
      default:
        return <TeacherAttendanceView />;
    }
  };

  if (!user || user.role !== 'teacher') {
    return <div>Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
        user={user}
      />
      
      <div className="md:ml-64 flex flex-col min-h-screen">
        <TeacherHeader onMobileMenuToggle={toggleMobileSidebar} />
        
        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
} 