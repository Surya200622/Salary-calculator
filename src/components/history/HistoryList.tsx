"use client";

import { useEffect, useState } from "react";
import { History, Trash2, Clock, IndianRupee, CalendarDays, ArrowRight, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SalaryHistory } from "@/lib/types";
import { loadAllHistory, deleteHistory, clearAllHistory } from "@/lib/storage";
import { formatCurrency } from "@/lib/salary-calculator";
import Link from "next/link";

export function HistoryList() {
  const [history, setHistory] = useState<SalaryHistory[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHistory(loadAllHistory());
  }, []);

  const handleDelete = (id: string) => {
    deleteHistory(id);
    setHistory(loadAllHistory());
  };

  const handleClearAll = () => {
    clearAllHistory();
    setHistory([]);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <History className="h-5 w-5" />
            </div>
            Salary History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage your saved salary calculations
          </p>
        </div>
        {history.length > 0 && (
          <Dialog>
            <DialogTrigger
              render={
                <Button variant="outline" size="sm" className="gap-2 rounded-xl text-destructive hover:text-destructive" />
              }
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Clear All History
                </DialogTitle>
                <DialogDescription>
                  This will permanently delete all saved salary calculations. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="destructive" onClick={handleClearAll} className="rounded-xl gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete All
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {history.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <History className="h-8 w-8" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">No saved calculations</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your salary calculations will appear here after you save them.
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {history.map((item, index) => (
            <Card
              key={item.id}
              className={`group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border border-border/50 animate-fade-in opacity-0 stagger-${Math.min(index + 1, 7)}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold truncate">{item.name}</h3>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {item.entries.length} entries
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(item.createdAt).toLocaleDateString("en-IN")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.totalDays} days
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-primary">
                        <IndianRupee className="h-3 w-3" />
                        {formatCurrency(item.totalSalary)}
                      </span>
                      <span className="text-muted-foreground/60">
                        @ ₹{item.hourlyRate}/hr
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
