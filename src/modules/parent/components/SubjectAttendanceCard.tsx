import { useState } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar,
  ChevronDown,
  ChevronUp,
  User,
  BookOpen,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { SubjectAttendanceData } from '../api/parentService';

interface SubjectAttendanceCardProps {
  subjectData: SubjectAttendanceData;
}

const SubjectAttendanceCard = ({ subjectData }: SubjectAttendanceCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Present':
        return <CheckCircle className="text-green-600" size={16} />;
      case 'Late':
        return <AlertCircle className="text-yellow-600" size={16} />;
      case 'Excused':
        return <Calendar className="text-blue-600" size={16} />;
      default:
        return <XCircle className="text-red-600" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Late':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Excused':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return '--:--';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatScheduleTime = (time: string) => {
    if (!time) return '--:--';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="text-blue-600" size={20} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-800">
                {subjectData.subjectName}
              </CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center space-x-1">
                  <User size={14} />
                  <span>{subjectData.teacherName}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock size={14} />
                  <span>{subjectData.dayOfWeek}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>{formatScheduleTime(subjectData.scheduleTimeIn)} - {formatScheduleTime(subjectData.scheduleTimeOut)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className={`text-2xl font-bold ${getAttendanceRateColor(subjectData.stats.attendanceRate)}`}>
                {subjectData.stats.attendanceRate}%
              </div>
              <div className="text-xs text-gray-500">Attendance Rate</div>
            </div>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>
      </CardHeader>

      {/* Summary Stats */}
      <CardContent className="pt-0">
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{subjectData.stats.presentDays}</div>
            <div className="text-xs text-green-700">Present</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-lg font-bold text-yellow-600">{subjectData.stats.lateDays}</div>
            <div className="text-xs text-yellow-700">Late</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-600">{subjectData.stats.absentDays}</div>
            <div className="text-xs text-red-700">Absent</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-600">{subjectData.stats.totalDays}</div>
            <div className="text-xs text-gray-700">Total</div>
          </div>
        </div>

        {/* Expanded Attendance Records */}
        {isExpanded && (
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Recent Attendance</span>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {subjectData.attendanceRecords.slice(0, 10).map((record, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(record.status)}
                    <div>
                      <p className="font-medium text-gray-800 text-sm">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(record.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">In</p>
                      <p className="font-medium text-gray-800 text-sm">
                        {formatTime(record.timeIn)}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Out</p>
                      <p className="font-medium text-gray-800 text-sm">
                        {formatTime(record.timeOut)}
                      </p>
                    </div>
                    
                    <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                      {record.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {subjectData.attendanceRecords.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <Clock size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No attendance records found for this subject</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubjectAttendanceCard;
