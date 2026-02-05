import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  ChevronRight,
  Sparkles,
  Info,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Insight {
  id: string;
  type: "warning" | "success" | "alert" | "info" | "trend";
  priority: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  metric?: {
    label: string;
    value: number;
    unit?: string;
    trend?: number;
  };
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

interface InsightsPanelProps {
  insights: Insight[];
  onDismiss?: (id: string) => void;
  onActionClick?: (insight: Insight) => void;
  compact?: boolean;
}

const priorityConfig = {
  critical: {
    bg: "bg-red-50 dark:bg-red-950",
    border: "border-red-500",
    icon: AlertTriangle,
    iconColor: "text-red-500",
    badge: "destructive" as const,
  },
  high: {
    bg: "bg-orange-50 dark:bg-orange-950",
    border: "border-orange-500",
    icon: AlertTriangle,
    iconColor: "text-orange-500",
    badge: "default" as const,
  },
  medium: {
    bg: "bg-amber-50 dark:bg-amber-950",
    border: "border-amber-500",
    icon: Info,
    iconColor: "text-amber-500",
    badge: "secondary" as const,
  },
  low: {
    bg: "bg-blue-50 dark:bg-blue-950",
    border: "border-blue-500",
    icon: Lightbulb,
    iconColor: "text-blue-500",
    badge: "outline" as const,
  },
  info: {
    bg: "bg-green-50 dark:bg-green-950",
    border: "border-green-500",
    icon: TrendingUp,
    iconColor: "text-green-500",
    badge: "outline" as const,
  },
};

const typeIcons = {
  warning: AlertTriangle,
  success: TrendingUp,
  alert: Clock,
  info: Lightbulb,
  trend: Target,
};

export function InsightsPanel({
  insights,
  onDismiss,
  onActionClick,
  compact = false,
}: InsightsPanelProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    onDismiss?.(id);
  };

  const visibleInsights = insights.filter((i) => !dismissedIds.has(i.id));

  if (visibleInsights.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {visibleInsights.slice(0, 4).map((insight) => {
          const config = priorityConfig[insight.priority];
          const Icon = typeIcons[insight.type];

          return (
            <Tooltip key={insight.id}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow whitespace-nowrap",
                    config.bg,
                    config.border
                  )}
                  onClick={() => onActionClick?.(insight)}
                >
                  <Icon className={cn("h-4 w-4", config.iconColor)} />
                  <span className="text-sm font-medium truncate max-w-[150px]">
                    {insight.title}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p>{insight.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {visibleInsights.length > 4 && (
          <Badge variant="secondary" className="whitespace-nowrap">
            +{visibleInsights.length - 4} autres
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          Insights Automatiques
          <Badge variant="secondary" className="ml-auto">
            {visibleInsights.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {visibleInsights.map((insight) => {
            const config = priorityConfig[insight.priority];
            const Icon = typeIcons[insight.type];

            return (
              <div
                key={insight.id}
                className={cn(
                  "relative p-3 rounded-lg border-l-4 transition-all hover:shadow-md",
                  config.bg,
                  config.border
                )}
              >
                {insight.dismissible && (
                  <button
                    onClick={() => handleDismiss(insight.id)}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}

                <div className="flex items-start gap-2">
                  <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", config.iconColor)} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm leading-tight pr-4">
                      {insight.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {insight.description}
                    </p>

                    {insight.metric && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-lg font-bold">
                          {insight.metric.value}
                          {insight.metric.unit}
                        </span>
                        {insight.metric.trend !== undefined && (
                          <span
                            className={cn(
                              "flex items-center text-xs",
                              insight.metric.trend >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            )}
                          >
                            {insight.metric.trend >= 0 ? (
                              <TrendingUp className="h-3 w-3 mr-0.5" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-0.5" />
                            )}
                            {Math.abs(insight.metric.trend)}%
                          </span>
                        )}
                      </div>
                    )}

                    {insight.action && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 mt-2 text-xs"
                        onClick={() => {
                          insight.action?.onClick();
                          onActionClick?.(insight);
                        }}
                      >
                        {insight.action.label}
                        <ChevronRight className="h-3 w-3 ml-0.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to generate insights from data
export function generateInsights(data: {
  ncMajor: number;
  ncMinor: number;
  overdueActions: number;
  conformityRate: number;
  conformityTrend: number;
  topNCProcess?: string;
  topNCClause?: string;
  avgClosureDays: number;
}): Insight[] {
  const insights: Insight[] = [];

  // Critical: Overdue actions
  if (data.overdueActions > 0) {
    insights.push({
      id: "overdue-actions",
      type: "alert",
      priority: "critical",
      title: "Actions en retard",
      description: `${data.overdueActions} actions CAPA dépassent leur échéance. Impact potentiel sur la certification.`,
      metric: {
        label: "Actions",
        value: data.overdueActions,
      },
      action: {
        label: "Voir les actions",
        onClick: () => {},
      },
    });
  }

  // High: Major NC
  if (data.ncMajor > 0) {
    insights.push({
      id: "nc-major",
      type: "warning",
      priority: "high",
      title: `${data.ncMajor} NC Majeure${data.ncMajor > 1 ? "s" : ""} ouverte${data.ncMajor > 1 ? "s" : ""}`,
      description: "Les non-conformités majeures nécessitent une attention immédiate.",
      action: {
        label: "Voir les NC",
        onClick: () => {},
      },
    });
  }

  // Medium: Process at risk
  if (data.topNCProcess) {
    insights.push({
      id: "process-risk",
      type: "warning",
      priority: "medium",
      title: `Processus ${data.topNCProcess} à risque`,
      description: `Le processus ${data.topNCProcess} concentre le plus de NC sur la période. Recommandation : audit ciblé.`,
      action: {
        label: "Analyser",
        onClick: () => {},
      },
    });
  }

  // Info: Positive trend
  if (data.conformityTrend > 0) {
    insights.push({
      id: "positive-trend",
      type: "success",
      priority: "info",
      title: "Amélioration continue",
      description: `Le taux de conformité global a augmenté de ${data.conformityTrend}% sur la période.`,
      metric: {
        label: "Conformité",
        value: data.conformityRate,
        unit: "%",
        trend: data.conformityTrend,
      },
      dismissible: true,
    });
  }

  // Medium: Recurring clause
  if (data.topNCClause) {
    insights.push({
      id: "recurring-clause",
      type: "info",
      priority: "medium",
      title: `Clause ${data.topNCClause} récurrente`,
      description: `La clause ${data.topNCClause} apparaît fréquemment dans les constats. Formation recommandée.`,
      action: {
        label: "Voir les constats",
        onClick: () => {},
      },
    });
  }

  // Low: Closure time
  if (data.avgClosureDays > 30) {
    insights.push({
      id: "closure-time",
      type: "info",
      priority: "low",
      title: "Délai de clôture élevé",
      description: `Le délai moyen de clôture des actions est de ${data.avgClosureDays} jours. Objectif recommandé : 21 jours.`,
      metric: {
        label: "Jours",
        value: data.avgClosureDays,
      },
      dismissible: true,
    });
  }

  return insights;
}

// Insight Card for standalone use
interface InsightCardProps {
  insight: Insight;
  onDismiss?: () => void;
  onClick?: () => void;
}

export function InsightCard({ insight, onDismiss, onClick }: InsightCardProps) {
  const config = priorityConfig[insight.priority];
  const Icon = typeIcons[insight.type];

  return (
    <div
      className={cn(
        "relative p-4 rounded-lg border-l-4 transition-all hover:shadow-md cursor-pointer",
        config.bg,
        config.border
      )}
      onClick={onClick}
    >
      {insight.dismissible && onDismiss && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-full", config.bg)}>
          <Icon className={cn("h-5 w-5", config.iconColor)} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{insight.title}</h4>
            <Badge variant={config.badge} className="text-xs">
              {insight.priority}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {insight.description}
          </p>

          {insight.metric && (
            <div className="flex items-center gap-3 mt-3 p-2 bg-background/50 rounded">
              <span className="text-sm text-muted-foreground">
                {insight.metric.label}
              </span>
              <span className="text-xl font-bold">
                {insight.metric.value}
                {insight.metric.unit}
              </span>
              {insight.metric.trend !== undefined && (
                <span
                  className={cn(
                    "flex items-center text-sm",
                    insight.metric.trend >= 0 ? "text-green-600" : "text-red-600"
                  )}
                >
                  {insight.metric.trend >= 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(insight.metric.trend)}%
                </span>
              )}
            </div>
          )}

          {insight.action && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={(e) => {
                e.stopPropagation();
                insight.action?.onClick();
              }}
            >
              {insight.action.label}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
