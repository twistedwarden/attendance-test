import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, Edit, Save, X, Search, Plus, Trash2, BookOpen, Users, Calendar, User } from 'lucide-react';
import { AdminService } from './api/adminService';
import Modal from './components/Modal';
import ScheduleConflictModal from './components/ScheduleConflictModal';
import StudentSearchInput from './components/StudentSearchInput';
import { toast } from 'sonner';

interface ScheduleVM {
  id: number;
  subject: string;
  teacher: string;
  sectionId?: number | null;
  sectionName?: string | null;
  sectionDescription?: string | null;
  sectionCapacity?: number | null;
  gradeLevel?: string | null;
  days: string[]; // e.g. ["Mon","Wed","Fri"]
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

interface TeacherScheduleVM {
  id: number;
  teacherId: number;
  teacherName: string;
  gradeLevel: string;
  section: string;
  sectionId: number | null;
  sectionName: string | null;
  subjectId: number;
  subjectName: string;
  timeIn: string; // HH:mm
  timeOut: string; // HH:mm
  dayOfWeek: string;
  gracePeriod: number;
}

interface SectionVM {
  id: number;
  sectionName: string;
  gradeLevel: string;
  description?: string | null;
  capacity?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SubjectVM {
  id: number;
  name: string;
  description?: string | null;
}

interface TeacherVM {
  id: number;
  name: string;
  contactInfo?: string | null;
  hireDate?: string | null;
  status: string;
  username?: string | null;
  userId?: number | null;
}

interface StudentAssignmentVM {
  id: number;
  studentId: number;
  studentName: string;
  gradeLevel: string;
  section: string;
  subjectId: number;
  subjectName: string;
  teacherId: number;
  teacherName: string;
  scheduleId: number;
  days: string[];
  startTime: string;
  endTime: string;
}

export default function SchedulesSection() {
  const [viewMode, setViewMode] = useState<'schedules' | 'subjects' | 'teachers' | 'sections' | 'calendar' | 'student-assignments'>('schedules');
  const [rows, setRows] = useState<ScheduleVM[]>([]);
  const [teacherSchedules, setTeacherSchedules] = useState<TeacherScheduleVM[]>([]);
  const [sections, setSections] = useState<SectionVM[]>([]);
  const [subjects, setSubjects] = useState<SubjectVM[]>([]);
  const [teachers, setTeachers] = useState<TeacherVM[]>([]);
  const [studentAssignments, setStudentAssignments] = useState<StudentAssignmentVM[]>([]);
  const [loading, setLoading] = useState(false);
  // Calendar filters
  const [calendarSectionId, setCalendarSectionId] = useState<number | ''>('');
  
  // Student assignment modal states
  const [assignmentCreateOpen, setAssignmentCreateOpen] = useState(false);
  const [formStudentId, setFormStudentId] = useState<number | null>(null);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<number[]>([]);
  const [students, setStudents] = useState<{id: number, name: string, gradeLevel: string, section: string}[]>([]);
  const [availableSchedules, setAvailableSchedules] = useState<ScheduleVM[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<{id: number, name: string, gradeLevel: string, section: string} | null>(null);
  const [studentSearchValue, setStudentSearchValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleVM | null>(null);
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formDays, setFormDays] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [formSubject, setFormSubject] = useState('');
  const [formTeacher, setFormTeacher] = useState('');
  const [formSectionId, setFormSectionId] = useState<number | null>(null);
  const [formScheduleGradeLevel, setFormScheduleGradeLevel] = useState('');
  
  // Conflict modal states
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<any>(null);
  const [conflictErrors, setConflictErrors] = useState<string[]>([]);
  
  // Teacher schedule form states (kept for potential future use)
  const [editingTeacherSchedule, setEditingTeacherSchedule] = useState<TeacherScheduleVM | null>(null);
  const [formGradeLevel, setFormGradeLevel] = useState('');
  const [formSectionName, setFormSectionName] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formTimeIn, setFormTimeIn] = useState('');
  const [formTimeOut, setFormTimeOut] = useState('');
  const [formDayOfWeek, setFormDayOfWeek] = useState('');
  const [formGracePeriod, setFormGracePeriod] = useState(15);
  const [formIsActive, setFormIsActive] = useState(true);
  
  // Section management states
  const [sectionEditOpen, setSectionEditOpen] = useState(false);
  const [sectionCreateOpen, setSectionCreateOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionVM | null>(null);
  const [formSectionNameNew, setFormSectionNameNew] = useState('');
  const [formSectionGradeLevel, setFormSectionGradeLevel] = useState('');
  const [formSectionDescription, setFormSectionDescription] = useState('');
  const [formSectionCapacity, setFormSectionCapacity] = useState<number | undefined>(undefined);
  const [formSectionIsActive, setFormSectionIsActive] = useState(true);
  
  // Subject management states
  const [subjectEditOpen, setSubjectEditOpen] = useState(false);
  const [subjectCreateOpen, setSubjectCreateOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectVM | null>(null);
  const [formSubjectName, setFormSubjectName] = useState('');
  const [formSubjectDescription, setFormSubjectDescription] = useState('');

  // Teacher management states
  const [teacherEditOpen, setTeacherEditOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherVM | null>(null);
  const [formTeacherName, setFormTeacherName] = useState('');
  const [formTeacherContact, setFormTeacherContact] = useState('');
  const [formTeacherHireDate, setFormTeacherHireDate] = useState('');
  const [formTeacherStatus, setFormTeacherStatus] = useState('Active');
  // typeahead state
  const [subjectSug, setSubjectSug] = useState<string[]>([]);
  const [teacherSug, setTeacherSug] = useState<{ id: number; name: string }[]>([]);
  const [sectionSug, setSectionSug] = useState<SectionVM[]>([]);
  const [hoverIdx, setHoverIdx] = useState<{ field: 'subject'|'teacher'|'section'|null; idx: number }>(() => ({ field: null, idx: -1 }));
  const [showSubjectSug, setShowSubjectSug] = useState(false);
  const [showTeacherSug, setShowTeacherSug] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const subjectRef = useRef<HTMLInputElement | null>(null);
  const teacherRef = useRef<HTMLInputElement | null>(null);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  // Calendar View Component
  const CalendarView = ({ schedules }: { schedules: TeacherScheduleVM[] }) => {
    const timeSlots = [];
    for (let hour = 6; hour <= 18; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    }

    const getScheduleForTimeSlot = (day: string, timeSlot: string) => {
      return schedules.filter(schedule => 
        schedule.dayOfWeek === day && 
        schedule.timeIn <= timeSlot && 
        schedule.timeOut > timeSlot
      );
    };

    return (
      <div className="p-3">
        <div className="grid gap-px" style={{ gridTemplateColumns: '56px repeat(5, minmax(0, 1fr))' }}>
          {/* Time column header */}
          <div className="bg-gray-100 px-1 py-1 text-xs font-medium text-gray-700 border-r">
            Time
          </div>
          
          {/* Day headers */}
          {daysOfWeek.map(day => (
            <div key={day} className="bg-gray-100 px-1 py-1 text-xs font-medium text-gray-700 text-center border-r">
              {day}
            </div>
          ))}
          
          {/* Time slots and schedule cells */}
          {timeSlots.map(timeSlot => (
            <React.Fragment key={timeSlot}>
              {/* Time label */}
              <div className="bg-gray-50 px-1 py-1 text-[10px] text-gray-600 border-r border-b">
                {timeSlot}
              </div>
              
              {/* Schedule cells for each day */}
              {daysOfWeek.map(day => {
                const daySchedules = getScheduleForTimeSlot(day, timeSlot);
                return (
                  <div key={`${day}-${timeSlot}`} className="border-r border-b min-h-[28px] p-0.5">
                    {daySchedules.map(schedule => (
                      <div
                        key={schedule.id}
                        className="text-[10px] p-0.5 rounded mb-0.5 bg-blue-100 text-blue-800 border border-blue-200"
                        title={`${schedule.subjectName} - ${schedule.sectionName || schedule.section} (${schedule.timeIn}-${schedule.timeOut}) - ${schedule.teacherName}`}
                      >
                        <div className="font-medium truncate leading-tight">{schedule.subjectName}</div>
                        <div className="text-[10px] opacity-75 truncate leading-tight">
                          {schedule.gradeLevel} - {schedule.sectionName || schedule.section}
                        </div>
                        <div className="text-[10px] opacity-75 leading-tight">
                          {schedule.timeIn}-{schedule.timeOut}
                        </div>
                        <div className="text-[10px] opacity-75 truncate leading-tight">
                          {schedule.teacherName}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };
  
  const toggleDay = (day: string) => {
    setFormDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      if (viewMode === 'schedules') {
        const data = await AdminService.listSchedules();
        const mapped: ScheduleVM[] = (data || []).map((r: any) => ({
          id: r.id ?? r.ScheduleID,
          subject: r.subject ?? r.SubjectName ?? 'Subject',
          teacher: r.teacher ?? r.TeacherName ?? '—',
          sectionId: r.sectionId ?? r.SectionID ?? null,
          sectionName: r.sectionName ?? r.SectionName ?? null,
          sectionDescription: r.sectionDescription ?? r.SectionDescription ?? null,
          sectionCapacity: r.sectionCapacity ?? r.SectionCapacity ?? null,
          gradeLevel: r.gradeLevel ?? r.GradeLevel ?? null,
          days: r.days ?? r.Days ?? [],
          startTime: r.startTime ?? r.StartTime ?? '08:00',
          endTime: r.endTime ?? r.EndTime ?? '09:00',
        }));
        setRows(mapped);
      } else if (viewMode === 'calendar') {
        const data = await AdminService.getSchedules();
        const mapped: TeacherScheduleVM[] = (data || []).map((r: any) => ({
          id: r.id ?? r.ScheduleID,
          teacherId: r.teacherId ?? r.TeacherID ?? 0,
          teacherName: r.teacher ?? r.TeacherName ?? 'Teacher',
          gradeLevel: r.gradeLevel ?? r.GradeLevel ?? '',
          section: r.section ?? r.Section ?? '',
          sectionId: r.sectionId ?? r.SectionID ?? null,
          sectionName: r.sectionName ?? r.SectionName ?? null,
          subjectId: r.subjectId ?? r.SubjectID ?? 0,
          subjectName: r.subject ?? r.SubjectName ?? 'Subject',
          timeIn: r.startTime ?? r.TimeIn ?? '08:00',
          timeOut: r.endTime ?? r.TimeOut ?? '09:00',
          dayOfWeek: r.days?.[0] ?? r.DayOfWeek ?? 'Mon',
          gracePeriod: r.gracePeriod ?? r.GracePeriod ?? 15,
        }));
        setTeacherSchedules(mapped);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminService.getAllSubjects();
      const mapped: SubjectVM[] = (data || []).map((r: any) => ({
        id: r.id ?? r.SubjectID,
        name: r.name ?? r.SubjectName ?? 'Subject',
        description: r.description ?? r.Description ?? null,
      }));
      setSubjects(mapped);
    } catch (e: any) {
      setError(e?.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminService.getAllTeachers();
      const mapped: TeacherVM[] = (data || []).map((r: any) => ({
        id: r.id ?? r.TeacherID,
        name: r.name ?? r.FullName ?? 'Teacher',
        contactInfo: r.contactInfo ?? r.ContactInfo ?? null,
        hireDate: r.hireDate ?? r.HireDate ?? null,
        status: r.status ?? r.Status ?? 'Active',
        username: r.username ?? r.Username ?? null,
        userId: r.userId ?? r.UserID ?? null,
      }));
      setTeachers(mapped);
    } catch (e: any) {
      setError(e?.message || 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (viewMode === 'schedules') {
      load(); 
    } else if (viewMode === 'subjects') {
      loadSubjects();
    } else if (viewMode === 'teachers') {
      loadTeachers();
    } else if (viewMode === 'sections') {
      loadSections();
    } else if (viewMode === 'calendar') {
      load();
      // Ensure sections are available for calendar filter
      loadSections();
    } else if (viewMode === 'student-assignments') {
      loadStudentAssignments();
    }
  }, [viewMode]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (viewMode === 'schedules') {
      return rows.filter(r =>
        r.subject.toLowerCase().includes(q) ||
        r.teacher.toLowerCase().includes(q) ||
        (r.gradeLevel || '').toLowerCase().includes(q) ||
        (r.sectionName || '').toLowerCase().includes(q)
      );
    } else if (viewMode === 'calendar') {
      return teacherSchedules
        .filter(s =>
          s.gradeLevel.toLowerCase().includes(q) ||
          s.section.toLowerCase().includes(q) ||
          s.subjectName.toLowerCase().includes(q) ||
          s.teacherName.toLowerCase().includes(q)
        )
        .filter(s => {
          if (calendarSectionId === '') return true;
          // Prefer matching by SectionID; fallback to name equality
          return (s.sectionId != null && s.sectionId === calendarSectionId) || (
            s.sectionName != null && sections.find(sec => sec.id === calendarSectionId)?.sectionName === s.sectionName
          );
        });
    } else if (viewMode === 'sections') {
      return sections.filter(s =>
        s.sectionName.toLowerCase().includes(q) ||
        s.gradeLevel.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q)
      );
    } else if (viewMode === 'subjects') {
      return subjects.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q)
      );
    } else if (viewMode === 'student-assignments') {
      return studentAssignments.filter(a =>
        a.studentName.toLowerCase().includes(q) ||
        a.subjectName.toLowerCase().includes(q) ||
        a.teacherName.toLowerCase().includes(q) ||
        a.gradeLevel.toLowerCase().includes(q) ||
        a.section.toLowerCase().includes(q)
      );
    } else {
      return teachers.filter(t =>
        t.name.toLowerCase().includes(q) ||
        (t.contactInfo || '').toLowerCase().includes(q) ||
        (t.username || '').toLowerCase().includes(q)
      );
    }
  }, [rows, teacherSchedules, sections, subjects, teachers, studentAssignments, search, viewMode, calendarSectionId]);

  const openEdit = (row: ScheduleVM) => {
    console.log('Opening edit for row:', row);
    
    // Validate that the schedule still exists in the current data
    const currentSchedule = rows.find(r => r.id === row.id);
    if (!currentSchedule) {
      toast.error('Schedule not found. It may have been deleted. Refreshing...');
      load(); // Refresh the schedule list
      return;
    }
    
    setEditing(row);
    setFormStart(row.startTime);
    setFormEnd(row.endTime);
    setFormDays(row.days);
    setFormSubject(row.subject);
    setFormTeacher(row.teacher);
    setFormSectionId(row.sectionId || null);
    // Convert "3" to "Grade 3" format for the dropdown
    const gradeLevel = row.gradeLevel ? `Grade ${row.gradeLevel}` : '';
    console.log('Setting grade level to:', gradeLevel);
    setFormScheduleGradeLevel(gradeLevel);
    setEditOpen(true);
  };

  const openCreate = () => {
    setFormSubject('');
    setFormTeacher('');
    setFormSectionId(null);
    setFormScheduleGradeLevel('');
    setFormStart('08:00');
    setFormEnd('09:00');
    setFormDays(['Mon', 'Wed', 'Fri']);
    setCreateOpen(true);
  };

  // debounced suggestions
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        if (createOpen || editOpen) {
          const subQ = formSubject.trim();
          const teaQ = formTeacher.trim();
          const [subs, teacs, secs] = await Promise.all([
            subQ ? AdminService.searchSubjects(subQ) : Promise.resolve([]),
            teaQ ? AdminService.searchTeachers(teaQ) : Promise.resolve([]),
            formScheduleGradeLevel ? AdminService.listSections(formScheduleGradeLevel.replace('Grade ', '')) : Promise.resolve([]),
          ]);
          setSubjectSug(subs || []);
          setTeacherSug(teacs || []);
          setSectionSug(secs || []);
        }
      } catch {}
    }, 200);
    return () => clearTimeout(t);
  }, [createOpen, editOpen, formSubject, formTeacher, formScheduleGradeLevel]);

  // Load sections when grade level changes
  useEffect(() => {
    const loadSectionsForGrade = async () => {
      if (formScheduleGradeLevel && (createOpen || editOpen)) {
        try {
          // Convert "Grade 1" to "1" format for API
          const gradeLevelForApi = formScheduleGradeLevel.replace('Grade ', '');
          const sections = await AdminService.listSections(gradeLevelForApi);
          setSectionSug(sections || []);
          console.log('Loaded sections for grade', gradeLevelForApi, ':', sections);
        } catch (error) {
          console.error('Failed to load sections:', error);
          setSectionSug([]);
        }
      } else {
        setSectionSug([]);
      }
    };

    loadSectionsForGrade();
  }, [formScheduleGradeLevel, createOpen, editOpen]);

  const submitCreate = async () => {
    try {
      if (!formSubject.trim() || !formTeacher.trim()) return;
      const days = formDays;
      await AdminService.createSchedule({
        subject: formSubject.trim(),
        teacher: formTeacher.trim(),
        sectionId: formSectionId,
        gradeLevel: formScheduleGradeLevel.trim() || null,
        startTime: formStart,
        endTime: formEnd,
        days,
      });
      toast.success('Schedule created');
      setCreateOpen(false);
      load();
    } catch (e: any) {
      // Handle schedule conflicts with detailed error messages
      if (e.status === 409 && e.errors && e.errors.length > 0) {
        // Show conflict modal with detailed information
        setConflictDetails(e.conflicts || []);
        setConflictErrors(e.errors || []);
        setConflictModalOpen(true);
      } else {
        toast.error(e?.message || 'Failed to create schedule');
      }
    }
  };

  const confirmDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await AdminService.deleteSchedule(id);
      toast.success('Schedule deleted');
      setDeletingId(null);
      load();
    } catch (e: any) {
      setDeletingId(null);
      toast.error(e?.message || 'Failed to delete schedule');
    }
  };

  const submitEdit = async () => {
    if (!editing) return;
    try {
      const days = formDays;

      await AdminService.updateSchedule(editing.id, {
        subject: formSubject.trim(),
        teacher: formTeacher.trim(),
        sectionId: formSectionId,
        gradeLevel: formScheduleGradeLevel.trim() || null,
        startTime: formStart,
        endTime: formEnd,
        days,
      });
      toast.success('Schedule updated');
      setEditOpen(false);
      setEditing(null);
      load();
    } catch (e: any) {
      // Handle schedule conflicts with detailed error messages
      if (e.status === 409 && e.errors && e.errors.length > 0) {
        // Show conflict modal with detailed information
        setConflictDetails(e.conflicts || []);
        setConflictErrors(e.errors || []);
        setConflictModalOpen(true);
      } else if (e.status === 404) {
        // Handle schedule not found - refresh data and close modal
        toast.error('Schedule not found. It may have been deleted. Refreshing...');
        setEditOpen(false);
        setEditing(null);
        load(); // Refresh the schedule list
      } else {
        toast.error(e?.message || 'Failed to update schedule');
      }
      // keep modal open for other errors
    }
  };

  // Subject management functions
  const openSubjectEdit = (subject: SubjectVM) => {
    setEditingSubject(subject);
    setFormSubjectName(subject.name);
    setFormSubjectDescription(subject.description || '');
    setSubjectEditOpen(true);
  };

  const openSubjectCreate = () => {
    setFormSubjectName('');
    setFormSubjectDescription('');
    setSubjectCreateOpen(true);
  };

  const submitSubjectCreate = async () => {
    try {
      if (!formSubjectName.trim()) return;
      await AdminService.createSubject({
        name: formSubjectName.trim(),
        description: formSubjectDescription.trim() || undefined,
      });
      toast.success('Subject created');
      setSubjectCreateOpen(false);
      loadSubjects();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create subject');
    }
  };

  const submitSubjectEdit = async () => {
    if (!editingSubject) return;
    try {
      await AdminService.updateSubject(editingSubject.id, {
        name: formSubjectName.trim(),
        description: formSubjectDescription.trim() || undefined,
      });
      toast.success('Subject updated');
      setSubjectEditOpen(false);
      setEditingSubject(null);
      loadSubjects();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update subject');
    }
  };

  const confirmSubjectDelete = async (id: number) => {
    try {
      await AdminService.deleteSubject(id);
      toast.success('Subject deleted');
      loadSubjects();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete subject');
    }
  };

  // Teacher management functions
  const openTeacherEdit = (teacher: TeacherVM) => {
    setEditingTeacher(teacher);
    setFormTeacherName(teacher.name);
    setFormTeacherContact(teacher.contactInfo || '');
    setFormTeacherHireDate(teacher.hireDate || '');
    setFormTeacherStatus(teacher.status);
    setTeacherEditOpen(true);
  };

  const submitTeacherEdit = async () => {
    if (!editingTeacher) return;
    try {
      await AdminService.updateTeacher(editingTeacher.id, {
        fullName: formTeacherName.trim(),
        contactInfo: formTeacherContact.trim() || undefined,
        hireDate: formTeacherHireDate || undefined,
        status: formTeacherStatus,
      });
      toast.success('Teacher updated');
      setTeacherEditOpen(false);
      setEditingTeacher(null);
      loadTeachers();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update teacher');
    }
  };

  // Teacher Schedule functions (kept for potential future use)
  const openTeacherScheduleCreate = () => {
    setFormGradeLevel('');
    setFormSectionName('');
    setFormSubjectId('');
    setFormTimeIn('');
    setFormTimeOut('');
    setFormDayOfWeek('');
    setFormGracePeriod(15);
  };

  const openTeacherScheduleEdit = (schedule: TeacherScheduleVM) => {
    setEditingTeacherSchedule(schedule);
    setFormGradeLevel(schedule.gradeLevel);
    setFormSectionName(schedule.section);
    setFormSubjectId(schedule.subjectId.toString());
    setFormTimeIn(schedule.timeIn);
    setFormTimeOut(schedule.timeOut);
    setFormDayOfWeek(schedule.dayOfWeek);
    setFormGracePeriod(schedule.gracePeriod);
  };

  const submitTeacherScheduleCreate = async () => {
    try {
      if (!formGradeLevel.trim() || !formSectionName.trim() || !formSubjectId || !formTimeIn || !formTimeOut || !formDayOfWeek) return;
      
      // This would use the existing schedule creation API
      toast.success('Teacher schedule created');
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create teacher schedule');
    }
  };

  const submitTeacherScheduleEdit = async () => {
    if (!editingTeacherSchedule) return;
    try {
      // This would use the existing schedule update API
      toast.success('Teacher schedule updated');
      setEditingTeacherSchedule(null);
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update teacher schedule');
    }
  };

  const confirmTeacherScheduleDelete = async (id: number) => {
    try {
      await AdminService.deleteSchedule(id);
      toast.success('Teacher schedule deleted');
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete teacher schedule');
    }
  };

  // Section functions
  const loadSections = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminService.listSections();
      const mapped: SectionVM[] = (data || []).map((r: any) => ({
        id: r.id ?? r.SectionID,
        sectionName: r.sectionName ?? r.SectionName ?? '',
        gradeLevel: r.gradeLevel ?? r.GradeLevel ?? '',
        description: r.description ?? r.Description ?? null,
        capacity: r.capacity ?? r.Capacity ?? undefined,
        isActive: r.isActive ?? r.IsActive ?? true,
        createdAt: r.createdAt ?? r.CreatedAt ?? '',
        updatedAt: r.updatedAt ?? r.UpdatedAt ?? '',
      }));
      setSections(mapped);
    } catch (e: any) {
      setError(e?.message || 'Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  // Student assignment functions
  const loadStudentAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminService.getStudentSchedules();
      const mapped: StudentAssignmentVM[] = (data || []).map((r: any) => ({
        id: r.id ?? r.StudentScheduleID,
        studentId: r.studentId ?? r.StudentID,
        studentName: r.studentName ?? r.StudentName ?? '',
        gradeLevel: r.gradeLevel ?? r.GradeLevel ?? '',
        section: r.section ?? r.Section ?? '',
        subjectId: r.subjectId ?? r.SubjectID,
        subjectName: r.subjectName ?? r.SubjectName ?? '',
        teacherId: r.teacherId ?? r.TeacherID,
        teacherName: r.teacherName ?? r.TeacherName ?? '',
        scheduleId: r.scheduleId ?? r.ScheduleID,
        days: r.days ? (Array.isArray(r.days) ? r.days : [r.days]) : [],
        startTime: r.startTime ?? r.StartTime ?? '',
        endTime: r.endTime ?? r.EndTime ?? '',
      }));
      setStudentAssignments(mapped);
    } catch (e: any) {
      setError(e?.message || 'Failed to load student assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    try {
      await AdminService.removeScheduleAssignment(assignmentId);
      toast.success('Schedule assignment removed successfully');
      loadStudentAssignments(); // Reload the assignments
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove schedule assignment');
    }
  };

  const submitAssignment = async () => {
    if (!formStudentId || selectedScheduleIds.length === 0) {
      toast.error('Please select a student and at least one schedule');
      return;
    }

    try {
      // Assign multiple schedules
      const assignments = selectedScheduleIds.map(scheduleId => ({
        studentId: formStudentId,
        scheduleId: scheduleId
      }));

      await AdminService.assignMultipleSchedules(assignments);
      toast.success(`${selectedScheduleIds.length} schedule(s) assigned successfully`);
      setAssignmentCreateOpen(false);
      setSelectedScheduleIds([]);
      loadStudentAssignments(); // Reload the assignments
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign schedules');
    }
  };

  const openAssignmentCreate = async () => {
    setFormStudentId(null);
    setSelectedScheduleIds([]);
    setSelectedStudent(null);
    setStudentSearchValue('');
    setAssignmentCreateOpen(true);
    
    // Load students and schedules
    try {
      const [studentsData, schedulesData] = await Promise.all([
        AdminService.listStudents(),
        AdminService.listSchedules()
      ]);
      
      const mappedStudents = (studentsData || []).map((s: any) => ({
        id: s.id || s.StudentID,
        name: s.fullName || s.FullName || '',
        gradeLevel: s.gradeLevel || s.GradeLevel || '',
        section: s.section || s.Section || s.sectionName || s.SectionName || ''
      }));
      
      setStudents(mappedStudents);
      setAvailableSchedules(schedulesData || []);
    } catch (error) {
      console.error('Failed to load students and schedules:', error);
      toast.error('Failed to load data for assignment creation');
    }
  };

  // Filter schedules based on selected student
  const filteredSchedules = useMemo(() => {
    if (!selectedStudent) return availableSchedules;
    
    return availableSchedules.filter(schedule => {
      // Filter by grade level if available
      if (selectedStudent.gradeLevel && schedule.gradeLevel) {
        return schedule.gradeLevel === selectedStudent.gradeLevel;
      }
      
      // Filter by section if available
      if (selectedStudent.section && schedule.sectionName) {
        return schedule.sectionName === selectedStudent.section;
      }
      
      // If no specific filters match, show all schedules
      return true;
    });
  }, [availableSchedules, selectedStudent]);

  const handleStudentSelect = (student: {id: number, name: string, gradeLevel: string | null, section: string | null}) => {
    const mappedStudent = {
      id: student.id,
      name: student.name,
      gradeLevel: student.gradeLevel || '',
      section: student.section || ''
    };
    setSelectedStudent(mappedStudent);
    setFormStudentId(student.id);
  };

  const openSectionCreate = () => {
    setFormSectionNameNew('');
    setFormSectionGradeLevel('');
    setFormSectionDescription('');
    setFormSectionCapacity(undefined);
    setFormSectionIsActive(true);
    setSectionCreateOpen(true);
  };

  const openSectionEdit = (section: SectionVM) => {
    setEditingSection(section);
    setFormSectionNameNew(section.sectionName);
    setFormSectionGradeLevel(section.gradeLevel);
    setFormSectionDescription(section.description || '');
    setFormSectionCapacity(section.capacity);
    setFormSectionIsActive(section.isActive);
    setSectionEditOpen(true);
  };

  const submitSectionCreate = async () => {
    try {
      if (!formSectionNameNew.trim() || !formSectionGradeLevel.trim()) return;
      
      await AdminService.createSection({
        sectionName: formSectionNameNew.trim(),
        gradeLevel: formSectionGradeLevel.trim(),
        description: formSectionDescription.trim() || undefined,
        capacity: formSectionCapacity,
        isActive: formSectionIsActive,
      });
      
      toast.success('Section created');
      setSectionCreateOpen(false);
      loadSections();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create section');
    }
  };

  const submitSectionEdit = async () => {
    if (!editingSection) return;
    try {
      await AdminService.updateSection(editingSection.id, {
        sectionName: formSectionNameNew.trim(),
        gradeLevel: formSectionGradeLevel.trim(),
        description: formSectionDescription.trim() || undefined,
        capacity: formSectionCapacity,
        isActive: formSectionIsActive,
      });
      
      toast.success('Section updated');
      setSectionEditOpen(false);
      setEditingSection(null);
      loadSections();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update section');
    }
  };

  const confirmSectionDelete = async (id: number) => {
    try {
      await AdminService.deleteSection(id);
      toast.success('Section deleted');
      loadSections();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete section');
    }
  };

  return (
    <div>
      <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {viewMode === 'schedules' ? 'Schedules' : viewMode === 'subjects' ? 'Subjects' : viewMode === 'teachers' ? 'Teachers' : viewMode === 'sections' ? 'Sections' : viewMode === 'student-assignments' ? 'Student Assignments' : 'Calendar'}
          </h2>
          <p className="text-sm text-gray-600">
            {viewMode === 'schedules' 
              ? 'Subject schedules and assigned teachers. Edit times as needed.'
              : viewMode === 'subjects'
              ? 'Manage subjects and their descriptions. Add, edit, or delete subjects.'
              : viewMode === 'teachers'
              ? 'Manage teacher information. Edit teacher details and contact information.'
              : viewMode === 'sections'
              ? 'Manage school sections and their details. Add, edit, or delete sections.'
              : viewMode === 'student-assignments'
              ? 'Assign schedules to students. Manage student schedule assignments.'
              : 'Weekly calendar view showing all schedules from 6am to 6pm.'
            }
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {viewMode === 'calendar' && (
            <div className="relative w-full sm:w-64">
              <select
                value={calendarSectionId}
                onChange={(e) => setCalendarSectionId(e.target.value ? Number(e.target.value) : '')}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Sections</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.gradeLevel ? `Grade ${s.gradeLevel} - ` : ''}{s.sectionName}</option>
                ))}
              </select>
            </div>
          )}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={viewMode === 'schedules' 
                ? "Search subject, teacher, grade level, or section"
                : viewMode === 'subjects'
                ? "Search subject name or description"
                : viewMode === 'teachers'
                ? "Search teacher name, contact, or username"
                : viewMode === 'sections'
                ? "Search section name, grade level, or description"
                : viewMode === 'student-assignments'
                ? "Search student, subject, teacher, grade level, or section"
                : "Search grade level, section, subject, or teacher"
              }
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button 
            onClick={load}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
            title="Refresh data"
          >
            <Calendar className="h-4 w-4" />
            Refresh
          </button>
          {viewMode !== 'teachers' && viewMode !== 'calendar' && (
            <button 
              onClick={viewMode === 'schedules' ? openCreate : viewMode === 'subjects' ? openSubjectCreate : viewMode === 'sections' ? openSectionCreate : viewMode === 'student-assignments' ? openAssignmentCreate : openTeacherScheduleCreate} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {viewMode === 'schedules' ? 'New Schedule' : viewMode === 'subjects' ? 'New Subject' : viewMode === 'sections' ? 'New Section' : viewMode === 'student-assignments' ? 'New Assignment' : 'New Teacher Schedule'}
            </button>
          )}
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="mt-6 flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <button
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              viewMode === 'schedules'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
            }`}
            onClick={() => setViewMode('schedules')}
          >
            <CalendarClock className="h-4 w-4 inline mr-1" />
            Schedules
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              viewMode === 'subjects'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
            }`}
            onClick={() => setViewMode('subjects')}
          >
            <BookOpen className="h-4 w-4 inline mr-1" />
            Subjects
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              viewMode === 'teachers'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
            }`}
            onClick={() => setViewMode('teachers')}
          >
            <Users className="h-4 w-4 inline mr-1" />
            Teachers
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              viewMode === 'sections'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
            }`}
            onClick={() => setViewMode('sections')}
          >
            <Users className="h-4 w-4 inline mr-1" />
            Sections
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              viewMode === 'calendar'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
            }`}
            onClick={() => setViewMode('calendar')}
          >
            <Calendar className="h-4 w-4 inline mr-1" />
            Calendar
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              viewMode === 'student-assignments'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
            }`}
            onClick={() => setViewMode('student-assignments')}
          >
            <Users className="h-4 w-4 inline mr-1" />
            Student Assignments
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          {viewMode === 'schedules' ? (
            <>
              <CalendarClock className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">All Schedules ({filtered.length})</h3>
            </>
          ) : viewMode === 'subjects' ? (
            <>
              <BookOpen className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">All Subjects ({filtered.length})</h3>
            </>
          ) : viewMode === 'calendar' ? (
            <>
              <Calendar className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Weekly Calendar View</h3>
            </>
          ) : viewMode === 'student-assignments' ? (
            <>
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Student Schedule Assignments</h3>
            </>
          ) : (
            <>
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">All Teachers ({filtered.length})</h3>
            </>
          )}
        </div>

        {error && <div className="p-4 text-red-600">{error}</div>}
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : viewMode === 'calendar' ? (
          <CalendarView schedules={filtered as TeacherScheduleVM[]} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                {viewMode === 'schedules' ? (
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                ) : viewMode === 'subjects' ? (
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                ) : viewMode === 'sections' ? (
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                ) : viewMode === 'student-assignments' ? (
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hire Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                )}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {viewMode === 'schedules' ? (
                  (filtered as ScheduleVM[]).map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.teacher}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.gradeLevel || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {r.sectionName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.days.join(', ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.startTime} - {r.endTime}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openEdit(r)} className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1">
                            <Edit className="h-4 w-4" />
                            Edit
                          </button>
                          <button disabled={deletingId === r.id} onClick={() => confirmDelete(r.id)} className="text-red-600 hover:text-red-900 inline-flex items-center gap-1 disabled:opacity-50">
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : viewMode === 'subjects' ? (
                  (filtered as SubjectVM[]).map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{s.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{s.description || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openSubjectEdit(s)} className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1">
                            <Edit className="h-4 w-4" />
                            Edit
                          </button>
                          <button onClick={() => confirmSubjectDelete(s.id)} className="text-red-600 hover:text-red-900 inline-flex items-center gap-1">
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : viewMode === 'sections' ? (
                  (filtered as SectionVM[]).map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{s.sectionName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{s.gradeLevel}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{s.description || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.capacity || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          s.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {s.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openSectionEdit(s)} className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1">
                            <Edit className="h-4 w-4" />
                            Edit
                          </button>
                          <button onClick={() => confirmSectionDelete(s.id)} className="text-red-600 hover:text-red-900 inline-flex items-center gap-1">
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : viewMode === 'student-assignments' ? (
                  (filtered as StudentAssignmentVM[]).map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{a.studentName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.subjectName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.teacherName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.gradeLevel}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.section}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.days.join(', ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.startTime} - {a.endTime}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => {
                              if (confirm('Are you sure you want to remove this schedule assignment?')) {
                                handleRemoveAssignment(a.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  (filtered as TeacherVM[]).map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{t.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{t.contactInfo || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {t.hireDate ? new Date(t.hireDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          t.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openTeacherEdit(t)} className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1">
                            <Edit className="h-4 w-4" />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={editOpen}
        title="Edit Schedule"
        onClose={() => setEditOpen(false)}
        footer={(
          <>
            <button onClick={() => setEditOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 inline-flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button onClick={submitEdit} className="px-4 py-2 rounded-lg bg-blue-600 text-white inline-flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <div className="relative">
                <input 
                  ref={subjectRef} 
                  value={formSubject} 
                  onChange={(e) => { setFormSubject(e.target.value); setShowSubjectSug(true); }} 
                  onFocus={() => setShowSubjectSug(!!formSubject.trim())} 
                  onBlur={() => setTimeout(() => setShowSubjectSug(false), 150)} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
                {subjectSug.length > 0 && showSubjectSug && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-sm max-h-48 overflow-auto">
                    {subjectSug.map((s, i) => (
                      <div key={s + i} className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${hoverIdx.field==='subject'&&hoverIdx.idx===i?'bg-gray-50':''}`} onMouseEnter={() => setHoverIdx({ field: 'subject', idx: i })} onClick={() => { setFormSubject(s); setSubjectSug([]); setShowSubjectSug(false); subjectRef.current?.focus(); }}>{s}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
              <div className="relative">
                <input 
                  ref={teacherRef} 
                  value={formTeacher} 
                  onChange={(e) => { setFormTeacher(e.target.value); setShowTeacherSug(true); }} 
                  onFocus={() => setShowTeacherSug(!!formTeacher.trim())} 
                  onBlur={() => setTimeout(() => setShowTeacherSug(false), 150)} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
                {teacherSug.length > 0 && showTeacherSug && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-sm max-h-48 overflow-auto">
                    {teacherSug.map((t, i) => (
                      <div key={t.id} className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${hoverIdx.field==='teacher'&&hoverIdx.idx===i?'bg-gray-50':''}`} onMouseEnter={() => setHoverIdx({ field: 'teacher', idx: i })} onClick={() => { setFormTeacher(t.name); setTeacherSug([]); setShowTeacherSug(false); teacherRef.current?.focus(); }}>
                        <div className="flex items-center justify-between"><span>{t.id}</span><span className="text-gray-700">{t.name}</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
            <select 
              value={formScheduleGradeLevel} 
              onChange={(e) => { setFormScheduleGradeLevel(e.target.value); setFormSectionId(null); setSectionSug([]); }} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Grade Level</option>
              <option value="Grade 1">Grade 1</option>
              <option value="Grade 2">Grade 2</option>
              <option value="Grade 3">Grade 3</option>
              <option value="Grade 4">Grade 4</option>
              <option value="Grade 5">Grade 5</option>
              <option value="Grade 6">Grade 6</option>
              <option value="Grade 7">Grade 7</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select 
              value={formSectionId || ''} 
              onChange={(e) => { setFormSectionId(e.target.value ? Number(e.target.value) : null); }} 
              disabled={!formScheduleGradeLevel.trim()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Section</option>
              {sectionSug.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sectionName} {s.description ? `- ${s.description}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="time" value={formStart} onChange={(e) => setFormStart(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input type="time" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Days</label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <label key={day} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formDays.includes(day)}
                    onChange={() => toggleDay(day)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{day}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={createOpen}
        title="Create Schedule"
        onClose={() => setCreateOpen(false)}
        footer={(
          <>
            <button onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 inline-flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button onClick={submitCreate} className="px-4 py-2 rounded-lg bg-blue-600 text-white inline-flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <div className="relative">
                <input ref={subjectRef} value={formSubject} onChange={(e) => { setFormSubject(e.target.value); setShowSubjectSug(true); }} onFocus={() => setShowSubjectSug(!!formSubject.trim())} onBlur={() => setTimeout(() => setShowSubjectSug(false), 150)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                {subjectSug.length > 0 && showSubjectSug && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-sm max-h-48 overflow-auto">
                    {subjectSug.map((s, i) => (
                      <div key={s + i} className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${hoverIdx.field==='subject'&&hoverIdx.idx===i?'bg-gray-50':''}`} onMouseEnter={() => setHoverIdx({ field: 'subject', idx: i })} onClick={() => { setFormSubject(s); setSubjectSug([]); setShowSubjectSug(false); subjectRef.current?.focus(); }}>{s}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
              <div className="relative">
                <input ref={teacherRef} value={formTeacher} onChange={(e) => { setFormTeacher(e.target.value); setShowTeacherSug(true); }} onFocus={() => setShowTeacherSug(!!formTeacher.trim())} onBlur={() => setTimeout(() => setShowTeacherSug(false), 150)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                {teacherSug.length > 0 && showTeacherSug && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-sm max-h-48 overflow-auto">
                    {teacherSug.map((t, i) => (
                      <div key={t.id} className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${hoverIdx.field==='teacher'&&hoverIdx.idx===i?'bg-gray-50':''}`} onMouseEnter={() => setHoverIdx({ field: 'teacher', idx: i })} onClick={() => { setFormTeacher(t.name); setTeacherSug([]); setShowTeacherSug(false); teacherRef.current?.focus(); }}>
                        <div className="flex items-center justify-between"><span>{t.id}</span><span className="text-gray-700">{t.name}</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
              <select 
                value={formScheduleGradeLevel} 
                onChange={(e) => { setFormScheduleGradeLevel(e.target.value); setFormSectionId(null); setSectionSug([]); }} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Grade Level</option>
                <option value="Grade 1">Grade 1</option>
                <option value="Grade 2">Grade 2</option>
                <option value="Grade 3">Grade 3</option>
                <option value="Grade 4">Grade 4</option>
                <option value="Grade 5">Grade 5</option>
                <option value="Grade 6">Grade 6</option>
                <option value="Grade 7">Grade 7</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <select 
                value={formSectionId || ''} 
                onChange={(e) => { setFormSectionId(e.target.value ? Number(e.target.value) : null); }} 
                disabled={!formScheduleGradeLevel.trim()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select Section</option>
                {sectionSug.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.sectionName} {s.description ? `- ${s.description}` : ''}
                  </option>
                ))}
              </select>
            </div>
            
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="time" value={formStart} onChange={(e) => setFormStart(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input type="time" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Days</label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <label key={day} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formDays.includes(day)}
                    onChange={() => toggleDay(day)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{day}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Subject Create Modal */}
      <Modal
        open={subjectCreateOpen}
        title="Create Subject"
        onClose={() => setSubjectCreateOpen(false)}
        footer={(
          <>
            <button onClick={() => setSubjectCreateOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 inline-flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button onClick={submitSubjectCreate} className="px-4 py-2 rounded-lg bg-blue-600 text-white inline-flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
            <input 
              value={formSubjectName} 
              onChange={(e) => setFormSubjectName(e.target.value)} 
              placeholder="e.g. Mathematics, Science, English"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea 
              value={formSubjectDescription} 
              onChange={(e) => setFormSubjectDescription(e.target.value)} 
              placeholder="Brief description of the subject"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
        </div>
      </Modal>

      {/* Subject Edit Modal */}
      <Modal
        open={subjectEditOpen}
        title="Edit Subject"
        onClose={() => setSubjectEditOpen(false)}
        footer={(
          <>
            <button onClick={() => setSubjectEditOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 inline-flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button onClick={submitSubjectEdit} className="px-4 py-2 rounded-lg bg-blue-600 text-white inline-flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
            <input 
              value={formSubjectName} 
              onChange={(e) => setFormSubjectName(e.target.value)} 
              placeholder="e.g. Mathematics, Science, English"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea 
              value={formSubjectDescription} 
              onChange={(e) => setFormSubjectDescription(e.target.value)} 
              placeholder="Brief description of the subject"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
        </div>
      </Modal>

      {/* Teacher Edit Modal */}
      <Modal
        open={teacherEditOpen}
        title="Edit Teacher"
        onClose={() => setTeacherEditOpen(false)}
        footer={(
          <>
            <button onClick={() => setTeacherEditOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 inline-flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button onClick={submitTeacherEdit} className="px-4 py-2 rounded-lg bg-blue-600 text-white inline-flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input 
              value={formTeacherName} 
              onChange={(e) => setFormTeacherName(e.target.value)} 
              placeholder="e.g. John Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info</label>
            <input 
              value={formTeacherContact} 
              onChange={(e) => setFormTeacherContact(e.target.value)} 
              placeholder="e.g. john.doe@school.edu, +1234567890"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
              <input 
                type="date"
                value={formTeacherHireDate} 
                onChange={(e) => setFormTeacherHireDate(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                value={formTeacherStatus} 
                onChange={(e) => setFormTeacherStatus(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          {editingTeacher && editingTeacher.username && (
            <div className="text-xs text-gray-500">
              Username: <span className="font-medium text-gray-900">{editingTeacher.username}</span>
            </div>
          )}
        </div>
      </Modal>

      {/* Section Create Modal */}
      <Modal
        open={sectionCreateOpen}
        title="Create Section"
        onClose={() => setSectionCreateOpen(false)}
        footer={(
          <>
            <button onClick={() => setSectionCreateOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 inline-flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button onClick={submitSectionCreate} className="px-4 py-2 rounded-lg bg-blue-600 text-white inline-flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Name</label>
              <input 
                value={formSectionNameNew} 
                onChange={(e) => setFormSectionNameNew(e.target.value)} 
                placeholder="e.g. A, B, C"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
              <select 
                value={formSectionGradeLevel} 
                onChange={(e) => setFormSectionGradeLevel(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Grade Level</option>
                <option value="1">Grade 1</option>
                <option value="2">Grade 2</option>
                <option value="3">Grade 3</option>
                <option value="4">Grade 4</option>
                <option value="5">Grade 5</option>
                <option value="6">Grade 6</option>
                <option value="7">Grade 7</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <input 
              value={formSectionDescription} 
              onChange={(e) => setFormSectionDescription(e.target.value)} 
              placeholder="e.g. Grade 3 Section A"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Optional)</label>
              <input 
                type="number"
                value={formSectionCapacity || ''} 
                onChange={(e) => setFormSectionCapacity(e.target.value ? Number(e.target.value) : undefined)} 
                placeholder="e.g. 30"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                value={formSectionIsActive ? 'Active' : 'Inactive'} 
                onChange={(e) => setFormSectionIsActive(e.target.value === 'Active')} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Section Edit Modal */}
      <Modal
        open={sectionEditOpen}
        title="Edit Section"
        onClose={() => setSectionEditOpen(false)}
        footer={(
          <>
            <button onClick={() => setSectionEditOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 inline-flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button onClick={submitSectionEdit} className="px-4 py-2 rounded-lg bg-blue-600 text-white inline-flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Name</label>
              <input 
                value={formSectionNameNew} 
                onChange={(e) => setFormSectionNameNew(e.target.value)} 
                placeholder="e.g. A, B, C"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
              <select 
                value={formSectionGradeLevel} 
                onChange={(e) => setFormSectionGradeLevel(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Grade Level</option>
                <option value="1">Grade 1</option>
                <option value="2">Grade 2</option>
                <option value="3">Grade 3</option>
                <option value="4">Grade 4</option>
                <option value="5">Grade 5</option>
                <option value="6">Grade 6</option>
                <option value="7">Grade 7</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <input 
              value={formSectionDescription} 
              onChange={(e) => setFormSectionDescription(e.target.value)} 
              placeholder="e.g. Grade 3 Section A"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Optional)</label>
              <input 
                type="number"
                value={formSectionCapacity || ''} 
                onChange={(e) => setFormSectionCapacity(e.target.value ? Number(e.target.value) : undefined)} 
                placeholder="e.g. 30"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                value={formSectionIsActive ? 'Active' : 'Inactive'} 
                onChange={(e) => setFormSectionIsActive(e.target.value === 'Active')} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Student Assignment Creation Modal */}
      <Modal
        open={assignmentCreateOpen}
        title="Assign Schedule to Student"
        onClose={() => setAssignmentCreateOpen(false)}
        footer={(
          <>
            <button onClick={() => setAssignmentCreateOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 inline-flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button onClick={submitAssignment} className="px-4 py-2 rounded-lg bg-blue-600 text-white inline-flex items-center gap-2">
              <Save className="h-4 w-4" />
              Assign
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <StudentSearchInput
              value={studentSearchValue}
              onChange={setStudentSearchValue}
              onSelect={handleStudentSelect}
              placeholder="Search by student name or ID..."
              className="w-full"
            />
            
            {/* Show selected student details */}
            {selectedStudent && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{selectedStudent.name}</span>
                </div>
                <div className="mt-1 text-xs text-blue-600">
                  Grade: {selectedStudent.gradeLevel || 'Not specified'} | 
                  Section: {selectedStudent.section || 'Not specified'}
                </div>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedules {selectedStudent ? `(Filtered for Grade ${selectedStudent.gradeLevel})` : ''}
            </label>
            <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
              {selectedStudent ? (
                filteredSchedules.length > 0 ? (
                  filteredSchedules.map(schedule => (
                    <label key={schedule.id} className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                      <input
                        type="checkbox"
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={selectedScheduleIds.includes(schedule.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedScheduleIds(prev => [...prev, schedule.id]);
                          } else {
                            setSelectedScheduleIds(prev => prev.filter(id => id !== schedule.id));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {schedule.subject} - {schedule.teacher}
                        </div>
                        <div className="text-gray-600">
                          {schedule.days.join(', ')} {schedule.startTime}-{schedule.endTime}
                          {schedule.gradeLevel && ` (Grade ${schedule.gradeLevel})`}
                          {schedule.sectionName && ` (${schedule.sectionName})`}
                        </div>
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="px-3 py-4 text-sm text-amber-600 bg-amber-50">
                    No schedules available for Grade {selectedStudent.gradeLevel}. 
                    You may need to create schedules for this grade level first.
                  </div>
                )
              ) : (
                <div className="px-3 py-4 text-sm text-gray-500">
                  Please select a student first to see available schedules.
                </div>
              )}
            </div>
            
            {selectedScheduleIds.length > 0 && (
              <div className="mt-2 text-sm text-blue-600">
                {selectedScheduleIds.length} schedule(s) selected
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Schedule Conflict Modal */}
      <ScheduleConflictModal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        conflicts={conflictDetails || []}
        errors={conflictErrors || []}
      />
    </div>
  );
}


