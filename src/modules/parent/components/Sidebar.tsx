import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  User, 
  Calendar, 
  X,
  ChevronDown,
  Users,
  Fingerprint,
  UserPlus
} from 'lucide-react';
import { Student, Parent } from '../api/parentService';

interface SidebarProps {
  selectedStudent: Student | null;
  onStudentChange: (student: Student) => void;
  students: Student[];
  parent: Parent | null;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  onEnrollNewStudent?: () => void;
}

const Sidebar = ({ selectedStudent, onStudentChange, students, parent, isMobileOpen = false, onMobileClose, onEnrollNewStudent }: SidebarProps) => {
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
      description: 'Overview & Stats'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      description: 'Manage Information'
    },
    {
      name: 'Attendance',
      href: '/attendance',
      icon: Calendar,
      description: 'View Records'
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`
        lg:hidden fixed top-0 left-0 h-screen w-64 bg-white shadow-sm border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 pb-24 flex-1 overflow-y-auto scrollbar-hide">
            {/* Mobile Close Button */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-600 p-2 rounded-lg">
                  <Fingerprint className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Parent</h2>
                  <p className="text-sm text-gray-500">Portal</p>
                </div>
              </div>
              <button
                onClick={onMobileClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Parent Info */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="text-sm">
                <p className="font-medium text-gray-900">Sarah Johnson</p>
                <p className="text-purple-600">Parent</p>
              </div>
            </div>

            {/* Student Selection */}
            <div className="mb-6">
              <div className="relative">
                <button
                  onClick={() => setIsStudentDropdownOpen(!isStudentDropdownOpen)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Users size={16} className="text-gray-600" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-800">
                        {selectedStudent ? selectedStudent.fullName : 'Select Student'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedStudent ? `Grade ${selectedStudent.gradeLevel} - Section ${selectedStudent.section}` : 'Choose student'}
                      </p>
                    </div>
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`text-gray-600 transition-transform ${isStudentDropdownOpen ? 'rotate-180' : ''}`} 
                  />
                </button>

                {/* Dropdown */}
                {isStudentDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {students.map((student) => (
                      <button
                        key={student.studentId}
                        onClick={() => {
                          onStudentChange(student);
                          setIsStudentDropdownOpen(false);
                        }}
                        className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0 ${
                          selectedStudent?.studentId === student.studentId ? 'bg-purple-50 text-purple-700' : ''
                        }`}
                      >
                        <p className="font-medium">{student.fullName}</p>
                        <p className="text-sm text-gray-500">Grade {student.gradeLevel} - Section {student.section}</p>
                      </button>
                    ))}
                    
                    {/* Enroll New Student Button */}
                    {onEnrollNewStudent && (
                      <button
                        onClick={() => {
                          onEnrollNewStudent();
                          setIsStudentDropdownOpen(false);
                        }}
                        className="w-full p-3 text-left hover:bg-blue-50 transition-colors border-t border-gray-200 bg-blue-50/50"
                      >
                        <div className="flex items-center space-x-2">
                          <UserPlus size={16} className="text-blue-600" />
                          <span className="font-medium text-blue-700">Enroll New Student</span>
                        </div>
                        <p className="text-sm text-blue-600 mt-1">Add another child</p>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => onMobileClose?.()}
                  className={({ isActive }) =>
                    `w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon className={`h-5 w-5 ${
                    navigationItems.find(nav => nav.href === item.href)?.href === item.href ? 'text-purple-600' : 'text-gray-400'
                  }`} />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs opacity-75">{item.description}</p>
                  </div>
                </NavLink>
              ))}
              
              {/* Enroll New Student Button - Always Visible */}
              <button
                onClick={() => {
                  onEnrollNewStudent?.();
                  onMobileClose?.();
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
              >
                <UserPlus className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Enroll New Student</p>
                  <p className="text-xs opacity-75">Add another child</p>
                </div>
              </button>
            </nav>
          </div>

          {/* System Stats */}
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">System Status</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 font-medium">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col h-full bg-white shadow-sm border-r border-gray-200">
        <div className="p-6 pb-24 flex-1 overflow-y-auto scrollbar-hide">
          {/* Desktop Logo */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-purple-600 p-2 rounded-lg">
              <Fingerprint className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Parent</h2>
              <p className="text-sm text-gray-500">Portal</p>
            </div>
          </div>

          {/* Parent Info */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="text-sm">
              <p className="font-medium text-gray-900">{parent?.fullName || 'Loading...'}</p>
              <p className="text-purple-600">Parent</p>
            </div>
          </div>

          {/* Student Selection */}
          <div className="mb-6">
            <div className="relative">
              <button
                onClick={() => setIsStudentDropdownOpen(!isStudentDropdownOpen)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Users size={16} className="text-gray-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">
                      {selectedStudent ? selectedStudent.fullName : 'Select Student'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedStudent ? `Grade ${selectedStudent.gradeLevel} - Section ${selectedStudent.section}` : 'Choose student'}
                    </p>
                  </div>
                </div>
                <ChevronDown 
                  size={16} 
                  className={`text-gray-600 transition-transform ${isStudentDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>

              {/* Dropdown */}
              {isStudentDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {students.map((student) => (
                    <button
                      key={student.studentId}
                      onClick={() => {
                        onStudentChange(student);
                        setIsStudentDropdownOpen(false);
                      }}
                      className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0 ${
                        selectedStudent?.studentId === student.studentId ? 'bg-purple-50 text-purple-700' : ''
                      }`}
                    >
                      <p className="font-medium">{student.fullName}</p>
                      <p className="text-sm text-gray-500">Grade {student.gradeLevel} - Section {student.section}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className={`h-5 w-5 ${
                  navigationItems.find(nav => nav.href === item.href)?.href === item.href ? 'text-purple-600' : 'text-gray-400'
                }`} />
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs opacity-75">{item.description}</p>
                </div>
              </NavLink>
            ))}
            
            {/* Enroll New Student Button - Desktop */}
            <button
              onClick={() => {
                onEnrollNewStudent?.();
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
            >
              <UserPlus className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Enroll New Student</p>
                <p className="text-xs opacity-75">Add another child</p>
              </div>
            </button>
          </nav>
        </div>

        {/* System Stats */}
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">System Status</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-medium">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 