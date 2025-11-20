import React, { useState, useMemo, useEffect } from 'react';
import { RAW_DATA } from './constants';
import { Student, AppView, HistoryEntry } from './types';
import { RollCall } from './components/RollCall';
import { Picker } from './components/Picker';
import { Leaderboard } from './components/Leaderboard';
import { exportDataToCSV } from './services/csvService';
import { Users, Dices, Trophy, GraduationCap, Download, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; // If uuid not available, simple counter works

// Utility for simple IDs
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const STORAGE_KEY_STUDENTS = 'classroom-spin-students-v3'; // Bumped version for new student list
const STORAGE_KEY_HISTORY = 'classroom-spin-history-v3';

// Parse initial data
const INITIAL_STUDENTS_PARSED: Student[] = RAW_DATA.split('\n')
  .filter(line => line.trim() !== '')
  .map((line, index) => {
    // Handle format: "1141601 Name Name"
    const parts = line.trim().split(/\s+/); // Split by spaces
    const studentId = parts[0]; 
    const studentName = parts.slice(1).join(' ');

    return {
      id: studentId || `student-${index}`, // Use student number as ID
      name: studentName || line.trim(),
      isPresent: false,
      score: 0,
      group: undefined
    };
  });

export default function App() {
  // Load state from localStorage or fallback to initial
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (saved) {
        return JSON.parse(saved);
    } 
    return INITIAL_STUDENTS_PARSED;
  });
  
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentView, setCurrentView] = useState<AppView>(AppView.ATTENDANCE);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  }, [history]);

  const logHistory = (action: HistoryEntry['action'], studentId?: string, details?: string | number) => {
    const student = studentId ? students.find(s => s.id === studentId) : undefined;
    const newEntry: HistoryEntry = {
      id: generateId(),
      timestamp: Date.now(),
      action,
      studentId,
      studentName: student?.name,
      details
    };
    setHistory(prev => [newEntry, ...prev]);
  };

  const handleToggleAttendance = (id: string) => {
    setStudents(prev => prev.map(s => {
        if (s.id === id) {
            // If marking present, assign random group 1-3
            const randomGroup = Math.floor(Math.random() * 3) + 1;
            return { ...s, isPresent: true, group: randomGroup };
        }
        return s;
    }));
  };

  const handleCycleGroup = (id: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id && s.isPresent && s.group) {
        // Cycle 1 -> 2 -> 3 -> 1
        const nextGroup = (s.group % 3) + 1;
        return { ...s, group: nextGroup };
      }
      return s;
    }));
  };

  const handleMarkAbsent = (id: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, isPresent: false, group: undefined };
      }
      return s;
    }));
  };

  const handleResetAttendance = () => {
    if (window.confirm("Reset all check-ins? This will mark everyone as absent.")) {
      setStudents(prev => prev.map(s => ({ ...s, isPresent: false, group: undefined })));
      logHistory('ABSENT', undefined, 'All students reset to absent');
    }
  };

  const handleMarkAllPresent = () => {
    // For testing, assign random groups
    if (window.confirm("Mark everyone as present (Random Groups)?")) {
      setStudents(prev => prev.map(s => ({ 
          ...s, 
          isPresent: true,
          group: Math.floor(Math.random() * 3) + 1 
      })));
      logHistory('CHECK_IN', undefined, 'All students marked present with random groups');
    }
  };

  const handleAddScore = (id: string, points: number) => {
    setStudents(prev => prev.map(s => 
      s.id === id ? { ...s, score: s.score + points } : s
    ));
    logHistory('SCORE', id, points);
  };

  const handleSkip = (id: string) => {
      logHistory('SKIP', id, 'Skipped turn');
  };

  const handleExport = () => {
    exportDataToCSV(students, history);
  };

  const totalScore = useMemo(() => students.reduce((acc, s) => acc + s.score, 0), [students]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView(AppView.ATTENDANCE)}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 hidden md:block">
              Classroom Spin & Win
            </h1>
          </div>
          
          {/* Navigation */}
          <nav className="flex items-center bg-slate-100 p-1 rounded-lg mx-2">
            <button
              onClick={() => setCurrentView(AppView.ATTENDANCE)}
              className={`
                px-3 sm:px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2
                ${currentView === AppView.ATTENDANCE ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
              `}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Check In</span>
            </button>
            <button
              onClick={() => setCurrentView(AppView.PICKER)}
              className={`
                px-3 sm:px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2
                ${currentView === AppView.PICKER ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
              `}
            >
              <Dices className="w-4 h-4" />
              <span className="hidden sm:inline">Activity</span>
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
             <button 
                onClick={handleExport}
                title="Export Data"
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
             >
                <Download className="w-5 h-5" />
             </button>
            <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span>Total: {totalScore}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-6 px-2 sm:px-4 relative overflow-hidden">
        <div className="max-w-screen-2xl mx-auto">
          {currentView === AppView.ATTENDANCE && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
               <RollCall 
                  students={students} 
                  onToggleAttendance={handleToggleAttendance}
                  onCycleGroup={handleCycleGroup}
                  onMarkAbsent={handleMarkAbsent}
                  onReset={handleResetAttendance}
                  onMarkAllPresent={handleMarkAllPresent}
               />
            </div>
          )}
          
          {currentView === AppView.PICKER && (
            <div className="grid lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="lg:col-span-2 order-1">
                <Picker 
                    students={students} 
                    onAddScore={handleAddScore} 
                    onSkip={handleSkip}
                />
              </div>
              <div className="lg:col-span-1 order-2">
                <Leaderboard students={students} />
                
                <div className="mt-6 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 opacity-10">
                    <Dices className="w-32 h-32 -mr-8 -mt-8" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <Save className="w-4 h-4" /> Auto-Save Active
                  </h3>
                  <p className="text-indigo-100 text-sm leading-relaxed opacity-90">
                    Attendance and scores are automatically saved to this browser. Use the download button in the header to save a spreadsheet record.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-xs">
          <p>Classroom Spin & Win &bull; Data stored locally in browser</p>
        </div>
      </footer>
    </div>
  );
}