import { WorkLogEntry, DashboardStats, AiInsights } from "./types";

export function calculateSalary(totalMinutes: number, hourlyRate: number): number {
  return Number(((totalMinutes / 60) * hourlyRate).toFixed(2));
}

export function calculatePerMinuteRate(hourlyRate: number): number {
  return Number((hourlyRate / 60).toFixed(4));
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

export function calculateStats(entries: WorkLogEntry[]): DashboardStats {
  if (entries.length === 0) {
    return {
      totalWorkingDays: 0,
      totalMinutesWorked: 0,
      totalHoursWorked: 0,
      totalSalaryEarned: 0,
      averageDailyEarnings: 0,
      highestEarningDay: null,
      lowestEarningDay: null,
    };
  }

  const totalMinutesWorked = entries.reduce((sum, e) => sum + e.totalMinutes, 0);
  const totalSalaryEarned = entries.reduce((sum, e) => sum + e.salary, 0);

  const sorted = [...entries].sort((a, b) => b.salary - a.salary);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  return {
    totalWorkingDays: entries.length,
    totalMinutesWorked,
    totalHoursWorked: Number((totalMinutesWorked / 60).toFixed(2)),
    totalSalaryEarned: Number(totalSalaryEarned.toFixed(2)),
    averageDailyEarnings: Number((totalSalaryEarned / entries.length).toFixed(2)),
    highestEarningDay: { date: highest.date, salary: highest.salary },
    lowestEarningDay: { date: lowest.date, salary: lowest.salary },
  };
}

export function generateInsights(entries: WorkLogEntry[]): AiInsights {
  if (entries.length === 0) {
    return {
      averageHoursPerDay: 0,
      projectedMonthlyIncome: 0,
      projectedYearlyIncome: 0,
      mostProductiveDay: null,
      leastProductiveDay: null,
      revenueGrowthTrend: "stable",
      averageMinutesPerDay: 0,
      consistencyScore: 0,
    };
  }

  const totalMinutes = entries.reduce((sum, e) => sum + e.totalMinutes, 0);
  const averageMinutesPerDay = totalMinutes / entries.length;
  const averageHoursPerDay = Number((averageMinutesPerDay / 60).toFixed(2));

  const totalSalary = entries.reduce((sum, e) => sum + e.salary, 0);
  const avgDailySalary = totalSalary / entries.length;
  const projectedMonthlyIncome = Number((avgDailySalary * 22).toFixed(2)); // 22 working days
  const projectedYearlyIncome = Number((projectedMonthlyIncome * 12).toFixed(2));

  const sortedByMinutes = [...entries].sort((a, b) => b.totalMinutes - a.totalMinutes);
  const mostProductiveDay = {
    date: sortedByMinutes[0].date,
    minutes: sortedByMinutes[0].totalMinutes,
  };
  const leastProductiveDay = {
    date: sortedByMinutes[sortedByMinutes.length - 1].date,
    minutes: sortedByMinutes[sortedByMinutes.length - 1].totalMinutes,
  };

  // Revenue growth trend: compare first half vs second half
  let revenueGrowthTrend: "increasing" | "decreasing" | "stable" = "stable";
  if (entries.length >= 4) {
    const mid = Math.floor(entries.length / 2);
    const firstHalf = entries.slice(0, mid).reduce((sum, e) => sum + e.salary, 0) / mid;
    const secondHalf = entries.slice(mid).reduce((sum, e) => sum + e.salary, 0) / (entries.length - mid);
    const diff = ((secondHalf - firstHalf) / firstHalf) * 100;
    if (diff > 5) revenueGrowthTrend = "increasing";
    else if (diff < -5) revenueGrowthTrend = "decreasing";
  }

  // Consistency score: based on standard deviation of minutes
  const mean = averageMinutesPerDay;
  const variance = entries.reduce((sum, e) => sum + Math.pow(e.totalMinutes - mean, 2), 0) / entries.length;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / mean) * 100; // coefficient of variation
  const consistencyScore = Math.max(0, Math.min(100, Math.round(100 - cv * 2)));

  return {
    averageHoursPerDay,
    projectedMonthlyIncome,
    projectedYearlyIncome,
    mostProductiveDay,
    leastProductiveDay,
    revenueGrowthTrend,
    averageMinutesPerDay: Number(averageMinutesPerDay.toFixed(0)),
    consistencyScore,
  };
}

export function recalculateEntries(entries: WorkLogEntry[], hourlyRate: number): WorkLogEntry[] {
  return entries.map((entry) => ({
    ...entry,
    salary: calculateSalary(entry.totalMinutes, hourlyRate),
  }));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function parseMinutesFromDuration(duration: string): number {
  // Handle formats like "3h 58m", "238 mins", "238m", "3:58", "238"
  const cleaned = duration.trim().toLowerCase();

  // Format: "3h 58m" or "3h58m"
  const hmMatch = cleaned.match(/(\d+)\s*h\s*(\d+)\s*m/);
  if (hmMatch) {
    return parseInt(hmMatch[1]) * 60 + parseInt(hmMatch[2]);
  }

  // Format: "3h" (hours only)
  const hOnlyMatch = cleaned.match(/^(\d+)\s*h$/);
  if (hOnlyMatch) {
    return parseInt(hOnlyMatch[1]) * 60;
  }

  // Format: "238 mins" or "238m" or "238 min"
  const minMatch = cleaned.match(/(\d+)\s*m(?:ins?)?/);
  if (minMatch) {
    return parseInt(minMatch[1]);
  }

  // Format: "3:58" (hours:minutes)
  const colonMatch = cleaned.match(/(\d+):(\d+)/);
  if (colonMatch) {
    return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2]);
  }

  // Plain number (assume minutes)
  const numMatch = cleaned.match(/^(\d+)$/);
  if (numMatch) {
    return parseInt(numMatch[1]);
  }

  return 0;
}
