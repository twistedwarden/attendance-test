import React from 'react';
import { X, AlertTriangle, Clock, User, BookOpen } from 'lucide-react';

interface ConflictDetails {
  day: string;
  conflicts: {
    teacher: {
      hasOverlap: boolean;
      conflictingSchedules: Array<{
        ScheduleID: number;
        SubjectID: number;
        TimeIn: string;
        TimeOut: string;
        SubjectName: string;
      }>;
    };
    section: {
      hasOverlap: boolean;
      conflictingSchedules: Array<{
        ScheduleID: number;
        SubjectID: number;
        TimeIn: string;
        TimeOut: string;
        SubjectName: string;
        TeacherName: string;
      }>;
    };
  };
}

interface ScheduleConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: ConflictDetails[];
  errors: string[];
}

export default function ScheduleConflictModal({ 
  isOpen, 
  onClose, 
  conflicts, 
  errors 
}: ScheduleConflictModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Schedule Conflicts Detected
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-600 mb-4">
              The following conflicts prevent this schedule from being created:
            </p>
          </div>

          {/* Error Messages */}
          <div className="space-y-2 mb-6">
            {errors.map((error, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            ))}
          </div>

          {/* Detailed Conflicts */}
          {conflicts.map((conflict, index) => (
            <div key={index} className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                {conflict.day}
              </h3>

              {/* Teacher Conflicts */}
              {conflict.conflicts.teacher.hasOverlap && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4 text-blue-500" />
                    <h4 className="font-medium text-gray-900">Teacher Conflicts</h4>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-blue-800 text-sm mb-2">
                      This teacher is already scheduled during this time:
                    </p>
                    <div className="space-y-1">
                      {conflict.conflicts.teacher.conflictingSchedules.map((schedule, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-sm">
                          <Clock className="h-3 w-3 text-blue-600" />
                          <span className="text-blue-700">
                            {schedule.SubjectName} ({schedule.TimeIn} - {schedule.TimeOut})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Section Conflicts */}
              {conflict.conflicts.section.hasOverlap && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen className="h-4 w-4 text-green-500" />
                    <h4 className="font-medium text-gray-900">Section Conflicts</h4>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-green-800 text-sm mb-2">
                      This section is already scheduled during this time:
                    </p>
                    <div className="space-y-1">
                      {conflict.conflicts.section.conflictingSchedules.map((schedule, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-sm">
                          <Clock className="h-3 w-3 text-green-600" />
                          <span className="text-green-700">
                            {schedule.SubjectName} with {schedule.TeacherName} ({schedule.TimeIn} - {schedule.TimeOut})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Suggestions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Suggestions:</h4>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Choose a different time slot that doesn't conflict</li>
              <li>• Select a different teacher if they have conflicts</li>
              <li>• Assign to a different section if there are section conflicts</li>
              <li>• Check existing schedules to find available time slots</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
