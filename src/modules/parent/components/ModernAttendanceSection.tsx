import { Clock, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AttendanceRecord } from '../data/enhancedMockData';

interface ModernAttendanceSectionProps {
  attendanceRecords: AttendanceRecord[];
}

const ModernAttendanceSection = ({ attendanceRecords }: ModernAttendanceSectionProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Present':
        return <CheckCircle className="text-green-600" size={18} />;
      case 'Late':
        return <AlertCircle className="text-yellow-600" size={18} />;
      case 'Excused':
        return <Calendar className="text-blue-600" size={18} />;
      default:
        return <Clock className="text-gray-400" size={18} />;
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
        return 'bg-gray-50 text-gray-700 border-gray-200';
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

  return (
    <Card className="shadow-sm border-0 bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Recent Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {attendanceRecords.map((record, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 border border-gray-100">
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
        
        {attendanceRecords.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Clock size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No attendance records found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModernAttendanceSection; 