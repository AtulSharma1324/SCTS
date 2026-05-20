"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, GraduationCap, School, 
  Calendar, BrainCircuit, BarChart3, Settings, 
  UserCircle, Bell, Mic, Sparkles, AlertTriangle, 
  Zap, ChevronRight 
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

const attendanceData = [
  { name: 'Mon', value: 85 },
  { name: 'Tue', value: 88 },
  { name: 'Wed', value: 92 },
  { name: 'Thu', value: 89 },
  { name: 'Fri', value: 94 },
];

const utilizationData = [
  { name: '08:00', used: 40, free: 60 },
  { name: '10:00', used: 85, free: 15 },
  { name: '12:00', used: 95, free: 5 },
  { name: '14:00', used: 60, free: 40 },
  { name: '16:00', used: 30, free: 70 },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNotifications, setShowNotifications] = useState(true);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Teachers', icon: Users },
    { name: 'Students', icon: GraduationCap },
    { name: 'Classrooms', icon: School },
    { name: 'Timetable', icon: Calendar },
    { name: 'AI Insights', icon: BrainCircuit },
    { name: 'Analytics', icon: BarChart3 },
    { name: 'Settings', icon: Settings },
    { name: 'Profile', icon: UserCircle },
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert("AI Timetable Generated Successfully!");
    }, 2500);
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-50 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 glass border-r border-white/10 flex flex-col z-20"
      >
        <div className="p-6 flex items-center space-x-3 border-b border-white/10">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg shadow-blue-500/30">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            SmartClass AI
          </h1>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive 
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                  : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`} />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <motion.div layoutId="activeNav" className="ml-auto">
                    <ChevronRight className="w-4 h-4" />
                  </motion.div>
                )}
              </button>
            )
          })}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Decorative background blurs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />

        {/* Top Header */}
        <header className="glass border-b border-white/10 px-8 py-4 flex items-center justify-between z-10 sticky top-0">
          <div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              {activeTab}
            </h2>
            <p className="text-sm text-slate-400">Next Generation Smart Classroom Ecosystem</p>
          </div>

          <div className="flex items-center space-x-6">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="relative group overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] disabled:opacity-70 disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              <div className="relative flex items-center space-x-2">
                {isGenerating ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Zap className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                <span>{isGenerating ? 'Optimizing...' : 'Generate Smart Timetable'}</span>
              </div>
            </button>

            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-full glass hover:bg-white/10 transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>
              </button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 glass rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-white/10 bg-white/5">
                      <h3 className="font-semibold flex items-center"><Bell className="w-4 h-4 mr-2" /> AI Notifications</h3>
                    </div>
                    <div className="p-2 space-y-2">
                      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm flex items-start space-x-3">
                        <Zap className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-100">Optimal Schedule Found</p>
                          <p className="text-blue-300/80 text-xs mt-1">Reduced teacher workload by 15%</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-sm flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-orange-100">Lab 304 High Demand</p>
                          <p className="text-orange-300/80 text-xs mt-1">Consider shifting Physics to Rm 201</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button className="p-2 rounded-full glass hover:bg-white/10 transition-colors bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-purple-500/30 group">
              <Mic className="w-5 h-5 text-purple-300 group-hover:text-purple-100 transition-colors" />
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8 z-10 scroll-smooth">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Total Students', value: '2,451', icon: GraduationCap, color: 'from-blue-400 to-blue-600', trend: '+12%' },
              { label: 'Active Teachers', value: '142', icon: Users, color: 'from-purple-400 to-purple-600', trend: '+3%' },
              { label: 'Available Rooms', value: '18/45', icon: School, color: 'from-emerald-400 to-emerald-600', trend: 'Optimal' },
              { label: 'Attendance', value: '94.2%', icon: BarChart3, color: 'from-orange-400 to-orange-600', trend: '+2.4%' },
            ].map((stat, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className="glass-card relative overflow-hidden group"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md`}>
                    <stat.icon className="w-6 h-6 text-white/80" />
                  </div>
                  <span className="text-emerald-400 text-sm font-medium bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
                    {stat.trend}
                  </span>
                </div>
                <div>
                  <h3 className="text-slate-400 text-sm font-medium">{stat.label}</h3>
                  <p className="text-3xl font-bold mt-1 tracking-tight text-white">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="glass-card lg:col-span-2 flex flex-col"
            >
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <BrainCircuit className="w-5 h-5 mr-2 text-blue-400" />
                Classroom Occupancy Prediction
              </h3>
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={utilizationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorFree" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" axisLine={false} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.5)" axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="used" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsed)" name="Occupied (%)" />
                    <Area type="monotone" dataKey="free" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorFree)" name="Free (%)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="glass-card flex flex-col"
            >
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
                AI Recommendations
              </h3>
              <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                {[
                  { title: "Reduce Teacher Fatigue", desc: "Prof. Smith has 3 consecutive lectures. Suggest adding a 15m break.", type: "warning" },
                  { title: "Optimize Lab Usage", desc: "Computer Lab B is idle during 2PM-4PM. Reschedule CS101 here.", type: "info" },
                  { title: "Low Attendance Alert", desc: "History 201 showing declining attendance trend on Fridays.", type: "alert" }
                ].map((rec, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-colors cursor-pointer group">
                    <h4 className="font-medium text-slate-200 group-hover:text-blue-300 transition-colors">{rec.title}</h4>
                    <p className="text-sm text-slate-400 mt-1">{rec.desc}</p>
                    <div className="mt-3 flex justify-end">
                      <button className="text-xs font-medium bg-white/10 hover:bg-blue-500/20 hover:text-blue-300 px-3 py-1 rounded-md transition-colors">
                        Apply Fix
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-card"
            >
              <h3 className="text-lg font-semibold mb-6">Weekly Attendance Trend</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" axisLine={false} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.5)" axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    <Bar dataKey="value" fill="url(#colorUsed)" radius={[6, 6, 0, 0]}>
                      {
                        attendanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="glass-card flex flex-col justify-center items-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-purple-900/40 z-0"></div>
              <div className="z-10 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(139,92,246,0.5)] animate-pulse">
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">AI Voice Assistant</h3>
                <p className="text-slate-400 mb-6">"Hey SmartClass, show me free rooms at 2 PM"</p>
                <div className="flex space-x-2 justify-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </main>
    </div>
  );
}
