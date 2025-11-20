import React, { useState, useEffect, useRef } from 'react';
import { Student } from '../types';
import { generateQuizQuestion } from '../services/geminiService';
import { playTick, playWin } from '../services/audioService';
import { Play, Sparkles, RotateCcw, BrainCircuit, Loader2, UserCheck, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PickerProps {
  students: Student[];
  onAddScore: (id: string, points: number) => void;
  onSkip: (id: string) => void;
}

interface GroupDiceProps {
  groupName: string;
  groupId: number;
  students: Student[];
  selectedStudentId: string | null;
  onPick: (student: Student) => void;
  colorTheme: 'red' | 'blue';
  disabled?: boolean;
}

const GroupDice: React.FC<GroupDiceProps> = ({ 
  groupName, 
  groupId, 
  students, 
  selectedStudentId, 
  onPick, 
  colorTheme,
  disabled 
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentName, setCurrentName] = useState("Ready");
  
  // Refs for animation loop
  const timerRef = useRef<number | null>(null);
  const speedRef = useRef<number>(50);
  const studentIndexRef = useRef<number>(0);

  // Determine current display state
  const activeStudent = students.find(s => s.id === selectedStudentId);
  // If the globally selected student belongs to this group, show them. Otherwise "Ready".
  const displayText = isSpinning 
    ? currentName 
    : (activeStudent ? activeStudent.name : "Ready");

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const startSpin = () => {
    if (students.length === 0 || disabled) return;
    
    setIsSpinning(true);
    speedRef.current = 30; // Start fast
    
    const spin = () => {
      playTick(); // Sound

      // Next name
      studentIndexRef.current = (studentIndexRef.current + 1) % students.length;
      const randomIndex = Math.floor(Math.random() * students.length);
      setCurrentName(students[randomIndex].name);
      
      // Check if we should stop
      if (speedRef.current > 400) {
        const finalIndex = Math.floor(Math.random() * students.length);
        const winner = students[finalIndex];
        setCurrentName(winner.name);
        setIsSpinning(false);
        onPick(winner); // Notify parent
        playWin(); // Sound
        return;
      }

      // Slow down
      speedRef.current = Math.floor(speedRef.current * 1.1);
      timerRef.current = window.setTimeout(spin, speedRef.current);
    };

    spin();
  };

  const themeStyles = colorTheme === 'red' 
    ? {
        gradient: 'from-rose-500 to-red-600',
        ring: 'ring-rose-400/50',
        button: 'text-rose-600 border-rose-100 hover:border-rose-200',
        label: 'bg-rose-700'
      }
    : {
        gradient: 'from-blue-500 to-indigo-600',
        ring: 'ring-blue-400/50',
        button: 'text-blue-600 border-blue-100 hover:border-blue-200',
        label: 'bg-blue-700'
      };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Dice Display Box */}
      <div className={`
        relative w-full h-48 sm:h-64 bg-gradient-to-br ${themeStyles.gradient}
        rounded-2xl shadow-xl flex items-center justify-center overflow-hidden border-8 border-white/20
        ${isSpinning ? `animate-pulse ring-4 ${themeStyles.ring}` : ''}
        transition-all duration-300
      `}>
        {/* Group Label */}
        <div className={`absolute top-0 left-0 px-4 py-1 ${themeStyles.label} text-white text-xs font-bold rounded-br-xl shadow-sm z-20`}>
          {groupName} ({students.length})
        </div>

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        
        <AnimatePresence mode="wait">
          <motion.h1
            key={displayText}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.05 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight z-10 text-center px-2 drop-shadow-lg break-words w-full"
          >
            {students.length === 0 ? "Empty" : displayText}
          </motion.h1>
        </AnimatePresence>
      </div>

      {/* Roll Button */}
      <button
        onClick={startSpin}
        disabled={isSpinning || students.length === 0 || disabled}
        className={`
          group relative w-full py-4 bg-white font-black text-xl rounded-xl shadow-lg 
          transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed
          border-b-4 ${themeStyles.button}
        `}
      >
        <span className="flex items-center justify-center gap-2">
          {isSpinning ? <Loader2 className="animate-spin w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
          {isSpinning ? 'ROLLING...' : `ROLL ${groupName.toUpperCase()}`}
        </span>
      </button>
    </div>
  );
};

export const Picker: React.FC<PickerProps> = ({ students, onAddScore, onSkip }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [aiQuestion, setAiQuestion] = useState<{ q: string; a: string } | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  // Split students by group
  const group1Students = students.filter(s => s.isPresent && s.group === 1);
  const group2Students = students.filter(s => s.isPresent && s.group === 2);
  
  const activeStudent = students.find(s => s.id === selectedStudentId);

  const handlePick = (student: Student) => {
    setSelectedStudentId(student.id);
    setAiQuestion(null);
    setShowAnswer(false);
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
  };

  return (
    <div className="w-full mx-auto flex flex-col gap-8 pb-12">
      
      {/* Dice Area */}
      <div className="grid md:grid-cols-2 gap-6 w-full">
        <GroupDice 
          groupName="Group 1"
          groupId={1}
          students={group1Students}
          selectedStudentId={selectedStudentId}
          onPick={handlePick}
          colorTheme="red"
          disabled={!!selectedStudentId} // Optional: Disable other dice while one is selected? Or allow switching? Let's allow switching.
        />
        <GroupDice 
          groupName="Group 2"
          groupId={2}
          students={group2Students}
          selectedStudentId={selectedStudentId}
          onPick={handlePick}
          colorTheme="blue"
          disabled={!!selectedStudentId}
        />
      </div>

      {/* Hint if no one is checked in */}
      {group1Students.length === 0 && group2Students.length === 0 && (
         <div className="text-center p-8 bg-white rounded-xl border border-dashed border-slate-300">
            <UserCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500">No students checked in yet. Go to the Check In tab.</p>
         </div>
      )}

      {/* Action Panel (Only visible when a student is picked) */}
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
                        ${points >= 4 
                            ? 'bg-yellow-400 text-yellow-900 border-yellow-500 hover:bg-yellow-300' 
                            : 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200'}
                      `}
                    >
                      +{points}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
