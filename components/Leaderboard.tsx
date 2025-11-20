import React, { useMemo } from 'react';
import { Student } from '../types';
import { Trophy, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardProps {
  students: Student[];
}

const GROUP_CONFIG = {
  1: { bg: 'bg-red-500', text: 'text-red-600', label: 'Group 1' },
  2: { bg: 'bg-blue-500', text: 'text-blue-600', label: 'Group 2' },
  3: { bg: 'bg-emerald-500', text: 'text-emerald-600', label: 'Group 3' },
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ students }) => {
  // Calculate Group Scores
  const groupScores = useMemo(() => {
    const scores = { 1: 0, 2: 0, 3: 0 };
    students.forEach(s => {
      if (s.group && s.score > 0 && (s.group === 1 || s.group === 2 || s.group === 3)) {
         scores[s.group as keyof typeof scores] += s.score;
      }
    });
    return scores;
  }, [students]);

  // Find max score for bar chart scaling
  const maxGroupScore = Math.max(...(Object.values(groupScores) as number[]), 10); 

  // Individual Leaderboard
  const sortedStudents = [...students].sort((a, b) => b.score - a.score);
  const topStudents = sortedStudents.filter(s => s.score > 0);

  return (
    <div className="space-y-6">
      {/* Group Performance Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-4">
         <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          Group Performance
        </h3>
        
        <div className="h-40 flex items-end justify-center gap-4 sm:gap-8 px-2">
          {[1, 2, 3].map((groupNum) => {
            const score = groupScores[groupNum as keyof typeof groupScores];
            const heightPercentage = Math.max((score / maxGroupScore) * 100, 5); 
            const config = GROUP_CONFIG[groupNum as keyof typeof GROUP_CONFIG];
            
            return (
              <div key={groupNum} className="flex flex-col items-center gap-2 flex-1 max-w-[80px] group">
                <div className="text-xs font-bold text-slate-600">{score}</div>
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercentage}%` }}
                  transition={{ type: 'spring', stiffness: 100 }}
                  className={`w-full rounded-t-lg relative ${config.bg} opacity-80 group-hover:opacity-100 transition-opacity`}
                >
                </motion.div>
                <div className={`text-sm font-black ${config.text} whitespace-nowrap`}>
                  G{groupNum}
                </div>
              </div>
            );
          })}
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