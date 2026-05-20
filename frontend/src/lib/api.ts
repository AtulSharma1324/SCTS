const BASE_URL = 'http://localhost:8080';

export interface User {
  id?: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

export interface AuthResponse {
  token: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  message: string;
  error?: string;
}

export interface Teacher {
  id?: number;
  name: string;
  email: string;
  department: string;
  specialization: string;
  phone: string;
}

export interface Student {
  id?: number;
  name: string;
  email: string;
  grade: string;
  section: string;
  department: string;
}

export interface Classroom {
  id?: number;
  name: string;
  capacity: number;
  roomType: string;
  building: string;
  floor: number;
  available: boolean;
}

export interface Timetable {
  id?: number;
  subjectName: string;
  teacherName: string;
  classroomName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  grade: string;
  section: string;
  semester: string;
  originalTeacherName?: string;
  isSubstituted?: boolean;
}

export interface Attendance {
  id?: number;
  studentName: string;
  subjectName: string;
  teacherName: string;
  date: string;
  present: boolean;
}

export interface Notification {
  id?: number;
  targetRole?: string;
  targetUser?: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  isRead?: boolean;
  createdAt?: string;
}

export interface AIRecommendation {
  id?: number;
  recommendationType: string;
  message: string;
  confidence: number;
  createdAt?: string;
}

export interface StudentMark {
  id?: number;
  studentName: string;
  subjectName: string;
  teacherName: string;
  marksObtained: number;
  maxMarks: number;
  examType: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClassrooms: number;
  totalSubjects: number;
  totalDepartments: number;
  totalTimetableEntries: number;
  attendancePercentage: number;
  availableRooms: number;
}

export interface HeatmapCell {
  day: string;
  hour: string;
  count: number;
  level: 'free' | 'low' | 'medium' | 'high';
}

export interface StressAnalytic {
  teacher: string;
  totalClasses: number;
  stressLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
}

export interface ConflictResolutionResponse {
  resolved: number;
  totalIssues: number;
  remainingRoomConflicts: number;
  remainingTeacherConflicts: number;
  details: {
    type: string;
    description: string;
    status: string;
  }[];
}

// Token Helpers
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

export const clearAuth = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Generic request wrapper
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errBody = await response.json();
      errorMsg = errBody.error || errBody.message || response.statusText;
    } catch (_) {
      errorMsg = response.statusText;
    }
    throw new Error(errorMsg);
  }

  // Handle empty or deleted content
  if (response.status === 204) {
    return {} as T;
  }

  try {
    return await response.json();
  } catch (_) {
    return {} as T;
  }
}

export const api = {
  // Authentication
  auth: {
    register: (body: Record<string, string>) => 
      request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    
    login: (body: Record<string, string>) => 
      request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  },

  // Admin Dashboard CRUD & Stats
  admin: {
    getDashboardStats: () => 
      request<DashboardStats>('/api/admin/dashboard'),
    
    // Teachers CRUD
    getTeachers: () => 
      request<Teacher[]>('/api/admin/teachers'),
    addTeacher: (teacher: Teacher) => 
      request<Teacher>('/api/admin/teachers', { method: 'POST', body: JSON.stringify(teacher) }),
    updateTeacher: (id: number, teacher: Teacher) => 
      request<Teacher>(`/api/admin/teachers/${id}`, { method: 'PUT', body: JSON.stringify(teacher) }),
    deleteTeacher: (id: number) => 
      request<void>(`/api/admin/teachers/${id}`, { method: 'DELETE' }),

    // Students CRUD
    getStudents: () => 
      request<Student[]>('/api/admin/students'),
    addStudent: (student: Student) => 
      request<Student>('/api/admin/students', { method: 'POST', body: JSON.stringify(student) }),
    updateStudent: (id: number, student: Student) => 
      request<Student>(`/api/admin/students/${id}`, { method: 'PUT', body: JSON.stringify(student) }),
    deleteStudent: (id: number) => 
      request<void>(`/api/admin/students/${id}`, { method: 'DELETE' }),

    // Classrooms CRUD
    getClassrooms: () => 
      request<Classroom[]>('/api/admin/classrooms'),
    addClassroom: (classroom: Classroom) => 
      request<Classroom>('/api/admin/classrooms', { method: 'POST', body: JSON.stringify(classroom) }),
    updateClassroom: (id: number, classroom: Classroom) => 
      request<Classroom>(`/api/admin/classrooms/${id}`, { method: 'PUT', body: JSON.stringify(classroom) }),
    deleteClassroom: (id: number) => 
      request<void>(`/api/admin/classrooms/${id}`, { method: 'DELETE' }),

    // Timetable
    getTimetable: () => 
      request<Timetable[]>('/api/admin/timetable'),
    addTimetable: (entry: Timetable) => 
      request<Timetable>('/api/admin/timetable', { method: 'POST', body: JSON.stringify(entry) }),
    deleteTimetable: (id: number) => 
      request<void>(`/api/admin/timetable/${id}`, { method: 'DELETE' }),

    // Attendance
    getAttendance: () => 
      request<Attendance[]>('/api/admin/attendance'),
    markAttendance: (att: Attendance) => 
      request<Attendance>('/api/admin/attendance', { method: 'POST', body: JSON.stringify(att) }),

    // Notifications
    getNotifications: () => 
      request<Notification[]>('/api/admin/notifications'),
    addNotification: (notif: Notification) => 
      request<Notification>('/api/admin/notifications', { method: 'POST', body: JSON.stringify(notif) }),
  },

  // Teacher Endpoints
  teacher: {
    getTimetable: (name: string) => 
      request<Timetable[]>(`/api/teacher/timetable?name=${encodeURIComponent(name)}`),
    getAttendance: (name: string) => 
      request<Attendance[]>(`/api/teacher/attendance?name=${encodeURIComponent(name)}`),
    markAttendance: (att: Attendance) => 
      request<Attendance>('/api/teacher/attendance', { method: 'POST', body: JSON.stringify(att) }),
    getNotifications: () => 
      request<Notification[]>('/api/teacher/notifications?role=TEACHER'),
    getRecommendations: () => 
      request<AIRecommendation[]>('/api/teacher/recommendations'),
    getSubjectsTaught: (teacherName: string) =>
      request<string[]>(`/api/teacher/subjects-taught?teacherName=${encodeURIComponent(teacherName)}`),
    getMarks: (teacherName: string) =>
      request<StudentMark[]>(`/api/teacher/marks?teacherName=${encodeURIComponent(teacherName)}`),
    uploadMark: (mark: StudentMark) =>
      request<StudentMark>('/api/teacher/marks', { method: 'POST', body: JSON.stringify(mark) }),
    deleteMark: (id: number) =>
      request<{ success: boolean }>(`/api/teacher/marks/${id}`, { method: 'DELETE' }),
  },

  // Student Endpoints
  student: {
    getTimetable: (grade: string, section: string) => 
      request<Timetable[]>(`/api/student/timetable?grade=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}`),
    getAttendance: (name: string) => 
      request<Attendance[]>(`/api/student/attendance?name=${encodeURIComponent(name)}`),
    getNotifications: () => 
      request<Notification[]>('/api/student/notifications?role=STUDENT'),
    getMarks: (studentName: string) =>
      request<StudentMark[]>(`/api/student/marks?name=${encodeURIComponent(studentName)}`),
  },

  // AI Endpoints
  ai: {
    generateSchedule: () => 
      request<{ message: string; totalEntries: number; conflicts: number; optimizationScore: number }>('/api/ai/generateSchedule', { method: 'POST' }),
    resolveConflicts: () => 
      request<ConflictResolutionResponse>('/api/ai/resolveConflicts', { method: 'POST' }),
    getFreeClassrooms: (day?: string, time?: string) => {
      const q = new URLSearchParams();
      if (day) q.append('day', day);
      if (time) q.append('time', time);
      return request<{ rooms: (Classroom & { free: boolean })[]; freeCount: number; totalCount: number; day: string; time: string }>(`/api/ai/freeClassrooms?${q.toString()}`);
    },
    getRecommendations: () => 
      request<AIRecommendation[]>('/api/ai/recommendations'),
    predictSchedule: () => 
      request<{ predictedConflicts: number; suggestedOptimizations: number; workloadBalance: string; roomUtilization: string; recommendations: string[] }>('/api/ai/predictSchedule', { method: 'POST' }),
    getHeatmap: () => 
      request<HeatmapCell[]>('/api/ai/heatmap'),
    getAnalytics: () => 
      request<any>('/api/ai/analytics'),
    getStress: () => 
      request<StressAnalytic[]>('/api/ai/stress'),
    getSubstitutes: (timetableId: number) => 
      request<any[]>(`/api/ai/substitutes?timetableId=${timetableId}`),
    applySubstitute: (body: { timetableId: number; substituteTeacherName: string }) => 
      request<{ success: boolean; message: string }>('/api/ai/substitute', { method: 'POST', body: JSON.stringify(body) }),
  }
};

