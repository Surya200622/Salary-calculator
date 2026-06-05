"use client";

import {
  Brain,
  Clock,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Minus,
  IndianRupee,
  Target,
  Zap,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AiInsights } from "@/lib/types";
import { formatCurrency } from "@/lib/salary-calculator";

interface AiInsightsPanelProps {
  insights: AiInsights;
}

export function AiInsightsPanel({ insights }: AiInsightsPanelProps) {
  const trendIcon =
    insights.revenueGrowthTrend === "increasing" ? (
      <TrendingUp className="h-4 w-4 text-chart-2" />
    ) : insights.revenueGrowthTrend === "decreasing" ? (
      <TrendingDown className="h-4 w-4 text-destructive" />
    ) : (
      <Minus className="h-4 w-4 text-muted-foreground" />
    );

  const trendLabel =
    insights.revenueGrowthTrend === "increasing"
      ? "Growing"
      : insights.revenueGrowthTrend === "decreasing"
      ? "Declining"
      : "Stable";

  const trendColor =
    insights.revenueGrowthTrend === "increasing"
      ? "bg-chart-2/10 text-chart-2 border-chart-2/20"
      : insights.revenueGrowthTrend === "decreasing"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : "bg-muted text-muted-foreground";

  const insightCards = [
    {
      label: "Avg. Hours/Day",
      value: `${insights.averageHoursPerDay}h`,
      icon: Clock,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      label: "Projected Monthly",
      value: formatCurrency(insights.projectedMonthlyIncome),
      icon: IndianRupee,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      label: "Projected Yearly",
      value: formatCurrency(insights.projectedYearlyIncome),
      icon: Target,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      label: "Most Productive",
      value: insights.mostProductiveDay
        ? `${insights.mostProductiveDay.date}`
        : "—",
      subtitle: insights.mostProductiveDay
        ? `${insights.mostProductiveDay.minutes} mins`
        : undefined,
      icon: Zap,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
    {
      label: "Consistency Score",
      value: `${insights.consistencyScore}%`,
      icon: Award,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
  ];

  return (
    <Card className="animate-fade-in opacity-0 stagger-5 border border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Brain className="h-4 w-4" />
          </div>
          AI Insights
          <Badge variant="outline" className={`text-[10px] ${trendColor} ml-auto`}>
            {trendIcon}
            <span className="ml-1">{trendLabel}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {insightCards.map((card) => (
            <div
              key={card.label}
              className="flex flex-col gap-2 p-3 rounded-xl bg-muted/30 border border-border/30 transition-all duration-200 hover:bg-muted/50"
            >
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.bgColor} ${card.color}`}>
                <card.icon className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium">{card.label}</p>
                <p className="text-sm font-bold">{card.value}</p>
                {card.subtitle && (
                  <p className="text-[10px] text-muted-foreground">{card.subtitle}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
