import React, { useState, useEffect } from 'react';
import { TeacherService, TeacherStudent } from '../api/teacherService';
import { ExcuseLetter, TeacherSchedule, ExcuseLetterFormData, ExcuseLetterReviewData } from '../../../types';
import { 
  PlusIcon, 
  EyeIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  CalendarIcon,
  UserIcon,
  BookOpenIcon,
  PhoneIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface TeacherExcuseLetterViewProps {
  schedules: TeacherSchedule[];
  students: TeacherStudent[];
}

export const TeacherExcuseLetterView: React.FC<TeacherExcuseLetterViewProps> = ({ schedules, students }) => {
  const [excuseLetters, setExcuseLetters] = useState<ExcuseLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<ExcuseLetter | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStudent, setFilterStudent] = useState<number | null>(null);
  const [filterSubject, setFilterSubject] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExcuseLetters();
  }, [filterStatus, filterStudent, filterSubject]);

  const loadExcuseLetters = async () => {
    try {
      setLoading(true);
      const letters = await TeacherService.getExcuseLetters(
        filterStudent || undefined,
        filterStatus === 'all' ? undefined : filterStatus,
        filterSubject || undefined
      );
      setExcuseLetters(letters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load excuse letters');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExcuseLetter = async (formData: ExcuseLetterFormData) => {
    try {
      await TeacherService.submitExcuseLetter(formData);
      setShowForm(false);
      await loadExcuseLetters();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit excuse letter');
    }
  };

  const handleReviewExcuseLetter = async (reviewData: ExcuseLetterReviewData) => {
    if (!selectedLetter) return;
    if (selectedLetter.status !== 'pending') return;
    
    try {
      await TeacherService.reviewExcuseLetter(selectedLetter.excuseLetterId, reviewData);
      setShowReviewModal(false);
      setSelectedLetter(null);
      await loadExcuseLetters();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review excuse letter');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'declined':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStudentName = (studentId: number) => {
    const student = students.find(s => s.studentId === studentId);
    return student ? student.studentName : `Student ${studentId}`;
  };

  const getSubjectName = (subjectId: number) => {
    const schedule = schedules.find(s => s.subjectId === subjectId);
    return schedule ? schedule.subjectName : `Subject ${subjectId}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Excuse Letters</h2>
          <p className="text-gray-600">Review and manage excuse letters from parents</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Submit Excuse Letter
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
          <select
            value={filterStudent || ''}
            onChange={(e) => setFilterStudent(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Students</option>
            {students.map((student) => (
              <option key={student.studentId} value={student.studentId}>
                {student.studentName}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select
            value={filterSubject || ''}
            onChange={(e) => setFilterSubject(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Subjects</option>
            {schedules.map((schedule) => (
              <option key={schedule.subjectId} value={schedule.subjectId}>
                {schedule.subjectName}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-end">
          <button
            onClick={() => {
              setFilterStatus('all');
              setFilterStudent(null);
              setFilterSubject(null);
            }}
            className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Excuse Letters List */}
      <div className="space-y-4">
        {excuseLetters.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-gray-500">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No excuse letters found</h3>
              <p>No excuse letters match your current filters.</p>
            </div>
          </div>
        ) : (
          excuseLetters.map((letter) => (
            <div key={letter.excuseLetterId} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900">{getStudentName(letter.studentId)}</span>
                    <span className="text-sm text-gray-500">({letter.gradeLevel} - {letter.sectionName})</span>
                  </div>
                  
                  {letter.subjectName && (
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpenIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{letter.subjectName}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {formatDate(letter.dateFrom)} - {formatDate(letter.dateTo)}
                    </span>
                  </div>
                  
                  {letter.parentName && (
                    <div className="flex items-center gap-2 mb-2">
                      <PhoneIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Parent: {letter.parentName} {letter.parentContact && `(${letter.parentContact})`}
                      </span>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-700 mb-3">{letter.reason}</p>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(letter.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(letter.status)}`}>
                      {letter.status.charAt(0).toUpperCase() + letter.status.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500">
                      Submitted {formatDate(letter.createdAt)} by {letter.submittedBy}
                    </span>
                  </div>
                  
                  {letter.reviewNotes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">
                        <strong>Review Notes:</strong> {letter.reviewNotes}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedLetter(letter);
                      setShowReviewModal(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <EyeIcon className="h-4 w-4" />
                    View Details
                  </button>
                  
                  {letter.status === 'pending' && (
                    <button
                      onClick={() => {
                        setSelectedLetter(letter);
                        setShowReviewModal(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <CheckIcon className="h-4 w-4" />
                      Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Submit Form Modal */}
      {showForm && (
        <TeacherExcuseLetterForm
          students={students}
          schedules={schedules}
          onClose={() => setShowForm(false)}
          onSubmit={handleSubmitExcuseLetter}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && selectedLetter && (
        <ExcuseLetterReviewModal
          excuseLetter={selectedLetter}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedLetter(null);
          }}
          onReview={handleReviewExcuseLetter}
        />
      )}
    </div>
  );
};

// Teacher Excuse Letter Form Component
interface TeacherExcuseLetterFormProps {
  students: TeacherStudent[];
  schedules: TeacherSchedule[];
  onClose: () => void;
  onSubmit: (formData: ExcuseLetterFormData) => void;
}

const TeacherExcuseLetterForm: React.FC<TeacherExcuseLetterFormProps> = ({
  students,
  schedules,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<ExcuseLetterFormData>({
    studentId: 0,
    subjectId: undefined,
    dateFrom: '',
    dateTo: '',
    reason: '',
    supportingDocumentPath: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.dateFrom || !formData.dateTo || !formData.reason) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Submit Excuse Letter</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student *
              </label>
              <select
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={0}>Select a student</option>
                {students.map((student) => (
                  <option key={student.studentId} value={student.studentId}>
                    {student.studentName}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject (Optional)
              </label>
              <select
                value={formData.subjectId || ''}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All subjects</option>
                {schedules.map((schedule) => (
                  <option key={schedule.subjectId} value={schedule.subjectId}>
                    {schedule.subjectName}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date *
                </label>
                <input
                  type="date"
                  value={formData.dateFrom}
                  onChange={(e) => setFormData({ ...formData, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Date *
                </label>
                <input
                  type="date"
                  value={formData.dateTo}
                  onChange={(e) => setFormData({ ...formData, dateTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Absence *
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Please provide a detailed reason for the absence..."
                required
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting || !formData.studentId || !formData.dateFrom || !formData.dateTo || !formData.reason}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Excuse Letter'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Excuse Letter Review Modal
interface ExcuseLetterReviewModalProps {
  excuseLetter: ExcuseLetter;
  onClose: () => void;
  onReview: (reviewData: ExcuseLetterReviewData) => void;
}

const ExcuseLetterReviewModal: React.FC<ExcuseLetterReviewModalProps> = ({
  excuseLetter,
  onClose,
  onReview
}) => {
  const [reviewData, setReviewData] = useState<ExcuseLetterReviewData>({
    status: 'approved',
    reviewNotes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const isReadOnly = excuseLetter.status !== 'pending';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setSubmitting(true);
    try {
      await onReview(reviewData);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Review Excuse Letter</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Excuse Letter Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{excuseLetter.studentName}</span>
                <span className="text-sm text-gray-500">({excuseLetter.gradeLevel} - {excuseLetter.sectionName})</span>
              </div>
              
              {excuseLetter.subjectName && (
                <div className="flex items-center gap-2">
                  <BookOpenIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{excuseLetter.subjectName}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {formatDate(excuseLetter.dateFrom)} - {formatDate(excuseLetter.dateTo)}
                </span>
              </div>
              
              {excuseLetter.parentName && (
                <div className="flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Parent: {excuseLetter.parentName} {excuseLetter.parentContact && `(${excuseLetter.parentContact})`}
                  </span>
                </div>
              )}
              
              <div className="mt-3">
                <p className="text-sm text-gray-700">
                  <strong>Reason:</strong> {excuseLetter.reason}
                </p>
              </div>
            </div>
          </div>

          {/* Review Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Decision *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="approved"
                    checked={reviewData.status === 'approved'}
                    onChange={(e) => setReviewData({ ...reviewData, status: e.target.value as 'approved' | 'declined' })}
                    className="mr-2"
                    disabled={isReadOnly}
                  />
                  <span className="text-green-600">Approve</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="declined"
                    checked={reviewData.status === 'declined'}
                    onChange={(e) => setReviewData({ ...reviewData, status: e.target.value as 'approved' | 'declined' })}
                    className="mr-2"
                    disabled={isReadOnly}
                  />
                  <span className="text-red-600">Decline</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Notes (Optional)
              </label>
              <textarea
                value={reviewData.reviewNotes}
                onChange={(e) => setReviewData({ ...reviewData, reviewNotes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Add any additional notes or comments..."
                disabled={isReadOnly}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting || isReadOnly}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReadOnly ? (excuseLetter.status === 'approved' ? 'Already Approved' : 'Already Declined') : (submitting ? 'Processing...' : 'Submit Review')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
