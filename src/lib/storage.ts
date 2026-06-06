import { SalaryHistory } from "./types";

const STORAGE_KEY = "salary-calculator-history";

export function saveHistory(history: SalaryHistory): void {
  if (typeof window === "undefined") return;
  const existing = loadAllHistory();
  const index = existing.findIndex((h) => h.id === history.id);
  if (index >= 0) {
    existing[index] = history;
  } else {
    existing.unshift(history);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function loadAllHistory(): SalaryHistory[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function loadHistory(id: string): SalaryHistory | null {
  const all = loadAllHistory();
  return all.find((h) => h.id === id) || null;
}

export function deleteHistory(id: string): void {
  if (typeof window === "undefined") return;
  const existing = loadAllHistory();
  const filtered = existing.filter((h) => h.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function clearAllHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

const EMPLOYEES_STORAGE_KEY = "salary-calculator-employees";

export function saveEmployees(employees: import("./types").Employee[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
}

export function loadEmployees(): import("./types").Employee[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function updateEmployeeProfile(email: string, name: string, image?: string): void {
  if (typeof window === "undefined") return;
  const employees = loadEmployees();
  let updated = false;
  const newEmployees = employees.map(emp => {
    if (emp.email === email || (!emp.email && emp.name === email)) {
      updated = true;
      return { ...emp, name, image, email };
    }
    return emp;
  });
  if (updated) {
    saveEmployees(newEmployees);
  }
}
import { generateId, calculateStats } from "./salary-calculator";

export function autoSaveMonthlySnapshots(): void {
  if (typeof window === "undefined") return;
  const employees = loadEmployees();
  if (employees.length === 0) return;

  const existingHistory = loadAllHistory();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  let newHistoryAdded = false;

  employees.forEach(emp => {
    const groups: Record<string, import("./types").WorkLogEntry[]> = {};
    
    emp.entries.forEach(entry => {
      const parts = entry.date.split("-");
      if (parts.length === 3) {
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        
        if (y < currentYear || (y === currentYear && m < currentMonth)) {
          const key = `${y}-${m}`;
          if (!groups[key]) groups[key] = [];
          groups[key].push(entry);
        }
      }
    });

    Object.keys(groups).forEach(key => {
      const [y, m] = key.split("-").map(Number);
      const monthName = new Date(0, m).toLocaleString("default", { month: "long" });
      const snapshotName = `${emp.name} - ${monthName} ${y} (Auto-Saved)`;

      const alreadySaved = existingHistory.some(h => h.name === snapshotName);
      
      if (!alreadySaved) {
        const stats = calculateStats(groups[key]);
        const newSnapshot: SalaryHistory = {
          id: generateId(),
          name: snapshotName,
          createdAt: new Date().toISOString(),
          entries: groups[key],
          hourlyRate: 75,
          totalSalary: stats.totalSalaryEarned,
          totalMinutes: stats.totalMinutesWorked,
          totalDays: stats.totalWorkingDays,
        };
        existingHistory.unshift(newSnapshot);
        newHistoryAdded = true;
      }
    });
  });

  if (newHistoryAdded) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingHistory));
  }
}
