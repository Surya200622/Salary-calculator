export interface WorkLogEntry {
  id: string;
  date: string;
  loggedTime: string;
  duration: string;
  totalMinutes: number;
  salary: number;
}

export interface Employee {
  id: string;
  name: string;
  entries: WorkLogEntry[];
}

export interface SalaryHistory {
  id: string;
  name: string;
  createdAt: string;
  entries: WorkLogEntry[];
  hourlyRate: number;
  totalSalary: number;
  totalMinutes: number;
  totalDays: number;
}

export interface DashboardStats {
  totalWorkingDays: number;
  totalMinutesWorked: number;
  totalHoursWorked: number;
  totalSalaryEarned: number;
  averageDailyEarnings: number;
  highestEarningDay: { date: string; salary: number } | null;
  lowestEarningDay: { date: string; salary: number } | null;
}

export interface AiInsights {
  averageHoursPerDay: number;
  projectedMonthlyIncome: number;
  projectedYearlyIncome: number;
  mostProductiveDay: { date: string; minutes: number } | null;
  leastProductiveDay: { date: string; minutes: number } | null;
  revenueGrowthTrend: "increasing" | "decreasing" | "stable";
  averageMinutesPerDay: number;
  consistencyScore: number; // 0-100
}

export type SortDirection = "asc" | "desc";
export type SortField = keyof Pick<WorkLogEntry, "date" | "totalMinutes" | "salary">;

export interface ExportOptions {
  format: "excel" | "csv" | "pdf";
  entries: WorkLogEntry[];
  stats: DashboardStats;
  hourlyRate: number;
}
