"use client";

import { Download, FileSpreadsheet, FileText, Printer, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { WorkLogEntry, DashboardStats } from "@/lib/types";
import { exportToCSV, exportToExcel, exportToPDF, printReport } from "@/lib/export";

interface ExportMenuProps {
  entries: WorkLogEntry[];
  stats: DashboardStats;
  hourlyRate: number;
}

export function ExportMenu({ entries, stats, hourlyRate }: ExportMenuProps) {
  const disabled = entries.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl h-9"
            disabled={disabled}
            id="export-menu-btn"
          />
        }
      >
        <Download className="h-4 w-4" />
        Export
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl">
        <DropdownMenuItem
          onClick={() => exportToExcel(entries, stats)}
          className="gap-2 cursor-pointer rounded-lg"
        >
          <FileSpreadsheet className="h-4 w-4 text-chart-2" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => exportToCSV(entries, stats)}
          className="gap-2 cursor-pointer rounded-lg"
        >
          <FileDown className="h-4 w-4 text-chart-1" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => exportToPDF(entries, stats, hourlyRate)}
          className="gap-2 cursor-pointer rounded-lg"
        >
          <FileText className="h-4 w-4 text-chart-5" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={printReport}
          className="gap-2 cursor-pointer rounded-lg"
        >
          <Printer className="h-4 w-4 text-muted-foreground" />
          Print Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
