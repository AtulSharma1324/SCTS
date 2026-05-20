"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { 
  BrainCircuit, Calendar, Users, School, BarChart3, 
  Sparkles, Zap, ChevronRight, GraduationCap, LayoutDashboard
} from 'lucide-react';

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  const features = [
    {
      title: "AI Timetable Generation",
      desc: "Automatically schedule classes using complex optimization models that balance teacher workloads and room capacities.",
      icon: Calendar,
      color: "from-blue-500/20 to-blue-600/20 text-blue-400"
    },
    {
      title: "Intelligent Conflict Resolution",
      desc: "AI detects double-bookings and room clashes, auto-suggesting and applying optimal room and time adjustments in real-time.",
      icon: BrainCircuit,
      color: "from-purple-500/20 to-purple-600/20 text-purple-400"
    },
    {
      title: "Predictive Analytics",
      desc: "Forecast attendance patterns, resource utilisation, and track student classroom participation with advanced statistics.",
      icon: BarChart3,
      color: "from-emerald-500/20 to-emerald-600/20 text-emerald-400"
    },
    {
      title: "Role-Based Hubs",
      desc: "Dedicated glassmorphism panels for Administrators, Teachers, and Students, connected directly to real-time data.",
      icon: Users,
      color: "from-orange-500/20 to-orange-600/20 text-orange-400"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 relative overflow-hidden font-sans flex flex-col justify-between">
      {/* Background blurs */}
      <div className="absolute top-[-10%] left-[-15%] w-[50%] h-[50%] rounded-full bg-orange-600/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[50%] h-[50%] rounded-full bg-amber-600/20 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="p-1 rounded-full bg-white/5 shadow-lg shadow-orange-500/30 overflow-hidden">
            <img src="/logo.png" alt="LPU Logo" className="w-8 h-8 rounded-full object-cover border-2 border-white/10" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
            SmartClass LPU
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated && user ? (
            <Link 
              href={user.role === 'ADMIN' ? '/admin' : user.role === 'TEACHER' ? '/teacher' : '/student'}
              className="glass px-5 py-2.5 rounded-xl border border-white/10 text-sm font-semibold flex items-center space-x-2 text-blue-400 hover:bg-white/5 transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Go to Dashboard</span>
            </Link>
          ) : (
            <>
              <Link 
                href="/login" 
                className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:scale-105 transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)]"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12 flex flex-col items-center justify-center text-center z-10 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full text-xs font-semibold text-blue-300 mb-6">
            <Sparkles className="w-4 h-4 animate-pulse text-purple-400" />
            <span>Next-Gen Smart Classroom Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
            AI-Powered scheduling & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400">
              Intelligent Classrooms
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Eliminate scheduling conflicts, balance faculty workloads, track student attendance, and unlock rich academic analytics—all powered by modern AI heuristics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            {isAuthenticated && user ? (
              <Link 
                href={user.role === 'ADMIN' ? '/admin' : user.role === 'TEACHER' ? '/teacher' : '/student'}
                className="group w-full sm:w-auto relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-8 py-4 font-semibold text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all hover:scale-105"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>Enter Dashboard</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ) : (
              <>
                <Link 
                  href="/signup" 
                  className="group w-full sm:w-auto relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-8 py-4 font-semibold text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all hover:scale-105"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>Get Started Free</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link 
                  href="/login" 
                  className="w-full sm:w-auto glass border border-white/10 px-8 py-4 rounded-xl font-semibold hover:bg-white/5 transition-all"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl mt-8">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * i }}
                key={i}
                className="glass rounded-2xl p-6 border border-white/10 flex flex-col text-left group hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all"
              >
                <div className={`p-3 rounded-xl w-fit mb-4 bg-gradient-to-br ${feat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-white group-hover:text-blue-300 transition-colors">
                  {feat.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feat.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-white/5 text-center text-xs text-slate-500 z-10">
        <p>© 2026 SmartClass LPU Ecosystem. Advanced Agentic Design. All rights reserved.</p>
      </footer>
    </div>
  );
}
