"use client";

import { useMemo, useState } from "react";
import { User, ChevronRight, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Employee } from "@/lib/types";
import { calculateStats, formatCurrency, formatDuration } from "@/lib/salary-calculator";

interface AdminOverviewTableProps {
  employees: Employee[];
  selectedDay: number | "all";
  selectedMonth: number;
  selectedYear: number;
  onViewEmployee: (id: string) => void;
  onAddEmployee: (name: string) => void;
}

export function AdminOverviewTable({
  employees,
  selectedDay,
  selectedMonth,
  selectedYear,
  onViewEmployee,
  onAddEmployee,
}: AdminOverviewTableProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    if (newName.trim()) {
      onAddEmployee(newName.trim());
      setNewName("");
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") setIsAdding(false);
  };

  // Compute aggregated stats for all employees filtered by day/month/year
  const overviewData = useMemo(() => {
    return employees.map((emp) => {
      const filteredEntries = emp.entries.filter((entry) => {
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
      const stats = calculateStats(filteredEntries);
      return {
        ...emp,
        filteredEntriesCount: filteredEntries.length,
        stats,
      };
    }).sort((a, b) => b.stats.totalSalaryEarned - a.stats.totalSalaryEarned);
  }, [employees, selectedDay, selectedMonth, selectedYear]);

  const { totalPayout, totalTime } = useMemo(() => {
    return overviewData.reduce(
      (acc, emp) => {
        acc.totalPayout += emp.stats.totalSalaryEarned;
        acc.totalTime += emp.stats.totalMinutesWorked;
        return acc;
      },
      { totalPayout: 0, totalTime: 0 }
    );
  }, [overviewData]);

  const handleExportCSV = () => {
    const headers = ["Employee Name", "Email", "Entries Count", "Total Hours", "Total Salary"];
    const rows = overviewData.map(emp => [
      emp.name,
      emp.email || "Manual Entry",
      emp.filteredEntriesCount.toString(),
      formatDuration(emp.stats.totalMinutesWorked),
      emp.stats.totalSalaryEarned.toString()
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `admin_overview_${selectedMonth + 1}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="border border-border/50 shadow-sm animate-fade-in opacity-0 stagger-2">
      <CardHeader className="pb-4 flex flex-col items-start gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-graphics.webp" alt="Logo" className="h-6 w-auto dark:brightness-0 dark:invert" />
              Employees Overview
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              View aggregated attendance and salary details for all registered and manually added employees.
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-2 rounded-xl h-9"
            >
              Export CSV
            </Button>
            
            {isAdding ? (
              <div className="flex items-center gap-2 animate-fade-in">
                <Input
                  autoFocus
                  placeholder="Employee name..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => {
                    if (!newName.trim()) setIsAdding(false);
                  }}
                  className="h-9 w-40 rounded-xl text-sm"
                />
                <Button size="sm" onClick={handleAdd} className="h-9 rounded-xl">
                  Save
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(true)}
                className="gap-2 rounded-xl h-9 text-primary hover:bg-primary/5 border-primary/20 hover:border-primary/50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Employee
              </Button>
            )}
          </div>
        </div>

        {/* Global Stats */}
        <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl bg-muted/30 border border-border/40 w-full">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Payout</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalPayout)}</p>
          </div>
          <div className="w-px h-8 bg-border/50 hidden sm:block"></div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Time</p>
            <p className="text-xl font-semibold">{formatDuration(totalTime)}</p>
          </div>
          <div className="w-px h-8 bg-border/50 hidden sm:block"></div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Employees</p>
            <p className="text-xl font-semibold">{overviewData.filter(e => e.filteredEntriesCount > 0).length} / {overviewData.length}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6 py-3 font-semibold text-foreground">Employee Profile</TableHead>
                <TableHead className="font-semibold text-foreground">Email</TableHead>
                <TableHead className="font-semibold text-foreground text-center">Entries</TableHead>
                <TableHead className="font-semibold text-foreground text-center">Total Time</TableHead>
                <TableHead className="font-semibold text-foreground text-right pr-6">Total Salary</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overviewData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No employees found. Employees will appear here once registered.
                  </TableCell>
                </TableRow>
              ) : (
                overviewData.map((emp) => (
                  <TableRow
                    key={emp.id}
                    className="group transition-colors duration-150 cursor-pointer hover:bg-muted/50"
                    onClick={() => onViewEmployee(emp.id)}
                  >
                    <TableCell className="pl-6 py-3">
                      <div className="flex items-center gap-3">
                        {emp.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={emp.image} alt={emp.name} className="h-9 w-9 rounded-full object-cover border border-border/50 bg-background/50" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {emp.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {emp.email || <span className="opacity-50 italic">Manual Entry</span>}
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium">
                      {emp.filteredEntriesCount}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {formatDuration(emp.stats.totalMinutesWorked)}
                    </TableCell>
                    <TableCell className="text-right pr-6 font-bold text-primary">
                      {formatCurrency(emp.stats.totalSalaryEarned)}
                    </TableCell>
                    <TableCell className="pr-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
