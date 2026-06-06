"use client";

import { useState, useMemo } from "react";
import { Plus, CalendarDays, Clock, ArrowRight, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkLogEntry } from "@/lib/types";
import { generateId, calculateSalary, formatDuration, timeToMinutes, formatTime12h } from "@/lib/salary-calculator";

interface ManualEntryFormProps {
  hourlyRate: number;
  onAddEntry: (entry: WorkLogEntry) => void;
}

export function ManualEntryForm({ hourlyRate, onAddEntry }: ManualEntryFormProps) {
  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const [date, setDate] = useState(getTodayDate());
  const [isManuallyChanged, setIsManuallyChanged] = useState(false);
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");

  // Automatically refresh the date to the next day when midnight passes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isManuallyChanged) {
        const today = getTodayDate();
        if (date !== today) {
          setDate(today);
        }
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isManuallyChanged, date]);

  // Calculate duration between from and to
  const calculatedMinutes = useMemo(() => {
    if (!toTime) return 0;
    const from = timeToMinutes(fromTime);
    const to = timeToMinutes(toTime);
    if (from < 0 || to < 0) return 0;
    const diff = to - from;
    return diff > 0 ? diff : 0;
  }, [fromTime, toTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !fromTime) return;

    let salary = 0;
    let duration = "In Progress";
    let loggedTime = `${formatTime12h(fromTime)} - In Progress`;

    if (toTime && calculatedMinutes > 0) {
      salary = calculateSalary(calculatedMinutes, hourlyRate);
      duration = formatDuration(calculatedMinutes);
      loggedTime = `${formatTime12h(fromTime)} - ${formatTime12h(toTime)}`;
    }

    // Format date as DD-MM-YYYY safely without timezone shifting
    const [y, m, d] = date.split("-");
    const formattedDate = `${d}-${m}-${y}`;

    const entry: WorkLogEntry = {
      id: generateId(),
      date: formattedDate,
      fromTime,
      toTime,
      loggedTime,
      duration,
      totalMinutes: calculatedMinutes,
      salary,
    };

    onAddEntry(entry);
    setDate("");
    setFromTime("");
    setToTime("");
  };

  return (
    <Card className="border border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-2/15 text-chart-2">
            <Plus className="h-4 w-4" />
          </div>
          Manual Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Row 1: Date */}
          <div className="space-y-1.5">
            <Label htmlFor="manual-date" className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" />
              Date
            </Label>
            <Input
              id="manual-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setIsManuallyChanged(true);
              }}
              className="h-9 rounded-lg text-sm"
              required
            />
          </div>

          {/* Row 2: From - To time */}
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="manual-from-time" className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                From
              </Label>
              <Input
                id="manual-from-time"
                type="time"
                value={fromTime}
                onChange={(e) => setFromTime(e.target.value)}
                className="h-9 rounded-lg text-sm"
                required
              />
            </div>
            <div className="flex items-center justify-center h-9 px-1 text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="manual-to-time" className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                To (Optional)
              </Label>
              <Input
                id="manual-to-time"
                type="time"
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
                className="h-9 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Row 3: Duration preview + Add button */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {calculatedMinutes > 0 && (
                <Badge variant="secondary" className="rounded-lg text-xs gap-1.5 py-1 px-2.5 animate-fade-in">
                  <Timer className="h-3 w-3" />
                  {formatDuration(calculatedMinutes)} ({calculatedMinutes} mins)
                </Badge>
              )}
            </div>
            <Button
              type="submit"
              size="sm"
              className="h-9 rounded-lg gap-1.5"
              id="add-entry-btn"
              disabled={!date || !fromTime}
            >
              <Plus className="h-4 w-4" />
              {toTime ? "Add Entry" : "Clock In"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
