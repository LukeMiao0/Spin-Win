import React from 'react';
import { Student } from '../types';
import { UserCheck, RotateCcw, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface RollCallProps {
  students: Student[];
  onToggleAttendance: (id: string) => void;
  onCycleGroup: (id: string) => void;
  onMarkAbsent: (id: string) => void;
  onReset: () => void;
  onMarkAllPresent: () => void;
}

// Updated colors: Violet (Group 1), Orange (Group 2)
const GROUP_STYLES = {
  1: { bg: 'bg-violet-500', border: 'border-violet-600', text: 'text-violet-600', badge: 'text-violet-600' },
  2: { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-orange-600', badge: 'text-orange-600' },
};

export const RollCall: React.FC<RollCallProps> = ({ 
  students, 
  onToggleAttendance, 
  onCycleGroup, 
  onMarkAbsent, 
  onReset 
}) => {
  
  return (
    <div className="w-full mx-auto p-2">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-600" />
            Group Check-in
          </h2>
          <button 
            onClick={onReset}
            className="text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 border border-rose-100 text-sm"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Tap to check in (Randomly assigned Group 1 or 2). Tap again to switch groups. Click X to remove.
        </p>
      </div>

      {/* Grid 10 columns for desktop */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2">
        {students.map((student) => {
          const isPresent = student.isPresent;
          const groupStyle = (isPresent && student.group && GROUP_STYLES[student.group as keyof typeof GROUP_STYLES])
            ? GROUP_STYLES[student.group as keyof typeof GROUP_STYLES] 
            : null;

          return (
            <div key={student.id} className="relative group">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => isPresent ? onCycleGroup(student.id) : onToggleAttendance(student.id)}
                className={`
                  w-full h-full relative p-2 rounded-lg border transition-all duration-150 flex flex-col items-center justify-center min-h-[80px] shadow-sm
                  ${isPresent && groupStyle
                    ? `${groupStyle.bg} ${groupStyle.border} shadow-md` 
                    : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow'}
                `}
              >
                <span className={`font-bold text-sm leading-tight text-center w-full truncate px-1 ${isPresent ? 'text-white' : 'text-slate-700'}`}>
                  {student.name}
                </span>
                
                {isPresent && student.group && (
                  <div className="absolute -top-2 -right-2 bg-white text-xs font-black rounded-full w-6 h-6 flex items-center justify-center shadow-sm border border-slate-100 z-10">
                     <span className={groupStyle?.badge}>{student.group}</span>
                  </div>
                )}

                {!isPresent && (
                   <span className="text-[10px] text-slate-400 mt-1">Absent</span>
                )}
              </motion.button>

              {/* Separate remove button for present students */}
              {isPresent && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAbsent(student.id);
                  }}
                  className="absolute -top-2 -left-2 w-6 h-6 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center border border-slate-300 shadow-sm z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Mark Absent"
                >
                  <X className="w-3 h-3 text-slate-500" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};