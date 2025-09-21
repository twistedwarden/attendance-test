import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import CompactLayout from './components/CompactLayout';
import CompactDashboard from './pages/CompactDashboard';
import ModernDashboard from './pages/ModernDashboard';
import CompactProfile from './pages/CompactProfile';
import CompactAttendance from './pages/CompactAttendance';
import NoStudentsMessage from './components/NoStudentsMessage';
import StudentEnrollmentForm from './components/StudentEnrollmentForm';
import { ExcuseLetterSection } from './components/ExcuseLetterSection';
import { FollowUpDocumentsSection } from './components/FollowUpDocumentsSection';
import { ParentService, Parent, Student } from './api/parentService';
import './parent.css';

const ParentDashboard = () => {
  const [parent, setParent] = useState<Parent | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);

  useEffect(() => {
    loadParentData();
  }, []);

  const loadParentData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load parent profile and students in parallel
      const [parentData, studentsData] = await Promise.all([
        ParentService.getParentProfile(),
        ParentService.getParentStudents()
      ]);
      
      setParent(parentData);
      setStudents(studentsData);
      
      // Set first student as selected if available
      if (studentsData.length > 0) {
        setSelectedStudent(studentsData[0]);
      }
    } catch (error) {
      console.error('Error loading parent data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentChange = (student: Student) => {
    setSelectedStudent(student);
  };

  const handleStudentEnrolled = () => {
    // Refresh the students list after enrollment
    loadParentData();
    setShowEnrollmentModal(false);
  };

  const handleEnrollNewStudent = () => {
    setShowEnrollmentModal(true);
  };

  const handleCloseEnrollmentModal = () => {
    setShowEnrollmentModal(false);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-md">
            <p className="font-medium">Error loading data</p>
            <p className="text-sm mt-1">{error}</p>
            <button 
              onClick={loadParentData}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show no students message if no students are linked
  if (students.length === 0) {
    return <NoStudentsMessage onStudentEnrolled={handleStudentEnrolled} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Routes>
        <Route 
          path="/*" 
          element={
            <CompactLayout 
              selectedStudent={selectedStudent}
              onStudentChange={handleStudentChange}
              students={students}
              parent={parent}
              onEnrollNewStudent={handleEnrollNewStudent}
            />
          }
        >
          <Route 
            index 
            element={
              <div className="flex-1 w-full h-full overflow-auto">
                <ModernDashboard selectedStudent={selectedStudent} />
              </div>
            } 
          />
          <Route 
            path="profile" 
            element={
              <div className="flex-1 w-full h-full overflow-auto">
                <CompactProfile 
                  parentData={parent} 
                  students={students} 
                />
              </div>
            } 
          />
          <Route 
            path="attendance" 
            element={
              <div className="flex-1 w-full h-full overflow-auto">
                {selectedStudent && <CompactAttendance selectedDaughter={selectedStudent} />}
              </div>
            } 
          />
          <Route 
            path="excuse-letters" 
            element={
              <div className="flex-1 w-full h-full overflow-auto p-6">
                <ExcuseLetterSection students={students} />
              </div>
            } 
          />
          <Route 
            path="follow-up-documents" 
            element={
              <div className="flex-1 w-full h-full overflow-auto p-6">
                <FollowUpDocumentsSection students={students} />
              </div>
            } 
          />
        </Route>
      </Routes>
      
      {/* Enrollment Modal */}
      {showEnrollmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <StudentEnrollmentForm 
              onBack={handleCloseEnrollmentModal}
              onSuccess={handleStudentEnrolled}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard; 