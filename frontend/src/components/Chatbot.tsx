"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, FileText, Download, Sparkles, Bot, Loader } from 'lucide-react';
import { api } from '@/lib/api';

interface ChatbotProps {
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  userName: string;
}

interface Message {
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  docLink?: {
    title: string;
    url: string;
  };
}

export default function Chatbot({ role, userName }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [registryDocs, setRegistryDocs] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load dynamic uploaded registry when chatbot opens
  useEffect(() => {
    const fetchRegistry = async () => {
      try {
        const res = await fetch(`/api/docs?file=registry.json&t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setRegistryDocs(data);
        }
      } catch (e) {
        console.error("Chatbot failed to read registry.json", e);
      }
    };

    if (isOpen) {
      fetchRegistry();
    }
  }, [isOpen]);

  // Initialize welcome message based on role
  useEffect(() => {
    let welcomeText = `Hello ${userName}! `;
    if (role === 'ADMIN') {
      welcomeText += "DocBot Admin System Diagnostic online. I can instantly fetch course syllabus files, university rules, or academic calendars. What doc do you need?";
    } else if (role === 'TEACHER') {
      welcomeText += "Welcome Professor. Looking for a curriculum syllabus, grading policy, or university calendar? Just let me know the topic or subject!";
    } else {
      welcomeText += "Hey there! I'm your SCTS DocBot. I can help you download syllabus PDFs or general college guides. What are you looking for today?";
    }

    setMessages([
      {
        sender: 'bot',
        text: welcomeText,
        timestamp: new Date()
      }
    ]);
  }, [role, userName]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg: Message = {
      sender: 'user',
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    try {
      // Simulate small latency for AI natural feel
      await new Promise(resolve => setTimeout(resolve, 600));
      const response = await processQueryAsync(text);
      setMessages(prev => [...prev, response]);
    } catch (e) {
      console.error("Chatbot failed to process query", e);
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'I apologize, but I encountered an error retrieving live SCTS schedule data. Please check the backend connection.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const processQueryAsync = async (query: string): Promise<Message> => {
    const q = query.toLowerCase();
    const botMsg: Message = {
      sender: 'bot',
      text: '',
      timestamp: new Date()
    };

    // 1. Intercept AI substitution & faculty absence inquiries
    const subKeywords = ['substitute', 'absent', 'schedule change', 'cancelled', 'who is cover', 'covered', 'substitution', 'covering'];
    const isSubQuery = subKeywords.some(kw => q.includes(kw));

    if (isSubQuery) {
      try {
        const timetable = await api.admin.getTimetable();
        const substitutions = timetable.filter(entry => entry.isSubstituted);

        if (substitutions.length > 0) {
          let report = `### 🚨 SCTS Smart AI Substitution Report\n\nI have scanned the live database and found **${substitutions.length}** active schedule substitutions:\n\n`;
          substitutions.forEach((entry, idx) => {
            report += `${idx + 1}. **${entry.subjectName}** (${entry.grade} - Sec ${entry.section})\n`;
            report += `   - **Day & Time**: ${entry.dayOfWeek} at ${entry.startTime} - ${entry.endTime}\n`;
            report += `   - **Classroom**: ${entry.classroomName}\n`;
            report += `   - **Absent Faculty**: 👤 Prof. **${entry.originalTeacherName || 'Original Teacher'}**\n`;
            report += `   - **AI Cover Assigned**: 🌟 Prof. **${entry.teacherName}**\n\n`;
          });
          report += `*All affected students and faculty members have been notified in their respective SCTS dashboards.*`;
          botMsg.text = report;
        } else {
          botMsg.text = `### ✅ Schedule Status: All Clear\n\nI successfully scanned the SCTS live schedule database. **No faculty absences or active AI substitutions** are scheduled. All classes are being conducted by their original assigned instructors today.`;
        }
        return botMsg;
      } catch (err) {
        console.error("Failed to query timetable in Chatbot:", err);
        botMsg.text = `⚠️ **System Link Offline**: I tried to query the SCTS live timetable database to check for absences or substitutions, but could not establish a connection to the server. Please ensure the SCTS backend API is running properly.`;
        return botMsg;
      }
    }

    // 2. Search dynamic uploaded registry first
    const matchedDoc = registryDocs.find(doc => 
      doc.keywords.some((kw: string) => q.includes(kw.toLowerCase())) ||
      q.includes(doc.title.toLowerCase())
    );

    if (matchedDoc) {
      botMsg.text = `Found a matching university document in SCTS database: "${matchedDoc.title}". It has been successfully retrieved. You can download the PDF below:`;
      botMsg.docLink = {
        title: `Download ${matchedDoc.title} (PDF)`,
        url: docLinkUrl(matchedDoc.url)
      };
      return botMsg;
    }

    // 3. Fallback to pre-seeded static files
    if (q.includes('machine learning') || q.includes(' ml')) {
      botMsg.text = "Here is the syllabus document for Machine Learning (CS-401). This core module covers supervised learning, decision trees, support vector machines, and deep neural networks.";
      botMsg.docLink = {
        title: "Download Machine Learning Syllabus (PDF)",
        url: "/docs/machine_learning_syllabus.pdf"
      };
    } else if (q.includes('database') || q.includes('dbms') || q.includes('sql')) {
      botMsg.text = "I've fetched the syllabus document for Database Systems (CS-402). This course focuses on ER designs, relational algebra, SQL, normal forms, and transaction ACID properties.";
      botMsg.docLink = {
        title: "Download Database Systems Syllabus (PDF)",
        url: "/docs/database_systems_syllabus.pdf"
      };
    } else if (q.includes('web') || q.includes('frontend') || q.includes('react') || q.includes('next.js')) {
      botMsg.text = "Found it! Here is the syllabus for Web Development (CS-403). It covers fullstack architecture, Next.js contexts, API routing, and JWT authorization mechanisms.";
      botMsg.docLink = {
        title: "Download Web Development Syllabus (PDF)",
        url: "/docs/web_development_syllabus.pdf"
      };
    } else if (q.includes('calendar') || q.includes('schedule') || q.includes('milestone')) {
      botMsg.text = "Sure! Here is the University Academic Calendar for 2026. This details key schedules for classes, midterm examinations, holidays, and practical assessments.";
      botMsg.docLink = {
        title: "Download Academic Calendar 2026 (PDF)",
        url: "/docs/academic_calendar_2026.pdf"
      };
    } else if (q.includes('exam') || q.includes('rule') || q.includes('regulation') || q.includes('policy') || q.includes('grading')) {
      botMsg.text = "Here is the official University Examinations & Evaluative Regulations Guide for 2026, detailing internal markings, bell-curve grading, and 75% attendance compliance guidelines.";
      botMsg.docLink = {
        title: "Download Exam Regulations 2026 (PDF)",
        url: "/docs/exam_regulations_2026.pdf"
      };
    } else if (q.includes('hi') || q.includes('hello') || q.includes('hey') || q.includes('help')) {
      botMsg.text = `Hi there! I can fetch syllabus PDFs or campus logs for you. Try clicking one of the quick suggestions below or type a course name!`;
    } else {
      botMsg.text = `I couldn't locate a specific matching document for "${query}". Try searching for one of the primary subjects or guides:`;
    }

    return botMsg;
  };

  // Safe helper to avoid double prefixing paths
  const docLinkUrl = (url: string) => {
    return url.startsWith('http') || url.startsWith('/') ? url : `/${url}`;
  };

  const baseSuggestions = [
    "Machine Learning Syllabus",
    "Database Systems Syllabus",
    "Web Development Syllabus",
    "Academic Calendar 2026",
    "Exam Regulations Guide"
  ];

  // Dynamically append up to 3 custom uploaded PDF titles to suggestion chips
  const dynamicSuggestions = [
    ...baseSuggestions,
    ...registryDocs.slice(0, 3).map(doc => doc.title)
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* CHAT WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-[380px] h-[520px] glass rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden mb-4 z-50 bg-[#0f172a]/95 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg border border-white/10 relative shrink-0">
                  <img src="/logo.png" alt="SCTS Logo" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-slate-900 animate-ping"></span>
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-slate-900"></span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center">
                    SCTS DocBot
                    <Sparkles className="w-3.5 h-3.5 text-blue-400 ml-1.5 animate-pulse" />
                  </h4>
                  <p className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">AI Document Agent</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white/5 border border-white/5 text-slate-200 rounded-tl-none'
                  }`}>
                    <p className="whitespace-pre-line">{msg.text}</p>
                    
                    {/* Embedded Doc download action button */}
                    {msg.docLink && (
                      <a 
                        href={msg.docLink.url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 flex items-center justify-between space-x-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded-xl font-semibold transition-all hover:scale-102 cursor-pointer"
                      >
                        <span className="flex items-center"><FileText className="w-3.5 h-3.5 mr-2" /> {msg.docLink.title}</span>
                        <Download className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-start">
                  <div className="bg-white/5 border border-white/5 text-slate-400 p-3.5 rounded-2xl rounded-tl-none flex items-center space-x-1.5">
                    <Loader className="w-3.5 h-3.5 animate-spin text-purple-400" />
                    <span className="text-xs">Parsing query and seeding PDF...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions Chips drawer */}
            {messages.length === 1 && !isTyping && (
              <div className="px-4 py-2 border-t border-white/5 bg-white/2 overflow-x-auto whitespace-nowrap flex space-x-2 shrink-0 scrollbar-none">
                {dynamicSuggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(sug)}
                    className="text-[10px] bg-white/5 border border-white/10 hover:border-blue-500/10 hover:text-blue-400 px-3 py-1.5 rounded-full font-medium transition-all"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Input field */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(inputVal); }}
              className="p-3 border-t border-white/10 bg-slate-950/40 flex items-center space-x-2 shrink-0"
            >
              <input 
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Type course name or 'calendar'..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button 
                type="submit"
                disabled={!inputVal.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-105 transition-all shadow-md shadow-blue-500/20 disabled:opacity-55 disabled:hover:scale-100 disabled:shadow-none"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB TRIGGER BUTTON */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className={`p-4 rounded-full shadow-2xl flex items-center justify-center transition-all bg-gradient-to-r from-blue-600 to-purple-600 text-white relative group overflow-hidden border border-white/15`}
        style={{
          boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)'
        }}
      >
        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageSquare className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
