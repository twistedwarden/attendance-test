import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ParentHeader from './ParentHeader';
import { Student, Parent } from '../api/parentService';

interface CompactLayoutProps {
  selectedStudent: Student | null;
  onStudentChange: (student: Student) => void;
  students: Student[];
  parent: Parent | null;
  onEnrollNewStudent?: () => void;
  enrollmentEnabled?: boolean;
}

const CompactLayout = ({ selectedStudent, onStudentChange, students, parent, onEnrollNewStudent, enrollmentEnabled = true }: CompactLayoutProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const handleMobileClose = () => {
    setIsMobileOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Single Sidebar Component */}
      <Sidebar
        selectedStudent={selectedStudent}
        onStudentChange={onStudentChange}
        students={students}
        parent={parent}
        isMobileOpen={isMobileOpen}
        onMobileClose={handleMobileClose}
        onEnrollNewStudent={onEnrollNewStudent}
        enrollmentEnabled={enrollmentEnabled}
      />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <ParentHeader onMobileMenuToggle={handleMobileMenuToggle} />
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default CompactLayout; 