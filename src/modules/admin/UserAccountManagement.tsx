import { useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, Edit, Trash2, Eye, Archive, RotateCcw } from 'lucide-react';
import { AdminService, AdminUser } from './api/adminService';
import Modal from './components/Modal';
import { toast } from 'sonner';

export default function UserAccountManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [actionType, setActionType] = useState<'archive' | 'delete' | 'restore'>('archive');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [viewUser, setViewUser] = useState<AdminUser | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'admin'|'teacher'|'parent'|'registrar'|'superadmin'|''>('');
  const [formStatus, setFormStatus] = useState<'active'|'pending'|'archived'|''>('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formMiddleName, setFormMiddleName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formContactInfo, setFormContactInfo] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const resetForm = () => {
    setFormEmail('');
    setFormPassword('');
    setFormRole('');
    setFormStatus('');
    setFormFirstName('');
    setFormMiddleName('');
    setFormLastName('');
    setFormContactInfo('');
    setSelectedUser(null);
    setConfirmationText('');
  };

  const openCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setFormEmail(user.email);
    setFormPassword('');
    setFormRole((user.role || '') as any);
    setFormStatus((user.status || '') as any);
    setFormFirstName(user.firstName || '');
    setFormMiddleName(user.middleName || '');
    setFormLastName(user.lastName || '');
    setFormContactInfo(user.contactInfo || '');
    setIsEditOpen(true);
  };

  const openArchive = (user: AdminUser) => {
    setSelectedUser(user);
    setActionType('archive');
    setConfirmationText('');
    setIsArchiveOpen(true);
  };

  const openRestore = (user: AdminUser) => {
    setSelectedUser(user);
    setActionType('restore');
    setConfirmationText('');
    setIsRestoreOpen(true);
  };

  const openDelete = (user: AdminUser) => {
    setSelectedUser(user);
    setActionType('delete');
    setConfirmationText('');
    setIsDeleteOpen(true);
  };

  const openView = async (user: AdminUser) => {
    setIsViewOpen(true);
    setViewLoading(true);
    setViewUser(null);
    try {
      const data = await AdminService.getUser(user.id);
      setViewUser(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load user details');
    } finally {
      setViewLoading(false);
    }
  };

  const closeAll = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    setIsViewOpen(false);
    setIsArchiveOpen(false);
    setIsRestoreOpen(false);
    resetForm();
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminService.listUsers();
      setUsers(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-purple-600';
      case 'registrar':
        return 'text-blue-600';
      case 'teacher':
        return 'text-green-600';
      case 'parent':
        return 'text-orange-600';
      case 'superadmin':
        return 'text-purple-800';
      default:
        return 'text-gray-600';
    }
  };

  const handleSetStatus = async (userId: number, status: 'Active' | 'Pending' | 'Disabled') => {
    try {
      await AdminService.setUserStatus(userId, status);
      toast.success(`User status updated to ${status}`);
      fetchUsers();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to update user status');
    }
  };

  const handleCreate = async () => {
    try {
      setFormSubmitting(true);
      setError(null);
      if (!formEmail || !formPassword || !formRole || !formFirstName || !formLastName) {
        setError('Email, password, role, first name, and last name are required');
        return;
      }
      await AdminService.createUser({ 
        email: formEmail, 
        password: formPassword, 
        role: formRole as any, 
        status: formStatus ? (formStatus.charAt(0).toUpperCase() + formStatus.slice(1)) as any : undefined,
        firstName: formFirstName,
        middleName: formMiddleName,
        lastName: formLastName,
        contactInfo: formContactInfo
      });
      closeAll();
      toast.success('User created successfully');
      fetchUsers();
    } catch (e: any) {
      setError(e?.message || 'Failed to create user');
      toast.error(e?.message || 'Failed to create user');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    try {
      setFormSubmitting(true);
      setError(null);
      await AdminService.updateUser(selectedUser.id, {
        email: formEmail !== selectedUser.email ? formEmail : undefined,
        role: formRole ? (formRole as any) : undefined,
        password: formPassword ? formPassword : undefined,
        status: formStatus ? (formStatus.charAt(0).toUpperCase() + formStatus.slice(1)) as any : undefined,
        firstName: formFirstName !== selectedUser.firstName ? formFirstName : undefined,
        middleName: formMiddleName !== selectedUser.middleName ? formMiddleName : undefined,
        lastName: formLastName !== selectedUser.lastName ? formLastName : undefined,
        contactInfo: formContactInfo !== selectedUser.contactInfo ? formContactInfo : undefined
      });
      closeAll();
      toast.success('User updated successfully');
      fetchUsers();
    } catch (e: any) {
      setError(e?.message || 'Failed to update user');
      toast.error(e?.message || 'Failed to update user');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedUser) return;
    try {
      setFormSubmitting(true);
      setError(null);
      await AdminService.setUserStatus(selectedUser.id, 'Archived');
      closeAll();
      toast.success('User archived successfully');
      fetchUsers();
    } catch (e: any) {
      setError(e?.message || 'Failed to archive user');
      toast.error(e?.message || 'Failed to archive user');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedUser) return;
    try {
      setFormSubmitting(true);
      setError(null);
      await AdminService.setUserStatus(selectedUser.id, 'Active');
      closeAll();
      toast.success('User restored successfully');
      fetchUsers();
    } catch (e: any) {
      setError(e?.message || 'Failed to restore user');
      toast.error(e?.message || 'Failed to restore user');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      setFormSubmitting(true);
      setError(null);
      await AdminService.deleteUser(selectedUser.id);
      closeAll();
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete user');
      toast.error(e?.message || 'Failed to delete user');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmAction = async () => {
    const expectedText = actionType === 'archive' ? 'Archive' : actionType === 'restore' ? 'Restore' : 'Delete';
    if (confirmationText !== expectedText) {
      setError(`Please type "${expectedText}" to confirm`);
      return;
    }
    
    if (actionType === 'archive') {
      await handleArchive();
    } else if (actionType === 'restore') {
      await handleRestore();
    } else {
      await handleDelete();
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = [user.email, user.name || ''].some(v => v.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  return (
    <div className="">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Account Management</h2>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <UserPlus className="h-4 w-4" />
          <span>Create User</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col gap-4 sm:flex-row">
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
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="registrar">Registrar</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
            <option value="superadmin">Super Admin</option>
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Users ({filteredUsers.length})</h3>
        </div>
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(['teacher','parent','admin','registrar'].includes(user.role)) ? (user.name || '-') : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getRoleColor(user.role)}`}>
                        {user.role || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button onClick={() => openView(user)} className="text-gray-600 hover:text-gray-900" title="View Details">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEdit(user)} className="text-blue-600 hover:text-blue-900" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        {user.status === 'archived' ? (
                          <>
                            <button onClick={() => openRestore(user)} className="text-green-600 hover:text-green-700" title="Restore">
                              <RotateCcw className="h-4 w-4" />
                            </button>
                            <button onClick={() => openDelete(user)} className="text-red-600 hover:text-red-700" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => openArchive(user)} className="text-orange-600 hover:text-orange-700" title="Archive">
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={isCreateOpen} title="Create User" onClose={closeAll} footer={(
        <>
          <button onClick={closeAll} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button disabled={formSubmitting} onClick={handleCreate} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{formSubmitting ? 'Creating...' : 'Create'}</button>
        </>
      )}>
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} type="email" className="mt-1 w-full px-3 py-2 border rounded-lg" placeholder="user@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input value={formPassword} onChange={(e) => setFormPassword(e.target.value)} type="password" className="mt-1 w-full px-3 py-2 border rounded-lg" placeholder="••••••••" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name *</label>
              <input value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} type="text" className="mt-1 w-full px-3 py-2 border rounded-lg" placeholder="John" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Middle Name</label>
              <input value={formMiddleName} onChange={(e) => setFormMiddleName(e.target.value)} type="text" className="mt-1 w-full px-3 py-2 border rounded-lg" placeholder="Michael" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name *</label>
              <input value={formLastName} onChange={(e) => setFormLastName(e.target.value)} type="text" className="mt-1 w-full px-3 py-2 border rounded-lg" placeholder="Doe" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Info</label>
            <input value={formContactInfo} onChange={(e) => setFormContactInfo(e.target.value)} type="text" className="mt-1 w-full px-3 py-2 border rounded-lg" placeholder="Phone number or email" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select value={formRole} onChange={(e) => setFormRole(e.target.value as any)} className="mt-1 w-full px-3 py-2 border rounded-lg">
                <option value="">Select role</option>
                <option value="admin">Admin</option>
                <option value="registrar">Registrar</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)} className="mt-1 w-full px-3 py-2 border rounded-lg">
                <option value="">Default</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={isEditOpen} title="Edit User" onClose={closeAll} footer={(
        <>
          <button onClick={closeAll} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button disabled={formSubmitting} onClick={handleEdit} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{formSubmitting ? 'Saving...' : 'Save'}</button>
        </>
      )}>
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} type="email" className="mt-1 w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input value={formPassword} onChange={(e) => setFormPassword(e.target.value)} type="password" className="mt-1 w-full px-3 py-2 border rounded-lg" placeholder="Leave blank to keep current" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name *</label>
              <input value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} type="text" className="mt-1 w-full px-3 py-2 border rounded-lg" placeholder="John" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Middle Name</label>
              <input value={formMiddleName} onChange={(e) => setFormMiddleName(e.target.value)} type="text" className="mt-1 w-full px-3 py-2 border rounded-lg" placeholder="Michael" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name *</label>
              <input value={formLastName} onChange={(e) => setFormLastName(e.target.value)} type="text" className="mt-1 w-full px-3 py-2 border rounded-lg" placeholder="Doe" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Info</label>
            <input value={formContactInfo} onChange={(e) => setFormContactInfo(e.target.value)} type="text" className="mt-1 w-full px-3 py-2 border rounded-lg" placeholder="Phone number or email" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select value={formRole} onChange={(e) => setFormRole(e.target.value as any)} className="mt-1 w-full px-3 py-2 border rounded-lg">
                <option value="admin">Admin</option>
                <option value="registrar">Registrar</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)} className="mt-1 w-full px-3 py-2 border rounded-lg">
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={isArchiveOpen} title="Archive User" onClose={closeAll} footer={(
        <>
          <button onClick={closeAll} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button 
            disabled={formSubmitting || confirmationText !== 'Archive'} 
            onClick={handleConfirmAction} 
            className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {formSubmitting ? 'Archiving...' : 'Archive'}
          </button>
        </>
      )}>
        <div className="space-y-4">
          <p>Are you sure you want to archive user <span className="font-semibold">{selectedUser?.email}</span>? This will move the user to archived status.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type "Archive" to confirm:</label>
            <input 
              value={confirmationText} 
              onChange={(e) => setConfirmationText(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Archive"
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </Modal>

      <Modal open={isRestoreOpen} title="Restore User" onClose={closeAll} footer={(
        <>
          <button onClick={closeAll} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button 
            disabled={formSubmitting || confirmationText !== 'Restore'} 
            onClick={handleConfirmAction} 
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {formSubmitting ? 'Restoring...' : 'Restore'}
          </button>
        </>
      )}>
        <div className="space-y-4">
          <p>Are you sure you want to restore user <span className="font-semibold">{selectedUser?.email}</span>? This will change the user status back to active.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type "Restore" to confirm:</label>
            <input 
              value={confirmationText} 
              onChange={(e) => setConfirmationText(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Restore"
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </Modal>

      <Modal open={isDeleteOpen} title="Delete User" onClose={closeAll} footer={(
        <>
          <button onClick={closeAll} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button 
            disabled={formSubmitting || confirmationText !== 'Delete'} 
            onClick={handleConfirmAction} 
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {formSubmitting ? 'Deleting...' : 'Delete'}
          </button>
        </>
      )}>
        <div className="space-y-4">
          <p>Are you sure you want to delete user <span className="font-semibold">{selectedUser?.email}</span>? This action cannot be undone.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type "Delete" to confirm:</label>
            <input 
              value={confirmationText} 
              onChange={(e) => setConfirmationText(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Delete"
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </Modal>

      <Modal open={isViewOpen} title="User Details" onClose={closeAll} footer={(
        <>
          <button onClick={closeAll} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Close</button>
        </>
      )}>
        {viewLoading ? (
          <div>Loading...</div>
        ) : viewUser ? (
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-600">ID</span><span className="font-medium">{viewUser.id}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Name</span><span className="font-medium">{(['teacher','parent','admin','registrar'].includes(viewUser.role)) ? (viewUser.name || '-') : '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Email</span><span className="font-medium">{viewUser.email}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Role</span><span className={`font-medium ${getRoleColor(viewUser.role)}`}>{viewUser.role || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Status</span><span className="font-medium capitalize">{viewUser.status || '-'}</span></div>
          </div>
        ) : (
          <div className="text-gray-600">No details available.</div>
        )}
      </Modal>
    </div>
  );
}
