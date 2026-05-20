"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import Chatbot from '@/components/Chatbot';
import { api, Timetable, Attendance, Notification, AIRecommendation, Student, StudentMark } from '@/lib/api';
import { 
  LayoutDashboard, Calendar, BarChart3, LogOut, 
  Bell, Check, X, Sparkles, AlertTriangle, 
  ChevronRight, Loader, Info, Plus, UserCheck, CalendarDays, Edit2, Award, Menu
} from 'lucide-react';

export default function TeacherDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'Timetable' | 'Attendance' | 'Student Marks' | 'AI Recommendations'>('Timetable');

  // Live Data
  const [timetable, setTimetable] = useState<Timetable[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Student Marks State
  const [subjectsTaught, setSubjectsTaught] = useState<string[]>([]);
  const [uploadedMarks, setUploadedMarks] = useState<StudentMark[]>([]);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [marksLoading, setMarksLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Upload Form State
  const [markStudentName, setMarkStudentName] = useState<string>('');
  const [markSubjectName, setMarkSubjectName] = useState<string>('');
  const [markExamType, setMarkExamType] = useState<string>('Midterm');
  const [marksObtained, setMarksObtained] = useState<string>('');
  const [maxMarks, setMaxMarks] = useState<string>('100');
  const [marksError, setMarksError] = useState<string>('');
  const [marksSuccess, setMarksSuccess] = useState<string>('');

  // Batch Attendance Marking Form State
  const [showMarkModal, setShowMarkModal] = useState<boolean>(false);
  const [selectedGrade, setSelectedGrade] = useState<string>('1st Year');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [markDate, setMarkDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Students Checklist state
  const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
  const [attendanceChecks, setAttendanceChecks] = useState<Record<string, boolean>>({});
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && user.role !== 'TEACHER') {
      if (user.role === 'ADMIN') router.push('/admin');
      else if (user.role === 'STUDENT') router.push('/student');
    }
  }, [user, authLoading, router]);

  const loadTeacherData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [
        timetableList,
        attendanceList,
        notificationsList,
        recommendationsList,
        subjectsList,
        marksList,
        allStudents
      ] = await Promise.all([
        api.teacher.getTimetable(user.name).catch(() => []),
        api.teacher.getAttendance(user.name).catch(() => []),
        api.teacher.getNotifications().catch(() => []),
        api.teacher.getRecommendations().catch(() => []),
        api.teacher.getSubjectsTaught(user.name).catch(() => []),
        api.teacher.getMarks(user.name).catch(() => []),
        api.admin.getStudents().catch(() => [])
      ]);

      setTimetable(timetableList);
      setAttendance(attendanceList);
      setNotifications(notificationsList);
      setRecommendations(recommendationsList);
      setSubjectsTaught(subjectsList);
      setUploadedMarks(marksList);
      setStudentsList(allStudents);
      
      // Default the form subject if list is not empty
      if (subjectsList.length > 0) {
        setMarkSubjectName(subjectsList[0]);
      }
    } catch (e) {
      console.error("Failed to load teacher dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'TEACHER') {
      loadTeacherData();
    }
  }, [user]);

  // Load students for batch class checklist when grade or section changes in modal
  const loadStudentsForChecklist = async (grade: string, sec: string) => {
    setLoadingStudents(true);
    try {
      const allStudents = await api.admin.getStudents();
      const filtered = allStudents.filter(s => s.grade === grade && s.section === sec);
      setStudentsInClass(filtered);
      
      // Default all to Present (checked)
      const checks: Record<string, boolean> = {};
      filtered.forEach(s => {
        checks[s.name] = true;
      });
      setAttendanceChecks(checks);
    } catch (err) {
      console.error("Failed to fetch class students list", err);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (showMarkModal) {
      loadStudentsForChecklist(selectedGrade, selectedSection);
    }
  }, [showMarkModal, selectedGrade, selectedSection]);

  const handleToggleStudent = (name: string) => {
    setAttendanceChecks(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleSelectAll = (status: boolean) => {
    const checks: Record<string, boolean> = {};
    studentsInClass.forEach(s => {
      checks[s.name] = status;
    });
    setAttendanceChecks(checks);
  };

  const handleBatchMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) {
      alert("Please select or enter a subject");
      return;
    }
    if (studentsInClass.length === 0) {
      alert("No students registered in this class to mark attendance for");
      return;
    }

    try {
      // Prepare attendance records for all students
      const promises = studentsInClass.map(s => {
        const payload: Attendance = {
          studentName: s.name,
          subjectName: selectedSubject,
          teacherName: user!.name,
          date: markDate,
          present: !!attendanceChecks[s.name]
        };
        return api.teacher.markAttendance(payload);
      });

      await Promise.all(promises);
      alert(`Successfully marked attendance logs for ${studentsInClass.length} students!`);
      setShowMarkModal(false);
      loadTeacherData();
    } catch (err) {
      alert("Failed to submit batch attendance records");
    }
  };

  const handleQuickSelectAttendance = (tt: Timetable) => {
    setSelectedGrade(tt.grade);
    setSelectedSection(tt.section);
    setSelectedSubject(tt.subjectName);
    setShowMarkModal(true);
  };

  const handleRectifyAttendance = async (record: Attendance) => {
    try {
      const updated: Attendance = {
        ...record,
        present: !record.present
      };
      await api.teacher.markAttendance(updated);
      alert(`Record rectified: Changed ${record.studentName}'s status to ${!record.present ? 'Present' : 'Absent'}`);
      loadTeacherData();
    } catch (err) {
      alert("Failed to rectify attendance log record");
    }
  };

  const handleUploadMark = async (e: React.FormEvent) => {
    e.preventDefault();
    setMarksError('');
    setMarksSuccess('');

    if (!markStudentName) {
      setMarksError('Please select a student');
      return;
    }
    if (!markSubjectName) {
      setMarksError('Please select a subject');
      return;
    }
    const obtained = parseFloat(marksObtained);
    const max = parseFloat(maxMarks);
    if (isNaN(obtained) || obtained < 0) {
      setMarksError('Marks obtained must be a positive number');
      return;
    }
    if (isNaN(max) || max <= 0) {
      setMarksError('Max marks must be greater than zero');
      return;
    }
    if (obtained > max) {
      setMarksError('Marks obtained cannot be greater than Max marks');
      return;
    }

    try {
      setMarksLoading(true);
      await api.teacher.uploadMark({
        studentName: markStudentName,
        subjectName: markSubjectName,
        teacherName: user!.name,
        marksObtained: obtained,
        maxMarks: max,
        examType: markExamType
      });
      setMarksSuccess('Marks uploaded successfully!');
      setMarksObtained('');
      // Reload marks list
      const marksList = await api.teacher.getMarks(user!.name);
      setUploadedMarks(marksList);
    } catch (err: any) {
      setMarksError(err.message || 'Failed to upload marks');
    } finally {
      setMarksLoading(false);
    }
  };

  const handleDeleteMark = async (id: number) => {
    if (!confirm('Are you sure you want to delete this mark entry?')) return;
    try {
      await api.teacher.deleteMark(id);
      alert('Mark entry deleted successfully!');
      // Reload marks list
      const marksList = await api.teacher.getMarks(user!.name);
      setUploadedMarks(marksList);
    } catch (err: any) {
      alert(err.message || 'Failed to delete mark entry');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

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
            { name: 'Timetable', icon: Calendar },
            { name: 'Attendance', icon: UserCheck },
            { name: 'Student Marks', icon: Award },
            { name: 'AI Recommendations', icon: Sparkles }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => { setActiveTab(item.name as any); setMobileMenuOpen(false); }}
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

        {/* Footer */}
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
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-600/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

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
                {activeTab} Portal
              </h2>
              <p className="hidden md:block text-sm text-slate-400">Logged in as {user.name} (Faculty)</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setSelectedSubject('');
                setShowMarkModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg transition-all hover:scale-105 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Mark Class Attendance</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="p-2.5 rounded-xl glass hover:bg-white/10 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-violet-500 rounded-full border-2 border-slate-900"></span>
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
                      <h3 className="font-semibold flex items-center text-sm"><Bell className="w-4 h-4 mr-2" /> Teacher Broadcasts</h3>
                      <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">{notifications.length} Logs</span>
                    </div>
                    <div className="p-2 max-h-80 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-center text-xs text-slate-500 py-6">No broadcasts assigned</p>
                      ) : (
                        notifications.map((n, i) => (
                          <div 
                            key={i} 
                            className="p-3 rounded-xl text-xs bg-white/5 border border-white/5 flex items-start space-x-3 text-slate-200"
                          >
                            <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
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

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-8 z-10 scroll-smooth">
          {loading ? (
            <div className="h-full flex items-center justify-center flex-col space-y-4">
              <Loader className="w-10 h-10 animate-spin text-purple-500" />
              <p className="text-slate-400 font-medium">Fetching faculty records...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* TAB 1: TIMETABLE */}
              {activeTab === 'Timetable' && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="glass-card flex items-start space-x-4 bg-gradient-to-r from-blue-900/10 to-purple-900/10">
                    <CalendarDays className="w-8 h-8 text-blue-400 shrink-0" />
                    <div>
                      <h3 className="font-bold text-lg text-white">Your Weekly Assigned Classes</h3>
                      <p className="text-xs text-slate-400 mt-1">This list displays classes mapped to your faculty name by the AI generator.</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/10 shrink-0">
                    <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider pl-2">Timetable Display Format</div>
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5 space-x-1">
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
                        Consolidated Cards
                      </button>
                    </div>
                  </div>

                  {viewMode === 'list' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {timetable.length === 0 ? (
                        <div className="col-span-full text-center py-12 glass border-dashed border-white/10 rounded-2xl text-slate-500">
                          No assigned schedule slots found for teacher: <span className="font-bold text-white">"{user.name}"</span>. Contact admin.
                        </div>
                      ) : (
                        timetable.map((tt) => (
                          <div key={tt.id} className="glass-card hover:border-blue-500/30 hover:shadow-lg transition-all flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">{tt.dayOfWeek}</span>
                              <h4 className="font-bold text-lg text-white mt-4">{tt.subjectName}</h4>
                              <p className="text-xs text-slate-400 mt-1">{tt.grade} - Section {tt.section}</p>
                              {tt.isSubstituted && (
                                <div className="text-[10px] text-orange-400 font-bold bg-orange-400/10 px-2 py-0.5 rounded border border-orange-400/20 shadow-[0_0_8px_rgba(249,115,22,0.1)] inline-block mt-2 animate-pulse">
                                  AI Cover (Original: {tt.originalTeacherName})
                                </div>
                              )}
                              
                              <div className="mt-4 space-y-2 text-xs text-slate-300">
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Time:</span>
                                  <span className="font-mono">{tt.startTime} - {tt.endTime}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Classroom:</span>
                                  <span className="font-mono font-bold">{tt.classroomName}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleQuickSelectAttendance(tt)}
                              className="w-full bg-white/5 hover:bg-blue-600 hover:text-white text-xs font-semibold py-2 rounded-lg border border-white/10 hover:border-blue-600 mt-6 transition-all text-blue-400 flex items-center justify-center space-x-1.5"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Mark Class Attendance Checklist</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto glass rounded-3xl border border-white/10 p-2 shadow-2xl">
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
                                  const cell = timetable.find(tt => tt.dayOfWeek.toLowerCase() === day.toLowerCase() && tt.startTime.startsWith(slot.start!));
                                  return (
                                    <td key={day} className="p-2 border-r border-white/5 last:border-0 align-middle">
                                      {cell ? (
                                        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 hover:border-blue-500/40 hover:shadow-lg transition-all group flex flex-col justify-between h-full min-h-[95px]">
                                          <div>
                                            <div className="flex justify-between items-start">
                                              <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md border border-blue-500/20 uppercase truncate max-w-[80px]">
                                                {cell.subjectName}
                                              </span>
                                              {cell.isSubstituted && (
                                                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]" title="Substitute Cover" />
                                              )}
                                            </div>
                                            <p className="text-xs font-bold text-white mt-2 leading-tight">{cell.grade} - {cell.section}</p>
                                            <p className="text-[10px] text-slate-400 mt-1 font-mono flex items-center space-x-1">
                                              <span className="px-1.5 py-0.5 bg-slate-800 rounded">{cell.classroomName}</span>
                                            </p>
                                          </div>
                                          <button
                                            onClick={() => handleQuickSelectAttendance(cell)}
                                            className="mt-2 text-[9px] font-bold bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white px-2 py-1.5 rounded-lg border border-blue-500/20 text-center w-full transition-all flex items-center justify-center space-x-1"
                                          >
                                            <UserCheck className="w-3 h-3" />
                                            <span>Attendance</span>
                                          </button>
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
                  )}
                </motion.div>
              )}

              {/* TAB 2: ATTENDANCE RECORDS */}
              {activeTab === 'Attendance' && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg text-white">Attendance Submission Logs</h3>
                      <p className="text-xs text-slate-400">View previous student records submitted by your account and rectify any entry instantly.</p>
                    </div>

                    <button 
                      onClick={() => {
                        setSelectedSubject('');
                        setShowMarkModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow"
                    >
                      New Batch Checklist
                    </button>
                  </div>

                  <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          <th className="p-4">Student</th>
                          <th className="p-4">Subject</th>
                          <th className="p-4">Date</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {attendance.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-500">No attendance records submitted yet. Click New Entry!</td>
                          </tr>
                        ) : (
                          attendance.map((a) => (
                            <tr key={a.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-4 font-medium text-white">{a.studentName}</td>
                              <td className="p-4 text-slate-300">{a.subjectName}</td>
                              <td className="p-4 text-slate-400 font-mono">{a.date}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                  a.present 
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                  : 'bg-red-500/10 border-red-500/20 text-red-400'
                                }`}>
                                  {a.present ? 'Present' : 'Absent'}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => handleRectifyAttendance(a)}
                                  className={`text-[10px] font-bold px-3 py-1 rounded-lg border transition-all ${
                                    a.present
                                    ? 'bg-red-500/5 hover:bg-red-500/20 text-red-400 border-red-500/10 hover:border-red-500/30'
                                    : 'bg-emerald-500/5 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/10 hover:border-emerald-500/30'
                                  }`}
                                >
                                  Mark {a.present ? 'Absent' : 'Present'} (Rectify)
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

              {/* TAB: STUDENT MARKS */}
              {activeTab === 'Student Marks' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="glass-card flex items-start space-x-4 bg-gradient-to-r from-blue-900/10 to-purple-900/10">
                    <Award className="w-8 h-8 text-blue-400 shrink-0" />
                    <div>
                      <h3 className="font-bold text-lg text-white">Student Marks & Performance Management</h3>
                      <p className="text-xs text-slate-400 mt-1">Upload and manage exam marks. Note: You can only upload marks for subjects you are actively registered to teach.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT COLUMN: UPLOAD FORM */}
                    <div className="lg:col-span-1 glass p-6 rounded-2xl border border-white/10 space-y-4 h-fit">
                      <h4 className="font-bold text-md text-white flex items-center">
                        <Plus className="w-4 h-4 mr-2 text-blue-400" />
                        Upload New Marks
                      </h4>
                      
                      {marksError && (
                        <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{marksError}</span>
                        </div>
                      )}
                      
                      {marksSuccess && (
                        <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center space-x-2">
                          <Check className="w-4 h-4 shrink-0" />
                          <span>{marksSuccess}</span>
                        </div>
                      )}

                      <form onSubmit={handleUploadMark} className="space-y-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Student</label>
                          <select
                            value={markStudentName}
                            onChange={(e) => setMarkStudentName(e.target.value)}
                            className="w-full bg-[#131d32] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                            required
                          >
                            <option value="">Choose a student...</option>
                            {studentsList.map(s => (
                              <option key={s.id} value={s.name}>
                                {s.name} ({s.grade} - {s.section})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject Taught</label>
                          <select
                            value={markSubjectName}
                            onChange={(e) => setMarkSubjectName(e.target.value)}
                            className="w-full bg-[#131d32] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                            required
                          >
                            {subjectsTaught.length === 0 ? (
                              <option value="">No subjects registered</option>
                            ) : (
                              subjectsTaught.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                              ))
                            )}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exam Type</label>
                          <select
                            value={markExamType}
                            onChange={(e) => setMarkExamType(e.target.value)}
                            className="w-full bg-[#131d32] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                            required
                          >
                            <option value="Assignment">Assignment</option>
                            <option value="Quiz">Quiz</option>
                            <option value="Midterm">Midterm</option>
                            <option value="Final Exam">Final Exam</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score Obtained</label>
                            <input
                              type="number"
                              step="0.1"
                              placeholder="e.g. 85"
                              value={marksObtained}
                              onChange={(e) => setMarksObtained(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total possible</label>
                            <input
                              type="number"
                              step="1"
                              placeholder="100"
                              value={maxMarks}
                              onChange={(e) => setMaxMarks(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                              required
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={marksLoading || subjectsTaught.length === 0}
                          className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg transition-all"
                        >
                          {marksLoading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Submit Marks Entry'}
                        </button>
                      </form>
                    </div>

                    {/* RIGHT COLUMN: MARKS GRID */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="glass p-6 rounded-2xl border border-white/10 space-y-4">
                        <h4 className="font-bold text-md text-white flex items-center">
                          <Award className="w-4 h-4 mr-2 text-purple-400" />
                          Uploaded Marks History
                        </h4>

                        <div className="overflow-x-auto font-sans">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <th className="p-3">Student</th>
                                <th className="p-3">Subject</th>
                                <th className="p-3">Exam Type</th>
                                <th className="p-3">Score</th>
                                <th className="p-3">Percent</th>
                                <th className="p-3 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs">
                              {uploadedMarks.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">No marks uploaded yet by you. Use the form to submit one.</td>
                                </tr>
                              ) : (
                                uploadedMarks.map((mark) => {
                                  const percent = Math.round((mark.marksObtained / mark.maxMarks) * 100);
                                  return (
                                    <tr key={mark.id} className="hover:bg-white/5 transition-colors">
                                      <td className="p-3 font-semibold text-white">{mark.studentName}</td>
                                      <td className="p-3 text-slate-300">{mark.subjectName}</td>
                                      <td className="p-3">
                                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px]">{mark.examType}</span>
                                      </td>
                                      <td className="p-3 font-mono font-bold text-white">{mark.marksObtained} / {mark.maxMarks}</td>
                                      <td className="p-3">
                                        <span className={`font-mono font-bold ${percent >= 75 ? 'text-emerald-400' : percent >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                          {percent}%
                                        </span>
                                      </td>
                                      <td className="p-3 text-center">
                                        <button
                                          onClick={() => handleDeleteMark(mark.id!)}
                                          className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all"
                                          title="Delete record"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: AI RECOMMENDATIONS */}
              {activeTab === 'AI Recommendations' && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="glass-card bg-gradient-to-r from-purple-900/10 to-indigo-900/10 border border-purple-500/20">
                    <h3 className="font-bold text-lg text-white flex items-center mb-1">
                      <Sparkles className="w-5 h-5 text-purple-400 mr-2" />
                      AI Faculty Insights
                    </h3>
                    <p className="text-xs text-slate-400">Heuristics suggestion engine specifically generated for your subjects and schedule.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recommendations.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-white/10 rounded-2xl">
                        No active AI recommendations at this time. Everything is fully optimized.
                      </div>
                    ) : (
                      recommendations.map((rec) => (
                        <div key={rec.id} className="glass-card flex flex-col justify-between hover:border-purple-500/30 transition-all">
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <span className="text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">{rec.recommendationType}</span>
                              <span className="text-xs font-semibold text-emerald-400 font-mono">{Math.round(rec.confidence * 100)}% Confidence</span>
                            </div>
                            <p className="text-sm text-slate-200 mt-2 font-medium">{rec.message}</p>
                          </div>

                          <div className="mt-6 flex justify-end">
                            <button 
                              onClick={() => alert("AI optimization applied successfully")}
                              className="text-xs font-semibold bg-white/5 hover:bg-purple-600 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-all text-purple-300"
                            >
                              Apply Suggestion
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* BATCH ATTENDANCE CHECKLIST MODAL */}
      {showMarkModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl glass rounded-3xl border border-white/10 p-6 shadow-2xl space-y-6 max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-4 shrink-0">
              <h3 className="font-bold text-lg text-white flex items-center">
                <UserCheck className="w-5 h-5 text-blue-400 mr-2" />
                Batch Class Attendance Checklist
              </h3>
              <button onClick={() => setShowMarkModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBatchMarkAttendance} className="space-y-4 flex flex-col flex-1 overflow-hidden">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Year</label>
                  <select 
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Section</label>
                  <select 
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Subject</label>
                  <input 
                    type="text" 
                    value={selectedSubject} 
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    placeholder="e.g. Data Structures"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
                  <input 
                    type="date" 
                    value={markDate} 
                    onChange={(e) => setMarkDate(e.target.value)}
                    className="w-full bg-[#131d32] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Convenience Toggles */}
              <div className="flex justify-between items-center shrink-0 border-t border-b border-white/5 py-2">
                <span className="text-xs text-slate-400 font-semibold uppercase">
                  Class List Checklist ({studentsInClass.length} Students)
                </span>
                
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded font-bold transition-all"
                  >
                    Select All (Present)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-2 py-1 rounded font-bold transition-all"
                  >
                    Deselect All (Absent)
                  </button>
                </div>
              </div>

              {/* Students Checkbox List Area */}
              <div className="flex-1 overflow-y-auto min-h-[150px] pr-2 space-y-2">
                {loadingStudents ? (
                  <div className="h-full flex items-center justify-center flex-col py-8 space-y-2">
                    <Loader className="w-6 h-6 animate-spin text-blue-500" />
                    <p className="text-slate-500 text-xs">Loading class roll call...</p>
                  </div>
                ) : studentsInClass.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-white/10 rounded-xl">
                    No students found registered for {selectedGrade} Section {selectedSection} in database.
                  </div>
                ) : (
                  studentsInClass.map((student) => {
                    const isPresent = !!attendanceChecks[student.name];
                    return (
                      <div 
                        key={student.id} 
                        onClick={() => handleToggleStudent(student.name)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                          isPresent
                          ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/30'
                          : 'bg-red-500/5 border-red-500/20 hover:border-red-500/30'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isPresent 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-red-500/20 text-red-400'
                          }`}>
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-white">{student.name}</p>
                            <p className="text-[10px] text-slate-500">{student.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                            isPresent 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-red-500/10 text-red-400'
                          }`}>
                            {isPresent ? 'Present' : 'Absent'}
                          </span>
                          
                          <input 
                            type="checkbox"
                            checked={isPresent}
                            onChange={() => {}} // Controlled via parent onClick
                            className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-white/10 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-white/10 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowMarkModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={studentsInClass.length === 0}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  Submit Attendance Grid
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Intelligent Chatbot */}
      <Chatbot role="TEACHER" userName={user!.name} />
    </div>
  );
}
