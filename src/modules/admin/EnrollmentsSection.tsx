import { useEffect, useMemo, useState } from 'react';
import { Search, Eye, Check, X, FileText, User, Calendar, Phone, Download } from 'lucide-react';
import { AdminService } from './api/adminService';
import Modal from './components/Modal';
// import ConfirmModal from './components/ConfirmModal';
import { toast } from 'sonner';

interface Enrollment {
  id: number;
  name: string;
  dateOfBirth?: string;
  gender?: string;
  placeOfBirth?: string;
  nationality?: string;
  address?: string;
  gradeLevel?: string;
  section?: string;
  enrollmentStatus: 'pending' | 'approved' | 'declined';
  enrollmentDate?: string;
  parentName?: string;
  parentContact?: string;
  parentEmail?: string;
  reviewId?: number;
  reviewStatus?: string;
  reviewDate?: string;
  declineReason?: string;
  reviewNotes?: string;
  reviewedBy?: number;
  reviewedByUsername?: string;
  documents?: any[] | string;
  additionalInfo?: string;
  submittedBy?: number;
}

interface EnrollmentStats {
  total: number;
  pending: number;
  approved: number;
  declined: number;
}

export default function EnrollmentsSection() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [stats, setStats] = useState<EnrollmentStats>({ total: 0, pending: 0, approved: 0, declined: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrollmentEnabled, setEnrollmentEnabled] = useState<boolean>(true);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [pendingToggleValue, setPendingToggleValue] = useState<boolean | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [declineNotes, setDeclineNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  const authToken = useMemo(() => localStorage.getItem('auth_token') || '', []);

  const getPreviewUrl = (filename: string) => {
    const encoded = encodeURIComponent(filename);
    const token = authToken;
    return `/api/registrar/documents/${encoded}?token=${encodeURIComponent(token)}`;
  };

  const handlePreviewDocument = (filename: string) => {
    const url = getPreviewUrl(filename);
    window.open(url, '_blank');
  };

  const handleDownloadDocument = async (filename: string) => {
    try {
      const res = await fetch(`/api/registrar/documents/${encodeURIComponent(filename)}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) {
        toast.error('Failed to download document');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e?.message || 'Download failed');
    }
  };
  
  // Schedule assignment state
  const [schedules, setSchedules] = useState<any[]>([]);
  const [scheduleAssignments, setScheduleAssignments] = useState<Array<{scheduleId: number}>>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);

  const loadEnrollments = async (page = 1, status = statusFilter) => {
    try {
      setLoading(true);
      setError(null);
      const response = await AdminService.getEnrollments({ 
        status: status === 'all' ? undefined : status, 
        page, 
        limit: 10 
      });
      setEnrollments(response.data || []);
      setTotalPages(response.pagination?.pages || 1);
      setCurrentPage(page);
    } catch (e: any) {
      setError(e?.message || 'Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await AdminService.getEnrollmentStats();
      setStats(statsData);
    } catch (e: any) {
      console.error('Failed to load stats:', e);
    }
  };

  useEffect(() => {
    loadEnrollments();
    loadStats();
    loadSchedules();
    (async () => {
      try {
        const enabled = await AdminService.getEnrollmentEnabled();
        setEnrollmentEnabled(Boolean(enabled));
      } catch {}
    })();
  }, []);

  // Load sections filtered by the enrollee's grade level when Approve modal opens
  useEffect(() => {
    (async () => {
      if (!approveOpen || !selectedEnrollment) return;
      try {
        const list = await AdminService.listSections(selectedEnrollment.gradeLevel || undefined, true);
        setSections(list || []);
      } catch (e) {
        console.error('Failed to load sections for grade level', e);
      }
    })();
  }, [approveOpen, selectedEnrollment]);

  const loadSchedules = async () => {
    try {
      const schedulesRes = await AdminService.getSchedules();
      setSchedules(schedulesRes || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter(enrollment => {
      const matchesSearch = enrollment.name.toLowerCase().includes(search.toLowerCase()) ||
                           enrollment.parentName?.toLowerCase().includes(search.toLowerCase()) ||
                           enrollment.parentContact?.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [enrollments, search]);

  const handleViewEnrollment = async (id: number) => {
    try {
      console.log('Loading enrollment details for ID:', id);
      const enrollment = await AdminService.getEnrollment(id);
      console.log('Enrollment loaded:', enrollment);
      setSelectedEnrollment(enrollment);
      setViewOpen(true);
      console.log('Modal should be open now');
    } catch (e: any) {
      console.error('Error loading enrollment:', e);
      toast.error(e?.message || 'Failed to load enrollment details');
    }
  };

  const addScheduleAssignment = () => {
    if (!selectedSectionId) {
      toast.error('Select a section first before adding schedules.');
      return;
    }
    setScheduleAssignments([...scheduleAssignments, { scheduleId: 0 }]);
  };

  const removeScheduleAssignment = (index: number) => {
    setScheduleAssignments(scheduleAssignments.filter((_, i) => i !== index));
  };

  const updateScheduleAssignment = (index: number, scheduleId: number) => {
    // Check if this schedule is already assigned to another slot
    const isDuplicate = scheduleAssignments.some((assignment, i) => 
      i !== index && assignment.scheduleId === scheduleId && scheduleId > 0
    );
    
    if (isDuplicate) {
      toast.error('This schedule is already assigned. Please select a different schedule.');
      return;
    }
    
    const updated = [...scheduleAssignments];
    updated[index] = { scheduleId };
    setScheduleAssignments(updated);
  };

  const handleApprove = async () => {
    if (!selectedEnrollment) {
      console.error('No selected enrollment for approval');
      return;
    }

    // Require a section before assigning schedules
    if (!selectedSectionId) {
      toast.error('Please select a section before approving.');
      return;
    }
    
    // Validate for duplicate schedules before approval
    const assignedScheduleIds = scheduleAssignments
      .map(assignment => assignment.scheduleId)
      .filter(id => id > 0);
    const uniqueScheduleIds = [...new Set(assignedScheduleIds)];
    
    if (assignedScheduleIds.length !== uniqueScheduleIds.length) {
      toast.error('Please remove duplicate schedule assignments before approving.');
      return;
    }
    
    try {
      console.log('Approving enrollment:', selectedEnrollment.id, 'with notes:', approveNotes);
      setActionLoading(true);
      await AdminService.approveEnrollment(selectedEnrollment.id, approveNotes, scheduleAssignments, selectedSectionId);
      toast.success('Enrollment approved successfully');
      setApproveOpen(false);
      setApproveNotes('');
      setScheduleAssignments([]);
      setSelectedSectionId(null);
      loadEnrollments(currentPage, statusFilter);
      loadStats();
    } catch (e: any) {
      console.error('Error approving enrollment:', e);
      toast.error(e?.message || 'Failed to approve enrollment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedEnrollment || !declineReason.trim()) {
      console.error('No selected enrollment or reason for decline');
      return;
    }
    
    try {
      console.log('Declining enrollment:', selectedEnrollment.id, 'with reason:', declineReason, 'notes:', declineNotes);
      setActionLoading(true);
      await AdminService.declineEnrollment(selectedEnrollment.id, declineReason, declineNotes);
      toast.success('Enrollment declined successfully');
      setDeclineOpen(false);
      setDeclineReason('');
      setDeclineNotes('');
      loadEnrollments(currentPage, statusFilter);
      loadStats();
    } catch (e: any) {
      console.error('Error declining enrollment:', e);
      toast.error(e?.message || 'Failed to decline enrollment');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      declined: { color: 'bg-red-100 text-red-800', label: 'Declined' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Enrollment Management</h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-gray-600">Review and manage student enrollment applications</p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">Enrollment</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={enrollmentEnabled}
                onChange={(e) => {
                  const next = e.target.checked;
                  setPendingToggleValue(next);
                  setConfirmText('');
                  setConfirmToggleOpen(true);
                }}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className={`text-xs font-medium ${enrollmentEnabled ? 'text-green-700' : 'text-red-700'}`}>
              {enrollmentEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Declined</p>
              <p className="text-2xl font-bold text-gray-900">{stats.declined}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Toggle Modal */}
      {confirmToggleOpen && (
        <Modal
          open={confirmToggleOpen}
          title={`${pendingToggleValue ? 'Enable' : 'Disable'} Admissions/Enrollment`}
          onClose={() => setConfirmToggleOpen(false)}
          footer={(
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border rounded-lg"
                onClick={() => setConfirmToggleOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
                disabled={(() => {
                  const shouldType = pendingToggleValue ? 'ENABLE' : 'DISABLE';
                  return confirmText.trim().toUpperCase() !== shouldType;
                })()}
                onClick={async () => {
                  if (pendingToggleValue === null) return;
                  const next = pendingToggleValue;
                  try {
                    await AdminService.setEnrollmentEnabled(next);
                    setEnrollmentEnabled(next);
                    toast.success(`Enrollment ${next ? 'enabled' : 'disabled'}`);
                    setConfirmToggleOpen(false);
                  } catch (err: any) {
                    toast.error(err?.message || 'Failed to update setting');
                  }
                }}
              >
                Confirm
              </button>
            </div>
          )}
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              To confirm, type <span className="font-semibold">{pendingToggleValue ? 'ENABLE' : 'DISABLE'}</span> below and press Confirm.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={pendingToggleValue ? 'ENABLE' : 'DISABLE'}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </Modal>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by student name, parent name, or contact..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                loadEnrollments(1, e.target.value);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enrollments Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading enrollments...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => loadEnrollments()}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="p-8 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No enrollments found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEnrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{enrollment.name}</div>
                          <div className="text-sm text-gray-500">
                            {enrollment.gender} • {formatDate(enrollment.dateOfBirth)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{enrollment.parentName || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{enrollment.parentContact || 'N/A'}</div>
                          {enrollment.parentEmail && (
                            <div className="text-sm text-gray-500">{enrollment.parentEmail}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {enrollment.gradeLevel || 'N/A'}
                          {enrollment.section && ` • ${enrollment.section}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(enrollment.enrollmentStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(enrollment.enrollmentDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('View clicked for enrollment:', enrollment.id);
                              handleViewEnrollment(enrollment.id);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {enrollment.enrollmentStatus === 'pending' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Approve clicked for enrollment:', enrollment.id);
                                  setSelectedEnrollment(enrollment);
                                  setApproveOpen(true);
                                }}
                                className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                                title="Approve Enrollment"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Decline clicked for enrollment:', enrollment.id);
                                  setSelectedEnrollment(enrollment);
                                  setDeclineOpen(true);
                                }}
                                className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                                title="Decline Enrollment"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => loadEnrollments(currentPage - 1, statusFilter)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => loadEnrollments(currentPage + 1, statusFilter)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View Enrollment Modal */}
      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title="Enrollment Details"
        size="xl"
        footer={
          selectedEnrollment?.enrollmentStatus === 'pending' ? (
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Modal approve clicked for enrollment:', selectedEnrollment.id);
                  setApproveOpen(true);
                }}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={actionLoading}
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Modal decline clicked for enrollment:', selectedEnrollment.id);
                  setDeclineOpen(true);
                }}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={actionLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Decline
              </button>
            </div>
          ) : undefined
        }
      >
        {selectedEnrollment && (
          <div className="space-y-6">
            {/* Header with Status */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedEnrollment.name}</h2>
                <p className="text-sm text-gray-600">Enrollment ID: {selectedEnrollment.id}</p>
              </div>
              <div className="text-right">
                {getStatusBadge(selectedEnrollment.enrollmentStatus)}
                <p className="text-xs text-gray-500 mt-1">
                  Submitted: {formatDate(selectedEnrollment.enrollmentDate)}
                </p>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Student Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Student Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900 font-medium">{selectedEnrollment.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(selectedEnrollment.dateOfBirth)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gender</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedEnrollment.gender || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nationality</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedEnrollment.nationality || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Grade Level</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedEnrollment.gradeLevel || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Place of Birth</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedEnrollment.placeOfBirth || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedEnrollment.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Parent Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-blue-600" />
                  Parent Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Parent Name</label>
                    <p className="mt-1 text-sm text-gray-900 font-medium">{selectedEnrollment.parentName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Information</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedEnrollment.parentContact || 'N/A'}</p>
                  </div>
                  {selectedEnrollment.parentEmail && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedEnrollment.parentEmail}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Documents and Additional Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Documents */}
              {(() => {
                let docs = selectedEnrollment.documents as any;
                if (typeof docs === 'string') {
                  try { docs = JSON.parse(docs); } catch { docs = null; }
                }
                const items = Array.isArray(docs) ? docs : [];
                return items.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Submitted Documents</h3>
                    <div className="space-y-2">
                      {items.map((doc: any, index: number) => {
                        const filename: string = typeof doc === 'string' ? doc : (doc.filename || doc.name || `document-${index + 1}`);
                        const displayName: string = (typeof doc === 'object' && (doc.originalName || doc.name)) || filename || `Document ${index + 1}`;
                        const sizeKb = typeof doc === 'object' && doc.size ? (doc.size / 1024).toFixed(1) : undefined;
                        const type = typeof doc === 'object' ? doc.type || doc.mimetype : undefined;
                        return (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
                            <div className="flex-shrink-0">
                              <FileText className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                              {type && (<p className="text-xs text-gray-500">{type}</p>)}
                              {sizeKb && (<p className="text-xs text-gray-500">{sizeKb} KB</p>)}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handlePreviewDocument(filename)}
                                className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                                title="Preview"
                              >
                                <Eye className="h-4 w-4 mr-1" /> Preview
                              </button>
                              <button
                                onClick={() => handleDownloadDocument(filename)}
                                className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                                title="Download"
                              >
                                <Download className="h-4 w-4 mr-1" /> Download
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Submitted Documents</h3>
                    <div className="text-center py-4 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No documents submitted</p>
                    </div>
                  </div>
                );
              })()}

              {/* Additional Information */}
              {selectedEnrollment.additionalInfo && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-900">{selectedEnrollment.additionalInfo}</p>
                  </div>
                </div>
              )}
            </div>


            {/* Review Information */}
            {selectedEnrollment.reviewStatus && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Review Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedEnrollment.reviewStatus)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reviewed By</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedEnrollment.reviewedByUsername || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Review Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedEnrollment.reviewDate)}</p>
                  </div>
                  {selectedEnrollment.declineReason && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Decline Reason</label>
                      <p className="mt-1 text-sm text-gray-900 bg-red-50 p-3 rounded-lg">{selectedEnrollment.declineReason}</p>
                    </div>
                  )}
                  {selectedEnrollment.reviewNotes && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Review Notes</label>
                      <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedEnrollment.reviewNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </Modal>

      {/* Approve Modal */}
      <Modal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        title="Approve Enrollment"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to approve the enrollment for <strong>{selectedEnrollment?.name}</strong>?
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Add any notes about this approval..."
            />
          </div>

          {/* Section and Schedule Assignment Section */}
          <div>
            {/* Section first */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Assign Section</label>
                <span className="text-xs text-gray-600">Grade Level: <span className="font-medium text-gray-900">{selectedEnrollment?.gradeLevel || 'N/A'}</span></span>
              </div>
              <select
                value={selectedSectionId ?? 0}
                onChange={(e) => setSelectedSectionId(Number(e.target.value) || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>Select Section</option>
                {sections.map((sec: any) => (
                  <option key={sec.SectionID || sec.id} value={sec.SectionID || sec.id}>
                    {(sec.SectionName || sec.sectionName || sec.name) + (sec.GradeLevel ? ` - ${sec.GradeLevel}` : '')}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">You must select a section before assigning schedules.</p>
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700">Schedule Assignments (Optional)</label>
            </div>

            <div className={`border border-gray-300 rounded-lg max-h-48 overflow-y-auto divide-y ${!selectedSectionId ? 'opacity-50 pointer-events-none' : ''}`}>
              {schedules
                .filter(s => !selectedSectionId || s.sectionId === selectedSectionId)
                .map(schedule => {
                  const checked = scheduleAssignments.some(a => a.scheduleId === schedule.id);
                  return (
                    <label key={schedule.id} className="flex items-center px-3 py-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-3"
                        checked={checked}
                        disabled={!selectedSectionId}
                        onChange={(e) => {
                          setScheduleAssignments(prev => {
                            const set = new Set(prev.map(p => p.scheduleId));
                            if (e.target.checked) {
                              set.add(schedule.id);
                            } else {
                              set.delete(schedule.id);
                            }
                            return Array.from(set).map(id => ({ scheduleId: id }));
                          });
                        }}
                      />
                      <span className="text-gray-700">
                        {schedule.subject} - {schedule.teacher} ({schedule.days.join(', ')} {schedule.startTime}-{schedule.endTime})
                      </span>
                    </label>
                  );
                })}
              {schedules.filter(s => !selectedSectionId || s.sectionId === selectedSectionId).length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">{selectedSectionId ? 'No schedules for selected section.' : 'Select a section to assign schedules.'}</div>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => {
                setApproveOpen(false);
                setScheduleAssignments([]);
              }}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              disabled={actionLoading}
            >
              {actionLoading ? 'Approving...' : 'Approve'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Decline Modal */}
      <Modal
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="Decline Enrollment"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to decline the enrollment for <strong>{selectedEnrollment?.name}</strong>?
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Decline *</label>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Please provide a reason for declining this enrollment..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</label>
            <textarea
              value={declineNotes}
              onChange={(e) => setDeclineNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Add any additional notes..."
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => setDeclineOpen(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleDecline}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              disabled={actionLoading || !declineReason.trim()}
            >
              {actionLoading ? 'Declining...' : 'Decline'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
