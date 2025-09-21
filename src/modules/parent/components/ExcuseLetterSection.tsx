import React, { useState, useEffect } from 'react';
import { ParentService } from '../api/parentService';
import { ExcuseLetter, Student, ExcuseLetterFormData } from '../../../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  PlusIcon, 
  EyeIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  CalendarIcon,
  UserIcon,
  BookOpenIcon,
  XMarkIcon,
  DocumentTextIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface ExcuseLetterSectionProps {
  students: Student[];
}

export const ExcuseLetterSection: React.FC<ExcuseLetterSectionProps> = ({ students }) => {
  const [excuseLetters, setExcuseLetters] = useState<ExcuseLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedExcuseLetter, setSelectedExcuseLetter] = useState<ExcuseLetter | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    loadExcuseLetters();
  }, [filterStatus]);

  const loadExcuseLetters = async () => {
    try {
      setLoading(true);
      const letters = await ParentService.getExcuseLetters(
        undefined, 
        filterStatus === 'all' ? undefined : filterStatus
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
      await ParentService.submitExcuseLetter(formData);
      setShowForm(false);
      setSelectedStudent(null);
      await loadExcuseLetters();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit excuse letter');
    }
  };

  const handleViewDetails = async (excuseLetterId: number) => {
    try {
      setDetailsLoading(true);
      const details = await ParentService.getExcuseLetterDetails(excuseLetterId);
      setSelectedExcuseLetter(details);
      setShowDetailsModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load excuse letter details');
    } finally {
      setDetailsLoading(false);
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
          <p className="text-gray-600">Submit and track excuse letters for your children</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Submit Excuse Letter
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('all')}
        >
          All
        </Button>
        <Button
          variant={filterStatus === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('pending')}
        >
          Pending
        </Button>
        <Button
          variant={filterStatus === 'approved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('approved')}
        >
          Approved
        </Button>
        <Button
          variant={filterStatus === 'declined' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('declined')}
        >
          Declined
        </Button>
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
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No excuse letters found</h3>
              <p>You haven't submitted any excuse letters yet.</p>
            </div>
          </Card>
        ) : (
          excuseLetters.map((letter) => (
            <Card key={letter.excuseLetterId} className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900">{letter.studentName}</span>
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
                  
                  <p className="text-sm text-gray-700 mb-3">{letter.reason}</p>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(letter.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(letter.status)}`}>
                      {letter.status.charAt(0).toUpperCase() + letter.status.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500">
                      Submitted {formatDate(letter.createdAt)}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(letter.excuseLetterId)}
                    disabled={detailsLoading}
                  >
                    <EyeIcon className="h-4 w-4" />
                    {detailsLoading ? 'Loading...' : 'View Details'}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Submit Form Modal */}
      {showForm && (
        <ExcuseLetterForm
          students={students}
          selectedStudent={selectedStudent}
          onClose={() => {
            setShowForm(false);
            setSelectedStudent(null);
          }}
          onSubmit={handleSubmitExcuseLetter}
        />
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedExcuseLetter && (
        <ExcuseLetterDetailsModal
          excuseLetter={selectedExcuseLetter}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedExcuseLetter(null);
          }}
        />
      )}
    </div>
  );
};

// Excuse Letter Form Component
interface ExcuseLetterFormProps {
  students: Student[];
  selectedStudent: number | null;
  onClose: () => void;
  onSubmit: (formData: ExcuseLetterFormData) => void;
}

const ExcuseLetterForm: React.FC<ExcuseLetterFormProps> = ({
  students,
  selectedStudent,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<ExcuseLetterFormData>({
    studentId: selectedStudent || 0,
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
            <Button variant="outline" onClick={onClose}>
              ×
            </Button>
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
                  <option key={student.id} value={student.id}>
                    {student.fullName} ({student.gradeLevel} - {student.section})
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
                <Input
                  type="date"
                  value={formData.dateFrom}
                  onChange={(e) => setFormData({ ...formData, dateFrom: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Date *
                </label>
                <Input
                  type="date"
                  value={formData.dateTo}
                  onChange={(e) => setFormData({ ...formData, dateTo: e.target.value })}
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

            {/* Supporting Document */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supporting Document (Optional)
              </label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // TODO: Implement file upload
                    setFormData({ ...formData, supportingDocumentPath: file.name });
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 5MB)
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={submitting || !formData.studentId || !formData.dateFrom || !formData.dateTo || !formData.reason}
                className="flex-1"
              >
                {submitting ? 'Submitting...' : 'Submit Excuse Letter'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Excuse Letter Details Modal Component
interface ExcuseLetterDetailsModalProps {
  excuseLetter: ExcuseLetter;
  onClose: () => void;
}

const ExcuseLetterDetailsModal: React.FC<ExcuseLetterDetailsModalProps> = ({
  excuseLetter,
  onClose
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-6 w-6 text-yellow-500" />;
      case 'approved':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'declined':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      default:
        return <ClockIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Excuse Letter Details</h3>
                <p className="text-sm text-gray-500">Letter ID: #{excuseLetter.excuseLetterId}</p>
              </div>
            </div>
            <Button variant="outline" onClick={onClose} className="p-2">
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Information */}
            <div className="space-y-6">
              {/* Student Information */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">Student Information</h4>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Name:</span>
                    <p className="text-gray-900">{excuseLetter.studentName}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Grade & Section:</span>
                    <p className="text-gray-900">{excuseLetter.gradeLevel} - {excuseLetter.sectionName}</p>
                  </div>
                  {excuseLetter.subjectName && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Subject:</span>
                      <p className="text-gray-900">{excuseLetter.subjectName}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Absence Details */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">Absence Details</h4>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">From Date:</span>
                    <p className="text-gray-900">{formatDate(excuseLetter.dateFrom)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">To Date:</span>
                    <p className="text-gray-900">{formatDate(excuseLetter.dateTo)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Reason:</span>
                    <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-md">
                      {excuseLetter.reason}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Supporting Document */}
              {excuseLetter.supportingDocumentPath && (
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">Supporting Document</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                      {excuseLetter.supportingDocumentPath}
                    </span>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column - Status & Timeline */}
            <div className="space-y-6">
              {/* Status */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  {getStatusIcon(excuseLetter.status)}
                  <h4 className="font-semibold text-gray-900">Status</h4>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(excuseLetter.status)}`}>
                  {excuseLetter.status.charAt(0).toUpperCase() + excuseLetter.status.slice(1)}
                </div>
              </Card>

              {/* Timeline */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ClockIcon className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">Timeline</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Submitted</p>
                      <p className="text-xs text-gray-500">{formatDateTime(excuseLetter.createdAt)}</p>
                      <p className="text-xs text-gray-500">by {excuseLetter.submittedBy === 'parent' ? 'Parent' : 'Teacher'}</p>
                    </div>
                  </div>
                  
                  {excuseLetter.reviewedAt && (
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        excuseLetter.status === 'approved' ? 'bg-green-500' : 
                        excuseLetter.status === 'declined' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {excuseLetter.status === 'approved' ? 'Approved' : 
                           excuseLetter.status === 'declined' ? 'Declined' : 'Under Review'}
                        </p>
                        <p className="text-xs text-gray-500">{formatDateTime(excuseLetter.reviewedAt)}</p>
                        {excuseLetter.reviewedByName && (
                          <p className="text-xs text-gray-500">by {excuseLetter.reviewedByName}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Review Notes */}
              {excuseLetter.reviewNotes && (
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <UserGroupIcon className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">Review Notes</h4>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700">{excuseLetter.reviewNotes}</p>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
