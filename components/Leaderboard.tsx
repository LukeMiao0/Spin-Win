import React, { useMemo } from 'react';
import { Student } from '../types';
import { Trophy, BarChart3, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardProps {
  students: Student[];
  onGroupBonus?: (groupId: number, points: number) => void;
}

const GROUP_CONFIG = {
  1: { bg: 'bg-violet-500', border: 'border-violet-600', text: 'text-violet-600', label: 'Group 1' },
  2: { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-orange-600', label: 'Group 2' },
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ students, onGroupBonus }) => {
  // Calculate Group Scores
  const groupScores = useMemo(() => {
    const scores = { 1: 0, 2: 0 };
    students.forEach(s => {
      if (s.group && s.score > 0 && (s.group === 1 || s.group === 2)) {
         scores[s.group as keyof typeof scores] += s.score;
      }
    });
    return scores;
  }, [students]);

  // Find max score for bar chart scaling (default to 20 if scores are low)
  const maxGroupScore = Math.max(...(Object.values(groupScores) as number[]), 20); 

  // Individual Leaderboard
  const sortedStudents = [...students].sort((a, b) => b.score - a.score);
  const topStudents = sortedStudents.filter(s => s.score > 0);

  return (
    <div className="space-y-6">
      {/* Group Performance Chart */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden p-6">
         <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          Group Performance
        </h3>
        
        {/* Chart Container */}
        <div className="relative h-48 w-full mt-2">
          {/* Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between text-xs text-slate-300 pointer-events-none">
            <div className="w-full border-b border-dashed border-slate-200 flex items-end">
              <span className="-mt-5">{maxGroupScore}</span>
            </div>
            <div className="w-full border-b border-dashed border-slate-200 flex items-end">
               <span className="-mt-5">{Math.round(maxGroupScore * 0.75)}</span>
            </div>
             <div className="w-full border-b border-dashed border-slate-200 flex items-end">
               <span className="-mt-5">{Math.round(maxGroupScore * 0.5)}</span>
            </div>
            <div className="w-full border-b border-dashed border-slate-200 flex items-end">
               <span className="-mt-5">{Math.round(maxGroupScore * 0.25)}</span>
            </div>
            <div className="w-full border-b border-slate-300 flex items-end">
               <span className="mb-1">0</span>
            </div>
          </div>

          {/* Bars */}
          <div className="absolute inset-0 flex items-end justify-around px-8 sm:px-12 z-10">
            {[1, 2].map((groupNum) => {
              const score = groupScores[groupNum as keyof typeof groupScores];
              const heightPercentage = Math.max((score / maxGroupScore) * 100, 2); // Min 2% height
              const config = GROUP_CONFIG[groupNum as keyof typeof GROUP_CONFIG];
              
              return (
                <div key={groupNum} className="flex flex-col items-center gap-2 w-16 sm:w-20 group relative">
                  
                  {/* Floating Score Label */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`font-black text-lg ${config.text} bg-white/80 backdrop-blur-sm px-2 rounded-md shadow-sm border border-slate-100 mb-1`}
                  >
                    {score}
                  </motion.div>

                  {/* The Bar */}
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercentage}%` }}
                    transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                    className={`
                      w-full rounded-t-lg relative ${config.bg} shadow-sm border-x border-t ${config.border}
                      after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-t after:from-black/10 after:to-transparent
                    `}
                  >
                  </motion.div>
                  
                  {/* X-Axis Label */}
                  <div className={`mt-2 font-bold text-sm ${config.text} uppercase tracking-wider`}>
                    {config.label}
                  </div>

                  {/* Bonus Button */}
                  {onGroupBonus && (
                    <button 
                      onClick={() => onGroupBonus(groupNum, 2)}
                      className="mt-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-full flex items-center gap-1 transition-colors border border-slate-200"
                      title="Award 2 points to everyone in this group"
                    >
                      <PlusCircle className="w-3 h-3" /> +2 Bonus
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Individual Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 p-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Individual Stars
          </h3>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {topStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 italic">
                  No points yet.
              </div>
          ) : (
              topStudents.map((student, index) => (
              <div 
                  key={student.id} 
                  className={`flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors`}
              >
                  <div className="flex items-center gap-4">
                  <div className={`
                      w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm
                      ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                        index === 1 ? 'bg-slate-200 text-slate-700' :
                        index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-white text-slate-400 border border-slate-100'}
                  `}>
                      {index + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">{student.name}</span>
                    {student.group && GROUP_CONFIG[student.group as keyof typeof GROUP_CONFIG] && (
                       <span className={`text-[10px] font-bold ${GROUP_CONFIG[student.group as keyof typeof GROUP_CONFIG].text}`}>
                         {GROUP_CONFIG[student.group as keyof typeof GROUP_CONFIG].label}
                       </span>
                    )}
                  </div>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      {student.score}
                  </div>
              </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};