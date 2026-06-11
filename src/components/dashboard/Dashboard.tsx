"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Save, RotateCcw, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ManualEntryForm } from "@/components/upload/ManualEntryForm";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { DataTable } from "@/components/table/DataTable";
import { Charts } from "@/components/charts/Charts";
import { AiInsightsPanel } from "@/components/insights/AiInsightsPanel";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { AdminOverviewTable } from "@/components/dashboard/AdminOverviewTable";
import { WorkLogEntry, Employee } from "@/lib/types";
import {
  calculateSalary,
  calculateStats,
  generateInsights,
  formatDuration,
  generateId,
  timeToMinutes,
  formatTime12h,
} from "@/lib/salary-calculator";
import { getEmployees, saveEmployeesToServer, autoSaveMonthlySnapshots, saveHistoryToServer } from "@/actions/db";

const FIXED_HOURLY_RATE = 75;

export function Dashboard({ role }: { role: "admin" | "employee" }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);

  const [selectedDay, setSelectedDay] = useState<number | "all">(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  const [saveName, setSaveName] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = role === "admin";
  const userEmail = session?.user?.email || "employee";

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load from database on mount
  useEffect(() => {
    setMounted(true);
    
    async function initData() {
      // Auto-save any previous months to history
      await autoSaveMonthlySnapshots();

      const loaded = await getEmployees();
      setEmployees(loaded);
      
      // Auto-select or create profile for regular employee
      if (status === "authenticated" && !isAdmin) {
        // Find either by email or name (for legacy support before email was added)
        const myProfile = loaded.find(e => e.email === userEmail || e.name === userEmail);
        if (myProfile) {
          // Automatically migrate to have email if it doesn't
          if (!myProfile.email) myProfile.email = userEmail;
          setActiveEmployeeId(myProfile.id);
        } else {
          // Create their personal profile
          const newEmp: Employee = { id: generateId(), name: session?.user?.name || userEmail, email: userEmail, entries: [] };
          setEmployees(prev => [...prev, newEmp]);
          setActiveEmployeeId(newEmp.id);
        }
      }
      setIsLoading(false);
    }
    
    if (status === "authenticated") {
      initData();
    }
  }, [status, isAdmin, userEmail, session?.user?.name]);

  // Save to database whenever employees change
  useEffect(() => {
    if (mounted && employees.length > 0 && !isLoading) {
      saveEmployeesToServer(employees);
    }
  }, [employees, mounted, isLoading]);

  const activeEmployee = useMemo(
    () => employees.find((e) => e.id === activeEmployeeId),
    [employees, activeEmployeeId]
  );

  const allEntries = activeEmployee?.entries || [];

  const entries = useMemo(() => {
    return allEntries.filter(entry => {
      const parts = entry.date.split("-");
      if (parts.length === 3) {
        const entryDay = parseInt(parts[0], 10);
        const entryMonth = parseInt(parts[1], 10) - 1;
        const entryYear = parseInt(parts[2], 10);
        
        const monthYearMatch = entryMonth === selectedMonth && entryYear === selectedYear;
        if (!monthYearMatch) return false;
        
        if (selectedDay !== "all") {
           return entryDay === selectedDay;
        }
        return true;
      }
      return true;
    });
  }, [allEntries, selectedDay, selectedMonth, selectedYear]);

  const stats = calculateStats(entries);
  const insights = generateInsights(entries);

  // Add a new employee (Admin only)
  const handleAddEmployee = useCallback((name: string) => {
    const newEmp: Employee = {
      id: generateId(),
      name,
      entries: [],
    };
    setEmployees((prev) => [...prev, newEmp]);
    setActiveEmployeeId(newEmp.id);
  }, []);

  // Manual entry
  const handleAddEntry = useCallback(
    (entry: WorkLogEntry) => {
      if (!activeEmployeeId) return;
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === activeEmployeeId
            ? { ...emp, entries: [...emp.entries, entry] }
            : emp
        )
      );
    },
    [activeEmployeeId]
  );

  // Update entry
  const handleUpdateEntry = useCallback(
    (entryId: string, updated: Partial<WorkLogEntry>) => {
      if (!activeEmployeeId) return;
      setEmployees((prev) =>
        prev.map((emp) => {
          if (emp.id !== activeEmployeeId) return emp;
          const newEntries = emp.entries.map((e) => {
            if (e.id !== entryId) return e;
            const newEntry = { ...e, ...updated };
            if (updated.fromTime !== undefined || updated.toTime !== undefined) {
              const fromTime = updated.fromTime !== undefined ? updated.fromTime : newEntry.fromTime;
              const toTime = updated.toTime !== undefined ? updated.toTime : newEntry.toTime;
              newEntry.fromTime = fromTime;
              newEntry.toTime = toTime;

              if (fromTime && toTime) {
                const calculatedMinutes = Math.max(0, timeToMinutes(toTime) - timeToMinutes(fromTime));
                newEntry.totalMinutes = calculatedMinutes;
                newEntry.salary = calculateSalary(calculatedMinutes, FIXED_HOURLY_RATE);
                newEntry.duration = formatDuration(calculatedMinutes);
                newEntry.loggedTime = `${formatTime12h(fromTime)} - ${formatTime12h(toTime)}`;
              } else if (fromTime) {
                newEntry.totalMinutes = 0;
                newEntry.salary = 0;
                newEntry.duration = "In Progress";
                newEntry.loggedTime = `${formatTime12h(fromTime)} - In Progress`;
              }
            } else if (updated.totalMinutes !== undefined) {
              newEntry.salary = calculateSalary(updated.totalMinutes, FIXED_HOURLY_RATE);
              newEntry.duration = formatDuration(updated.totalMinutes);
              newEntry.loggedTime = `${updated.totalMinutes} mins`;
            }
            return newEntry;
          });
          return { ...emp, entries: newEntries };
        })
      );
    },
    [activeEmployeeId]
  );

  // Delete entry
  const handleDeleteEntry = useCallback(
    (entryId: string) => {
      if (!activeEmployeeId) return;
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === activeEmployeeId
            ? { ...emp, entries: emp.entries.filter((e) => e.id !== entryId) }
            : emp
        )
      );
    },
    [activeEmployeeId]
  );

  // Save to history (creates snapshot)
  const handleSaveHistory = async () => {
    if (!saveName.trim() || !activeEmployee) return;
    setIsLoading(true);
    await saveHistoryToServer({
      id: generateId(),
      name: saveName.trim(),
      createdAt: new Date().toISOString(),
      entries: entries,
      hourlyRate: FIXED_HOURLY_RATE,
      totalSalary: stats.totalSalaryEarned,
      totalMinutes: stats.totalMinutesWorked,
      totalDays: stats.totalWorkingDays,
    });
    setSaveName("");
    setSaveDialogOpen(false);
    setIsLoading(false);
  };

  // Reset active employee entries
  const handleReset = () => {
    if (!activeEmployeeId) return;
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === activeEmployeeId ? { ...emp, entries: [] } : emp
      )
    );
  };

  if (!mounted || status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            <span className="gradient-text">
              {isAdmin ? "Admin Dashboard" : "My Dashboard"}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin 
              ? "Manage employees, upload work logs & calculate salary" 
              : "Upload your work logs & track your earnings"} (Fixed ₹75/hr)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Select value={selectedDay.toString()} onValueChange={(v) => setSelectedDay(v === "all" ? "all" : parseInt(v as string, 10))}>
            <SelectTrigger className="w-[80px] rounded-xl h-9">
              <SelectValue>{selectedDay === "all" ? "All Days" : selectedDay}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {Array.from({ length: daysInMonth }).map((_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v as string, 10))}>
            <SelectTrigger className="w-[110px] rounded-xl h-9">
              <SelectValue>{new Date(0, selectedMonth).toLocaleString("default", { month: "short" })}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }).map((_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {new Date(0, i).toLocaleString("default", { month: "short" })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v as string, 10))}>
            <SelectTrigger className="w-[90px] rounded-xl h-9">
              <SelectValue>{selectedYear}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 35 }).map((_, i) => {
                const year = 2026 + i;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <div className="w-px h-6 bg-border mx-1 hidden sm:block"></div>

          <ExportMenu entries={entries} stats={stats} hourlyRate={FIXED_HOURLY_RATE} />

          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger
              render={
                <Button
                  size="sm"
                  className="gap-2 rounded-xl h-9"
                  disabled={entries.length === 0}
                  id="save-btn"
                />
              }
            >
              <Save className="h-4 w-4" />
              Save Snapshot
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Save Snapshot</DialogTitle>
                <DialogDescription>
                  Give this snapshot a name to save it to your history.
                </DialogDescription>
              </DialogHeader>
              <Input
                placeholder="e.g. May 2026 Work Log"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="rounded-xl"
                id="save-name-input"
                onKeyDown={(e) => e.key === "Enter" && handleSaveHistory()}
              />
              <DialogFooter>
                <Button onClick={handleSaveHistory} disabled={!saveName.trim() || isLoading} className="rounded-xl gap-2">
                  <Save className="h-4 w-4" />
                  {isLoading ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-2 rounded-xl h-9"
            disabled={entries.length === 0}
          >
            <RotateCcw className="h-4 w-4" />
            Clear Logs
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="gap-2 rounded-xl h-9 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {isAdmin && !activeEmployeeId ? (
        <AdminOverviewTable
          employees={employees.filter(emp => emp.email !== userEmail && emp.name !== userEmail)}
          selectedDay={selectedDay}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onViewEmployee={setActiveEmployeeId}
          onAddEmployee={handleAddEmployee}
        />
      ) : !activeEmployeeId ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-2xl border-border/50 bg-card/30">
          <p className="text-muted-foreground">Add an employee to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 animate-fade-in">
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveEmployeeId(null)}
              className="gap-2 text-muted-foreground hover:text-foreground mb-2 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to All Employees
            </Button>
          )}
          {/* Entry Section */}
          {!isAdmin && (
            <div className="w-full lg:w-1/2 order-1">
              <ManualEntryForm hourlyRate={FIXED_HOURLY_RATE} onAddEntry={handleAddEntry} />
            </div>
          )}

          {/* Stats Cards */}
          {entries.length > 0 && (
            <div className="order-3 lg:order-2 w-full">
              <StatsCards stats={stats} />
            </div>
          )}

          {/* Data Table */}
          <div className="order-2 lg:order-3 w-full">
            <DataTable
              entries={entries}
              onUpdateEntry={handleUpdateEntry}
              onDeleteEntry={handleDeleteEntry}
              readOnly={isAdmin}
            />
          </div>

          {/* Charts */}
          {entries.length > 0 && (
            <div className="order-4 w-full">
              <Charts entries={entries} />
            </div>
          )}

          {/* AI Insights */}
          {entries.length > 0 && (
            <div className="order-5 w-full">
              <AiInsightsPanel insights={insights} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
