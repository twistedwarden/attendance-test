import { useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, Edit, Trash2, Fingerprint, Eye } from 'lucide-react';
import { AdminService } from './api/adminService';
import Modal from './components/Modal';
import ConfirmModal from './components/ConfirmModal';
import { toast } from 'sonner';

interface StudentVM {
  id: number;
  name: string;
  gradeLevel: string | null;
  section: string | null;
  parentContact: string;
  parentName?: string;
  hasFingerprint?: boolean;
}

export default function StudentsSection() {
  const [students, setStudents] = useState<StudentVM[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All Grades');
  const [sectionFilter, setSectionFilter] = useState('All Sections');
  const [fingerFilter, setFingerFilter] = useState<'all'|'available'|'missing'>('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<StudentVM | null>(null);
  const [formName, setFormName] = useState('');
  const [formGrade, setFormGrade] = useState('');
  const [formSection, setFormSection] = useState('');
  const [editing, setEditing] = useState<StudentVM | null>(null);
  const [formParentContact, setFormParentContact] = useState('');
  const [parentMode, setParentMode] = useState<'none'|'existing'|'new'>('none');
  const [parentQuery, setParentQuery] = useState('');
  const [parentResults, setParentResults] = useState<any[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [newParentName, setNewParentName] = useState('');
  const [newParentEmail, setNewParentEmail] = useState('');
  const [newParentPassword, setNewParentPassword] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminService.listStudents();
      setStudents(
        (data || []).map((r: any) => ({
          id: r.id ?? r.StudentID,
          name: r.name ?? r.FullName,
          gradeLevel: r.gradeLevel ?? r.GradeLevel ?? null,
          section: r.section ?? r.Section ?? null,
          parentContact: r.parentContact ?? r.ParentContact ?? '',
          parentName: r.parentName ?? r.ParentName ?? '',
          hasFingerprint: r.hasFingerprint ?? false
        }))
      );
    } catch (e: any) {
      setError(e?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchesGrade = gradeFilter === 'All Grades' || s.gradeLevel === gradeFilter;
      const matchesSection = sectionFilter === 'All Sections' || s.section === sectionFilter;
      const matchesFinger = fingerFilter === 'all' || (fingerFilter === 'available' ? !!s.hasFingerprint : !s.hasFingerprint);
      return matchesSearch && matchesGrade && matchesSection && matchesFinger;
    });
  }, [students, search, gradeFilter, sectionFilter, fingerFilter]);

  const gradeOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => { if (s.gradeLevel) set.add(s.gradeLevel); });
    return ['All Grades', ...Array.from(set).sort()];
  }, [students]);

  const sectionOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => { if (s.section) set.add(s.section); });
    return ['All Sections', ...Array.from(set).sort()];
  }, [students]);

  const searchParents = async (q: string) => {
    if (!q.trim()) { setParentResults([]); return; }
    try {
      const rows = await AdminService.searchParents(q);
      setParentResults(rows);
    } catch {}
  };

  const openCreate = () => {
    setFormName('');
    setFormGrade('');
    setFormSection('');
    setFormParentContact('');
    setParentMode('none');
    setParentQuery(''); setParentResults([]); setSelectedParentId(null);
    setNewParentName(''); setNewParentEmail(''); setNewParentPassword('');
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    try {
      if (!formName.trim()) return;
      await AdminService.createStudent({ name: formName.trim(), gradeLevel: formGrade || null, section: formSection || null, parentContact: formParentContact || null, parentId: selectedParentId ?? undefined });
      setCreateOpen(false);
      toast.success('Student created');
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create student');
      console.error(e);
    }
  };

  const openEdit = (s: StudentVM) => {
    setEditing(s);
    setFormName(s.name);
    setFormGrade(s.gradeLevel || '');
    setFormSection(s.section || '');
    setFormParentContact(s.parentContact || '');
    setParentMode('none'); setSelectedParentId(null); setParentQuery(''); setParentResults([]);
    setCreateOpen(false);
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editing) return;
    try {
      await AdminService.updateStudent(editing.id, { name: formName.trim(), gradeLevel: formGrade || null, section: formSection || null, parentContact: formParentContact || null, parentId: selectedParentId ?? undefined });
      setEditOpen(false);
      setEditing(null);
      toast.success('Student updated');
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update student');
      console.error(e);
    }
  };

  const confirmDelete = (id: number) => {
    setConfirmDeleteId(id);
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await AdminService.deleteStudent(confirmDeleteId);
      setConfirmDeleteId(null);
      toast.success('Student deleted');
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete student');
      console.error(e);
    }
  };

  return (
    <div className="">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Student Management</h2>
          <p className="text-sm sm:text-base text-gray-600">Manage student enrollment and fingerprint data</p>
        </div>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center">
          <UserPlus className="h-4 w-4" />
          <span>Enroll Student</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
            {gradeOptions.map((g) => <option key={g}>{g}</option>)}
          </select>
          <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
            {sectionOptions.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={fingerFilter} onChange={(e) => setFingerFilter(e.target.value as any)} className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
            <option value="all">All Fingerprints</option>
            <option value="available">Available</option>
            <option value="missing">Not Captured</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Students ({filtered.length})</h3>
        </div>
        {error && <div className="p-4 text-red-600">{error}</div>}
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <Fingerprint className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.gradeLevel || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.section || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.parentName || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.parentContact || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button onClick={() => { setViewing(student); setViewOpen(true); }} className="text-gray-600 hover:text-gray-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => openEdit(student)} className="text-blue-600 hover:text-blue-900">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => confirmDelete(student.id)} className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden">
              <div className="divide-y divide-gray-200">
                {filtered.map((student) => (
                  <div key={student.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                          <Fingerprint className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{student.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{student.gradeLevel || '-'}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <div className="flex space-x-1">
                          <button onClick={() => { setViewing(student); setViewOpen(true); }} className="text-gray-600 hover:text-gray-900 p-1">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => openEdit(student)} className="text-blue-600 hover:text-blue-900 p-1">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => confirmDelete(student.id)} className="text-red-600 hover:text-red-900 p-1">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500">Section:</span>
                        <div className="font-medium text-gray-900">{student.section || '-'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Parent:</span>
                        <div className="font-medium text-gray-900">{student.parentName || '-'}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Parent Contact:</span>
                        <div className="font-medium text-gray-900">{student.parentContact || '-'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        open={createOpen}
        title="Enroll Student"
        onClose={() => setCreateOpen(false)}
        footer={(
          <>
            <button onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">Cancel</button>
            <button onClick={submitCreate} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Save</button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
              <input value={formGrade} onChange={(e) => setFormGrade(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <input value={formSection} onChange={(e) => setFormSection(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Contact</label>
            <input value={formParentContact} onChange={(e) => setFormParentContact(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Link to Parent</label>
            <div className="flex items-center space-x-3">
              <button onClick={() => setParentMode('existing')} className={`px-3 py-1 rounded border ${parentMode==='existing'?'bg-blue-50 border-blue-300 text-blue-700':'border-gray-300 text-gray-700'}`}>Select Existing</button>
              <button onClick={() => setParentMode('new')} className={`px-3 py-1 rounded border ${parentMode==='new'?'bg-blue-50 border-blue-300 text-blue-700':'border-gray-300 text-gray-700'}`}>Create New</button>
              <button onClick={() => { setParentMode('none'); setSelectedParentId(null); }} className={`px-3 py-1 rounded border ${parentMode==='none'?'bg-blue-50 border-blue-300 text-blue-700':'border-gray-300 text-gray-700'}`}>None</button>
            </div>
            {parentMode === 'existing' && (
              <div className="space-y-2">
                <input value={parentQuery} onChange={(e) => { setParentQuery(e.target.value); searchParents(e.target.value); }} placeholder="Search parent by name/contact" className="w-full px-3 py-2 border border-gray-300 rounded" />
                <div className="max-h-40 overflow-auto border rounded">
                  {parentResults.map((p) => (
                    <button key={p.ParentID} onClick={() => setSelectedParentId(p.ParentID)} className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${selectedParentId===p.ParentID?'bg-blue-50':''}`}>
                      <div className="text-sm font-medium">{p.FullName}</div>
                      <div className="text-xs text-gray-500">{p.ContactInfo}</div>
                    </button>
                  ))}
                </div>
                {selectedParentId && <div className="text-sm text-green-700">Selected ParentID: {selectedParentId}</div>}
              </div>
            )}
            {parentMode === 'new' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Full Name</label>
                  <input value={newParentName} onChange={(e) => setNewParentName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Email</label>
                  <input value={newParentEmail} onChange={(e) => setNewParentEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Password</label>
                  <input type="password" value={newParentPassword} onChange={(e) => setNewParentPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                </div>
                <div className="sm:col-span-2">
                  <button
                    onClick={async () => {
                      if (!newParentName || !newParentEmail || !newParentPassword) return;
                      const info = await AdminService.createParentFull({ fullName: newParentName, contactInfo: formParentContact || null, email: newParentEmail, password: newParentPassword });
                      setSelectedParentId(info.parentId);
                    }}
                    className="px-3 py-2 rounded bg-blue-600 text-white"
                  >Create Parent</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        title="Edit Student"
        onClose={() => setEditOpen(false)}
        footer={(
          <>
            <button onClick={() => setEditOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">Cancel</button>
            <button onClick={submitEdit} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Update</button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
              <input value={formGrade} onChange={(e) => setFormGrade(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <input value={formSection} onChange={(e) => setFormSection(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Contact</label>
            <input value={formParentContact} onChange={(e) => setFormParentContact(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Link to Parent</label>
            <div className="flex items-center space-x-3">
              <button onClick={() => setParentMode('existing')} className={`px-3 py-1 rounded border ${parentMode==='existing'?'bg-blue-50 border-blue-300 text-blue-700':'border-gray-300 text-gray-700'}`}>Select Existing</button>
              <button onClick={() => setParentMode('new')} className={`px-3 py-1 rounded border ${parentMode==='new'?'bg-blue-50 border-blue-300 text-blue-700':'border-gray-300 text-gray-700'}`}>Create New</button>
              <button onClick={() => { setParentMode('none'); setSelectedParentId(null); }} className={`px-3 py-1 rounded border ${parentMode==='none'?'bg-blue-50 border-blue-300 text-blue-700':'border-gray-300 text-gray-700'}`}>None</button>
            </div>
            {parentMode === 'existing' && (
              <div className="space-y-2">
                <input value={parentQuery} onChange={(e) => { setParentQuery(e.target.value); searchParents(e.target.value); }} placeholder="Search parent by name/contact" className="w-full px-3 py-2 border border-gray-300 rounded" />
                <div className="max-h-40 overflow-auto border rounded">
                  {parentResults.map((p) => (
                    <button key={p.ParentID} onClick={() => setSelectedParentId(p.ParentID)} className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${selectedParentId===p.ParentID?'bg-blue-50':''}`}>
                      <div className="text-sm font-medium">{p.FullName}</div>
                      <div className="text-xs text-gray-500">{p.ContactInfo}</div>
                    </button>
                  ))}
                </div>
                {selectedParentId && <div className="text-sm text-green-700">Selected ParentID: {selectedParentId}</div>}
              </div>
            )}
            {parentMode === 'new' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Full Name</label>
                  <input value={newParentName} onChange={(e) => setNewParentName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Email</label>
                  <input value={newParentEmail} onChange={(e) => setNewParentEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Password</label>
                  <input type="password" value={newParentPassword} onChange={(e) => setNewParentPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                </div>
                <div className="sm:col-span-2">
                  <button
                    onClick={async () => {
                      if (!newParentName || !newParentEmail || !newParentPassword) return;
                      const info = await AdminService.createParentFull({ fullName: newParentName, contactInfo: formParentContact || null, email: newParentEmail, password: newParentPassword });
                      setSelectedParentId(info.parentId);
                    }}
                    className="px-3 py-2 rounded bg-blue-600 text-white"
                  >Create Parent</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={viewOpen}
        title="Student Details"
        onClose={() => setViewOpen(false)}
        footer={(
          <>
            <button onClick={() => setViewOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">Close</button>
          </>
        )}
      >
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500">Full Name</div>
                <div className="text-sm font-medium text-gray-900">{viewing?.name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Grade Level</div>
                <div className="text-sm font-medium text-gray-900">{viewing?.gradeLevel || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Section</div>
                <div className="text-sm font-medium text-gray-900">{viewing?.section || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Parent</div>
                <div className="text-sm font-medium text-gray-900">{viewing?.parentName || '-'}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-gray-500">Parent Contact</div>
                <div className="text-sm font-medium text-gray-900">{viewing?.parentContact || '-'}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-gray-500">Fingerprint Template</div>
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-900">
                  <Fingerprint className={`h-4 w-4 ${viewing?.hasFingerprint ? 'text-green-600' : 'text-gray-400'}`} />
                  <span>{viewing?.hasFingerprint ? 'Available' : 'Not captured'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={confirmDeleteId !== null}
        title="Delete student?"
        description={<div> This action cannot be undone. The student record will be permanently removed. </div>}
        confirmText="Delete"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}