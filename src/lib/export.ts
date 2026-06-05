import { WorkLogEntry, DashboardStats } from "./types";
import { formatCurrency } from "./salary-calculator";

export function exportToCSV(entries: WorkLogEntry[], stats: DashboardStats): void {
  const headers = ["Date", "Logged Time", "Duration", "Total Minutes", "Salary (₹)"];
  const rows = entries.map((e) => [e.date, e.loggedTime, e.duration, e.totalMinutes.toString(), e.salary.toFixed(2)]);

  // Add summary rows
  rows.push([]);
  rows.push(["Summary"]);
  rows.push(["Total Working Days", stats.totalWorkingDays.toString()]);
  rows.push(["Total Minutes", stats.totalMinutesWorked.toString()]);
  rows.push(["Total Hours", stats.totalHoursWorked.toFixed(2)]);
  rows.push(["Total Salary", formatCurrency(stats.totalSalaryEarned)]);
  rows.push(["Average Daily Earnings", formatCurrency(stats.averageDailyEarnings)]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, "salary-report.csv");
}

export async function exportToExcel(entries: WorkLogEntry[], stats: DashboardStats): Promise<void> {
  const XLSX = await import("xlsx");

  const wsData = [
    ["Date", "Logged Time", "Duration", "Total Minutes", "Salary (₹)"],
    ...entries.map((e) => [e.date, e.loggedTime, e.duration, e.totalMinutes, e.salary]),
    [],
    ["Summary"],
    ["Total Working Days", stats.totalWorkingDays],
    ["Total Minutes", stats.totalMinutesWorked],
    ["Total Hours", stats.totalHoursWorked],
    ["Total Salary", stats.totalSalaryEarned],
    ["Average Daily Earnings", stats.averageDailyEarnings],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Salary Report");
  XLSX.writeFile(wb, "salary-report.xlsx");
}

export async function exportToPDF(
  entries: WorkLogEntry[],
  stats: DashboardStats,
  hourlyRate: number
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229); // Indigo
  doc.text("Part-Time Salary Report", 14, 22);

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated on ${new Date().toLocaleDateString("en-IN")} | Hourly Rate: ${formatCurrency(hourlyRate)}`, 14, 30);

  // Summary section
  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55);
  doc.text("Summary", 14, 42);

  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  const summaryY = 50;
  const summaryLines = [
    `Total Working Days: ${stats.totalWorkingDays}`,
    `Total Hours Worked: ${stats.totalHoursWorked.toFixed(2)}`,
    `Total Salary Earned: ${formatCurrency(stats.totalSalaryEarned)}`,
    `Average Daily Earnings: ${formatCurrency(stats.averageDailyEarnings)}`,
    `Highest Earning Day: ${stats.highestEarningDay ? `${stats.highestEarningDay.date} (${formatCurrency(stats.highestEarningDay.salary)})` : "N/A"}`,
    `Lowest Earning Day: ${stats.lowestEarningDay ? `${stats.lowestEarningDay.date} (${formatCurrency(stats.lowestEarningDay.salary)})` : "N/A"}`,
  ];
  summaryLines.forEach((line, i) => {
    doc.text(line, 14, summaryY + i * 7);
  });

  // Table
  autoTable(doc, {
    startY: summaryY + summaryLines.length * 7 + 10,
    head: [["Date", "Logged Time", "Duration", "Total Minutes", "Salary (₹)"]],
    body: entries.map((e) => [e.date, e.loggedTime, e.duration, e.totalMinutes.toString(), formatCurrency(e.salary)]),
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 243, 255] },
    styles: { fontSize: 9 },
    foot: [["Total", "", "", stats.totalMinutesWorked.toString(), formatCurrency(stats.totalSalaryEarned)]],
    footStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
  });

  doc.save("salary-report.pdf");
}

export function printReport(): void {
  window.print();
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
