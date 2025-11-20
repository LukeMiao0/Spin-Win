import React, { useState } from 'react';
import { Student } from '../types';
import { UserCheck, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface RollCallProps {
  students: Student[];
  onToggleAttendance: (id: string, group: number) => void;
  onReset: () => void;
  onMarkAllPresent: () => void;
}

const GROUP_COLORS = {
  1: 'bg-red-500 border-red-600',
  2: 'bg-blue-500 border-blue-600',
};

const GROUP_TEXT = {
  1: 'text-red-600',
  2: 'text-blue-600',
};

export const RollCall: React.FC<RollCallProps> = ({ students, onToggleAttendance, onReset, onMarkAllPresent }) => {
  const [selectedGroup, setSelectedGroup] = useState<number>(1);

  return (
    <div className="w-full mx-auto p-2">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 sticky top-0 z-40">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-indigo-600" />
              Group Check-in
            </h2>
            <div className="flex gap-2 text-xs sm:text-sm">
               <button 
                onClick={onReset}
                className="text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 border border-rose-100"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>

          {/* Group Selector Toolbar */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Select Group to Assign:</span>
            <div className="flex flex-wrap justify-center gap-2">
              {[1, 2].map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedGroup(num)}
                  className={`
                    w-12 h-12 rounded-full font-bold text-xl shadow-sm transition-all transform hover:scale-105 flex items-center justify-center border-2
                    ${selectedGroup === num 
                      ? `${GROUP_COLORS[num as keyof typeof GROUP_COLORS]} text-white ring-2 ring-offset-2 ring-slate-300 scale-110` 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-400 hidden sm:block border-l border-slate-200 pl-4">
              Click a student below to assign them to Group {selectedGroup}
            </div>
          </div>
        </div>
      </div>

      {/* Grid 10 columns for desktop */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2">
        {students.map((student) => {
          const isSelectedGroup = student.group === selectedGroup;
          
          return (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={student.id}
              onClick={() => onToggleAttendance(student.id, selectedGroup)}
              className={`
                relative group p-2 rounded-lg border transition-all duration-150 flex flex-col items-center justify-center min-h-[80px] shadow-sm
                ${student.isPresent && student.group
                  ? `${GROUP_COLORS[student.group as keyof typeof GROUP_COLORS]} shadow-md` 
                  : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow'}
              `}
            >
              <span className={`font-bold text-sm leading-tight text-center w-full truncate px-1 ${student.isPresent ? 'text-white' : 'text-slate-700'}`}>
                {student.name}
              </span>
              
              {student.isPresent && student.group && (
                <div className="absolute -top-2 -right-2 bg-white text-xs font-black rounded-full w-6 h-6 flex items-center justify-center shadow-sm border border-slate-100 z-10">
                   <span className={GROUP_TEXT[student.group as keyof typeof GROUP_TEXT]}>{student.group}</span>
                </div>
              )}

              {!student.isPresent && (
                 <span className="text-[10px] text-slate-400 mt-1">Absent</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};