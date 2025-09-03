import { useEffect, useMemo, useState } from 'react';
import { Search, CheckCircle, XCircle, Clock, Eye, MessageSquare } from 'lucide-react';
import { AdminService, Registration } from './api/adminService';
import Modal from './components/Modal';
import ConfirmModal from './components/ConfirmModal';
import { toast } from 'sonner';

export default function RegistrationManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'teacher' | 'parent'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [items, setItems] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMessage, setComposeMessage] = useState('');
  const [confirm, setConfirm] = useState<{ id: number; action: 'approve' | 'reject' } | null>(null);

  const load = async (status: 'Pending' | 'Approved' | 'Denied' = 'Pending') => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminService.listRegistrations(status);
      setItems(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const loadForFilter = async (filter: 'all' | 'pending' | 'approved' | 'rejected') => {
    try {
      setLoading(true);
      setError(null);
      if (filter === 'all') {
        const [p, a, d] = await Promise.all([
          AdminService.listRegistrations('Pending'),
          AdminService.listRegistrations('Approved'),
          AdminService.listRegistrations('Denied')
        ]);
        setItems([...(p || []), ...(a || []), ...(d || [])]);
      } else if (filter === 'pending') {
        setItems(await AdminService.listRegistrations('Pending'));
      } else if (filter === 'approved') {
        setItems(await AdminService.listRegistrations('Approved'));
      } else {
        setItems(await AdminService.listRegistrations('Denied'));
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForFilter(statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    // initial load
    loadForFilter('pending');
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const requestDecision = (registrationId: number, action: 'approve' | 'reject') => {
    setConfirm({ id: registrationId, action });
  };

  const handleDecision = async () => {
    if (!confirm) return;
    const { id, action } = confirm;
    try {
      const decision = action === 'approve' ? 'Approved' : 'Denied';
      await AdminService.reviewRegistration(id, decision as any);
      toast.success(`Registration ${action === 'approve' ? 'approved' : 'rejected'}`);
      setConfirm(null);
      await loadForFilter(statusFilter);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to process decision');
    }
  };

  const handleViewDetails = (registration: Registration) => {
    setSelectedReg(registration);
    setDetailsOpen(true);
  };

  const handleSendMessage = () => {
    toast.success('Message sent');
    setComposeOpen(false);
    setComposeMessage('');
  };

  const view = useMemo(() => {
    return items
      .map(r => ({
        id: r.RegistrationID,
        applicantName: r.FullName,
        email: r.Username,
        requestedRole: r.UserType.toLowerCase(),
        submittedDate: r.ReviewedDate || '-',
        status: (r.Status || '').toLowerCase() === 'denied' ? 'rejected' : (r.Status || '').toLowerCase(),
        raw: r
      }))
      .filter(reg => {
        const matchesSearch = reg.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             reg.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || reg.requestedRole === roleFilter;
        const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || (priorityFilter === 'normal');
        return matchesSearch && matchesRole && matchesStatus && matchesPriority;
      });
  }, [items, searchTerm, roleFilter, statusFilter, priorityFilter]);

  return (
    <div className="">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Registration Management</h2>
          <p className="text-gray-600">Review and approve account registration requests</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Pending: <span className="font-semibold text-yellow-600">{items.filter(r => r.Status === 'Pending').length}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select 
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus-border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Registration Requests ({view.length})</h3>
        </div>
        {error && <div className="p-4 text-red-600">{error}</div>}
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {view.map((registration) => (
                  <tr key={registration.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(registration.status)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{registration.applicantName}</div>
                          <div className="text-sm text-gray-500">{registration.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {registration.requestedRole.charAt(0).toUpperCase() + registration.requestedRole.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(registration.status)}`}>
                        {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {registration.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => requestDecision(registration.id, 'approve')}
                            className="text-green-600 hover:text-green-900"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => requestDecision(registration.id, 'reject')}
                            className="text-red-600 hover:text-red-900 ml-2"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button className="text-gray-600 hover:text-gray-900 ml-2" onClick={() => handleViewDetails(registration.raw)}>
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 ml-2" onClick={() => { setComposeOpen(true); setSelectedReg(registration.raw); }}>
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={detailsOpen}
        title="Registration Details"
        onClose={() => setDetailsOpen(false)}
        footer={(
          <>
            <button onClick={() => setDetailsOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">Close</button>
          </>
        )}
      >
        {selectedReg && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-gray-500">Full Name</div>
                <div className="font-medium text-gray-900">{selectedReg.FullName}</div>
              </div>
              <div>
                <div className="text-gray-500">Role</div>
                <div className="font-medium text-gray-900">{selectedReg.UserType}</div>
              </div>
              <div>
                <div className="text-gray-500">Email</div>
                <div className="font-medium text-gray-900">{selectedReg.Username}</div>
              </div>
              <div>
                <div className="text-gray-500">Status</div>
                <div className="font-medium text-gray-900">{selectedReg.Status}</div>
              </div>
              <div>
                <div className="text-gray-500">Reviewed Date</div>
                <div className="font-medium text-gray-900">{selectedReg.ReviewedDate || '-'}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={composeOpen}
        title="Send Message"
        onClose={() => setComposeOpen(false)}
        footer={(
          <>
            <button onClick={() => setComposeOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">Cancel</button>
            <button onClick={handleSendMessage} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Send</button>
          </>
        )}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
            <input readOnly value={selectedReg?.Username || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea value={composeMessage} onChange={(e) => setComposeMessage(e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirm}
        title={confirm?.action === 'approve' ? 'Approve registration?' : 'Reject registration?'}
        description={confirm?.action === 'approve' ? (
          <div>Applicant will be granted an active user account.</div>
        ) : (
          <div>This request will be marked as denied.</div>
        )}
        confirmText={confirm?.action === 'approve' ? 'Approve' : 'Reject'}
        onCancel={() => setConfirm(null)}
        onConfirm={handleDecision}
      />
    </div>
  );
} 