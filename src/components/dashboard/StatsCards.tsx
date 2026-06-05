"use client";

import {
  CalendarDays,
  Clock,
  Timer,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardStats } from "@/lib/types";
import { formatCurrency, formatDuration } from "@/lib/salary-calculator";

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Working Days",
      value: stats.totalWorkingDays.toString(),
      subtitle: "days tracked",
      icon: CalendarDays,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
      borderColor: "border-chart-1/20",
    },
    {
      title: "Total Minutes",
      value: stats.totalMinutesWorked.toLocaleString(),
      subtitle: "minutes logged",
      icon: Timer,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      borderColor: "border-chart-2/20",
    },
    {
      title: "Total Hours",
      value: stats.totalHoursWorked.toFixed(1),
      subtitle: "hours worked",
      icon: Clock,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      borderColor: "border-chart-3/20",
    },
    {
      title: "Total Salary",
      value: formatCurrency(stats.totalSalaryEarned),
      subtitle: "earned",
      icon: IndianRupee,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      borderColor: "border-chart-2/20",
      highlight: true,
    },
    {
      title: "Avg. Daily",
      value: formatCurrency(stats.averageDailyEarnings),
      subtitle: "per day",
      icon: BarChart3,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      borderColor: "border-chart-4/20",
    },
    {
      title: "Highest Day",
      value: stats.highestEarningDay ? formatCurrency(stats.highestEarningDay.salary) : "—",
      subtitle: stats.highestEarningDay?.date || "no data",
      icon: TrendingUp,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      borderColor: "border-chart-2/20",
    },
    {
      title: "Lowest Day",
      value: stats.lowestEarningDay ? formatCurrency(stats.lowestEarningDay.salary) : "—",
      subtitle: stats.lowestEarningDay?.date || "no data",
      icon: TrendingDown,
      color: "text-chart-5",
      bgColor: "bg-chart-5/10",
      borderColor: "border-chart-5/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {cards.map((card, index) => (
        <Card
          key={card.title}
          className={`relative overflow-hidden border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 animate-fade-in opacity-0 ${card.borderColor} stagger-${index + 1} ${
            card.highlight
              ? "col-span-2 sm:col-span-1 bg-gradient-to-br from-primary/5 to-primary/0"
              : ""
          }`}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start justify-between mb-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${card.bgColor} ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">{card.title}</p>
              <p className={`text-base sm:text-lg font-bold tracking-tight ${card.highlight ? "gradient-text" : ""}`}>
                {card.value}
              </p>
              <p className="text-[10px] text-muted-foreground/70">{card.subtitle}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
