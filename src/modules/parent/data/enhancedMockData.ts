// Enhanced mock data for testing the Parent Portal UI with multiple students

export interface Parent {
  parentId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  relationship: string;
}

export interface Student {
  studentId: number;
  fullName: string;
  gradeLevel: string;
  section: string;
  parentId: number;
  enrollmentStatus?: 'pending' | 'rejected' | 'approved';
}

export interface AttendanceRecord {
  attendanceId: number;
  studentId: number;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  status: 'Present' | 'Late' | 'Excused';
}

export interface AttendanceStats {
  todayStatus: string;
  weeklyPercentage: number;
}

export const mockParent: Parent = {
  parentId: 1,
  fullName: "Sarah Johnson",
  email: "sarah.johnson@email.com",
  phoneNumber: "+1 (555) 123-4567",
  address: "123 Oak Street, Springfield, IL 62701",
  relationship: "Mother"
};

export const mockStudents: Student[] = [
  {
    studentId: 1,
    fullName: "Emma Johnson",
    gradeLevel: "10",
    section: "A",
    parentId: 1,
    enrollmentStatus: "approved"
  },
  {
    studentId: 2,
    fullName: "Sophia Johnson",
    gradeLevel: "8",
    section: "B",
    parentId: 1,
    enrollmentStatus: "approved"
  },
  {
    studentId: 3,
    fullName: "Olivia Johnson",
    gradeLevel: "12",
    section: "A",
    parentId: 1,
    enrollmentStatus: "approved"
  },
  {
    studentId: 4,
    fullName: "Juan Dela Cruz",
    gradeLevel: "6",
    section: "A",
    parentId: 1,
    enrollmentStatus: "pending"
  }
];

export const mockAttendanceData: Record<number, AttendanceRecord[]> = {
  1: [ // Emma's attendance
    {
      attendanceId: 1,
      studentId: 1,
      date: "2025-08-25",
      timeIn: "07:45:00",
      timeOut: "15:30:00",
      status: "Present"
    },
    {
      attendanceId: 2,
      studentId: 1,
      date: "2025-08-24",
      timeIn: "07:50:00",
      timeOut: "15:30:00",
      status: "Present"
    },
    {
      attendanceId: 3,
      studentId: 1,
      date: "2025-08-23",
      timeIn: "08:15:00",
      timeOut: "15:30:00",
      status: "Late"
    },
    {
      attendanceId: 4,
      studentId: 1,
      date: "2025-08-22",
      timeIn: "07:40:00",
      timeOut: "15:30:00",
      status: "Present"
    },
    {
      attendanceId: 5,
      studentId: 1,
      date: "2025-08-21",
      timeIn: null,
      timeOut: null,
      status: "Late"
    },
    {
      attendanceId: 6,
      studentId: 1,
      date: "2025-08-20",
      timeIn: "07:45:00",
      timeOut: "15:30:00",
      status: "Present"
    },
    {
      attendanceId: 7,
      studentId: 1,
      date: "2025-08-19",
      timeIn: null,
      timeOut: null,
      status: "Excused"
    }
  ],
  2: [ // Sophia's attendance
    {
      attendanceId: 8,
      studentId: 2,
      date: "2025-08-25",
      timeIn: "07:30:00",
      timeOut: "15:00:00",
      status: "Present"
    },
    {
      attendanceId: 9,
      studentId: 2,
      date: "2025-08-24",
      timeIn: "07:35:00",
      timeOut: "15:00:00",
      status: "Present"
    },
    {
      attendanceId: 10,
      studentId: 2,
      date: "2025-08-23",
      timeIn: "07:30:00",
      timeOut: "15:00:00",
      status: "Present"
    },
    {
      attendanceId: 11,
      studentId: 2,
      date: "2025-08-22",
      timeIn: "08:00:00",
      timeOut: "15:00:00",
      status: "Late"
    },
    {
      attendanceId: 12,
      studentId: 2,
      date: "2025-08-21",
      timeIn: "07:30:00",
      timeOut: "15:00:00",
      status: "Present"
    },
    {
      attendanceId: 13,
      studentId: 2,
      date: "2025-08-20",
      timeIn: "07:30:00",
      timeOut: "15:00:00",
      status: "Present"
    }
  ],
  3: [ // Olivia's attendance
    {
      attendanceId: 14,
      studentId: 3,
      date: "2025-08-25",
      timeIn: "07:15:00",
      timeOut: "16:00:00",
      status: "Present"
    },
    {
      attendanceId: 15,
      studentId: 3,
      date: "2025-08-24",
      timeIn: "07:20:00",
      timeOut: "16:00:00",
      status: "Present"
    },
    {
      attendanceId: 16,
      studentId: 3,
      date: "2025-08-23",
      timeIn: "07:15:00",
      timeOut: "16:00:00",
      status: "Present"
    },
    {
      attendanceId: 17,
      studentId: 3,
      date: "2025-08-22",
      timeIn: "07:15:00",
      timeOut: "16:00:00",
      status: "Present"
    },
    {
      attendanceId: 18,
      studentId: 3,
      date: "2025-08-21",
      timeIn: null,
      timeOut: null,
      status: "Excused"
    },
    {
      attendanceId: 19,
      studentId: 3,
      date: "2025-08-20",
      timeIn: "07:15:00",
      timeOut: "16:00:00",
      status: "Present"
    }
  ]
};

// Calculate attendance statistics for a specific student
export const calculateAttendanceStats = (attendanceRecords: AttendanceRecord[]): AttendanceStats => {
  const today = new Date().toISOString().split('T')[0];
  const todayRecord = attendanceRecords.find(record => record.date === today);
  
  // Calculate weekly attendance (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const weeklyRecords = attendanceRecords.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= oneWeekAgo;
  });
  
  const presentDays = weeklyRecords.filter(record => 
    record.status === 'Present' || record.status === 'Late'
  ).length;
  
  const weeklyPercentage = weeklyRecords.length > 0 
    ? Math.round((presentDays / weeklyRecords.length) * 100)
    : 0;

  return {
    todayStatus: todayRecord ? todayRecord.status : 'No Record',
    weeklyPercentage
  };
}; 