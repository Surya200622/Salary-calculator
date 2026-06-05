"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Clock, BarChart3, PieChart as PieIcon } from "lucide-react";
import { WorkLogEntry } from "@/lib/types";
import { formatCurrency } from "@/lib/salary-calculator";

interface ChartsProps {
  entries: WorkLogEntry[];
}

const CHART_COLORS = [
  "hsl(262, 80%, 55%)", // indigo/violet
  "hsl(160, 60%, 50%)", // teal
  "hsl(40, 80%, 55%)",  // amber
  "hsl(290, 65%, 55%)", // purple
  "hsl(10, 75%, 55%)",  // coral
  "hsl(200, 70%, 55%)", // blue
  "hsl(80, 60%, 50%)",  // lime
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover/95 backdrop-blur-sm p-3 shadow-xl">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((item: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: item.color }}>
          {item.name}: {typeof item.value === "number" && item.name?.toLowerCase().includes("salary")
            ? formatCurrency(item.value)
            : item.value}
        </p>
      ))}
    </div>
  );
}

export function Charts({ entries }: ChartsProps) {
  if (entries.length === 0) {
    return (
      <Card className="animate-fade-in opacity-0 stagger-4">
        <CardContent className="flex items-center justify-center h-48 text-sm text-muted-foreground">
          Add entries to see analytics charts
        </CardContent>
      </Card>
    );
  }

  // Prepare data
  const dailyData = entries.map((e) => ({
    date: e.date,
    salary: e.salary,
    hours: Number((e.totalMinutes / 60).toFixed(2)),
    minutes: e.totalMinutes,
  }));

  // Monthly aggregation
  const monthlyMap = new Map<string, { salary: number; hours: number; days: number }>();
  entries.forEach((e) => {
    const parts = e.date.split(/[-/.]/);
    let monthKey: string;
    if (parts[0].length === 4) {
      monthKey = `${parts[0]}-${parts[1]}`;
    } else {
      monthKey = `${parts[2]}-${parts[1]}`;
    }
    const existing = monthlyMap.get(monthKey) || { salary: 0, hours: 0, days: 0 };
    existing.salary += e.salary;
    existing.hours += e.totalMinutes / 60;
    existing.days += 1;
    monthlyMap.set(monthKey, existing);
  });
  const monthlyData = Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    salary: Number(data.salary.toFixed(2)),
    hours: Number(data.hours.toFixed(2)),
    days: data.days,
  }));

  // Distribution buckets
  const ranges = [
    { label: "₹0-200", min: 0, max: 200 },
    { label: "₹200-300", min: 200, max: 300 },
    { label: "₹300-400", min: 300, max: 400 },
    { label: "₹400-500", min: 400, max: 500 },
    { label: "₹500+", min: 500, max: Infinity },
  ];
  const distributionData = ranges.map((range) => ({
    name: range.label,
    count: entries.filter((e) => e.salary >= range.min && e.salary < range.max).length,
  })).filter((d) => d.count > 0);

  return (
    <div className="animate-fade-in opacity-0 stagger-4">
      <Tabs defaultValue="salary" className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-xl h-10">
          <TabsTrigger value="salary" className="rounded-lg gap-1.5 text-xs">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Salary Trend</span>
            <span className="sm:hidden">Salary</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="rounded-lg gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Daily Hours</span>
            <span className="sm:hidden">Hours</span>
          </TabsTrigger>
          <TabsTrigger value="monthly" className="rounded-lg gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Monthly</span>
            <span className="sm:hidden">Month</span>
          </TabsTrigger>
          <TabsTrigger value="distribution" className="rounded-lg gap-1.5 text-xs">
            <PieIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Distribution</span>
            <span className="sm:hidden">Dist.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="salary" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-chart-1" />
                Daily Salary Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="salaryGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="salary"
                      stroke={CHART_COLORS[0]}
                      fill="url(#salaryGradient)"
                      strokeWidth={2.5}
                      name="Salary"
                      dot={{ r: 4, fill: CHART_COLORS[0], strokeWidth: 0 }}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: "white" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-chart-2" />
                Daily Working Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="hours"
                      fill={CHART_COLORS[1]}
                      name="Hours"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-chart-3" />
                Monthly Revenue Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="salary" fill={CHART_COLORS[0]} name="Salary" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    <Bar dataKey="days" fill={CHART_COLORS[2]} name="Days" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-chart-4" />
                Salary Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="count"
                      nameKey="name"
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {distributionData.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
