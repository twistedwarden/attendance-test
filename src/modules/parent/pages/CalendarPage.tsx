import { useState, useEffect } from 'react';
import { Calendar, Clock, User, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { ParentService, Student } from '../api/parentService';

interface SubjectSchedule {
  subjectId: number;
  subjectName: string;
  subjectDescription: string;
  scheduleId: number;
  timeIn: string;
  timeOut: string;
  dayOfWeek: string;
  teacherName: string;
  teacherId: number;
}

interface CalendarPageProps {
  selectedStudent: Student;
}

const CalendarPage = ({ selectedStudent }: CalendarPageProps) => {
  const [subjects, setSubjects] = useState<SubjectSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayMapping: { [key: string]: string } = {
    'Sun': 'Sunday',
    'Mon': 'Monday', 
    'Tue': 'Tuesday',
    'Wed': 'Wednesday',
    'Thu': 'Thursday',
    'Fri': 'Friday',
    'Sat': 'Saturday'
  };
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (selectedStudent) {
      loadStudentSubjects();
    }
  }, [selectedStudent]);

  const loadStudentSubjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ParentService.getStudentSubjects(selectedStudent.studentId);
      // console.log('Loaded subjects data:', data); // Debug log
      setSubjects(data);
    } catch (error) {
      console.error('Error loading student subjects:', error);
      setError(error instanceof Error ? error.message : 'Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  const getSubjectsForDay = (dayName: string) => {
    const daySubjects = subjects.filter(subject => dayMapping[subject.dayOfWeek] === dayName);
    // console.log(`Getting subjects for ${dayName}:`, daySubjects); // Debug log
    return daySubjects;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const getCurrentWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    return startOfWeek;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-600">
            <Calendar className="h-6 w-6" />
          </div>
          <div className="ml-3">
            <h3 className="text-red-800 font-medium">Error loading calendar</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subject Calendar</h1>
          <p className="text-gray-600 mt-1">
            Schedule for {selectedStudent.fullName} - {selectedStudent.gradeLevel} • {selectedStudent.section}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'month' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'week' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <button
          onClick={() => setCurrentDate(new Date())}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Today
        </button>
      </div>

      {viewMode === 'month' ? (
        /* Month View */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {daysOfWeek.map(day => (
              <div key={day} className="p-4 text-center font-medium text-gray-700 bg-gray-50">
                {day.substring(0, 3)}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {getDaysInMonth(currentDate).map((date, index) => (
              <div key={index} className="min-h-[120px] border-r border-b border-gray-200 last:border-r-0">
                {date ? (
                  <div className="p-2 h-full">
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {getSubjectsForDay(daysOfWeek[date.getDay()]).map(subject => (
                        <div
                          key={subject.scheduleId}
                          className="bg-purple-100 text-purple-800 text-xs p-1 rounded truncate"
                          title={`${subject.subjectName} - ${formatTime(subject.timeIn)} to ${formatTime(subject.timeOut)}`}
                        >
                          <div className="font-medium truncate">{subject.subjectName}</div>
                          <div className="text-purple-600 truncate">
                            {formatTime(subject.timeIn)} - {formatTime(subject.timeOut)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full bg-gray-50"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Week View */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {getWeekDates(currentDate).map((date, index) => (
              <div key={index} className="p-4 text-center border-r border-gray-200 last:border-r-0">
                <div className="font-medium text-gray-700">{daysOfWeek[date.getDay()].substring(0, 3)}</div>
                <div className="text-lg font-bold text-gray-900">{date.getDate()}</div>
              </div>
            ))}
          </div>
          
          {/* Week grid */}
          <div className="grid grid-cols-7">
            {getWeekDates(currentDate).map((date, index) => (
              <div key={index} className="min-h-[200px] border-r border-gray-200 last:border-r-0 p-3">
                <div className="space-y-2">
                  {getSubjectsForDay(daysOfWeek[date.getDay()]).map(subject => (
                    <div
                      key={subject.scheduleId}
                      className="bg-purple-100 border border-purple-200 rounded-lg p-3"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <BookOpen className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-purple-900 text-sm">{subject.subjectName}</span>
                      </div>
                      <div className="space-y-1 text-xs text-purple-700">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(subject.timeIn)} - {formatTime(subject.timeOut)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span className="truncate">{subject.teacherName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subject List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Subjects</h3>
        {subjects.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No subjects scheduled for this student.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map(subject => (
              <div key={subject.scheduleId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{subject.subjectName}</h4>
                    <p className="text-sm text-gray-600">{dayMapping[subject.dayOfWeek] || subject.dayOfWeek}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(subject.timeIn)} - {formatTime(subject.timeOut)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{subject.teacherName}</span>
                  </div>
                </div>
                {subject.subjectDescription && (
                  <p className="text-sm text-gray-500 mt-2">{subject.subjectDescription}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
