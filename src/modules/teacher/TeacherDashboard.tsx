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
import { SchoolYearService } from '../shared/schoolYearService';
import { SchoolYear } from '../../types';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('attendance');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [schedules, setSchedules] = useState<TeacherSchedule[]>([]);
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [activeYear, setActiveYear] = useState<SchoolYear | null>(null);

  useEffect(() => {
    const loadTeacherData = async () => {
      try {
        // Load school year first (this should always work)
        const activeYearData = await SchoolYearService.getActiveSchoolYear();
        console.log('TeacherDashboard - Active year loaded:', activeYearData);
        setActiveYear(activeYearData);

        // Try to load schedules and students, but don't fail if there are permission issues
        try {
          const schedulesData = await TeacherService.getSchedules();
          setSchedules(schedulesData);
          
          // Only try to load students if we have schedules
          if (schedulesData.length > 0) {
            try {
              const studentsData = await TeacherService.getStudents(schedulesData[0].id);
              setStudents(studentsData);
            } catch (studentError) {
              console.warn('Could not load students (permission issue):', studentError);
              setStudents([]);
            }
          } else {
            setStudents([]);
          }
        } catch (scheduleError) {
          console.warn('Could not load schedules (permission issue):', scheduleError);
          setSchedules([]);
          setStudents([]);
        }
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
        <TeacherHeader onMobileMenuToggle={toggleMobileSidebar} activeYear={activeYear} />
        
        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
} 