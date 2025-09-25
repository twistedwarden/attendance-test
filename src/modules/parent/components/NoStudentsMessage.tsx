import { UserPlus, AlertCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useState } from 'react';
import StudentEnrollmentForm from './StudentEnrollmentForm';

export default function NoStudentsMessage({ onStudentEnrolled, enrollmentEnabled = true }: { onStudentEnrolled: () => void; enrollmentEnabled?: boolean }) {
  const { logout } = useAuth();
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);

  if (showEnrollmentForm) {
    return <StudentEnrollmentForm onBack={() => setShowEnrollmentForm(false)} onSuccess={onStudentEnrolled} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto text-center">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Icon */}
          <div className="mx-auto bg-yellow-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-6">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Students Linked
          </h2>
          
          {/* Description */}
          <p className="text-gray-600 mb-6">
            You don't have any students linked to your parent account yet. 
            You can enroll your child(ren) using the form below.
          </p>
          
          {/* Enrollment disabled notice */}
          {!enrollmentEnabled && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900 text-sm">
              Enrollment is currently closed.
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <span className="block" title={enrollmentEnabled ? undefined : 'Enrollment is currently closed.'}>
              <button
                onClick={() => setShowEnrollmentForm(true)}
                disabled={!enrollmentEnabled}
                className="w-full inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Enroll New Student
              </button>
            </span>
            
            <div className="text-sm text-gray-500">
              or contact the school office for assistance
            </div>
          </div>
          
          {/* Contact Information */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Contact the school office at{' '}
              <a href="tel:+1234567890" className="text-blue-600 hover:text-blue-700">
                (123) 456-7890
              </a>
              {' '}or email{' '}
              <a href="mailto:office@foothills.edu" className="text-blue-600 hover:text-blue-700">
                office@foothills.edu
              </a>
            </p>
            
            {/* Logout Button */}
            <button
              onClick={logout}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

