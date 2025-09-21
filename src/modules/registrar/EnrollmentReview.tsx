import { useState, useEffect } from 'react';
// Dynamically import mammoth when needed to keep bundle lean
let mammothRef: any = null;
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, User, FileText, Download } from 'lucide-react';
import { RegistrarService } from './api/registrarService';

interface Enrollment {
  id: string;
  studentName: string;
  dateOfBirth: string;
  gender: string;
  gradeLevel: string;
  section: string;
  enrollmentStatus: 'pending' | 'approved' | 'declined';
  enrollmentDate: string;
  parentName: string;
  parentContact: string;
  documents: Array<string | { name: string; type?: string; size?: number; url?: string }>;
  additionalInfo?: string;
  reviewNotes?: string;
  declineReason?: string;
  submittedBy: string;
  reviewedBy?: string;
  reviewDate?: string;
}

interface EnrollmentStats {
  total: number;
  pending: number;
  approved: number;
  declined: number;
}

export default function EnrollmentReview() {
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [stats, setStats] = useState<EnrollmentStats>({ total: 0, pending: 0, approved: 0, declined: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [approveSectionId, setApproveSectionId] = useState<string>('');
  const [approveScheduleIds, setApproveScheduleIds] = useState<string[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [declineReason, setDeclineReason] = useState('');
  const [declineNotes, setDeclineNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Determine if a filename/url is previewable inline in browsers
  const canPreviewInline = (filename: string) => {
    const lower = filename.toLowerCase();
    return (
      lower.endsWith('.pdf') ||
      lower.endsWith('.png') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.gif') ||
      lower.endsWith('.txt') ||
      lower.endsWith('.html')
    );
  };

  // Function to create a document viewer modal
  const createDocumentViewer = (url: string, filename: string, inlineOverride?: boolean) => {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 8px;
      width: 90%;
      height: 90%;
      max-width: 1200px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    `;

    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const title = document.createElement('h3');
    title.textContent = filename;
    title.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6b7280;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = 'Download';
    downloadBtn.style.cssText = `
      background: #3b82f6;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      text-decoration: none;
      font-size: 14px;
      margin-left: 12px;
    `;
    
    // Add download functionality (uses Authorization to force attachment response)
    downloadBtn.onclick = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const noQueryUrl = url.split('?')[0];
        const response = await fetch(noQueryUrl, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
        });
        if (!response.ok) throw new Error('Failed to fetch file for download');
        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
      } catch (_) {
        // Silently ignore in modal; main flow already handles errors
      }
    };

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; align-items: center;';
    buttonContainer.appendChild(downloadBtn);
    buttonContainer.appendChild(closeBtn);

    header.appendChild(title);
    header.appendChild(buttonContainer);

    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.style.cssText = `
      flex: 1;
      padding: 20px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    if (inlineOverride === true || (inlineOverride !== false && canPreviewInline(filename))) {
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        border-radius: 4px;
      `;
      contentContainer.appendChild(iframe);
    } else if (filename.toLowerCase().endsWith('.docx')) {
      // Render .docx to HTML using mammoth
      const container = document.createElement('div');
      container.style.cssText = 'width:100%; height:100%; overflow:auto;';
      contentContainer.appendChild(container);

      (async () => {
        try {
          if (!mammothRef) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const mod = await import('mammoth');
            mammothRef = (mod as any).default ? (mod as any).default : mod;
          }
          const token = localStorage.getItem('auth_token') || '';
          const noQueryUrl = url.split('?')[0];
          const response = await fetch(noQueryUrl, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
          });
          if (!response.ok) throw new Error('Failed to fetch docx');
          const arrayBuf = await response.arrayBuffer();
          const result = await mammothRef.convertToHtml({ arrayBuffer: arrayBuf });
          container.innerHTML = `<div style="max-width:800px;margin:0 auto;">${result.value}</div>`;
        } catch (err: any) {
          container.innerHTML = `<div style="text-align:center;color:#b91c1c;">Unable to render DOCX. Use Download to open it. (${err?.message || 'Unknown error'})</div>`;
        }
      })();
    } else {
      const message = document.createElement('div');
      message.style.cssText = `
        text-align: center;
        color: #374151;
      `;
      message.innerHTML = `
        <div style="font-size:16px; font-weight:600; margin-bottom:8px;">Preview not available</div>
        <div style="font-size:14px; color:#6b7280;">This file type cannot be viewed in the browser. Use Download to open it.</div>
      `;
      contentContainer.appendChild(message);
    }

    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(contentContainer);
    overlay.appendChild(modal);

    // Add to document
    document.body.appendChild(overlay);

    // Close handlers
    const closeModal = () => {
      document.body.removeChild(overlay);
    };

    closeBtn.onclick = closeModal;
    overlay.onclick = (e) => {
      if (e.target === overlay) closeModal();
    };

    // Escape key handler
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  };

  // Function to handle authenticated document access
  const handleDocumentAccess = async (url: string, filename: string, isDownload = false) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Please log in to access documents');
        return;
      }

      if (isDownload) {
        // For download, fetch the file and create a blob URL
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch document');
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        }

        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up the object URL after a delay
        setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
      } else {
        // For viewing: only attempt inline preview for the exact file if supported
        const baseUrlNoQuery = url.split('?')[0];
        const urlWithToken = `${baseUrlNoQuery}?token=${encodeURIComponent(token)}`;
        if (canPreviewInline(filename)) {
          createDocumentViewer(urlWithToken, filename, true);
        } else {
          // Not previewable – show message to avoid showing a different file
          createDocumentViewer(urlWithToken, filename, false);
        }
      }
    } catch (error: any) {
      console.error('Error accessing document:', error);
      alert(`Failed to access document: ${error?.message || 'Unknown error'}`);
    }
  };

  useEffect(() => {
    loadEnrollments();
    loadStats();
  }, [currentPage, statusFilter]);

  // Auto-apply filters with debounce (search + status)
  useEffect(() => {
    const handler = setTimeout(() => {
      // Reset to first page when filters change
      setCurrentPage(1);
      loadEnrollments();
      loadStats();
    }, 350);
    return () => clearTimeout(handler);
  }, [search, statusFilter]);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await RegistrarService.getEnrollments({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: currentPage,
        limit: 10,
        search: search || undefined
      });
      setEnrollments(response.data || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (e: any) {
      setError(e?.message || 'Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await RegistrarService.getEnrollmentStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  useEffect(() => {
    // Preload sections and schedules for approval modal
    const init = async () => {
      try {
        const [sectionsRes, schedulesRes] = await Promise.all([
          RegistrarService.getSections?.() || RegistrarService.getSections?.(),
          (RegistrarService as any).getRegistrarSchedules?.() || (RegistrarService as any).getRegistrarSchedules?.()
        ]);
        if (sectionsRes?.data) setSections(sectionsRes.data);
        if (schedulesRes?.data) setSchedules(schedulesRes.data);
      } catch (_) {}
    };
    init();
  }, []);

  const handleApprove = async () => {
    if (!selectedEnrollment) return;
    
    try {
      setActionLoading(true);
      await RegistrarService.approveEnrollment(selectedEnrollment.id, {
        notes: approveNotes,
        sectionId: approveSectionId ? Number(approveSectionId) : null,
        scheduleIds: approveScheduleIds.map((v) => Number(v))
      });
      
      setApproveOpen(false);
      setApproveNotes('');
      setApproveSectionId('');
      setApproveScheduleIds([]);
      setSelectedEnrollment(null);
      loadEnrollments();
      loadStats();
    } catch (error) {
      console.error('Failed to approve enrollment:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedEnrollment) return;
    
    try {
      setActionLoading(true);
      await RegistrarService.declineEnrollment(selectedEnrollment.id, {
        reason: declineReason,
        notes: declineNotes
      });
      
      setDeclineOpen(false);
      setDeclineReason('');
      setDeclineNotes('');
      setSelectedEnrollment(null);
      loadEnrollments();
      loadStats();
    } catch (error) {
      console.error('Failed to decline enrollment:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'declined': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredEnrollments = enrollments.filter(enrollment =>
    enrollment.studentName.toLowerCase().includes(search.toLowerCase()) ||
    enrollment.parentName.toLowerCase().includes(search.toLowerCase()) ||
    enrollment.gradeLevel.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Enrollment Review</h2>
        <p className="text-gray-600">Review and approve student enrollment applications.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-lg font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-lg font-semibold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-50 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Declined</p>
              <p className="text-lg font-semibold text-gray-900">{stats.declined}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by student name, parent, or grade level..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
            </select>
            
            <button
              onClick={loadEnrollments}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Filter className="w-4 h-4" />
              <span className="ml-2 sm:inline hidden">Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enrollments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade & Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEnrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{enrollment.studentName}</div>
                            <div className="text-sm text-gray-500">{enrollment.gender} • {enrollment.dateOfBirth}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">Grade {enrollment.gradeLevel}</div>
                        <div className="text-sm text-gray-500">{enrollment.section || 'Not assigned'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{enrollment.parentName}</div>
                        <div className="text-sm text-gray-500">{enrollment.parentContact}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(enrollment.enrollmentStatus)}
                          <span className="ml-2">{getStatusBadge(enrollment.enrollmentStatus)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedEnrollment(enrollment);
                              setViewOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {enrollment.enrollmentStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedEnrollment(enrollment);
                                  setApproveOpen(true);
                                }}
                                className="text-green-600 hover:text-green-900"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedEnrollment(enrollment);
                                  setDeclineOpen(true);
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                <XCircle className="w-4 h-4" />
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

            {/* Mobile Cards */}
            <div className="lg:hidden">
              {filteredEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="border-b border-gray-200 p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{enrollment.studentName}</div>
                        <div className="text-sm text-gray-500">{enrollment.gender} • {enrollment.dateOfBirth}</div>
                        <div className="text-sm text-gray-500">Grade {enrollment.gradeLevel} • {enrollment.section || 'Not assigned'}</div>
                        <div className="text-sm text-gray-500">{enrollment.parentName}</div>
                        <div className="text-sm text-gray-500">{enrollment.parentContact}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center">
                        {getStatusIcon(enrollment.enrollmentStatus)}
                        <span className="ml-2">{getStatusBadge(enrollment.enrollmentStatus)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedEnrollment(enrollment);
                            setViewOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {enrollment.enrollmentStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedEnrollment(enrollment);
                                setApproveOpen(true);
                              }}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEnrollment(enrollment);
                                setDeclineOpen(true);
                              }}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Decline"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewOpen && selectedEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Enrollment Details</h3>
                <button
                  onClick={() => setViewOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Student Name</label>
                    <p className="text-sm text-gray-900">{selectedEnrollment.studentName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                    <p className="text-sm text-gray-900">{new Date(selectedEnrollment.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Gender</label>
                    <p className="text-sm text-gray-900">{selectedEnrollment.gender}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Grade Level</label>
                    <p className="text-sm text-gray-900">{selectedEnrollment.gradeLevel}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Parent Name</label>
                    <p className="text-sm text-gray-900">{selectedEnrollment.parentName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Parent Contact</label>
                    <p className="text-sm text-gray-900">{selectedEnrollment.parentContact}</p>
                  </div>
                </div>
                
                {selectedEnrollment.documents && selectedEnrollment.documents.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Documents</label>
                    <div className="mt-1 space-y-1">
                      {selectedEnrollment.documents.map((doc, index) => {
                        const isObject = typeof doc === 'object' && doc !== null;
                        const name = isObject ? (doc as { name?: string }).name || 'Document' : String(doc);
                        let url = isObject ? (doc as { url?: string }).url : undefined;
                        const size = isObject ? (doc as { size?: number }).size : undefined;
                        if (!url && !isObject && typeof doc === 'string') {
                          const raw = doc.trim();
                          if (raw.startsWith('http://') || raw.startsWith('https://')) {
                            url = raw;
                          } else if (raw.startsWith('/')) {
                            url = `${API_BASE_URL}${raw}`;
                          } else {
                            // Serve files through backend API
                            url = `${API_BASE_URL}/registrar/documents/${encodeURIComponent(raw)}`;
                          }
                        }
                        if (!url && isObject && name) {
                          const raw = name.trim();
                          if (raw.startsWith('http://') || raw.startsWith('https://')) {
                            url = raw;
                          } else if (raw.startsWith('/')) {
                            url = `${API_BASE_URL}${raw}`;
                          } else {
                            url = `${API_BASE_URL}/registrar/documents/${encodeURIComponent(raw)}`;
                          }
                        }
                        return (
                          <div key={index} className="flex items-center justify-between text-sm text-gray-600 py-2 border-b border-gray-100 last:border-b-0">
                            <div className="flex items-center flex-1">
                              <FileText className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="text-gray-900 font-medium">{name}</span>
                              {typeof size === 'number' && (
                                <span className="ml-2 text-xs text-gray-400">({Math.round(size / 1024)} KB)</span>
                              )}
                            </div>
                            {url && (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleDocumentAccess(url, name, false)}
                                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                                  title="View Document"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </button>
                                <button
                                  onClick={() => handleDocumentAccess(url, name, true)}
                                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                                  title="Download Document"
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  Download
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {selectedEnrollment.additionalInfo && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Additional Information</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedEnrollment.additionalInfo}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveOpen && selectedEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Approve Enrollment</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to approve the enrollment for <strong>{selectedEnrollment.studentName}</strong>?
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Add any notes about this approval..."
                />
              </div>

              <div className="mb-4 grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign Section</label>
                  <select
                    value={approveSectionId}
                    onChange={(e) => setApproveSectionId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Do not assign</option>
                    {sections
                      .filter((s: any) => !selectedEnrollment?.gradeLevel || s.gradeLevel == selectedEnrollment?.gradeLevel)
                      .map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (Grade {s.gradeLevel})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign Schedules</label>
                  <div className="border border-gray-300 rounded-lg max-h-40 overflow-y-auto divide-y">
                    {schedules
                      .filter((sch: any) => !approveSectionId || String(sch.sectionId) === String(approveSectionId))
                      .map((sch: any) => {
                        const idStr = String(sch.id);
                        const checked = approveScheduleIds.includes(idStr);
                        return (
                          <label key={sch.id} className="flex items-center px-3 py-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              className="mr-3"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setApproveScheduleIds((prev) => Array.from(new Set([...prev, idStr])));
                                } else {
                                  setApproveScheduleIds((prev) => prev.filter((v) => v !== idStr));
                                }
                              }}
                            />
                            <span className="text-gray-700">
                              {sch.subject} • {sch.teacher} • {sch.startTime}-{sch.endTime}
                            </span>
                          </label>
                        );
                      })}
                    {schedules.filter((sch: any) => !approveSectionId || String(sch.sectionId) === String(approveSectionId)).length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">No schedules for selected section.</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setApproveOpen(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {declineOpen && selectedEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Decline Enrollment</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to decline the enrollment for <strong>{selectedEnrollment.studentName}</strong>?
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Decline *
                </label>
                <select
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="incomplete_documents">Incomplete Documents</option>
                  <option value="age_requirement">Age Requirement Not Met</option>
                  <option value="capacity_full">Grade/Section at Capacity</option>
                  <option value="academic_requirements">Academic Requirements Not Met</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={declineNotes}
                  onChange={(e) => setDeclineNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Provide additional details about the decline..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeclineOpen(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDecline}
                  disabled={actionLoading || !declineReason}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Declining...' : 'Decline'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
