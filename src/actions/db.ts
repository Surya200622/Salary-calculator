"use server";

import { prisma } from "@/lib/prisma";
import { Employee, SalaryHistory, WorkLogEntry } from "@/lib/types";

// Employees
export async function getEmployees(): Promise<Employee[]> {
  try {
    const employees = await prisma.employee.findMany({
      include: { entries: true },
    });
    
    // Map Prisma models to our frontend types
    return employees.map((emp) => ({
      id: emp.id,
      name: emp.name,
      email: emp.email || undefined,
      image: emp.image || undefined,
      entries: emp.entries.map((entry) => ({
        id: entry.id,
        date: entry.date,
        fromTime: entry.fromTime || undefined,
        toTime: entry.toTime || undefined,
        loggedTime: entry.loggedTime,
        duration: entry.duration,
        totalMinutes: entry.totalMinutes,
        salary: entry.salary,
      })),
    }));
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    return [];
  }
}

export async function saveEmployeesToServer(employees: Employee[]): Promise<void> {
  // This is a complex operation: we need to upsert employees and their entries
  // For simplicity, we'll iterate and upsert
  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { id: emp.id },
      update: {
        name: emp.name,
        email: emp.email,
        image: emp.image,
      },
      create: {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        image: emp.image,
      },
    });

    // Handle entries: delete existing for this employee, insert new
    // This isn't the most efficient, but it matches the "save all" logic
    await prisma.workLog.deleteMany({
      where: { employeeId: emp.id },
    });

    if (emp.entries.length > 0) {
      await prisma.workLog.createMany({
        data: emp.entries.map((e) => ({
          id: e.id,
          employeeId: emp.id,
          date: e.date,
          fromTime: e.fromTime,
          toTime: e.toTime,
          loggedTime: e.loggedTime,
          duration: e.duration,
          totalMinutes: e.totalMinutes,
          salary: e.salary,
        })),
      });
    }
  }
}

// History Snapshots
export async function getHistory(): Promise<SalaryHistory[]> {
  try {
    const history = await prisma.historySnapshot.findMany({
      orderBy: { createdAt: "desc" },
    });
    
    return history.map((h) => ({
      id: h.id,
      name: h.name,
      createdAt: h.createdAt.toISOString(),
      entries: h.entriesJson ? JSON.parse(h.entriesJson) : [],
      hourlyRate: h.hourlyRate,
      totalSalary: h.totalSalary,
      totalMinutes: h.totalMinutes,
      totalDays: h.totalDays,
    }));
  } catch (error) {
    console.error("Failed to fetch history:", error);
    return [];
  }
}

export async function saveHistoryToServer(history: SalaryHistory): Promise<void> {
  await prisma.historySnapshot.upsert({
    where: { id: history.id },
    update: {
      name: history.name,
      entriesJson: JSON.stringify(history.entries),
      hourlyRate: history.hourlyRate,
      totalSalary: history.totalSalary,
      totalMinutes: history.totalMinutes,
      totalDays: history.totalDays,
    },
    create: {
      id: history.id,
      name: history.name,
      entriesJson: JSON.stringify(history.entries),
      hourlyRate: history.hourlyRate,
      totalSalary: history.totalSalary,
      totalMinutes: history.totalMinutes,
      totalDays: history.totalDays,
    },
  });
}

export async function deleteHistoryFromServer(id: string): Promise<void> {
  await prisma.historySnapshot.delete({
    where: { id },
  });
}

export async function clearAllHistoryFromServer(): Promise<void> {
  await prisma.historySnapshot.deleteMany({});
}

import { generateId, calculateStats } from "@/lib/salary-calculator";

export async function autoSaveMonthlySnapshots(): Promise<void> {
  const employees = await getEmployees();
  if (employees.length === 0) return;

  const existingHistory = await getHistory();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  let newHistoryAdded = false;

  for (const emp of employees) {
    const groups: Record<string, WorkLogEntry[]> = {};
    
    emp.entries.forEach((entry) => {
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

    for (const key of Object.keys(groups)) {
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
        await saveHistoryToServer(newSnapshot);
      }
    }
  }
}

export async function updateEmployeeProfileOnServer(email: string, name: string, image?: string): Promise<void> {
  const emp = await prisma.employee.findFirst({
    where: {
      OR: [
        { email },
        { name: email } // fallback for legacy matching
      ]
    }
  });

  if (emp) {
    await prisma.employee.update({
      where: { id: emp.id },
      data: { name, email, image }
    });
  }
}
