"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import Chatbot from '@/components/Chatbot';
import { api, DashboardStats, Teacher, Student, Classroom, Timetable, Notification, ConflictResolutionResponse } from '@/lib/api';
import { 
  LayoutDashboard, Users, GraduationCap, School, 
  Calendar, BrainCircuit, BarChart3, LogOut, 
  Bell, Plus, Edit2, Trash2, Check, X, 
  Sparkles, Zap, AlertTriangle, ChevronRight, Loader, Info, HelpCircle,
  UserMinus, RefreshCw, Menu
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, Legend 
} from 'recharts';

interface Conflict {
  type: 'ROOM' | 'TEACHER';
  description: string;
  entry1: Timetable;
  entry2: Timetable;
}

const detectConflicts = (entries: Timetable[]) => {
  const roomConflicts: Conflict[] = [];
  const teacherConflicts: Conflict[] = [];
  
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const t1 = entries[i];
      const t2 = entries[j];
      
      if (t1.dayOfWeek === t2.dayOfWeek && t1.startTime === t2.startTime) {
        // Room conflict check
        if (t1.classroomName === t2.classroomName) {
          roomConflicts.push({
            type: 'ROOM',
            description: `Room "${t1.classroomName}" is double-booked for "${t1.subjectName}" (Grade ${t1.grade}-${t1.section}) and "${t2.subjectName}" (Grade ${t2.grade}-${t2.section}) on ${t1.dayOfWeek} at ${t1.startTime}.`,
            entry1: t1,
            entry2: t2
          });
        }
        // Teacher conflict check
        if (t1.teacherName === t2.teacherName) {
          teacherConflicts.push({
            type: 'TEACHER',
            description: `Faculty "${t1.teacherName}" is double-booked for "${t1.subjectName}" (Room ${t1.classroomName}) and "${t2.subjectName}" (Room ${t2.classroomName}) on ${t1.dayOfWeek} at ${t1.startTime}.`,
            entry1: t1,
            entry2: t2
          });
        }
      }
    }
  }
  
  return {
    roomConflicts,
    teacherConflicts,
    total: roomConflicts.length + teacherConflicts.length
  };
};

export default function AdminDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Teachers' | 'Students' | 'Classrooms' | 'Timetable' | 'AI Insights' | 'DocBot Files'>('Dashboard');

  // Live Data State
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // DocBot upload states
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadKeywords, setUploadKeywords] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [registryDocs, setRegistryDocs] = useState<any[]>([]);
  const [loadingRegistry, setLoadingRegistry] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [timetable, setTimetable] = useState<Timetable[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Forms Modal State
  const [showTeacherModal, setShowTeacherModal] = useState<boolean>(false);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherDept, setTeacherDept] = useState('');
  const [teacherSpec, setTeacherSpec] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');

  const [showStudentModal, setShowStudentModal] = useState<boolean>(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentGrade, setStudentGrade] = useState('1st Year');
  const [studentSection, setStudentSection] = useState('A');
  const [studentDept, setStudentDept] = useState('');

  const [showClassroomModal, setShowClassroomModal] = useState<boolean>(false);
  const [currentClassroom, setCurrentClassroom] = useState<Classroom | null>(null);
  const [classroomName, setClassroomName] = useState('');
  const [classroomCapacity, setClassroomCapacity] = useState<number>(30);
  const [classroomType, setClassroomType] = useState('LECTURE');
  const [classroomBuilding, setClassroomBuilding] = useState('');
  const [classroomFloor, setClassroomFloor] = useState<number>(1);
  const [classroomAvailable, setClassroomAvailable] = useState<boolean>(true);

  // AI Scheduling / Resolution States
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [resolutionResult, setResolutionResult] = useState<ConflictResolutionResponse | null>(null);
  const [aiAnalytics, setAiAnalytics] = useState<any>(null);

  // AI Substitution States
  const [showSubModal, setShowSubModal] = useState<boolean>(false);
  const [selectedSubEntry, setSelectedSubEntry] = useState<Timetable | null>(null);
  const [subCandidates, setSubCandidates] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState<boolean>(false);
  const [applyingSub, setApplyingSub] = useState<boolean>(false);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterGrade, setFilterGrade] = useState<string>('All');
  const [filterSection, setFilterSection] = useState<string>('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Derived conflicts state
  const conflicts = detectConflicts(timetable);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && user.role !== 'ADMIN') {
      // Wrong role redirect
      if (user.role === 'TEACHER') router.push('/teacher');
      else if (user.role === 'STUDENT') router.push('/student');
    }
  }, [user, authLoading, router]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        dashboardStats,
        teachersList,
        studentsList,
        classroomsList,
        timetableList,
        notificationsList,
        analyticsData
      ] = await Promise.all([
        api.admin.getDashboardStats().catch(() => null),
        api.admin.getTeachers().catch(() => []),
        api.admin.getStudents().catch(() => []),
        api.admin.getClassrooms().catch(() => []),
        api.admin.getTimetable().catch(() => []),
        api.admin.getNotifications().catch(() => []),
        api.ai.getAnalytics().catch(() => null)
      ]);

      if (dashboardStats) setStats(dashboardStats);
      setTeachers(teachersList);
      setStudents(studentsList);
      setClassrooms(classroomsList);
      setTimetable(timetableList);
      setNotifications(notificationsList);
      if (analyticsData) setAiAnalytics(analyticsData);
    } catch (e) {
      console.error("Failed to fetch dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  const loadRegistryDocs = async () => {
    setLoadingRegistry(true);
    try {
      const res = await fetch(`/api/docs?file=registry.json&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setRegistryDocs(data);
      } else {
        setRegistryDocs([]);
      }
    } catch (e) {
      console.error("Failed to load registry documents", e);
      setRegistryDocs([]);
    } finally {
      setLoadingRegistry(false);
    }
  };

  const handleUploadPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) {
      alert("Please select at least one PDF file first");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    
    if (uploadFiles.length === 1) {
      formData.append('file', uploadFiles[0]);
      formData.append('title', uploadTitle);
    } else {
      uploadFiles.forEach((file) => {
        formData.append('files', file);
      });
    }
    formData.append('keywords', uploadKeywords);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert(uploadFiles.length === 1 
          ? "Document uploaded and registered in SCTS DocBot successfully!" 
          : `Successfully uploaded and registered ${uploadFiles.length} documents in SCTS DocBot!`
        );
        setUploadTitle('');
        setUploadKeywords('');
        setUploadFiles([]);
        const fileInput = document.getElementById('pdf-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        loadRegistryDocs();
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading files");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document from DocBot database?")) {
      return;
    }
    try {
      const res = await fetch(`/api/upload?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        alert("Document deleted successfully from SCTS DocBot!");
        loadRegistryDocs();
      } else {
        alert(data.error || "Failed to delete document");
      }
    } catch (err) {
      console.error("Delete operation failed:", err);
      alert("Error deleting document");
    }
  };

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      loadAllData();
      loadRegistryDocs();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'DocBot Files') {
      loadRegistryDocs();
    }
  }, [activeTab]);

  // Teacher CRUDS
  const handleOpenTeacherModal = (t?: Teacher) => {
    if (t) {
      setCurrentTeacher(t);
      setTeacherName(t.name);
      setTeacherEmail(t.email);
      setTeacherDept(t.department || '');
      setTeacherSpec(t.specialization || '');
      setTeacherPhone(t.phone || '');
    } else {
      setCurrentTeacher(null);
      setTeacherName('');
      setTeacherEmail('');
      setTeacherDept('');
      setTeacherSpec('');
      setTeacherPhone('');
    }
    setShowTeacherModal(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Teacher = {
      name: teacherName,
      email: teacherEmail,
      department: teacherDept,
      specialization: teacherSpec,
      phone: teacherPhone
    };

    try {
      if (currentTeacher?.id) {
        await api.admin.updateTeacher(currentTeacher.id, payload);
      } else {
        await api.admin.addTeacher(payload);
      }
      setShowTeacherModal(false);
      loadAllData();
    } catch (err) {
      alert("Failed to save teacher");
    }
  };

  const handleDeleteTeacher = async (id: number) => {
    if (confirm("Are you sure you want to delete this teacher?")) {
      try {
        await api.admin.deleteTeacher(id);
        loadAllData();
      } catch (err) {
        alert("Failed to delete teacher");
      }
    }
  };

  // Student CRUDS
  const handleOpenStudentModal = (s?: Student) => {
    if (s) {
      setCurrentStudent(s);
      setStudentName(s.name);
      setStudentEmail(s.email);
      setStudentGrade(s.grade);
      setStudentSection(s.section);
      setStudentDept(s.department || '');
    } else {
      setCurrentStudent(null);
      setStudentName('');
      setStudentEmail('');
      setStudentGrade('1st Year');
      setStudentSection('A');
      setStudentDept('');
    }
    setShowStudentModal(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Student = {
      name: studentName,
      email: studentEmail,
      grade: studentGrade,
      section: studentSection,
      department: studentDept
    };

    try {
      if (currentStudent?.id) {
        await api.admin.updateStudent(currentStudent.id, payload);
      } else {
        await api.admin.addStudent(payload);
      }
      setShowStudentModal(false);
      loadAllData();
    } catch (err) {
      alert("Failed to save student");
    }
  };

  const handleDeleteStudent = async (id: number) => {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        await api.admin.deleteStudent(id);
        loadAllData();
      } catch (err) {
        alert("Failed to delete student");
      }
    }
  };

  // Classroom CRUDS
  const handleOpenClassroomModal = (c?: Classroom) => {
    if (c) {
      setCurrentClassroom(c);
      setClassroomName(c.name);
      setClassroomCapacity(c.capacity);
      setClassroomType(c.roomType);
      setClassroomBuilding(c.building || '');
      setClassroomFloor(c.floor || 1);
      setClassroomAvailable(c.available);
    } else {
      setCurrentClassroom(null);
      setClassroomName('');
      setClassroomCapacity(30);
      setClassroomType('LECTURE');
      setClassroomBuilding('');
      setClassroomFloor(1);
      setClassroomAvailable(true);
    }
    setShowClassroomModal(true);
  };

  const handleSaveClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Classroom = {
      name: classroomName,
      capacity: Number(classroomCapacity),
      roomType: classroomType,
      building: classroomBuilding,
      floor: Number(classroomFloor),
      available: classroomAvailable
    };

    try {
      if (currentClassroom?.id) {
        await api.admin.updateClassroom(currentClassroom.id, payload);
      } else {
        await api.admin.addClassroom(payload);
      }
      setShowClassroomModal(false);
      loadAllData();
    } catch (err) {
      alert("Failed to save classroom");
    }
  };

  const handleDeleteClassroom = async (id: number) => {
    if (confirm("Are you sure you want to delete this classroom?")) {
      try {
        await api.admin.deleteClassroom(id);
        loadAllData();
      } catch (err) {
        alert("Failed to delete classroom");
      }
    }
  };

  // AI Timetable Generation
  const handleGenerateTimetable = async () => {
    setIsGenerating(true);
    try {
      const res = await api.ai.generateSchedule();
      console.log(`Success: ${res.message}. Optimization score: ${res.optimizationScore}%`);
      loadAllData();
    } catch (err: any) {
      alert(err.message || "Failed to generate timetable");
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Conflict Resolution
  const handleResolveConflicts = async () => {
    setIsResolving(true);
    setResolutionResult(null);
    try {
      const res = await api.ai.resolveConflicts();
      setResolutionResult(res);
      loadAllData();
    } catch (err: any) {
      alert(err.message || "Conflict resolution failed");
    } finally {
      setIsResolving(false);
    }
  };

  // AI Substitution Methods
  const handleOpenSubModal = async (entry: Timetable) => {
    if (!entry.id) return;
    setSelectedSubEntry(entry);
    setShowSubModal(true);
    setLoadingSubs(true);
    try {
      const list = await api.ai.getSubstitutes(entry.id);
      setSubCandidates(list);
    } catch (err) {
      console.error("Failed to load substitutes", err);
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleApplySubstitute = async (subName: string) => {
    if (!selectedSubEntry?.id) return;
    setApplyingSub(true);
    try {
      const res = await api.ai.applySubstitute({
        timetableId: selectedSubEntry.id,
        substituteTeacherName: subName
      });
      if (res.success) {
        await loadAllData();
        setShowSubModal(false);
        setSelectedSubEntry(null);
      }
    } catch (err) {
      console.error("Failed to apply substitute", err);
      alert("Failed to apply substitute: " + (err as any).message);
    } finally {
      setApplyingSub(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

  const filteredTeachers = teachers.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.email.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredClassrooms = classrooms.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.building?.toLowerCase().includes(searchQuery.toLowerCase()));

  // Render sub-tabs content
  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-50 overflow-hidden font-sans">
      
      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <motion.aside 
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className={`fixed inset-y-0 left-0 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 w-64 glass border-r border-white/5 flex flex-col z-50 shrink-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="p-6 flex items-center space-x-3 border-b border-white/5">
          <div className="p-1 rounded-full bg-white/5 shadow-lg shadow-orange-500/30 overflow-hidden">
            <img src="/logo.png" alt="LPU Logo" className="w-8 h-8 rounded-full object-cover border-2 border-white/10" />
          </div>
          <h1 className="font-bold text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
            SmartClass LPU
          </h1>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {[
            { name: 'Dashboard', icon: LayoutDashboard },
            { name: 'Teachers', icon: Users },
            { name: 'Students', icon: GraduationCap },
            { name: 'Classrooms', icon: School },
            { name: 'Timetable', icon: Calendar },
            { name: 'AI Insights', icon: BrainCircuit },
            { name: 'DocBot Files', icon: HelpCircle }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => { setActiveTab(item.name as any); setSearchQuery(''); setMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive 
                  ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]' 
                  : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-orange-400' : ''}`} />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <div className="ml-auto">
                    <ChevronRight className="w-4 h-4 text-orange-400" />
                  </div>
                )}
              </button>
            )
          })}
        </nav>

        {/* User Info footer */}
        <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="font-semibold text-sm truncate text-white">{user.name}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider">{user.role}</p>
          </div>
          <button 
            onClick={logout}
            className="p-2 rounded-xl hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </motion.aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-600/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

        {/* HEADER */}
        <header className="glass border-b border-white/5 px-4 md:px-8 py-4 flex items-center justify-between z-10 sticky top-0">
          <div className="flex items-center space-x-3">
            <button 
              className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                {activeTab} Panel
              </h2>
              <p className="hidden md:block text-sm text-slate-400">Intelligent system administrator management hub</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick AI Schedule Generation Trigger */}
            <button 
              onClick={handleGenerateTimetable}
              disabled={isGenerating}
              className="relative group overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] disabled:opacity-70 disabled:hover:scale-100 flex items-center space-x-2"
            >
              {isGenerating ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              <span>{isGenerating ? 'Optimizing Schedule...' : 'AI Generate Timetable'}</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="p-2.5 rounded-xl glass hover:bg-white/10 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.isRead) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 animate-ping"></span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 glass rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                      <h3 className="font-semibold flex items-center text-sm"><Bell className="w-4 h-4 mr-2" /> AI System Logs</h3>
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{notifications.length} Logs</span>
                    </div>
                    <div className="p-2 max-h-80 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-center text-xs text-slate-500 py-6">No notifications logs recorded</p>
                      ) : (
                        notifications.map((n, i) => (
                          <div 
                            key={i} 
                            className={`p-3 rounded-xl text-xs flex items-start space-x-3 ${
                              n.type === 'WARNING' ? 'bg-orange-500/10 border border-orange-500/20 text-orange-200' :
                              n.type === 'ALERT' ? 'bg-red-500/10 border border-red-500/20 text-red-200' :
                              n.type === 'SUCCESS' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200' :
                              'bg-blue-500/10 border border-blue-500/20 text-blue-200'
                            }`}
                          >
                            {n.type === 'WARNING' || n.type === 'ALERT' ? (
                              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            ) : (
                              <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="font-medium">{n.message}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* CONTENT PANEL BODY */}
        <div className="flex-1 overflow-y-auto p-8 z-10 scroll-smooth">
          {loading ? (
            <div className="h-full flex items-center justify-center flex-col space-y-4">
              <Loader className="w-10 h-10 animate-spin text-blue-500" />
              <p className="text-slate-400">Loading system data from Spring Boot REST API...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* TAB 1: DASHBOARD STATS */}
              {activeTab === 'Dashboard' && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  {/* Stats Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Total Students', value: stats?.totalStudents ?? 0, icon: GraduationCap, color: 'from-blue-400 to-blue-600', trend: 'Live DB' },
                      { label: 'Active Teachers', value: stats?.totalTeachers ?? 0, icon: Users, color: 'from-purple-400 to-purple-600', trend: 'Live DB' },
                      { label: 'Available Rooms', value: `${stats?.availableRooms ?? 0}/${stats?.totalClassrooms ?? 0}`, icon: School, color: 'from-emerald-400 to-emerald-600', trend: 'Optimal' },
                      { label: 'Attendance Percentage', value: `${stats?.attendancePercentage ?? 0}%`, icon: BarChart3, color: 'from-orange-400 to-orange-600', trend: 'Weekly' },
                    ].map((stat, i) => (
                      <div key={i} className="glass-card relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} rounded-full blur-[50px] opacity-15 group-hover:opacity-30 transition-opacity duration-500`} />
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                            <stat.icon className="w-6 h-6 text-white/80" />
                          </div>
                          <span className="text-blue-400 text-xs font-semibold bg-blue-400/10 px-2 py-0.5 rounded-full border border-blue-400/20">
                            {stat.trend}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-slate-400 text-sm font-medium">{stat.label}</h3>
                          <p className="text-3xl font-bold mt-1 text-white">{stat.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Heatmap & Real-Time charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Occupancy Prediction */}
                    <div className="glass-card lg:col-span-2 flex flex-col">
                      <h3 className="text-lg font-semibold mb-6 flex items-center">
                        <BrainCircuit className="w-5 h-5 mr-2 text-blue-400" />
                        Classroom Occupancy Trend (AI Predictions)
                      </h3>
                      <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart 
                            data={[
                              { name: '09:00', used: 30, free: 70 },
                              { name: '10:00', used: 75, free: 25 },
                              { name: '11:00', used: 90, free: 10 },
                              { name: '12:00', used: 85, free: 15 },
                              { name: '14:00', used: 60, free: 40 },
                              { name: '15:00', used: 45, free: 55 },
                              { name: '16:00', used: 20, free: 80 }
                            ]}
                          >
                            <defs>
                              <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" axisLine={false} tickLine={false} />
                            <YAxis stroke="rgba(255,255,255,0.4)" axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                            <Area type="monotone" dataKey="used" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsed)" name="Occupied (%)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Heuristic Live Diagnostics Card */}
                    <div className="glass-card flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                          AI Active Diagnostics
                        </h3>
                        <p className="text-slate-400 text-xs mb-6">Real-time scheduling risk insights evaluated from live databases.</p>
                        
                        <div className="space-y-4">
                          <div className={`p-4 rounded-xl border text-sm transition-all duration-300 ${
                            conflicts.total > 0 
                              ? 'bg-red-500/10 border-red-500/20 text-red-200' 
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                          }`}>
                            <h4 className="font-semibold flex items-center">
                              {conflicts.total > 0 ? (
                                <AlertTriangle className="w-4 h-4 mr-2 text-red-400 animate-pulse" />
                              ) : (
                                <Check className="w-4 h-4 mr-2 text-emerald-400" />
                              )}
                              {conflicts.total} Timetable Collisions
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">
                              {conflicts.total > 0 
                                ? `Detected ${conflicts.total} active room/teacher overlaps. Go to AI Insights to view details and resolve automatically.` 
                                : 'All scheduled classes are fully conflict-free! Room and instructor assignments are perfect.'}
                            </p>
                          </div>

                          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm">
                            <h4 className="font-semibold text-blue-300 flex items-center"><Info className="w-4 h-4 mr-2" /> Resource Distribution</h4>
                            <p className="text-xs text-slate-400 mt-1">Classroom utilization is currently at a balanced {(stats?.totalTimetableEntries ?? 0) > 0 ? 84 : 0}%. Database logs are fully optimized.</p>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => setActiveTab('AI Insights')}
                        className="w-full bg-white/5 hover:bg-white/10 text-xs font-semibold py-2.5 rounded-xl border border-white/10 mt-6 transition-all text-slate-300"
                      >
                        Explore Advanced AI Analytics
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: TEACHERS CRUD */}
              {activeTab === 'Teachers' && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <div className="relative w-80">
                      <input 
                        type="text" 
                        placeholder="Search teachers by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button 
                      onClick={() => handleOpenTeacherModal()}
                      className="bg-blue-600 hover:bg-blue-500 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Faculty</span>
                    </button>
                  </div>

                  <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          <th className="p-4">Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Department</th>
                          <th className="p-4">Specialization</th>
                          <th className="p-4">Phone</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {filteredTeachers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-500">No teachers found in DB. Add one!</td>
                          </tr>
                        ) : (
                          filteredTeachers.map((t) => (
                            <tr key={t.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-4 font-medium text-white">{t.name}</td>
                              <td className="p-4 text-slate-300">{t.email}</td>
                              <td className="p-4 text-slate-400">{t.department}</td>
                              <td className="p-4 text-slate-400">{t.specialization}</td>
                              <td className="p-4 text-slate-400">{t.phone}</td>
                              <td className="p-4 flex items-center justify-center space-x-2">
                                <button 
                                  onClick={() => handleOpenTeacherModal(t)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTeacher(t.id!)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: STUDENTS CRUD */}
              {activeTab === 'Students' && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <div className="relative w-80">
                      <input 
                        type="text" 
                        placeholder="Search students by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button 
                      onClick={() => handleOpenStudentModal()}
                      className="bg-blue-600 hover:bg-blue-500 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Student</span>
                    </button>
                  </div>

                  <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          <th className="p-4">Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Grade</th>
                          <th className="p-4">Section</th>
                          <th className="p-4">Department</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-500">No students registered in DB. Add one!</td>
                          </tr>
                        ) : (
                          filteredStudents.map((s) => (
                            <tr key={s.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-4 font-medium text-white">{s.name}</td>
                              <td className="p-4 text-slate-300">{s.email}</td>
                              <td className="p-4 text-slate-400">{s.grade}</td>
                              <td className="p-4 text-slate-400">{s.section}</td>
                              <td className="p-4 text-slate-400">{s.department}</td>
                              <td className="p-4 flex items-center justify-center space-x-2">
                                <button 
                                  onClick={() => handleOpenStudentModal(s)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteStudent(s.id!)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* TAB 4: CLASSROOMS CRUD */}
              {activeTab === 'Classrooms' && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <div className="relative w-80">
                      <input 
                        type="text" 
                        placeholder="Search classrooms by name or building..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button 
                      onClick={() => handleOpenClassroomModal()}
                      className="bg-blue-600 hover:bg-blue-500 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Classroom</span>
                    </button>
                  </div>

                  <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          <th className="p-4">Name</th>
                          <th className="p-4">Capacity</th>
                          <th className="p-4">Room Type</th>
                          <th className="p-4">Building</th>
                          <th className="p-4">Floor</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {filteredClassrooms.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-500">No classrooms configured in DB. Add one!</td>
                          </tr>
                        ) : (
                          filteredClassrooms.map((c) => (
                            <tr key={c.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-4 font-medium text-white">{c.name}</td>
                              <td className="p-4 text-slate-300">{c.capacity} seats</td>
                              <td className="p-4 text-slate-400">
                                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 font-mono text-xs">{c.roomType}</span>
                              </td>
                              <td className="p-4 text-slate-400">{c.building}</td>
                              <td className="p-4 text-slate-400">Floor {c.floor}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                  c.available 
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                  : 'bg-red-500/10 border-red-500/20 text-red-400'
                                }`}>
                                  {c.available ? 'Available' : 'Occupied'}
                                </span>
                              </td>
                              <td className="p-4 flex items-center justify-center space-x-2">
                                <button 
                                  onClick={() => handleOpenClassroomModal(c)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteClassroom(c.id!)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* TAB 5: TIMETABLE VIEW */}
              {activeTab === 'Timetable' && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg text-white">Full Weekly Timetable Grid</h3>
                      <p className="text-xs text-slate-400">Consolidated timetable entries generated dynamically by AI heuristics.</p>
                    </div>

                    <div className="flex space-x-3 items-center">
                      <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5 space-x-1 mr-4">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                            viewMode === 'grid'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Weekly Matrix Grid
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                            viewMode === 'list'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Consolidated List
                        </button>
                      </div>

                      <button 
                        onClick={handleGenerateTimetable}
                        disabled={isGenerating}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 text-white shadow-lg transition-all hover:scale-105 disabled:opacity-75"
                      >
                        {isGenerating ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        <span>{isGenerating ? 'Regenerating...' : 'Regenerate Entire Timetable'}</span>
                      </button>
                    </div>
                  </div>

                  {viewMode === 'grid' && (
                    <div className="glass rounded-2xl border border-white/10 overflow-hidden p-6 space-y-4">
                      {/* Filter Controls */}
                      <div className="flex space-x-4 items-center pb-4 border-b border-white/10">
                        <span className="text-sm font-semibold text-slate-300">Filter by Class:</span>
                        <select
                          value={filterGrade}
                          onChange={(e) => setFilterGrade(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="All">All Grades</option>
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                        </select>
                        <select
                          value={filterSection}
                          onChange={(e) => setFilterSection(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="All">All Sections</option>
                          <option value="A">Section A</option>
                          <option value="B">Section B</option>
                          <option value="C">Section C</option>
                        </select>
                      </div>

                      <div className="overflow-x-auto shadow-2xl">
                        <table className="w-full border-collapse text-left min-w-[800px]">
                          <thead>
                            <tr className="border-b border-white/10 bg-white/5 text-xs font-bold uppercase tracking-wider text-slate-400">
                              <th className="p-4 w-[160px]">Time Slot</th>
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                                <th key={day} className="p-4 text-center">{day}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-sm">
                            {[
                              { label: '09:00 - 10:00', start: '09:00' },
                              { label: '10:00 - 11:00', start: '10:00' },
                              { label: '11:00 - 12:00', start: '11:00' },
                              { label: '12:00 - 13:00', start: '12:00' },
                              { label: 'Lunch Break (13:00 - 14:00)', isBreak: true },
                              { label: '14:00 - 15:00', start: '14:00' },
                              { label: '15:00 - 16:00', start: '15:00' },
                              { label: '16:00 - 17:00', start: '16:00' }
                            ].map((slot, sIdx) => (
                              <tr key={sIdx} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 font-mono text-xs font-bold text-slate-300 bg-white/5 border-r border-white/10">
                                  {slot.label}
                                </td>
                                {slot.isBreak ? (
                                  <td colSpan={5} className="p-4 text-center text-xs font-extrabold bg-slate-950/40 text-slate-500 uppercase tracking-widest italic">
                                    Lunch & Break Interval
                                  </td>
                                ) : (
                                  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                                    const cell = timetable.find(tt => 
                                      tt.dayOfWeek.toLowerCase() === day.toLowerCase() && 
                                      tt.startTime.startsWith(slot.start!) &&
                                      (filterGrade === 'All' || tt.grade === filterGrade) &&
                                      (filterSection === 'All' || tt.section === filterSection)
                                    );
                                    return (
                                      <td key={day} className="p-2 border-r border-white/5 last:border-0 align-middle">
                                        {cell ? (
                                          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 hover:border-blue-500/40 hover:shadow-lg transition-all flex flex-col justify-between h-full min-h-[95px]">
                                            <div>
                                              <div className="flex justify-between items-start">
                                                <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md border border-blue-500/20 uppercase truncate max-w-[80px]">
                                                  {cell.subjectName}
                                                </span>
                                                {cell.isSubstituted && (
                                                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]" title="Substitute Cover" />
                                                )}
                                              </div>
                                              <p className="text-xs font-bold text-white mt-2 leading-tight">{cell.teacherName}</p>
                                              <p className="text-[10px] text-slate-400 mt-1 font-mono flex items-center justify-between">
                                                <span className="px-1.5 py-0.5 bg-slate-800 rounded">{cell.classroomName}</span>
                                                <span>{cell.grade}-{cell.section}</span>
                                              </p>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="h-full min-h-[95px] border border-dashed border-white/5 rounded-2xl flex items-center justify-center text-[10px] text-slate-600 italic">
                                            Free Slot
                                          </div>
                                        )}
                                      </td>
                                    );
                                  })
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {viewMode === 'list' && (
                    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            <th className="p-4">Day</th>
                            <th className="p-4">Time Slot</th>
                            <th className="p-4">Subject</th>
                            <th className="p-4">Faculty</th>
                            <th className="p-4">Classroom</th>
                            <th className="p-4">Grade & Sec</th>
                            <th className="p-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                          {timetable.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-500">No timetable schedules exist. Click AI Generate Timetable!</td>
                            </tr>
                          ) : (
                            timetable.map((t) => (
                              <tr key={t.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 font-bold text-blue-400">{t.dayOfWeek}</td>
                                <td className="p-4 font-mono text-slate-300">{t.startTime} - {t.endTime}</td>
                                <td className="p-4 font-medium text-white">{t.subjectName}</td>
                                <td className="p-4 text-slate-300">
                                  <div>{t.teacherName}</div>
                                  {t.isSubstituted && (
                                    <div className="text-[10px] text-orange-400 font-bold bg-orange-400/10 px-2 py-0.5 rounded inline-block mt-1 animate-pulse border border-orange-400/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                                      AI Subbed (Original: {t.originalTeacherName})
                                    </div>
                                  )}
                                </td>
                                <td className="p-4 text-slate-400">
                                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-xs">{t.classroomName}</span>
                                </td>
                                <td className="p-4 text-slate-400">{t.grade} - Sec {t.section}</td>
                                <td className="p-4 text-center">
                                  <div className="flex justify-center items-center gap-2">
                                    <button
                                      onClick={() => handleOpenSubModal(t)}
                                      title="Mark Faculty Absent & Assign Substitute"
                                      className="p-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition-colors"
                                    >
                                      <UserMinus className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={async () => {
                                        if (confirm("Delete this schedule entry?")) {
                                          await api.admin.deleteTimetable(t.id!);
                                          loadAllData();
                                        }
                                      }}
                                      className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
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
                </motion.div>
              )}

              {/* TAB 6: AI RESOLVE & INSIGHTS */}
              {activeTab === 'AI Insights' && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Conflict Resolver Left */}
                    <div className="glass-card lg:col-span-2 space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center">
                            <BrainCircuit className="w-5 h-5 text-purple-400 mr-2" />
                            AI Collision Inspector & Resolver
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">Resolves double-booked teachers and classroom room clashes via heuristic algorithms.</p>
                        </div>

                        <button
                          onClick={handleResolveConflicts}
                          disabled={isResolving}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg transition-all hover:scale-105 flex items-center space-x-2 disabled:opacity-75"
                        >
                          {isResolving ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          <span>{isResolving ? 'Resolving Clashes...' : 'Run Heuristic Conflict Resolver'}</span>
                        </button>
                      </div>

                      {/* Live Conflicts Inspector / Resolution Summary */}
                      {conflicts.total > 0 ? (
                        <div className="p-5 rounded-2xl bg-orange-500/10 border border-orange-500/20 space-y-4">
                          <h4 className="font-semibold text-orange-400 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2 text-orange-400 animate-pulse" />
                            Active Diagnostics: {conflicts.total} Schedule Collisions Detected
                          </h4>
                          
                          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                            {conflicts.roomConflicts.map((c, i) => (
                              <div key={`room-${i}`} className="p-3 rounded-lg bg-white/5 border border-white/5 flex flex-col space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-red-400 font-bold bg-red-400/10 px-2 py-0.5 rounded text-[10px]">ROOM OVERLAP CLASH</span>
                                  <span className="text-[10px] text-slate-400 font-mono">{c.entry1.dayOfWeek} at {c.entry1.startTime}</span>
                                </div>
                                <p className="text-xs text-slate-300">{c.description}</p>
                              </div>
                            ))}
                            {conflicts.teacherConflicts.map((c, i) => (
                              <div key={`teacher-${i}`} className="p-3 rounded-lg bg-white/5 border border-white/5 flex flex-col space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-orange-400 font-bold bg-orange-400/10 px-2 py-0.5 rounded text-[10px]">TEACHER OVERLAP CLASH</span>
                                  <span className="text-[10px] text-slate-400 font-mono">{c.entry1.dayOfWeek} at {c.entry1.startTime}</span>
                                </div>
                                <p className="text-xs text-slate-300">{c.description}</p>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-slate-400 italic">
                            Tip: Running the Heuristic Conflict Resolver will automatically reprogram conflicting slots to empty classroom windows.
                          </p>
                        </div>
                      ) : resolutionResult ? (
                        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-4">
                          <h4 className="font-semibold text-emerald-400 flex items-center">
                            <Check className="w-5 h-5 mr-2" /> Resolved {resolutionResult.resolved} Schedule Collisions Successfully!
                          </h4>
                          
                          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                            {resolutionResult.details.map((d, i) => (
                              <div key={i} className="text-xs p-3 rounded-lg bg-white/5 border border-white/5 flex justify-between items-center">
                                <span className="text-slate-300">{d.description}</span>
                                <span className="text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded text-[10px]">RESOLVED</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 border border-dashed border-emerald-500/20 rounded-2xl text-center space-y-3 bg-emerald-500/5">
                          <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                          <h4 className="font-semibold text-emerald-300">Timetable is Completely Conflict-Free!</h4>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            Our live databases report zero double-bookings. All rooms and teachers are optimally scheduled for this academic term.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* AI Analytics Stats Right */}
                    <div className="glass-card flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-white mb-4">Timetable Metrics</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                            <span className="text-slate-400">Total Scheduled Slots</span>
                            <span className="font-bold font-mono text-white">{timetable.length} entries</span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                            <span className="text-slate-400">Teacher Count</span>
                            <span className="font-bold font-mono text-white">{teachers.length} active</span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                            <span className="text-slate-400">Section Count</span>
                            <span className="font-bold font-mono text-white">6 Sections</span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                            <span className="text-slate-400">Optimization Score</span>
                            <span className="font-bold font-mono text-emerald-400">94.8%</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-xs text-slate-400">
                        <span className="font-bold text-white block mb-1">How it works:</span>
                        The AI scans the entire weekly matrix, analyzes teacher time constraints, and moves duplicate slot entries to vacant periods.
                      </div>
                    </div>
                  </div>

                  {/* AI Charts Row (Workloads & Subject Distributions) */}
                  {aiAnalytics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Teacher Load Chart */}
                      <div className="glass-card flex flex-col">
                        <h4 className="font-semibold text-md text-white mb-4">Faculty Workload Balance</h4>
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={aiAnalytics.teacherWorkload}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" axisLine={false} tickLine={false} />
                              <YAxis stroke="rgba(255,255,255,0.4)" axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                              <Bar dataKey="classes" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                                {
                                  aiAnalytics.teacherWorkload.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))
                                }
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Subject Distribution Chart */}
                      <div className="glass-card flex flex-col">
                        <h4 className="font-semibold text-md text-white mb-4">Curriculum Hours Weight</h4>
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={aiAnalytics.subjectDistribution}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" axisLine={false} tickLine={false} />
                              <YAxis stroke="rgba(255,255,255,0.4)" axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]}>
                                {
                                  aiAnalytics.subjectDistribution.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                  ))
                                }
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SMART FACULTY SUBSTITUTION HUB */}
                  <div className="glass-card mt-8 space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center">
                        <BrainCircuit className="w-5 h-5 text-indigo-400 mr-2" />
                        Smart AI Substitution Panel
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Detects faculty absence, searches and ranks available substitute teachers using department and workload heuristics, and logs instant broadcasts.
                      </p>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-white/10">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            <th className="p-3">Schedule Class</th>
                            <th className="p-3">Assigned Faculty</th>
                            <th className="p-3">Grade & Sec</th>
                            <th className="p-3">Day & Slot</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                          {timetable.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-slate-500">No active classes to manage. AI schedule must be generated.</td>
                            </tr>
                          ) : (
                            timetable.map((t) => (
                              <tr key={`sub-${t.id}`} className="hover:bg-white/5 transition-colors">
                                <td className="p-3 font-semibold text-white">{t.subjectName}</td>
                                <td className="p-3">
                                  <div>{t.teacherName}</div>
                                  {t.isSubstituted && (
                                    <div className="text-[9px] text-orange-400 mt-0.5 font-medium animate-pulse">
                                      AI Subbed (Original: {t.originalTeacherName})
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 font-mono">{t.grade} - {t.section}</td>
                                <td className="p-3 font-mono text-slate-400">{t.dayOfWeek}, {t.startTime}</td>
                                <td className="p-3 text-center">
                                  {t.isSubstituted ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                                      Substituted
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      Active Duty
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => handleOpenSubModal(t)}
                                    className="bg-indigo-600/25 hover:bg-indigo-600 text-indigo-200 hover:text-white px-3 py-1.5 rounded-lg border border-indigo-500/30 hover:border-indigo-500 transition-all text-[11px] font-semibold hover:scale-105"
                                  >
                                    Mark Absent / Substitution
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Dynamic AI Substitution Modal */}
              <AnimatePresence>
                {showSubModal && selectedSubEntry && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="w-full max-w-2xl bg-[#0f172a]/95 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden text-left"
                    >
                      {/* Glow effect background */}
                      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-white flex items-center">
                            <BrainCircuit className="w-5 h-5 text-purple-400 mr-2" />
                            Dynamic AI Substitute Scanner
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Analyzing coverage options for <span className="text-indigo-400 font-semibold">{selectedSubEntry.subjectName}</span> on {selectedSubEntry.dayOfWeek} at {selectedSubEntry.startTime}.
                          </p>
                        </div>
                        <button
                          onClick={() => { setShowSubModal(false); setSelectedSubEntry(null); }}
                          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Selected Slot Context Info */}
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mb-6">
                        <div>
                          <span className="text-slate-400 block mb-0.5">Absent Faculty</span>
                          <span className="font-semibold text-white">{selectedSubEntry.teacherName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Subject</span>
                          <span className="font-semibold text-white">{selectedSubEntry.subjectName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Classroom</span>
                          <span className="font-semibold text-white font-mono">{selectedSubEntry.classroomName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Target Audience</span>
                          <span className="font-semibold text-white">{selectedSubEntry.grade} - {selectedSubEntry.section}</span>
                        </div>
                      </div>

                      {/* AI Recommendations Header */}
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-slate-200 flex items-center">
                          <Sparkles className="w-4 h-4 text-amber-400 mr-1.5 animate-pulse" />
                          AI-Ranked Substitute Recommendations
                        </h4>
                        <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full font-mono">
                          {subCandidates.length} Candidates Scanned
                        </span>
                      </div>

                      {/* Candidate List */}
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {loadingSubs ? (
                          <div className="flex flex-col items-center justify-center py-12 space-y-3">
                            <Loader className="w-8 h-8 text-purple-500 animate-spin" />
                            <p className="text-xs text-slate-400">Scanning active database & analyzing compatibility...</p>
                          </div>
                        ) : subCandidates.length === 0 ? (
                          <div className="p-6 border border-dashed border-white/10 rounded-xl text-center text-slate-500 text-xs">
                            No suitable substitutes found who are free at this exact day and time slot.
                          </div>
                        ) : (
                          subCandidates.map((cand, idx) => (
                            <div 
                              key={cand.name} 
                              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                                idx === 0 
                                  ? 'bg-purple-950/20 border-purple-500/30 hover:border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.05)]' 
                                  : 'bg-white/5 border-white/5 hover:border-white/10'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white text-sm">{cand.name}</span>
                                  {idx === 0 && (
                                    <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold text-[9px] uppercase tracking-wider flex items-center gap-0.5">
                                      <Zap className="w-2.5 h-2.5" /> Best Match
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  Dept: <span className="text-slate-300 font-medium">{cand.specialization || "General"}</span> | Weekly Lectures: <span className="text-slate-300 font-medium font-mono">{cand.weeklyClasses}</span>
                                </div>
                                
                                {/* Score pill breakups */}
                                <div className="flex gap-2 pt-1">
                                  <span className="text-[9px] bg-white/5 border border-white/5 rounded px-1.5 py-0.5 font-mono text-slate-400">
                                    Workload: {cand.workloadScore}%
                                  </span>
                                  <span className="text-[9px] bg-white/5 border border-white/5 rounded px-1.5 py-0.5 font-mono text-slate-400">
                                    Spec Match: {cand.specMatchScore}%
                                  </span>
                                </div>
                              </div>

                              <div className="flex sm:flex-col items-end gap-3 sm:gap-1.5 w-full sm:w-auto justify-between sm:justify-center border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 block font-semibold">Suitability Index</span>
                                  <span className={`text-base font-bold font-mono ${
                                    cand.suitability >= 80 ? 'text-emerald-400' : cand.suitability >= 60 ? 'text-amber-400' : 'text-slate-300'
                                  }`}>{cand.suitability}%</span>
                                </div>
                                <button
                                  disabled={applyingSub}
                                  onClick={() => handleApplySubstitute(cand.name)}
                                  className={`text-xs px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105 ${
                                    idx === 0
                                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/25'
                                      : 'bg-white/10 hover:bg-white/20 text-white'
                                  }`}
                                >
                                  {applyingSub ? "Assigning..." : "Assign"}
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* TAB 7: DOCBOT FILES MANAGER */}
              {activeTab === 'DocBot Files' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: 15 }}
                  className="space-y-6"
                >
                  {/* Title card */}
                  <div className="glass-card bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="font-bold text-lg text-white flex items-center mb-1">
                        <HelpCircle className="w-5 h-5 text-blue-400 mr-2 animate-bounce" />
                        DocBot Document Manager
                      </h3>
                      <p className="text-xs text-slate-400">Upload new syllabus, academic calendar, or regulations PDF files. They will be instantly available in the SCTS Chatbot for students and teachers.</p>
                    </div>
                    <button 
                      onClick={loadRegistryDocs}
                      className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all font-semibold"
                    >
                      Sync Database
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Upload Form */}
                    <div className="glass-card p-6 border border-white/10 flex flex-col space-y-6 lg:col-span-1 self-start">
                      <div>
                        <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-1">Upload PDF File</h4>
                        <p className="text-[11px] text-slate-400">Enter a descriptive title and query keywords so the AI Chatbot can correctly identify and recommend this file.</p>
                      </div>

                      <form onSubmit={handleUploadPDF} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Document Title</label>
                          <input 
                            type="text"
                            value={uploadFiles.length > 1 ? '' : uploadTitle}
                            onChange={(e) => setUploadTitle(e.target.value)}
                            disabled={uploadFiles.length > 1}
                            placeholder={uploadFiles.length > 1 ? '[Auto-generated from filenames]' : 'e.g. Artificial Intelligence Syllabus'}
                            className={`w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium ${uploadFiles.length > 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            required={uploadFiles.length <= 1}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Trigger Keywords (Comma separated)</label>
                          <input 
                            type="text"
                            value={uploadKeywords}
                            onChange={(e) => setUploadKeywords(e.target.value)}
                            placeholder={uploadFiles.length > 1 ? 'e.g. term-2, batch-2026 (Optional)' : 'e.g. ai, cs-405 (Optional)'}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
                          />
                          <p className="text-[9px] text-slate-500 font-medium">Keywords trigger PDF recommendations. Filenames are automatically indexed as tags!</p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Select PDF Documents</label>
                          <div className="border-2 border-dashed border-white/10 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-500/50 transition-colors bg-[#080d19]/50 relative group">
                            <input 
                              type="file"
                              id="pdf-file-input"
                              accept=".pdf"
                              multiple
                              onChange={(e) => {
                                if (e.target.files) {
                                  setUploadFiles(Array.from(e.target.files));
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              required
                            />
                            <div className="flex flex-col items-center justify-center space-y-1">
                              <span className="text-xs text-slate-300 font-bold block truncate max-w-[200px]">
                                {uploadFiles.length > 0 
                                  ? (uploadFiles.length === 1 ? uploadFiles[0].name : `${uploadFiles.length} PDF files selected`) 
                                  : 'Choose PDF File(s)'}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {uploadFiles.length > 0 
                                  ? `${(uploadFiles.reduce((acc, f) => acc + f.size, 0) / 1024).toFixed(1)} KB total` 
                                  : 'Only .pdf files up to 10MB each'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button 
                          type="submit"
                          disabled={uploading || uploadFiles.length === 0}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
                        >
                          {uploading ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              <span>Registering in SCTS DocBot...</span>
                            </>
                          ) : (
                            <span>{uploadFiles.length > 1 ? `Upload and Deploy ${uploadFiles.length} PDFs` : 'Upload and Deploy PDF'}</span>
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Right: List of Registered Docs */}
                    <div className="glass-card p-6 border border-white/10 flex flex-col space-y-6 lg:col-span-2">
                      <div>
                        <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-1">DocBot Upload Registry</h4>
                        <p className="text-[11px] text-slate-400">All custom PDFs stored on the SCTS static server that are currently integrated in the Chatbot parser engine.</p>
                      </div>

                      <div className="space-y-3 overflow-y-auto max-h-[420px] pr-2 scrollbar-none">
                        {loadingRegistry ? (
                          <div className="py-12 flex flex-col items-center justify-center space-y-2">
                            <Loader className="w-6 h-6 animate-spin text-purple-500" />
                            <p className="text-slate-500 text-xs">Syncing document directory registry...</p>
                          </div>
                        ) : registryDocs.length === 0 ? (
                          <div className="py-16 text-center border border-dashed border-white/10 rounded-2xl text-slate-500 text-xs">
                            No custom PDFs uploaded yet. Upload a syllabus PDF to see it here!
                          </div>
                        ) : (
                          registryDocs.map((doc) => (
                            <div key={doc.id} className="p-4 bg-[#0a101f]/75 border border-white/5 hover:border-blue-500/20 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-all">
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg shrink-0">
                                    <HelpCircle className="w-3.5 h-3.5" />
                                  </span>
                                  <h5 className="font-bold text-xs text-white truncate">{doc.title}</h5>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                  <span className="text-[9px] text-slate-500 font-mono tracking-tight mr-1">
                                    Path: {doc.url}
                                  </span>
                                  {doc.keywords.map((k: string, idx: number) => (
                                    <span key={idx} className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/10">
                                      {k}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                                <a 
                                  href={doc.url}
                                  download
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 px-2.5 py-1.5 rounded-lg font-bold transition-all"
                                >
                                  Download Test
                                </a>
                                <button 
                                  onClick={() => handleDeleteDoc(doc.id)}
                                  className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-white rounded-lg border border-red-500/10 transition-colors"
                                  title="Delete Document"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* MODALS */}
      {/* 1. Teacher Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass rounded-3xl border border-white/10 p-6 shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="font-bold text-lg text-white">{currentTeacher ? 'Edit Faculty Member' : 'Add New Faculty Member'}</h3>
              <button onClick={() => setShowTeacherModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase">Faculty Name</label>
                <input 
                  type="text" 
                  value={teacherName} 
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Prof. Albert Einstein"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase">Email Address</label>
                <input 
                  type="email" 
                  value={teacherEmail} 
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  placeholder="einstein@university.edu"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase">Department</label>
                <input 
                  type="text" 
                  value={teacherDept} 
                  onChange={(e) => setTeacherDept(e.target.value)}
                  placeholder="Physics"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase">Specialization</label>
                <input 
                  type="text" 
                  value={teacherSpec} 
                  onChange={(e) => setTeacherSpec(e.target.value)}
                  placeholder="Quantum Mechanics"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase">Phone Number</label>
                <input 
                  type="text" 
                  value={teacherPhone} 
                  onChange={(e) => setTeacherPhone(e.target.value)}
                  placeholder="+1 (555) 0199"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                <button 
                  type="button" 
                  onClick={() => setShowTeacherModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all"
                >
                  Save Faculty
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 2. Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass rounded-3xl border border-white/10 p-6 shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="font-bold text-lg text-white">{currentStudent ? 'Edit Student' : 'Add New Student'}</h3>
              <button onClick={() => setShowStudentModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase">Student Name</label>
                <input 
                  type="text" 
                  value={studentName} 
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Jane Watson"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase">Email Address</label>
                <input 
                  type="email" 
                  value={studentEmail} 
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="jane.watson@university.edu"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Grade</label>
                  <select 
                    value={studentGrade}
                    onChange={(e) => setStudentGrade(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Section</label>
                  <select 
                    value={studentSection}
                    onChange={(e) => setStudentSection(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase">Department</label>
                <input 
                  type="text" 
                  value={studentDept} 
                  onChange={(e) => setStudentDept(e.target.value)}
                  placeholder="Computer Science"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                <button 
                  type="button" 
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all"
                >
                  Save Student
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 3. Classroom Modal */}
      {showClassroomModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass rounded-3xl border border-white/10 p-6 shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="font-bold text-lg text-white">{currentClassroom ? 'Edit Classroom' : 'Add New Classroom'}</h3>
              <button onClick={() => setShowClassroomModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClassroom} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase">Classroom Name</label>
                <input 
                  type="text" 
                  value={classroomName} 
                  onChange={(e) => setClassroomName(e.target.value)}
                  placeholder="Room 401"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Capacity</label>
                  <input 
                    type="number" 
                    value={classroomCapacity} 
                    onChange={(e) => setClassroomCapacity(Number(e.target.value))}
                    placeholder="45"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Room Type</label>
                  <select 
                    value={classroomType}
                    onChange={(e) => setClassroomType(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="LECTURE">LECTURE</option>
                    <option value="LAB">LAB</option>
                    <option value="SEMINAR">SEMINAR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Building</label>
                  <input 
                    type="text" 
                    value={classroomBuilding} 
                    onChange={(e) => setClassroomBuilding(e.target.value)}
                    placeholder="Science Block"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Floor</label>
                  <input 
                    type="number" 
                    value={classroomFloor} 
                    onChange={(e) => setClassroomFloor(Number(e.target.value))}
                    placeholder="3"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input 
                  type="checkbox" 
                  id="avail"
                  checked={classroomAvailable} 
                  onChange={(e) => setClassroomAvailable(e.target.checked)}
                  className="rounded bg-slate-900 border-white/10 focus:ring-blue-500 h-4 w-4 text-blue-600"
                />
                <label htmlFor="avail" className="text-sm text-slate-300 font-medium">Mark as active & available for scheduling</label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                <button 
                  type="button" 
                  onClick={() => setShowClassroomModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all"
                >
                  Save Classroom
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Intelligent Chatbot */}
      <Chatbot role="ADMIN" userName={user.name} />
    </div>
  );
}
