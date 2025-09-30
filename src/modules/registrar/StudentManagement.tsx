import { useState, useEffect } from 'react';
import { Search, Filter, Edit, Save, X, User, Eye } from 'lucide-react';
import { RegistrarService } from './api/registrarService';

interface Student {
  id: string;
  studentName: string;
  dateOfBirth: string;
  gender: string;
  placeOfBirth: string;
  nationality: string;
  address: string;
  gradeLevel: string;
  section: string;
  parentName: string;
  parentContact: string;
  parentEmail?: string;
  enrollmentStatus: 'pending' | 'approved' | 'declined' | 'enrolled';
  enrollmentDate: string;
  lastModified: string;
}

interface Section {
  id: string;
  name: string;
  gradeLevel: string;
  capacity: number;
  currentEnrollment: number;
}

export default function StudentManagement() {
  // Normalize to YYYY-MM-DD for date inputs
  const toInputDate = (value?: string) => {
    if (!value) return '';
    const iso = value.toString();
    return iso.length >= 10 ? iso.substring(0, 10) : iso;
  };
  const formatDateMDY = (value?: string) => {
    if (!value) return '';
    const iso = value.toString();
    const ymd = iso.length >= 10 ? iso.substring(0, 10) : iso;
    const [y, m, d] = ymd.split('-');
    if (!y || !m || !d) return value;
    return `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y}`;
  };
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('approved');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<Partial<Student>>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  useEffect(() => {
    loadStudents();
    loadSections();
  }, []);

  // Auto-apply filters with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      loadStudents();
    }, 350);
    return () => clearTimeout(handler);
  }, [search, gradeFilter, statusFilter]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await RegistrarService.getStudents({
        search: search || undefined,
        gradeLevel: gradeFilter === 'all' ? undefined : gradeFilter,
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      setStudents(response.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      const response = await RegistrarService.getSections();
      setSections(response.data || []);
    } catch (error) {
      console.error('Failed to load sections:', error);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setEditForm({
      studentName: student.studentName,
      dateOfBirth: toInputDate(student.dateOfBirth),
      gender: student.gender,
      placeOfBirth: student.placeOfBirth,
      nationality: student.nationality,
      address: student.address,
      gradeLevel: student.gradeLevel,
      section: student.section,
      parentName: student.parentName,
      parentContact: student.parentContact
    });
  };

  const handleSave = async () => {
    if (!editingStudent) return;
    
    try {
      setSaveLoading(true);
      await RegistrarService.updateStudent(editingStudent.id, editForm);
      
      // Update local state
      setStudents(students.map(student => 
        student.id === editingStudent.id 
          ? { ...student, ...editForm, lastModified: new Date().toISOString() }
          : student
      ));
      
      setEditingStudent(null);
      setEditForm({});
    } catch (error) {
      console.error('Failed to update student:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingStudent(null);
    setEditForm({});
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      enrolled: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredStudents = students.filter(student =>
    student.studentName.toLowerCase().includes(search.toLowerCase()) ||
    student.parentName.toLowerCase().includes(search.toLowerCase()) ||
    student.gradeLevel.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
        <p className="text-gray-600">View and modify student information and enrollment details.</p>
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
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Grades</option>
              <option value="1">Grade 1</option>
              <option value="2">Grade 2</option>
              <option value="3">Grade 3</option>
              <option value="4">Grade 4</option>
              <option value="5">Grade 5</option>
              <option value="6">Grade 6</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
              <option value="enrolled">Enrolled</option>
            </select>
            
            <button
              onClick={loadStudents}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Filter className="w-4 h-4" />
              <span className="ml-2 sm:inline hidden">Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
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
                      Last Modified
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                            <div className="text-sm text-gray-500">{student.gender} • {formatDateMDY(student.dateOfBirth)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">Grade {student.gradeLevel}</div>
                        <div className="text-sm text-gray-500">{student.section || 'Not assigned'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.parentName}</div>
                        <div className="text-sm text-gray-500">{student.parentContact}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(student.enrollmentStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(student.lastModified).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setViewingStudent(student)}
                            className="text-gray-600 hover:text-gray-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(student)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden">
              {filteredStudents.map((student) => (
                <div key={student.id} className="border-b border-gray-200 p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                        <div className="text-sm text-gray-500">{student.gender} • {formatDateMDY(student.dateOfBirth)}</div>
                        <div className="text-sm text-gray-500">Grade {student.gradeLevel} • {student.section || 'Not assigned'}</div>
                        <div className="text-sm text-gray-500">{student.parentName}</div>
                        <div className="text-sm text-gray-500">{student.parentContact}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center">
                        {getStatusBadge(student.enrollmentStatus)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(student.lastModified).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => setViewingStudent(student)}
                        className="text-gray-600 hover:text-gray-900 p-1"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(student)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Edit Student Information</h3>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
                    <input
                      type="text"
                      value={editForm.studentName || ''}
                      onChange={(e) => setEditForm({...editForm, studentName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={editForm.dateOfBirth || ''}
                      onChange={(e) => setEditForm({...editForm, dateOfBirth: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      value={editForm.gender || ''}
                      onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Place of Birth</label>
                    <input
                      type="text"
                      value={editForm.placeOfBirth || ''}
                      onChange={(e) => setEditForm({...editForm, placeOfBirth: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                    <input
                      type="text"
                      value={editForm.nationality || ''}
                      onChange={(e) => setEditForm({...editForm, nationality: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                    <select
                      value={editForm.gradeLevel || ''}
                      onChange={(e) => setEditForm({...editForm, gradeLevel: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Grade</option>
                      <option value="1">Grade 1</option>
                      <option value="2">Grade 2</option>
                      <option value="3">Grade 3</option>
                      <option value="4">Grade 4</option>
                      <option value="5">Grade 5</option>
                      <option value="6">Grade 6</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                    <select
                      value={editForm.section || ''}
                      onChange={(e) => setEditForm({...editForm, section: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Section</option>
                      {sections
                        .filter(section => section.gradeLevel === editForm.gradeLevel)
                        .map(section => (
                          <option key={section.id} value={section.name}>
                            {section.name} ({section.currentEnrollment}/{section.capacity})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={editForm.address || ''}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name</label>
                    <input
                      type="text"
                      value={editForm.parentName || ''}
                      onChange={(e) => setEditForm({...editForm, parentName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Contact</label>
                    <input
                      type="text"
                      value={editForm.parentContact || ''}
                      onChange={(e) => setEditForm({...editForm, parentContact: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {saveLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Student Details</h3>
                <button
                  onClick={() => setViewingStudent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Full Name</div>
                  <div className="font-medium text-gray-900">{viewingStudent.studentName}</div>
                </div>
                <div>
                  <div className="text-gray-500">Date of Birth</div>
                  <div className="font-medium text-gray-900">{formatDateMDY(viewingStudent.dateOfBirth)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Gender</div>
                  <div className="font-medium text-gray-900">{viewingStudent.gender}</div>
                </div>
                <div>
                  <div className="text-gray-500">Place of Birth</div>
                  <div className="font-medium text-gray-900">{viewingStudent.placeOfBirth}</div>
                </div>
                <div>
                  <div className="text-gray-500">Nationality</div>
                  <div className="font-medium text-gray-900">{viewingStudent.nationality}</div>
                </div>
                <div>
                  <div className="text-gray-500">Grade & Section</div>
                  <div className="font-medium text-gray-900">Grade {viewingStudent.gradeLevel} • {viewingStudent.section || 'Not assigned'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Parent</div>
                  <div className="font-medium text-gray-900">{viewingStudent.parentName}</div>
                </div>
                <div>
                  <div className="text-gray-500">Parent Contact</div>
                  <div className="font-medium text-gray-900">{viewingStudent.parentContact}</div>
                </div>
                {viewingStudent.parentEmail && (
                  <div className="sm:col-span-2">
                    <div className="text-gray-500">Parent Email</div>
                    <div className="font-medium text-gray-900">{viewingStudent.parentEmail}</div>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <div className="text-gray-500">Address</div>
                  <div className="font-medium text-gray-900">{viewingStudent.address}</div>
                </div>
                <div>
                  <div className="text-gray-500">Enrollment Status</div>
                  <div>{getStatusBadge(viewingStudent.enrollmentStatus)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Enrollment Date</div>
                  <div className="font-medium text-gray-900">{formatDateMDY(viewingStudent.enrollmentDate)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Last Modified</div>
                  <div className="font-medium text-gray-900">{new Date(viewingStudent.lastModified).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setViewingStudent(null)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
