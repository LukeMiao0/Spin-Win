import React, { useState, useEffect, useRef } from 'react';
import { Student } from '../types';
import { generateQuizQuestion } from '../services/geminiService';
import { playTick, playWin } from '../services/audioService';
import { Play, Sparkles, RotateCcw, BrainCircuit, Loader2, UserCheck, Volume2, Hand } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PickerProps {
  students: Student[];
  onAddScore: (id: string, points: number) => void;
  onSkip: (id: string) => void;
}

export const Picker: React.FC<PickerProps> = ({ students, onAddScore, onSkip }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [aiQuestion, setAiQuestion] = useState<{ q: string; a: string } | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayName, setDisplayName] = useState("Ready");
  const [displayGroup, setDisplayGroup] = useState<number | null>(null);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);

  // Refs for animation
  const timerRef = useRef<number | null>(null);
  const speedRef = useRef<number>(50);

  const activeStudent = students.find(s => s.id === selectedStudentId);
  const presentStudents = students.filter(s => s.isPresent);

  // Group colors for spinning UI
  const GROUP_COLORS = {
    1: 'text-red-500',
    2: 'text-blue-500',
    3: 'text-emerald-500'
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const startSpin = () => {
    if (presentStudents.length === 0) return;
    
    setIsSpinning(true);
    setSelectedStudentId(null);
    setAiQuestion(null);
    speedRef.current = 50;
    
    // Logic: "Counts of draws equally distributed among 3 groups"
    // 1. Pick a random group (1-3)
    // 2. Pick a random student from that group
    // This ensures even if Group 1 has 20 people and Group 2 has 2, they have equal chance of being the "winning group".
    
    const availableGroups = [1, 2, 3].filter(g => students.some(s => s.isPresent && s.group === g));
    
    if (availableGroups.length === 0) {
        setIsSpinning(false);
        return;
    }

    const spin = () => {
      playTick();

      // Visual shuffle
      const randomGroup = availableGroups[Math.floor(Math.random() * availableGroups.length)];
      const groupStudents = students.filter(s => s.isPresent && s.group === randomGroup);
      const randomStudent = groupStudents[Math.floor(Math.random() * groupStudents.length)];
      
      if (randomStudent) {
        setDisplayName(randomStudent.name);
        setDisplayGroup(randomStudent.group || null);
      }

      // Stop condition (approx 2 seconds)
      if (speedRef.current > 300) {
        // DECIDE WINNER
        const winningGroup = availableGroups[Math.floor(Math.random() * availableGroups.length)];
        const winners = students.filter(s => s.isPresent && s.group === winningGroup);
        const winner = winners[Math.floor(Math.random() * winners.length)];

        if (winner) {
            setDisplayName(winner.name);
            setDisplayGroup(winner.group || null);
            setSelectedStudentId(winner.id);
            playWin();
        }
        setIsSpinning(false);
        return;
      }

      // Decaying speed
      speedRef.current = Math.floor(speedRef.current * 1.15); // Faster decay for 2s duration
      timerRef.current = window.setTimeout(spin, speedRef.current);
    };

    spin();
  };

  const handleGenerateQuestion = async () => {
    setIsLoadingAi(true);
    setAiQuestion(null);
    setShowAnswer(false);
    const q = await generateQuizQuestion("General Fun Trivia");
    if (q) {
      setAiQuestion({ q: q.question, a: q.answer });
    } else {
      setAiQuestion({ q: "Could not generate a question right now. Ask the class a question!", a: "" });
    }
    setIsLoadingAi(false);
  };

  const handleScore = (points: number) => {
    if (selectedStudentId) {
      onAddScore(selectedStudentId, points);
      resetRound();
    }
  };

  const handleSkip = () => {
    if (selectedStudentId) {
      onSkip(selectedStudentId);
      resetRound();
    }
  };

  const resetRound = () => {
    setSelectedStudentId(null);
    setAiQuestion(null);
    setDisplayName("Ready");
    setDisplayGroup(null);
  };

  const handleVolunteerSelect = (student: Student) => {
      setSelectedStudentId(student.id);
      setDisplayName(student.name);
      setDisplayGroup(student.group || null);
      setShowVolunteerModal(false);
      setAiQuestion(null);
  };

  return (
    <div className="w-full mx-auto flex flex-col gap-8 pb-12">
      
      {/* Spinner Display */}
      <div className="relative w-full">
          <div className={`
            relative h-56 sm:h-72 w-full bg-white rounded-3xl shadow-xl border-4 border-slate-100 overflow-hidden flex flex-col items-center justify-center
            transition-all duration-300 ${isSpinning ? 'ring-4 ring-indigo-200 scale-[1.01]' : ''}
          `}>
             <div className="absolute inset-0 bg-slate-50 opacity-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
             
             {/* Group Indicator */}
             {displayGroup && (
                 <div className={`absolute top-6 text-lg font-bold uppercase tracking-widest ${GROUP_COLORS[displayGroup as keyof typeof GROUP_COLORS] || 'text-slate-400'}`}>
                     Group {displayGroup}
                 </div>
             )}

             <AnimatePresence mode="wait">
                <motion.div
                    key={displayName}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    className="z-10 text-center px-4"
                >
                    <h1 className={`text-4xl sm:text-6xl font-black tracking-tight ${selectedStudentId ? 'text-indigo-600' : 'text-slate-800'}`}>
                        {displayName}
                    </h1>
                </motion.div>
             </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-4">
              <button
                onClick={startSpin}
                disabled={isSpinning || presentStudents.length === 0}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-2xl shadow-lg shadow-indigo-200 font-bold text-xl flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
              >
                 {isSpinning ? <Loader2 className="animate-spin" /> : <Play className="fill-current" />}
                 {isSpinning ? 'Spinning...' : 'SPIN'}
              </button>
              
              <button
                 onClick={() => setShowVolunteerModal(true)}
                 disabled={isSpinning}
                 className="px-4 py-4 bg-white hover:bg-slate-50 text-slate-600 border-2 border-slate-200 rounded-2xl shadow-md font-bold flex items-center gap-2 transition-all hover:scale-105"
                 title="Select Volunteer"
              >
                  <Hand className="w-6 h-6 text-orange-500" />
                  <span className="hidden sm:inline">Volunteer</span>
              </button>
          </div>
      </div>

      {/* Hint if no one is checked in */}
      {presentStudents.length === 0 && (
         <div className="text-center mt-8 p-8 bg-white rounded-xl border border-dashed border-slate-300">
            <UserCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500">No students checked in yet. Go to the Check In tab.</p>
         </div>
      )}

      {/* Volunteer Modal */}
      {showVolunteerModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                          <Hand className="w-5 h-5 text-orange-500" /> Select Volunteer
                      </h3>
                      <button onClick={() => setShowVolunteerModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">Close</button>
                  </div>
                  <div className="overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {presentStudents.map(s => (
                          <button 
                             key={s.id}
                             onClick={() => handleVolunteerSelect(s)}
                             className="p-3 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-left font-medium text-slate-700 truncate"
                          >
                              {s.name}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Action Panel (Only visible when a student is picked) */}
      <div className="mt-8">
      <AnimatePresence>
        {activeStudent && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full bg-white rounded-2xl shadow-xl border-2 border-indigo-100 overflow-hidden"
          >
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-700">Current Turn</h2>
                <div className="text-indigo-600 font-bold text-2xl">{activeStudent.name}</div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                 <Volume2 className="w-4 h-4" />
                 <span>Current Score: {activeStudent.score}</span>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-8">
              {/* AI Question Section */}
              <div className="bg-indigo-50/50 rounded-xl p-6 border border-indigo-100 relative">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-indigo-900 font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    AI Question Generator
                  </h3>
                  <button 
                    onClick={handleGenerateQuestion}
                    disabled={isLoadingAi}
                    className="text-sm bg-white text-indigo-600 px-4 py-2 rounded-full border border-indigo-200 hover:bg-indigo-50 font-bold transition-colors flex items-center gap-2 shadow-sm"
                  >
                    {isLoadingAi ? <Loader2 className="w-4 h-4 animate-spin"/> : <RotateCcw className="w-4 h-4" />}
                    New Question
                  </button>
                </div>
                
                {isLoadingAi ? (
                  <div className="h-24 flex flex-col items-center justify-center text-indigo-400 gap-3">
                    <BrainCircuit className="w-8 h-8 animate-pulse" />
                    <span className="text-sm font-medium">Thinking of a challenge...</span>
                  </div>
                ) : aiQuestion ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-xl font-medium text-slate-800 leading-relaxed">
                      {aiQuestion.q}
                    </p>
                    {showAnswer ? (
                      <div className="bg-emerald-100 text-emerald-900 p-4 rounded-lg text-base font-medium border border-emerald-200 flex items-start gap-3">
                        <span className="bg-emerald-200 text-emerald-800 text-xs px-2 py-0.5 rounded uppercase tracking-wide mt-1 font-bold">Answer</span>
                        {aiQuestion.a}
                      </div>
                    ) : (
                       <button onClick={() => setShowAnswer(true)} className="text-sm text-indigo-600 underline hover:text-indigo-800 font-medium ml-1">
                         Show Answer
                       </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500">
                    <p className="mb-2">Ready for a question?</p>
                    <button onClick={handleGenerateQuestion} className="text-indigo-600 font-bold hover:underline">
                        Generate Trivia
                    </button> 
                    <span className="mx-2">or</span>
                    <span className="italic">Ask from the textbook</span>
                  </div>
                )}
              </div>

              {/* Scoring Section */}
              <div className="flex flex-col items-center">
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
                  Award Points
                </h3>
                
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                  <button 
                    onClick={handleSkip} 
                    className="px-6 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold transition-colors border-b-4 border-slate-200 hover:border-slate-300"
                  >
                    Skip
                  </button>
                  <div className="w-px h-14 bg-slate-200 mx-2 hidden sm:block"></div>
                  
                  {[1, 2, 3, 4, 5].map((points) => (
                    <button
                      key={points}
                      onClick={() => handleScore(points)}
                      className={`
                        w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center font-black text-2xl shadow-sm transition-all transform hover:scale-105 active:scale-95 border-b-4
                        ${points >= 2 
                            ? 'bg-yellow-400 text-yellow-900 border-yellow-500 hover:bg-yellow-300 ring-2 ring-offset-2 ring-yellow-100' // Highlight volunteer range
                            : 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200'}
                      `}
                    >
                      +{points}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-slate-400 mt-3 font-medium">
                   Tip: Volunteers typically earn 2-5 points!
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};