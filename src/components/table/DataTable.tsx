"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkLogEntry, SortDirection, SortField } from "@/lib/types";
import { formatCurrency } from "@/lib/salary-calculator";

interface DataTableProps {
  entries: WorkLogEntry[];
  onUpdateEntry: (id: string, updated: Partial<WorkLogEntry>) => void;
  onDeleteEntry: (id: string) => void;
  readOnly?: boolean;
}

const PAGE_SIZE = 10;

export function DataTable({ entries, onUpdateEntry, onDeleteEntry, readOnly = false }: DataTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<WorkLogEntry>>({});

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.date.toLowerCase().includes(q) ||
        e.loggedTime.toLowerCase().includes(q) ||
        e.duration.toLowerCase().includes(q) ||
        e.totalMinutes.toString().includes(q) ||
        e.salary.toString().includes(q)
    );
  }, [entries, search]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortField === "date") {
        // Parse DD-MM-YYYY for proper date sorting
        const parseDate = (d: string) => {
          const parts = d.split(/[-/.]/);
          if (parts.length === 3) {
            if (parts[0].length === 4) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          }
          return new Date(d);
        };
        comparison = parseDate(a.date).getTime() - parseDate(b.date).getTime();
      } else if (sortField === "totalMinutes") {
        comparison = a.totalMinutes - b.totalMinutes;
      } else if (sortField === "salary") {
        comparison = a.salary - b.salary;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filtered, sortField, sortDirection]);

  // Paginate
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 text-primary" />
    );
  };

  const startEdit = (entry: WorkLogEntry) => {
    setEditingId(entry.id);
    setEditValues({ 
      date: entry.date, 
      totalMinutes: entry.totalMinutes,
      fromTime: entry.fromTime,
      toTime: entry.toTime
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = (id: string) => {
    if (Object.keys(editValues).length > 0) {
      onUpdateEntry(id, editValues);
    }
    setEditingId(null);
    setEditValues({});
  };

  return (
    <Card className="border border-border/50 animate-fade-in opacity-0 stagger-3">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            Work Log
            <Badge variant="secondary" className="rounded-md text-xs font-normal">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </Badge>
          </CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entries..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-9 pl-9 rounded-lg text-sm"
              id="search-entries"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("date")}
                >
                  <div className="flex items-center text-xs font-semibold">
                    Date <SortIcon field="date" />
                  </div>
                </TableHead>
                <TableHead className="text-xs font-semibold">Logged Time</TableHead>
                <TableHead className="text-xs font-semibold">Duration</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("totalMinutes")}
                >
                  <div className="flex items-center text-xs font-semibold">
                    Total Mins <SortIcon field="totalMinutes" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("salary")}
                >
                  <div className="flex items-center text-xs font-semibold">
                    Salary <SortIcon field="salary" />
                  </div>
                </TableHead>
                {!readOnly && (
                  <TableHead className="text-xs font-semibold text-right w-24">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                    {search ? "No matching entries found" : "No entries yet. Upload an image or add manually."}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="group transition-colors duration-150"
                  >
                    <TableCell className="text-sm font-medium">
                      {editingId === entry.id ? (
                        <Input
                          value={editValues.date || ""}
                          onChange={(e) => setEditValues((v) => ({ ...v, date: e.target.value }))}
                          className="h-7 w-28 text-xs rounded"
                        />
                      ) : (
                        entry.date
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {editingId === entry.id && entry.fromTime !== undefined ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="time"
                            value={editValues.fromTime || ""}
                            onChange={(e) => setEditValues((v) => ({ ...v, fromTime: e.target.value }))}
                            className="h-7 w-24 text-xs rounded"
                          />
                          <span>-</span>
                          <Input
                            type="time"
                            value={editValues.toTime || ""}
                            onChange={(e) => setEditValues((v) => ({ ...v, toTime: e.target.value }))}
                            className="h-7 w-24 text-xs rounded"
                          />
                        </div>
                      ) : (
                        entry.loggedTime
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{entry.duration}</TableCell>
                    <TableCell className="text-sm">
                      {editingId === entry.id && entry.fromTime === undefined ? (
                        <Input
                          type="number"
                          value={editValues.totalMinutes || 0}
                          onChange={(e) => setEditValues((v) => ({ ...v, totalMinutes: Number(e.target.value) }))}
                          className="h-7 w-20 text-xs rounded"
                        />
                      ) : (
                        <span className="font-medium">{entry.totalMinutes}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-primary">
                      {formatCurrency(entry.salary)}
                    </TableCell>
                    {!readOnly && (
                      <TableCell className="text-right">
                        {editingId === entry.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-chart-2 hover:text-chart-2 hover:bg-chart-2/10"
                              onClick={() => saveEdit(entry.id)}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={cancelEdit}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => startEdit(entry)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => onDeleteEntry(entry.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8 text-xs"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
