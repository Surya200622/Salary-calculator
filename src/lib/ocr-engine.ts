import { WorkLogEntry } from "./types";
import { generateId, parseMinutesFromDuration, calculateSalary, formatDuration } from "./salary-calculator";

export async function extractTableFromImage(
  imageFile: File,
  hourlyRate: number,
  onProgress?: (progress: number) => void
): Promise<WorkLogEntry[]> {
  // Dynamic import to avoid SSR issues
  const Tesseract = await import("tesseract.js");

  const result = await Tesseract.recognize(imageFile, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  const text = result.data.text;
  return parseExtractedText(text, hourlyRate);
}

function parseExtractedText(text: string, hourlyRate: number): WorkLogEntry[] {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  const entries: WorkLogEntry[] = [];

  for (const line of lines) {
    const entry = parseLine(line, hourlyRate);
    if (entry) {
      entries.push(entry);
    }
  }

  return entries;
}

function parseLine(line: string, hourlyRate: number): WorkLogEntry | null {
  // Try to extract date pattern
  const datePatterns = [
    /(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/, // DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
    /(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/, // YYYY-MM-DD
  ];

  let dateStr: string | null = null;
  for (const pattern of datePatterns) {
    const match = line.match(pattern);
    if (match) {
      dateStr = match[1];
      break;
    }
  }

  if (!dateStr) return null;

  // Try to extract duration/minutes
  const durationPatterns = [
    /(\d+)\s*(?:mins?|minutes?)/i,
    /(\d+)\s*h\s*(\d+)\s*m/i,
    /(\d+):(\d+)/,
  ];

  let totalMinutes = 0;
  let durationStr = "";

  for (const pattern of durationPatterns) {
    const match = line.match(pattern);
    if (match) {
      if (match[2] !== undefined) {
        // hours:minutes format
        totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
      } else {
        totalMinutes = parseInt(match[1]);
      }
      durationStr = match[0];
      break;
    }
  }

  // If no duration pattern matched, try to find any number that could be minutes
  if (totalMinutes === 0) {
    const numbers = line.match(/\b(\d{2,3})\b/g);
    if (numbers) {
      // Pick the most likely minutes value (between 30 and 600)
      for (const num of numbers) {
        const n = parseInt(num);
        if (n >= 30 && n <= 600) {
          totalMinutes = n;
          durationStr = `${n} mins`;
          break;
        }
      }
    }
  }

  if (totalMinutes === 0) return null;

  const salary = calculateSalary(totalMinutes, hourlyRate);
  const duration = formatDuration(totalMinutes);

  return {
    id: generateId(),
    date: dateStr,
    loggedTime: durationStr || `${totalMinutes} mins`,
    duration,
    totalMinutes,
    salary,
  };
}
