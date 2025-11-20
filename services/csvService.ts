import { Student, HistoryEntry } from '../types';

export const exportDataToCSV = (students: Student[], history: HistoryEntry[]) => {
  // 1. Create Summary CSV Content
  const headers = ['Student Name', 'Present', 'Total Score'];
  const rows = students.map(s => [
    s.name,
    s.isPresent ? 'Yes' : 'No',
    s.score
  ]);

  // 2. Create History Log Content
  const logHeaders = ['Timestamp', 'Action', 'Student Name', 'Details'];
  const logRows = history.map(h => [
    new Date(h.timestamp).toLocaleString(),
    h.action,
    h.studentName || 'N/A',
    h.details || ''
  ]);

  // Combine into one file (or just prioritize the log for this specific request which asked for a record of picks)
  // Let's make a comprehensive CSV
  
  let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM for Excel support
  
  csvContent += "--- STUDENT SUMMARY ---\n";
  csvContent += headers.join(",") + "\n";
  csvContent += rows.map(e => e.join(",")).join("\n");
  
  csvContent += "\n\n--- ACTIVITY LOG ---\n";
  csvContent += logHeaders.join(",") + "\n";
  csvContent += logRows.map(e => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `class_record_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};