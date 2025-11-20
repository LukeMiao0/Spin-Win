import React, { useMemo } from 'react';
import { Student } from '../types';
import { Trophy, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardProps {
  students: Student[];
}

const GROUP_COLORS_BG = {
  1: 'bg-red-500',
  2: 'bg-blue-500',
};

const GROUP_COLORS_TEXT = {
  1: 'text-red-600',
  2: 'text-blue-600',
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ students }) => {
  // Calculate Group Scores
  const groupScores = useMemo(() => {
    const scores = { 1: 0, 2: 0 };
    students.forEach(s => {
      if (s.group && s.score > 0) {
        // Only count for valid groups 1 and 2
        if (s.group === 1 || s.group === 2) {
             scores[s.group] += s.score;
        }
      }
    });
    return scores;
  }, [students]);

  // Find max score for bar chart scaling
  const maxGroupScore = Math.max(...(Object.values(groupScores) as number[]), 10); // Min height of 10 for scale

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
        
        <div className="h-40 flex items-end justify-center gap-8 px-2">
          {[1, 2].map((groupNum) => {
            const score = groupScores[groupNum as keyof typeof groupScores];
            const heightPercentage = Math.max((score / maxGroupScore) * 100, 5); // Min 5% height
            
            return (
              <div key={groupNum} className="flex flex-col items-center gap-2 flex-1 max-w-[120px] group">
                <div className="text-xs font-bold text-slate-600">{score}</div>
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercentage}%` }}
                  transition={{ type: 'spring', stiffness: 100 }}
                  className={`w-full rounded-t-lg relative ${GROUP_COLORS_BG[groupNum as keyof typeof GROUP_COLORS_BG]} opacity-80 group-hover:opacity-100 transition-opacity`}
                >
                </motion.div>
                <div className={`text-lg font-black ${GROUP_COLORS_TEXT[groupNum as keyof typeof GROUP_COLORS_TEXT]}`}>
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
                    {student.group && (
                       <span className={`text-[10px] font-bold ${GROUP_COLORS_TEXT[student.group as keyof typeof GROUP_COLORS_TEXT]}`}>
                         Group {student.group}
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