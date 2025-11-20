export interface Student {
  id: string;
  name: string;
  isPresent: boolean;
  group?: number; // 1-6
  score: number;
  lastPicked?: number; // Timestamp
}

export enum AppView {
  ATTENDANCE = 'ATTENDANCE',
  PICKER = 'PICKER',
  LEADERBOARD = 'LEADERBOARD',
}

export interface QuestionResponse {
  question: string;
  answer?: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  action: 'CHECK_IN' | 'ABSENT' | 'PICKED' | 'SCORE' | 'SKIP';
  studentId?: string;
  studentName?: string;
  details?: string | number;
}