"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { api, Timetable, Attendance, Notification, StudentMark } from '@/lib/api';
import Chatbot from '@/components/Chatbot';
import { 
  Calendar, BarChart3, LogOut, Bell, Check, X, Sparkles, 
  ChevronRight, Loader, Info, GraduationCap, CalendarDays, 
  Award, Settings, Clock, MapPin, User, ChevronUp
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // Mobile Tab State
  const [activeTab, setActiveTab] = useState<'Timetable' | 'Attendance' | 'Grades & Marks' | 'Broadcasts'>('Timetable');

  // Timetable Filters (Grade, Section) - Locked to student profile
  const [grade, setGrade] = useState<string>('1st Year');
  const [section, setSection] = useState<string>('A');
  const [studentDept, setStudentDept] = useState<string>('Computer Science');

  // Selected Day Filter (Mobile-first swipe/tap day navigation)
  const [selectedDay, setSelectedDay] = useState<string>('All');

  // Live Data State
  const [timetable, setTimetable] = useState<Timetable[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showProfileDrawer, setShowProfileDrawer] = useState<boolean>(false);
  const [marks, setMarks] = useState<StudentMark[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const daysOfWeek = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Verification and redirection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && user.role !== 'STUDENT') {
      if (user.role === 'ADMIN') router.push('/admin');
      else if (user.role === 'TEACHER') router.push('/teacher');
    }
  }, [user, authLoading, router]);

  // Load student profile on mount and lock grade/section
  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (user && user.role === 'STUDENT') {
        try {
          const studentsList = await api.admin.getStudents();
          const current = studentsList.find(s => s.email.toLowerCase() === user.email.toLowerCase());
          if (current) {
            setGrade(current.grade);
            setSection(current.section);
            if (current.department) {
              setStudentDept(current.department);
            }
          }
        } catch (err) {
          console.error("Failed to fetch student profile", err);
        }
      }
    };
    fetchStudentProfile();
  }, [user]);

  const loadStudentData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [
        timetableList,
        attendanceList,
        notificationsList,
        marksList
      ] = await Promise.all([
        api.student.getTimetable(grade, section).catch(() => []),
        api.student.getAttendance(user.name).catch(() => []),
        api.student.getNotifications().catch(() => []),
        api.student.getMarks(user.name).catch(() => [])
      ]);

      setTimetable(timetableList);
      setAttendance(attendanceList);
      setNotifications(notificationsList);
      setMarks(marksList);
    } catch (e) {
      console.error("Failed to load student data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'STUDENT') {
      loadStudentData();
    }
  }, [user, grade, section]);

  // Attendance Calculations
  const totalClasses = attendance.length;
  const presentClasses = attendance.filter(a => a.present).length;
  const absentClasses = totalClasses - presentClasses;
  const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

  // Subject-wise Attendance Breakdown
  const subjectAttendanceMap = new Map<string, { present: number; total: number }>();
  attendance.forEach(a => {
    const key = a.subjectName;
    if (!subjectAttendanceMap.has(key)) {
      subjectAttendanceMap.set(key, { present: 0, total: 0 });
    }
    const current = subjectAttendanceMap.get(key)!;
    current.total += 1;
    if (a.present) {
      current.present += 1;
    }
  });

  const subjectAttendanceBreakdown = Array.from(subjectAttendanceMap.entries()).map(([subjectName, counts]) => {
    const rate = counts.total > 0 ? Math.round((counts.present / counts.total) * 100) : 0;
    return {
      subjectName,
      present: counts.present,
      total: counts.total,
      rate
    };
  });

  // Timetable Filtering
  const filteredTimetable = timetable.filter(tt => {
    if (selectedDay === 'All') return true;
    return tt.dayOfWeek.toLowerCase() === selectedDay.toLowerCase();
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Circular progress math
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (attendanceRate / 100) * circumference;

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans pb-24 md:pb-0 md:pl-64 overflow-x-hidden">
      
      {/* Background Decorative Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[40%] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none z-0 animate-pulse" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[40%] rounded-full bg-amber-600/10 blur-[120px] pointer-events-none z-0 animate-pulse" style={{ animationDelay: '1s' }} />

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 glass border-r border-white/5 flex-col z-30">
        <div className="p-6 flex items-center space-x-3 border-b border-white/5">
          <div className="p-1 rounded-full bg-white/5 shadow-lg shadow-orange-500/30 overflow-hidden">
            <img src="/logo.png" alt="LPU Logo" className="w-8 h-8 rounded-full object-cover border-2 border-white/10" />
          </div>
          <h1 className="font-bold text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
            SmartClass LPU
          </h1>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1.5">
          {[
            { name: 'Timetable', icon: Calendar },
            { name: 'Attendance', icon: BarChart3 },
            { name: 'Grades & Marks', icon: Award },
            { name: 'Broadcasts', icon: Bell }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name as any)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive 
                  ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]' 
                  : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-orange-400' : ''}`} />
                <span className="font-medium text-sm">{item.name}</span>
              </button>
            )
          })}
        </nav>

        {/* Desktop Profile Info (Read-Only) */}
        <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="font-semibold text-sm truncate text-white">{user.name}</p>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{grade} • Sec {section}</p>
          </div>
          <button 
            onClick={logout}
            className="p-2 rounded-xl hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="glass border-b border-white/10 px-5 py-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowProfileDrawer(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-sm relative"
          >
            {user.name.charAt(0).toUpperCase()}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-[#070a13]" />
          </button>
          <div>
            <h2 className="text-xs text-slate-400">Welcome back,</h2>
            <h1 className="text-sm font-bold text-white truncate max-w-[120px] sm:max-w-none flex items-center">
              {user.name} <Sparkles className="w-3.5 h-3.5 text-amber-400 ml-1.5 shrink-0" />
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Class quick tag (Read-Only Year & Section Lock) */}
          <div 
            className="glass px-3.5 py-1.5 rounded-full border border-white/10 text-[10px] font-bold text-slate-300 flex items-center bg-emerald-500/5 border-emerald-500/20"
          >
            <GraduationCap className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
            {grade} • {section}
          </div>
        </div>
      </header>

      {/* PRIMARY CONTAINER */}
      <main className="flex-1 p-5 md:p-8 z-10 max-w-5xl w-full mx-auto">
        {loading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <Loader className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Loading academic details...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* ==================== TIMETABLE TAB ==================== */}
            {activeTab === 'Timetable' && (
              <motion.div
                key="timetable"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {/* Title */}
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center">
                    <CalendarDays className="w-5 h-5 text-emerald-400 mr-2 shrink-0" />
                    Class Schedule
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Strictly locked registered schedule for {grade} (Section {section})</p>
                </div>

                {/* Mobile horizontal scrolling/tab Day-Selector */}
                <div className="flex overflow-x-auto pb-2 scrollbar-none gap-2 -mx-5 px-5">
                  {daysOfWeek.map((day) => {
                    const isActive = selectedDay === day;
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                          isActive
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-400/30 shadow-lg shadow-emerald-500/20 scale-105'
                          : 'glass border-white/5 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                {/* Toggle display format */}
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/10 shrink-0 mb-4">
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider pl-2">Display Format</div>
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5 space-x-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                        viewMode === 'grid'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Weekly Matrix Grid
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                        viewMode === 'list'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Consolidated List
                    </button>
                  </div>
                </div>

                {viewMode === 'list' ? (
                  /* Timetable Table (Row and Column layout) */
                  <div className="overflow-x-auto glass rounded-2xl border border-white/10">
                    {filteredTimetable.length === 0 ? (
                      <div className="text-center py-16 flex flex-col items-center justify-center p-6">
                        <Calendar className="w-10 h-10 text-slate-600 mb-3" />
                        <p className="text-sm font-semibold text-slate-300">No classes scheduled</p>
                        <p className="text-xs text-slate-500 mt-1">There are no classes scheduled for {selectedDay === 'All' ? 'the week' : selectedDay}.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse min-w-[650px]">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            <th className="p-4 pl-6">Day</th>
                            <th className="p-4">Time Slot</th>
                            <th className="p-4">Subject</th>
                            <th className="p-4">Instructor</th>
                            <th className="p-4 pr-6">Location</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                          {filteredTimetable.map((tt) => (
                            <tr key={tt.id} className="hover:bg-white/5 transition-colors group">
                              <td className="p-4 pl-6 font-bold text-emerald-400">{tt.dayOfWeek}</td>
                              <td className="p-4 font-mono text-slate-300">
                                <div className="flex items-center space-x-1.5">
                                  <Clock className="w-3.5 h-3.5 text-emerald-500/80 shrink-0" />
                                  <span>{tt.startTime} - {tt.endTime}</span>
                                </div>
                              </td>
                              <td className="p-4 font-semibold text-white">{tt.subjectName}</td>
                              <td className="p-4 text-slate-300">
                                <div className="flex items-center space-x-1.5">
                                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span>{tt.teacherName}</span>
                                </div>
                                {tt.isSubstituted && (
                                  <div className="text-[9px] text-orange-400 font-bold bg-orange-400/10 px-2 py-0.5 rounded inline-block mt-1 border border-orange-400/20 shadow-[0_0_8px_rgba(249,115,22,0.1)]">
                                    AI Substitute Cover (Original: {tt.originalTeacherName})
                                  </div>
                                )}
                              </td>
                              <td className="p-4 pr-6 text-slate-400">
                                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 font-mono text-xs text-emerald-300">
                                  {tt.classroomName}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : (
                  /* New Weekly Grid Matrix */
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
                                      <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-lg transition-all group flex flex-col justify-between h-full min-h-[95px]">
                                        <div>
                                          <div className="flex justify-between items-start">
                                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20 uppercase truncate max-w-[80px]">
                                              {cell.subjectName}
                                            </span>
                                            {cell.isSubstituted && (
                                              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]" title="Substitute Cover" />
                                            )}
                                          </div>
                                          <p className="text-xs font-bold text-white mt-2 leading-tight">{cell.teacherName}</p>
                                          <p className="text-[10px] text-slate-400 mt-1 font-mono flex items-center space-x-1">
                                            <span className="px-1.5 py-0.5 bg-slate-800 rounded">{cell.classroomName}</span>
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
                )}
              </motion.div>
            )}

            {/* ==================== ATTENDANCE TAB ==================== */}
            {activeTab === 'Attendance' && (
              <motion.div
                key="attendance"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-emerald-400 shrink-0" />
                  <h2 className="text-lg font-bold text-white">Attendance Ledger</h2>
                </div>

                {/* Circular Indicator Premium Card */}
                <div className="glass-card bg-gradient-to-r from-emerald-950/10 to-blue-950/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
                    <span className="text-[10px] font-extrabold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      Overall Standing
                    </span>
                    <h3 className="font-bold text-xl text-white">Dynamic Attendance Rate</h3>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Your presence rate is calculated dynamically from registered faculty sessions. Maintain above 75% to stay compliant.
                    </p>
                    
                    {/* Tiny badges */}
                    <div className="flex gap-3 pt-3">
                      <div className="text-center px-3.5 py-1.5 rounded-xl glass border border-white/5 bg-white/5">
                        <span className="text-[10px] text-slate-500 block">Present</span>
                        <span className="text-xs font-bold text-emerald-400">{presentClasses}</span>
                      </div>
                      <div className="text-center px-3.5 py-1.5 rounded-xl glass border border-white/5 bg-white/5">
                        <span className="text-[10px] text-slate-500 block">Absent</span>
                        <span className="text-xs font-bold text-red-400">{absentClasses}</span>
                      </div>
                      <div className="text-center px-3.5 py-1.5 rounded-xl glass border border-white/5 bg-white/5">
                        <span className="text-[10px] text-slate-500 block">Total Lectures</span>
                        <span className="text-xs font-bold text-blue-400">{totalClasses}</span>
                      </div>
                    </div>
                  </div>

                  {/* Gorgeous animated SVG circular ring */}
                  <div className="relative flex items-center justify-center shrink-0 py-2">
                    <svg className="w-36 h-36 transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r={radius}
                        className="stroke-slate-800"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <motion.circle
                        cx="72"
                        cy="72"
                        r={radius}
                        className="stroke-emerald-500"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-white tracking-tight">{attendanceRate}%</span>
                      <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">
                        {attendanceRate >= 75 ? 'Safe Status' : 'Warning'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subject-wise Attendance Breakdown Card */}
                <div className="glass-card p-6 space-y-4">
                  <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider flex items-center">
                    <Sparkles className="w-4 h-4 text-emerald-400 mr-2" />
                    Subject-wise Attendance Analysis
                  </h3>
                  
                  {subjectAttendanceBreakdown.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No individual subject logs found.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {subjectAttendanceBreakdown.map((subject, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-sm text-white">{subject.subjectName}</h4>
                              <span className="text-[10px] text-slate-400">
                                {subject.present} of {subject.total} lectures attended
                              </span>
                            </div>
                            <span className={`text-sm font-extrabold ${
                              subject.rate >= 75 ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              {subject.rate}%
                            </span>
                          </div>
                          
                          {/* visual progress bar */}
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div 
                              className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${
                                subject.rate >= 75 
                                ? 'from-emerald-500 to-teal-400' 
                                : 'from-red-500 to-orange-400'
                              }`}
                              style={{ width: `${subject.rate}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mobile Attendance Log Feed */}
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider">Attendance Logs Feed</h3>
                  
                  {attendance.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 border border-dashed border-white/10 rounded-3xl">
                      No logs mapped to your name yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {attendance.map((a) => (
                        <div key={a.id} className="glass-card flex items-center justify-between p-4 border border-white/5 bg-white/5">
                          <div className="space-y-1">
                            <h4 className="font-bold text-sm text-white">{a.subjectName}</h4>
                            <p className="text-xs text-slate-400">Instructor: {a.teacherName}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{a.date}</p>
                          </div>
                          
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${
                            a.present 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                          }`}>
                            {a.present ? 'Present' : 'Absent'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ==================== BROADCASTS TAB ==================== */}
            {activeTab === 'Broadcasts' && (
              <motion.div
                key="broadcasts"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-emerald-400 shrink-0" />
                  <h2 className="text-lg font-bold text-white">University Broadcasts</h2>
                </div>

                <div className="space-y-3.5">
                  {notifications.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 border border-dashed border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center">
                      <Bell className="w-8 h-8 text-slate-600 mb-2" />
                      <p className="text-sm font-semibold text-slate-400">No active alerts</p>
                      <p className="text-xs text-slate-500 mt-1">There are no administrative broadcast announcements at this time.</p>
                    </div>
                  ) : (
                    notifications.map((n, idx) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={n.id}
                        className="glass-card flex items-start space-x-4 p-4 hover:border-emerald-500/10 transition-all bg-white/5"
                      >
                        <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
                          <Info className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-widest bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/15">
                              {n.type || 'INFO'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Today'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-100 font-medium leading-relaxed pt-1">{n.message}</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* ==================== GRADES & MARKS TAB ==================== */}
            {activeTab === 'Grades & Marks' && (() => {
              const overallAverage = marks.length > 0 ? Math.round(marks.reduce((acc, m) => acc + (m.marksObtained / m.maxMarks), 0) / marks.length * 100) : 0;
              const roundedGpa = Math.round(((overallAverage / 100) * 4.0) * 100) / 100;
              const totalExams = marks.length;
              return (
                <motion.div
                  key="grades"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-emerald-400 shrink-0" />
                    <h2 className="text-lg font-bold text-white">Academic Performance & Grades</h2>
                  </div>

                  {/* Grade analytics summary cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 font-sans">
                    <div className="glass-card bg-gradient-to-br from-emerald-950/10 to-blue-950/10 p-5 flex flex-col justify-between border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                      <span className="text-[10px] font-extrabold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/15 w-fit">
                        Cumulative Score
                      </span>
                      <div className="mt-4">
                        <span className="text-4xl font-extrabold text-white tracking-tight">{overallAverage}%</span>
                        <span className="text-xs text-slate-400 block mt-1">Average of all courses</span>
                      </div>
                    </div>

                    <div className="glass-card bg-gradient-to-br from-blue-950/10 to-purple-950/10 p-5 flex flex-col justify-between border border-blue-500/20 shadow-lg shadow-blue-500/5">
                      <span className="text-[10px] font-extrabold tracking-wider text-blue-400 uppercase bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/15 w-fit">
                        Overall GPA
                      </span>
                      <div className="mt-4">
                        <span className="text-4xl font-extrabold text-white tracking-tight">{roundedGpa} / 4.0</span>
                        <span className="text-xs text-slate-400 block mt-1">Normalized academic standing</span>
                      </div>
                    </div>

                    <div className="glass-card bg-gradient-to-br from-purple-950/10 to-indigo-950/10 p-5 flex flex-col justify-between border border-purple-500/20 shadow-lg shadow-purple-500/5">
                      <span className="text-[10px] font-extrabold tracking-wider text-purple-400 uppercase bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/15 w-fit">
                        Exams & Evaluated Items
                      </span>
                      <div className="mt-4">
                        <span className="text-4xl font-extrabold text-white tracking-tight">{totalExams}</span>
                        <span className="text-xs text-slate-400 block mt-1">Total submitted grades</span>
                      </div>
                    </div>
                  </div>

                  {/* Glassmorphic performance table */}
                  <div className="glass-card p-6 space-y-4">
                    <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider flex items-center">
                      <Sparkles className="w-4 h-4 text-emerald-400 mr-2" />
                      Detailed Subject Grades
                    </h3>
                    
                    <div className="overflow-x-auto font-sans">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            <th className="p-4 pl-6">Subject</th>
                            <th className="p-4">Instructor</th>
                            <th className="p-4">Exam Type</th>
                            <th className="p-4">Marks Obtained</th>
                            <th className="p-4 pr-6">Status & Percentage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                          {marks.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-500 italic">No academic marks uploaded yet by faculty members.</td>
                            </tr>
                          ) : (
                            marks.map((mark) => {
                              const percent = Math.round((mark.marksObtained / mark.maxMarks) * 100);
                              return (
                                <tr key={mark.id} className="hover:bg-white/5 transition-colors">
                                  <td className="p-4 pl-6 font-bold text-white">{mark.subjectName}</td>
                                  <td className="p-4 text-slate-300">{mark.teacherName}</td>
                                  <td className="p-4">
                                    <span className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs text-slate-400 font-semibold uppercase">
                                      {mark.examType}
                                    </span>
                                  </td>
                                  <td className="p-4 font-mono font-bold text-slate-200">{mark.marksObtained} / {mark.maxMarks}</td>
                                  <td className="p-4 pr-6">
                                    <div className="flex items-center space-x-3">
                                      <span className={`text-xs font-bold font-mono w-10 ${percent >= 75 ? 'text-emerald-400' : percent >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                        {percent}%
                                      </span>
                                      <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden shrink-0">
                                        <div
                                          className={`h-full rounded-full bg-gradient-to-r ${percent >= 75 ? 'from-emerald-500 to-teal-400' : percent >= 50 ? 'from-amber-500 to-orange-400' : 'from-red-500 to-rose-400'}`}
                                          style={{ width: `${percent}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

          </AnimatePresence>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/10 px-4 py-2.5 flex justify-between items-center z-30 backdrop-blur-lg">
        {[
          { name: 'Timetable', icon: Calendar, label: 'Schedule' },
          { name: 'Attendance', icon: BarChart3, label: 'Attendance' },
          { name: 'Grades & Marks', icon: Award, label: 'Grades' },
          { name: 'Broadcasts', icon: Bell, label: 'Broadcasts' }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;
          return (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name as any)}
              className="flex flex-col items-center justify-center flex-1 py-1 relative"
            >
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                isActive 
                ? 'text-orange-400 scale-110 bg-orange-500/10' 
                : 'text-slate-500'
              }`}>
                <Icon className="w-5.5 h-5.5" />
              </div>
              <span className={`text-[10px] font-semibold mt-1 transition-colors ${
                isActive ? 'text-orange-400' : 'text-slate-500'
              }`}>
                {item.label}
              </span>
              
              {/* Glowing Indicator bar */}
              {isActive && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute bottom-[-10px] w-8 h-1 bg-orange-400 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" 
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* DYNAMIC USER PROFILE SLIDE-UP SHEET */}
      <AnimatePresence>
        {showProfileDrawer && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfileDrawer(false)}
              className="fixed inset-0 bg-[#020408] z-40"
            />
            {/* Drawer */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 glass rounded-t-3xl border-t border-white/10 z-50 p-6 flex flex-col space-y-6 shadow-2xl backdrop-blur-xl"
            >
              <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto" />

              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-extrabold text-white text-lg shadow-lg shadow-orange-500/20">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{user.name}</h3>
                  <p className="text-xs text-slate-400">{user.email}</p>
                  <p className="text-[10px] text-orange-400 font-extrabold uppercase tracking-widest mt-0.5">
                    {grade} • Section {section}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-slate-400">Account Role</span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{user.role}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-slate-400">Registered Department</span>
                  <span className="text-xs font-bold text-white">{studentDept}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowProfileDrawer(false)}
                  className="flex-1 glass border border-white/10 text-slate-300 font-bold py-3.5 rounded-2xl text-xs hover:bg-white/5 transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowProfileDrawer(false);
                    logout();
                  }}
                  className="flex-1 bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-3.5 rounded-2xl text-xs hover:bg-red-500/30 transition-all flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Intelligent Chatbot */}
      {user && <Chatbot role="STUDENT" userName={user.name} />}
    </div>
  );
}
