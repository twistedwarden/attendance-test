import { useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, Edit, Trash2, Fingerprint, Eye, Archive, RotateCcw, Calendar } from 'lucide-react';
import { AdminService } from './api/adminService';
import Modal from './components/Modal';
import ConfirmModal from './components/ConfirmModal';
import SuggestionInput from './components/SuggestionInput';
import { toast } from 'sonner';

interface StudentVM {
  id: number;
  name: string;
  gradeLevel: string | null;
  section: string | null;
  sectionId?: number;
  sectionName?: string;
  sectionDescription?: string;
  sectionCapacity?: number;
  parentContact: string;
  parentName?: string;
  hasFingerprint?: boolean;
  status?: 'Active' | 'Archived';
}

export default function StudentsSection() {
  const [students, setStudents] = useState<StudentVM[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All Grades');
  const [sectionFilter, setSectionFilter] = useState('All Sections');
  const [fingerFilter, setFingerFilter] = useState<'all'|'available'|'missing'>('all');
  const [statusFilter, setStatusFilter] = useState('active');

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<StudentVM | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewDetails, setViewDetails] = useState<any | null>(null);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedStudentForAttendance, setSelectedStudentForAttendance] = useState<StudentVM | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  // Name (split)
  const [formFirstName, setFormFirstName] = useState('');
  const [formMiddleName, setFormMiddleName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formGrade, setFormGrade] = useState('');
  const [formSection, setFormSection] = useState('');
  const [formSectionId, setFormSectionId] = useState<number | null>(null);
  // Enrollment details
  const [formDateOfBirth, setFormDateOfBirth] = useState('');
  const [formGender, setFormGender] = useState('');
  const [formPlaceOfBirth, setFormPlaceOfBirth] = useState('');
  const [formNationality, setFormNationality] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formAdditionalInfo, setFormAdditionalInfo] = useState('');
  const [editing, setEditing] = useState<StudentVM | null>(null);
  const [parentMode, setParentMode] = useState<'none'|'existing'|'new'>('none');
  const [parentQuery, setParentQuery] = useState('');
  const [parentResults, setParentResults] = useState<any[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [selectedParentName, setSelectedParentName] = useState<string>('');
  const [selectedParentContact, setSelectedParentContact] = useState<string>('');
  const [newParentName, setNewParentName] = useState('');
  const [newParentEmail, setNewParentEmail] = useState('');
  const [newParentPassword, setNewParentPassword] = useState('');
  const [newParentContact, setNewParentContact] = useState('');
  const [newParentRelationship, setNewParentRelationship] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  
  const toInputDate = (value?: string | null) => {
    if (!value) return '';
    const iso = value.toString();
    return iso.length >= 10 ? iso.substring(0, 10) : iso;
  };
  
  // Suggestions state
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [sectionOptionsFull, setSectionOptionsFull] = useState<Array<{ id: number; sectionName: string; gradeLevel?: string }>>([]);
  const filteredSectionOptions = useMemo(() => {
    if (!formGrade) return sectionOptionsFull;
    return sectionOptionsFull.filter(opt => (opt.gradeLevel ?? '') === formGrade);
  }, [sectionOptionsFull, formGrade]);
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);
  
  // Archiving states
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [actionType, setActionType] = useState<'archive' | 'delete' | 'restore'>('archive');
  const [selectedStudent, setSelectedStudent] = useState<StudentVM | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

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
          sectionId: r.sectionId ?? r.SectionID ?? null,
          sectionName: r.sectionName ?? r.SectionName ?? null,
          sectionDescription: r.sectionDescription ?? r.SectionDescription ?? null,
          sectionCapacity: r.sectionCapacity ?? r.SectionCapacity ?? null,
          parentContact: r.parentContact ?? r.ParentContact ?? '',
          parentName: r.parentName ?? r.ParentName ?? '',
          hasFingerprint: r.hasFingerprint ?? false,
          status: r.status ?? r.Status ?? 'Active'
        }))
      );
    } catch (e: any) {
      setError(e?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      // Load sections
      const sections = await AdminService.listSections();
      setSectionOptionsFull(
        (sections || [])
          .map((s: any) => ({ id: s.id ?? s.SectionID, sectionName: s.sectionName ?? s.SectionName, gradeLevel: s.gradeLevel ?? s.GradeLevel }))
          .filter((s: any) => s.id && s.sectionName)
      );
      const sectionNames = [...new Set(sections.map((section: any) => section.sectionName ?? section.SectionName).filter(Boolean))];
      setAvailableSections(sectionNames);
      
      // Load grades (extract unique grades from sections)
      const grades = [...new Set(sections.map(section => section.gradeLevel).filter(Boolean))];
      setAvailableGrades(grades);
    } catch (e: any) {
      console.error('Failed to load suggestions:', e);
    }
  };

  useEffect(() => { 
    load(); 
    loadSuggestions();
  }, []);

  // Clear section if grade changes to a non-matching set
  useEffect(() => {
    if (!formSectionId) return;
    const valid = sectionOptionsFull.some(opt => opt.id === formSectionId && ((opt.gradeLevel ?? '') === formGrade || !formGrade));
    if (!valid) setFormSectionId(null);
  }, [formGrade, sectionOptionsFull]);

  const filtered = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchesGrade = gradeFilter === 'All Grades' || s.gradeLevel === gradeFilter;
      const matchesSection = sectionFilter === 'All Sections' || (s.sectionName || s.section) === sectionFilter;
      const matchesFinger = fingerFilter === 'all' || (fingerFilter === 'available' ? !!s.hasFingerprint : !s.hasFingerprint);
      const matchesStatus = statusFilter === 'all' || s.status?.toLowerCase() === statusFilter;
      return matchesSearch && matchesGrade && matchesSection && matchesFinger && matchesStatus;
    });
  }, [students, search, gradeFilter, sectionFilter, fingerFilter, statusFilter]);

  const gradeOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => { if (s.gradeLevel) set.add(s.gradeLevel); });
    return ['All Grades', ...Array.from(set).sort()];
  }, [students]);

  const sectionOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => { 
      const sectionName = s.sectionName || s.section;
      if (sectionName) set.add(sectionName); 
    });
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
    setFormFirstName('');
    setFormMiddleName('');
    setFormLastName('');
    setFormGrade('');
    setFormSection('');
    setFormSectionId(null);
    setFormDateOfBirth('');
    setFormGender('');
    setFormPlaceOfBirth('');
    setFormNationality('');
    setFormAddress('');
    setFormAdditionalInfo('');
    setParentMode('none');
    setParentQuery(''); setParentResults([]); setSelectedParentId(null);
    setSelectedParentName(''); setSelectedParentContact('');
    setNewParentName(''); setNewParentEmail(''); setNewParentPassword('');
    setNewParentContact(''); setNewParentRelationship('');
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    try {
      const name = `${formFirstName} ${formMiddleName} ${formLastName}`.replace(/\s+/g, ' ').trim();
      if (!name) return;
      await AdminService.createStudent({ 
        name, 
        gradeLevel: formGrade || null, 
        sectionId: formSectionId && formSectionId > 0 ? formSectionId : null, 
        parentId: selectedParentId && selectedParentId > 0 ? selectedParentId : null,
        dateOfBirth: formDateOfBirth || null,
        gender: formGender || null,
        placeOfBirth: formPlaceOfBirth || null,
        nationality: formNationality || null,
        address: formAddress || null,
        additionalInfo: formAdditionalInfo || null
      });
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
    // We don't have parts; split best-effort
    const parts = (s.name || '').split(' ');
    setFormFirstName(parts[0] || '');
    setFormMiddleName(parts.length > 2 ? parts.slice(1, parts.length - 1).join(' ') : '');
    setFormLastName(parts.length > 1 ? parts[parts.length - 1] : '');
    setFormGrade(s.gradeLevel || '');
    setFormSection(s.section || '');
    setFormSectionId(s.sectionId ?? null);
    setFormDateOfBirth('');
    setFormGender('');
    setFormPlaceOfBirth('');
    setFormNationality('');
    setFormAddress('');
    setFormAdditionalInfo('');
    setParentMode('none'); setSelectedParentId(null); setParentQuery(''); setParentResults([]);
    setSelectedParentName(''); setSelectedParentContact('');
    setCreateOpen(false);
    setEditOpen(true);

    // Load additional details to prefill personal info fields
    (async () => {
      try {
        const details = await AdminService.getEnrollment(s.id);
        setFormDateOfBirth(toInputDate(details?.dateOfBirth));
        setFormGender(details?.gender || '');
        setFormPlaceOfBirth(details?.placeOfBirth || '');
        setFormNationality(details?.nationality || '');
        setFormAddress(details?.address || '');
        setFormAdditionalInfo(details?.additionalInfo || '');
        // Prefer sectionId from details if available
        if (details?.sectionId && !formSectionId) setFormSectionId(details.sectionId);
        if (details?.gradeLevel && !formGrade) setFormGrade(details.gradeLevel);
        if (details?.parentId) {
          setParentMode('existing');
          setSelectedParentId(details.parentId);
          setSelectedParentName(details.parentName || '');
          setSelectedParentContact(details.parentContact || '');
        }
      } catch (e) {
        // Silent fail; the basic fields are already loaded
      }
    })();
  };

  const openAttendanceModal = async (student: StudentVM) => {
    setSelectedStudentForAttendance(student);
    setAttendanceModalOpen(true);
    await loadAttendanceRecords(student.id, attendanceDate);
  };

  const loadAttendanceRecords = async (studentId: number, date: string) => {
    try {
      setAttendanceLoading(true);
      const data = await AdminService.listSubjectAttendance(50, 0, undefined, date, studentId);
      setAttendanceRecords(data);
    } catch (error) {
      console.error('Failed to load attendance records:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleDateChange = async (newDate: string) => {
    setAttendanceDate(newDate);
    if (selectedStudentForAttendance) {
      await loadAttendanceRecords(selectedStudentForAttendance.id, newDate);
    }
  };

  const submitEdit = async () => {
    if (!editing) return;
    try {
      const name = `${formFirstName} ${formMiddleName} ${formLastName}`.replace(/\s+/g, ' ').trim();
      await AdminService.updateStudent(editing.id, { 
        name, 
        gradeLevel: formGrade || null, 
        sectionId: formSectionId && formSectionId > 0 ? formSectionId : null, 
        parentId: selectedParentId && selectedParentId > 0 ? selectedParentId : null,
        dateOfBirth: formDateOfBirth || null,
        gender: formGender || null,
        placeOfBirth: formPlaceOfBirth || null,
        nationality: formNationality || null,
        address: formAddress || null,
        additionalInfo: formAdditionalInfo || null
      });
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

  // Load detailed info for view modal
  const loadViewDetails = async (studentId: number) => {
    try {
      setViewLoading(true);
      setViewDetails(null);
      const details = await AdminService.getEnrollment(studentId);
      setViewDetails(details);
    } catch (e) {
      console.error('Failed to load student details:', e);
      toast.error('Failed to load student details');
    } finally {
      setViewLoading(false);
    }
  };

  // When opening view modal, fetch details
  useEffect(() => {
    if (viewOpen && viewing?.id) {
      loadViewDetails(viewing.id);
    }
  }, [viewOpen, viewing?.id]);

  // Archiving functions
  const openArchive = (student: StudentVM) => {
    setSelectedStudent(student);
    setActionType('archive');
    setConfirmationText('');
    setIsArchiveOpen(true);
  };

  const openRestore = (student: StudentVM) => {
    setSelectedStudent(student);
    setActionType('restore');
    setConfirmationText('');
    setIsRestoreOpen(true);
  };

  const openDeleteModal = (student: StudentVM) => {
    setSelectedStudent(student);
    setActionType('delete');
    setConfirmationText('');
    setIsDeleteOpen(true);
  };

  const handleArchive = async () => {
    if (!selectedStudent) return;
    try {
      setFormSubmitting(true);
      setError(null);
      await AdminService.setStudentStatus(selectedStudent.id, 'Archived');
      closeAllModals();
      toast.success('Student archived successfully');
      load();
    } catch (e: any) {
      setError(e?.message || 'Failed to archive student');
      toast.error(e?.message || 'Failed to archive student');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedStudent) return;
    try {
      setFormSubmitting(true);
      setError(null);
      await AdminService.setStudentStatus(selectedStudent.id, 'Active');
      closeAllModals();
      toast.success('Student restored successfully');
      load();
    } catch (e: any) {
      setError(e?.message || 'Failed to restore student');
      toast.error(e?.message || 'Failed to restore student');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    try {
      setFormSubmitting(true);
      setError(null);
      await AdminService.deleteStudent(selectedStudent.id);
      closeAllModals();
      toast.success('Student deleted successfully');
      load();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete student');
      toast.error(e?.message || 'Failed to delete student');
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
      await handleDeleteStudent();
    }
  };

  const closeAllModals = () => {
    setIsArchiveOpen(false);
    setIsRestoreOpen(false);
    setIsDeleteOpen(false);
    setSelectedStudent(null);
    setConfirmationText('');
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
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.id}</td>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.sectionName || student.section || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.parentName || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.parentContact || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button onClick={() => { setViewing(student); setViewOpen(true); }} className="text-gray-600 hover:text-gray-900" title="View Details">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => openAttendanceModal(student)} className="text-green-600 hover:text-green-900" title="View Attendance">
                            <Calendar className="h-4 w-4" />
                          </button>
                          <button onClick={() => openEdit(student)} className="text-blue-600 hover:text-blue-900" title="Edit">
                            <Edit className="h-4 w-4" />
                          </button>
                          {student.status === 'Archived' ? (
                            <>
                              <button onClick={() => openRestore(student)} className="text-green-600 hover:text-green-700" title="Restore">
                                <RotateCcw className="h-4 w-4" />
                              </button>
                              <button onClick={() => openDeleteModal(student)} className="text-red-600 hover:text-red-700" title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button onClick={() => openArchive(student)} className="text-orange-600 hover:text-orange-700" title="Archive">
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
                          <div className="text-xs text-gray-500 mt-1">ID: {student.id} • {student.gradeLevel || '-'}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <div className="flex space-x-1">
                          <button onClick={() => { setViewing(student); setViewOpen(true); }} className="text-gray-600 hover:text-gray-900 p-1" title="View Details">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => openAttendanceModal(student)} className="text-green-600 hover:text-green-900 p-1" title="View Attendance">
                            <Calendar className="h-4 w-4" />
                          </button>
                          <button onClick={() => openEdit(student)} className="text-blue-600 hover:text-blue-900 p-1" title="Edit">
                            <Edit className="h-4 w-4" />
                          </button>
                          {student.status === 'Archived' ? (
                            <>
                              <button onClick={() => openRestore(student)} className="text-green-600 hover:text-green-700 p-1" title="Restore">
                                <RotateCcw className="h-4 w-4" />
                              </button>
                              <button onClick={() => openDeleteModal(student)} className="text-red-600 hover:text-red-700 p-1" title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button onClick={() => openArchive(student)} className="text-orange-600 hover:text-orange-700 p-1" title="Archive">
                              <Archive className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500">Section:</span>
                        <div className="font-medium text-gray-900">{student.sectionName || student.section || '-'}</div>
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
            <button 
              disabled={parentMode === 'new' && !selectedParentId}
              onClick={submitCreate} 
              className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >Save</button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input placeholder="First name" value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <input placeholder="Middle name" value={formMiddleName} onChange={(e) => setFormMiddleName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <input placeholder="Last name" value={formLastName} onChange={(e) => setFormLastName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input type="date" value={formDateOfBirth} onChange={(e) => setFormDateOfBirth(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select value={formGender} onChange={(e) => setFormGender(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Place of Birth</label>
              <input value={formPlaceOfBirth} onChange={(e) => setFormPlaceOfBirth(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
              <input value={formNationality} onChange={(e) => setFormNationality(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea value={formAddress} onChange={(e) => setFormAddress(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Info</label>
            <textarea value={formAdditionalInfo} onChange={(e) => setFormAdditionalInfo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={2} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <SuggestionInput
                label="Grade Level"
                value={formGrade}
                onChange={setFormGrade}
                suggestions={availableGrades}
                placeholder="Enter grade level (e.g., 1, 2, 3)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <select
                value={formSectionId ?? 0}
                onChange={(e) => setFormSectionId(Number(e.target.value) || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>Select Section</option>
                {filteredSectionOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.sectionName}{opt.gradeLevel ? ` - ${opt.gradeLevel}` : ''}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Removed Parent Contact per requirement */}
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
                    <button key={p.ParentID} onClick={() => { setSelectedParentId(p.ParentID); setSelectedParentName(p.FullName || ''); setSelectedParentContact(p.ContactInfo || ''); }} className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${selectedParentId===p.ParentID?'bg-blue-50':''}`}>
                      <div className="text-sm font-medium">{p.FullName}</div>
                      <div className="text-xs text-gray-500">{p.ContactInfo}</div>
                    </button>
                  ))}
                </div>
                {selectedParentId && (
                  <div className="text-sm text-green-700">
                    Linked to: <span className="font-medium">{selectedParentName || `Parent #${selectedParentId}`}</span>{selectedParentContact ? ` • ${selectedParentContact}` : ''}
                  </div>
                )}
              </div>
            )}
            {parentMode === 'new' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Full Name</label>
                  <input value={newParentName} onChange={(e) => setNewParentName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info</label>
                  <input value={newParentContact} onChange={(e) => setNewParentContact(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <select value={newParentRelationship} onChange={(e) => setNewParentRelationship(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded">
                    <option value="">Select Relationship</option>
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="guardian">Guardian</option>
                  </select>
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
                      try {
                        if (!newParentName || !newParentEmail || !newParentPassword) {
                          toast.error('Please enter name, email, and password');
                          return;
                        }
                        const info = await AdminService.createParentFull({ fullName: newParentName, contactInfo: newParentContact || null, relationship: newParentRelationship || null, email: newParentEmail, password: newParentPassword });
                        setSelectedParentId(info.parentId);
                        setSelectedParentName(newParentName);
                        setSelectedParentContact(newParentContact || '');
                        setParentMode('existing');
                        toast.success('Parent created and linked');
                      } catch (e: any) {
                        toast.error(e?.message || 'Failed to create parent');
                      }
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
            <button 
              disabled={parentMode === 'new' && !selectedParentId}
              onClick={submitEdit} 
              className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >Update</button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input placeholder="First name" value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <input placeholder="Middle name" value={formMiddleName} onChange={(e) => setFormMiddleName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <input placeholder="Last name" value={formLastName} onChange={(e) => setFormLastName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input type="date" value={formDateOfBirth} onChange={(e) => setFormDateOfBirth(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select value={formGender} onChange={(e) => setFormGender(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <SuggestionInput
                label="Grade Level"
                value={formGrade}
                onChange={setFormGrade}
                suggestions={availableGrades}
                placeholder="Enter grade level (e.g., 1, 2, 3)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <select
                value={formSectionId ?? 0}
                onChange={(e) => setFormSectionId(Number(e.target.value) || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>Select Section</option>
                {sectionOptionsFull.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.sectionName}{opt.gradeLevel ? ` - ${opt.gradeLevel}` : ''}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Removed Parent Contact per requirement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Place of Birth</label>
              <input value={formPlaceOfBirth} onChange={(e) => setFormPlaceOfBirth(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus-border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
              <input value={formNationality} onChange={(e) => setFormNationality(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus-border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea value={formAddress} onChange={(e) => setFormAddress(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus-border-transparent" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Info</label>
            <textarea value={formAdditionalInfo} onChange={(e) => setFormAdditionalInfo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus-border-transparent" rows={2} />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info</label>
                  <input value={newParentContact} onChange={(e) => setNewParentContact(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <select value={newParentRelationship} onChange={(e) => setNewParentRelationship(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded">
                    <option value="">Select Relationship</option>
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="guardian">Guardian</option>
                  </select>
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
                      try {
                        if (!newParentName || !newParentEmail || !newParentPassword) {
                          toast.error('Please enter name, email, and password');
                          return;
                        }
                        const info = await AdminService.createParentFull({ fullName: newParentName, contactInfo: newParentContact || null, relationship: newParentRelationship || null, email: newParentEmail, password: newParentPassword });
                        setSelectedParentId(info.parentId);
                        toast.success('Parent created and linked');
                      } catch (e: any) {
                        toast.error(e?.message || 'Failed to create parent');
                      }
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
            {viewLoading && (
              <div className="flex items-center justify-center py-6 text-gray-600">Loading details...</div>
            )}

            {!viewLoading && (
              <>
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Student ID</div>
                    <div className="text-sm font-medium text-gray-900">{viewing?.id}</div>
                  </div>
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
                    <div className="text-sm font-medium text-gray-900">{viewing?.sectionName || viewing?.section || '-'}</div>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="mt-2">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Personal Details</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Date of Birth</div>
                      <div className="text-sm font-medium text-gray-900">{viewDetails?.dateOfBirth ? new Date(viewDetails.dateOfBirth).toLocaleDateString() : '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Gender</div>
                      <div className="text-sm font-medium text-gray-900">{viewDetails?.gender || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Place of Birth</div>
                      <div className="text-sm font-medium text-gray-900">{viewDetails?.placeOfBirth || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Nationality</div>
                      <div className="text-sm font-medium text-gray-900">{viewDetails?.nationality || '-'}</div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-xs text-gray-500">Address</div>
                      <div className="text-sm font-medium text-gray-900">{viewDetails?.address || '-'}</div>
                    </div>
                  </div>
                </div>

                {/* Parent Details */}
                <div className="mt-2">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Parent Details</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Name</div>
                      <div className="text-sm font-medium text-gray-900">{viewDetails?.parentName || viewing?.parentName || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Contact</div>
                      <div className="text-sm font-medium text-gray-900">{viewDetails?.parentContact || viewing?.parentContact || '-'}</div>
                    </div>
                  </div>
                </div>

                {/* Enrollment Details (if available) */}
                <div className="mt-2">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Enrollment</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Status</div>
                      <div className="text-sm font-medium text-gray-900">{viewDetails?.enrollmentStatus || viewing?.status || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Enrollment Date</div>
                      <div className="text-sm font-medium text-gray-900">{viewDetails?.enrollmentDate ? new Date(viewDetails.enrollmentDate).toLocaleDateString() : '-'}</div>
                    </div>
                  </div>
                </div>

                {/* Fingerprint */}
                <div className="sm:col-span-2 mt-2">
                  <div className="text-xs text-gray-500">Fingerprint Template</div>
                  <div className="flex items-center space-x-2 text-sm font-medium text-gray-900">
                    <Fingerprint className={`h-4 w-4 ${viewing?.hasFingerprint ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>{viewing?.hasFingerprint ? 'Available' : 'Not captured'}</span>
                  </div>
                </div>
              </>
            )}
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

      {/* Archive Modal */}
      <Modal open={isArchiveOpen} title="Archive Student" onClose={closeAllModals} footer={(
        <>
          <button onClick={closeAllModals} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
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
          <p>Are you sure you want to archive student <span className="font-semibold">{selectedStudent?.name}</span>? This will move the student to archived status.</p>
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

      {/* Restore Modal */}
      <Modal open={isRestoreOpen} title="Restore Student" onClose={closeAllModals} footer={(
        <>
          <button onClick={closeAllModals} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
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
          <p>Are you sure you want to restore student <span className="font-semibold">{selectedStudent?.name}</span>? This will change the student status back to active.</p>
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

      {/* Delete Modal */}
      <Modal open={isDeleteOpen} title="Delete Student" onClose={closeAllModals} footer={(
        <>
          <button onClick={closeAllModals} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
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
          <p>Are you sure you want to delete student <span className="font-semibold">{selectedStudent?.name}</span>? This action cannot be undone.</p>
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

      {/* Attendance Modal */}
      <Modal
        open={attendanceModalOpen}
        title={`Attendance Records - ${selectedStudentForAttendance?.name || ''}`}
        onClose={() => setAttendanceModalOpen(false)}
        footer={(
          <button 
            onClick={() => setAttendanceModalOpen(false)} 
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        )}
      >
        <div className="space-y-4">
          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Date:</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Student Info */}
          {selectedStudentForAttendance && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Fingerprint className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">{selectedStudentForAttendance.name}</span>
              </div>
              <div className="text-sm text-blue-600 mt-1">
                Grade: {selectedStudentForAttendance.gradeLevel || 'Not specified'} | 
                Section: {selectedStudentForAttendance.sectionName || selectedStudentForAttendance.section || 'Not specified'}
              </div>
            </div>
          )}

          {/* Loading State */}
          {attendanceLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Loading attendance records...</span>
            </div>
          )}

          {/* Attendance Records */}
          {!attendanceLoading && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">Subject Attendance Checklist</h3>
              {attendanceRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No attendance records found for this date.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attendanceRecords.map((record) => {
                    const statusLower = (record.Status || '').toLowerCase();
                    let status: 'present' | 'failed' | 'late' = 'present';
                    if (statusLower.includes('late')) status = 'late';
                    else if (statusLower.includes('absent') || statusLower.includes('fail')) status = 'failed';

                    return (
                      <div
                        key={record.SubjectAttendanceID}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          status === 'present' 
                            ? 'bg-green-50 border-green-200' 
                            : status === 'late' 
                            ? 'bg-yellow-50 border-yellow-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {status === 'present' && <div className="w-3 h-3 bg-green-500 rounded-full"></div>}
                          {status === 'late' && <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>}
                          {status === 'failed' && <div className="w-3 h-3 bg-red-500 rounded-full"></div>}
                          <div>
                            <div className="font-medium text-gray-900">{record.SubjectName}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(record.CreatedAt).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          status === 'present' 
                            ? 'bg-green-100 text-green-800' 
                            : status === 'late' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {status === 'present' ? 'Time in' : status === 'late' ? 'Late Arrival' : 'Absent'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}