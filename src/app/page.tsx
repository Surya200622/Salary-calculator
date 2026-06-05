"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { ManualEntryForm } from "@/components/upload/ManualEntryForm";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { DataTable } from "@/components/table/DataTable";
import { Charts } from "@/components/charts/Charts";
import { AiInsightsPanel } from "@/components/insights/AiInsightsPanel";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { EmployeeSelector } from "@/components/dashboard/EmployeeSelector";
import { WorkLogEntry, Employee } from "@/lib/types";
import {
  calculateSalary,
  calculateStats,
  generateInsights,
  formatDuration,
  generateId,
} from "@/lib/salary-calculator";
import { extractTableFromImage } from "@/lib/ocr-engine";
import { saveHistory, saveEmployees, loadEmployees } from "@/lib/storage";

const FIXED_HOURLY_RATE = 75;

export default function DashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [saveName, setSaveName] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    setMounted(true);
    const loaded = loadEmployees();
    setEmployees(loaded);
    if (loaded.length > 0) {
      setActiveEmployeeId(loaded[0].id);
    }
  }, []);

  // Save to local storage whenever employees change
  useEffect(() => {
    if (mounted) {
      saveEmployees(employees);
    }
  }, [employees, mounted]);

  const activeEmployee = useMemo(
    () => employees.find((e) => e.id === activeEmployeeId),
    [employees, activeEmployeeId]
  );

  const entries = activeEmployee?.entries || [];
  const stats = calculateStats(entries);
  const insights = generateInsights(entries);

  // Add a new employee
  const handleAddEmployee = useCallback((name: string) => {
    const newEmp: Employee = {
      id: generateId(),
      name,
      entries: [],
    };
    setEmployees((prev) => [...prev, newEmp]);
    setActiveEmployeeId(newEmp.id);
  }, []);

  // OCR extraction
  const handleImageSelected = useCallback(
    async (file: File) => {
      if (!activeEmployeeId) return;
      setIsProcessing(true);
      setOcrProgress(0);
      try {
        const extracted = await extractTableFromImage(
          file,
          FIXED_HOURLY_RATE,
          (p) => setOcrProgress(p)
        );
        if (extracted.length > 0) {
          setEmployees((prev) =>
            prev.map((emp) =>
              emp.id === activeEmployeeId
                ? { ...emp, entries: [...emp.entries, ...extracted] }
                : emp
            )
          );
        }
      } catch (err) {
        console.error("OCR error:", err);
      } finally {
        setIsProcessing(false);
        setOcrProgress(0);
      }
    },
    [activeEmployeeId]
  );

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
            if (updated.totalMinutes !== undefined) {
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
  const handleSaveSnapshot = () => {
    if (!saveName.trim() || entries.length === 0 || !activeEmployee) return;
    saveHistory({
      id: generateId(),
      name: `${activeEmployee.name} - ${saveName.trim()}`,
      createdAt: new Date().toISOString(),
      entries,
      hourlyRate: FIXED_HOURLY_RATE,
      totalSalary: stats.totalSalaryEarned,
      totalMinutes: stats.totalMinutesWorked,
      totalDays: stats.totalWorkingDays,
    });
    setSaveName("");
    setSaveDialogOpen(false);
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

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage employees, upload work logs & calculate salary (Fixed ₹75/hr)
          </p>
        </div>
        <div className="flex items-center gap-2">
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
                onKeyDown={(e) => e.key === "Enter" && handleSaveSnapshot()}
              />
              <DialogFooter>
                <Button onClick={handleSaveSnapshot} disabled={!saveName.trim()} className="rounded-xl gap-2">
                  <Save className="h-4 w-4" />
                  Save
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
        </div>
      </div>

      {/* Employee Selector */}
      <EmployeeSelector
        employees={employees}
        activeEmployeeId={activeEmployeeId}
        onSelectEmployee={setActiveEmployeeId}
        onAddEmployee={handleAddEmployee}
      />

      {!activeEmployeeId ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-2xl border-border/50 bg-card/30">
          <p className="text-muted-foreground">Add an employee to get started.</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Upload Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ImageUploader
              onImageSelected={handleImageSelected}
              isProcessing={isProcessing}
              progress={ocrProgress}
            />
            <ManualEntryForm hourlyRate={FIXED_HOURLY_RATE} onAddEntry={handleAddEntry} />
          </div>

          {/* Stats Cards */}
          {entries.length > 0 && <StatsCards stats={stats} />}

          {/* Data Table */}
          <DataTable
            entries={entries}
            onUpdateEntry={handleUpdateEntry}
            onDeleteEntry={handleDeleteEntry}
          />

          {/* Charts */}
          {entries.length > 0 && <Charts entries={entries} />}

          {/* AI Insights */}
          {entries.length > 0 && <AiInsightsPanel insights={insights} />}
        </div>
      )}
    </div>
  );
}
