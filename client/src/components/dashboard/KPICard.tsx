import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  definition?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    label?: string;
  };
  color?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  isLoading?: boolean;
}

const colorClasses = {
  default: "text-foreground",
  success: "text-green-600 dark:text-green-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
  info: "text-blue-600 dark:text-blue-400",
};

const trendColors = {
  up: "text-green-600 dark:text-green-400",
  down: "text-red-600 dark:text-red-400",
  neutral: "text-muted-foreground",
};

const TrendIcon = ({ direction }: { direction: "up" | "down" | "neutral" }) => {
  switch (direction) {
    case "up":
      return <TrendingUp className="h-3 w-3" />;
    case "down":
      return <TrendingDown className="h-3 w-3" />;
    default:
      return <Minus className="h-3 w-3" />;
  }
};

export function KPICard({
  title,
  value,
  unit,
  icon,
  definition,
  trend,
  color = "default",
  size = "md",
  onClick,
  isLoading = false,
}: KPICardProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  const valueSizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/50",
        isLoading && "animate-pulse"
      )}
      onClick={onClick}
    >
      <CardContent className={cn(sizeClasses[size], "space-y-2")}>
        {/* Header with title and info tooltip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            {icon && <span className="opacity-70">{icon}</span>}
            <span className="text-sm font-medium">{title}</span>
          </div>
          {definition && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">{definition}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              "font-bold tracking-tight",
              valueSizeClasses[size],
              colorClasses[color]
            )}
          >
            {isLoading ? "—" : value}
          </span>
          {unit && (
            <span className="text-sm text-muted-foreground">{unit}</span>
          )}
        </div>

        {/* Trend indicator */}
        {trend && !isLoading && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs",
              trendColors[trend.direction]
            )}
          >
            <TrendIcon direction={trend.direction} />
            <span>
              {trend.direction === "up" ? "+" : trend.direction === "down" ? "" : ""}
              {trend.value}%
            </span>
            {trend.label && (
              <span className="text-muted-foreground ml-1">{trend.label}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// KPI definitions for tooltips
export const KPI_DEFINITIONS = {
  globalScore: {
    fr: "Score moyen pondéré de tous les audits sur la période sélectionnée. Calculé comme 100 - (somme des pénalités / nombre d'audits).",
    en: "Weighted average score of all audits over the selected period. Calculated as 100 - (sum of penalties / number of audits).",
  },
  conformityRate: {
    fr: "Pourcentage de conformité = (Nombre de questions conformes / Nombre de questions applicables) × 100. Les questions N/A sont exclues du calcul.",
    en: "Conformity rate = (Number of compliant questions / Number of applicable questions) × 100. N/A questions are excluded.",
  },
  ncMajor: {
    fr: "Non-conformités majeures : écarts systémiques ou répétés pouvant compromettre la sécurité du produit ou l'efficacité du système qualité.",
    en: "Major non-conformities: systemic or repeated deviations that may compromise product safety or quality system effectiveness.",
  },
  ncMinor: {
    fr: "Non-conformités mineures : écarts ponctuels n'affectant pas significativement le système qualité ou la sécurité du produit.",
    en: "Minor non-conformities: isolated deviations that do not significantly affect the quality system or product safety.",
  },
  observations: {
    fr: "Observations : points d'attention identifiés qui ne constituent pas des non-conformités mais méritent un suivi.",
    en: "Observations: attention points identified that are not non-conformities but deserve follow-up.",
  },
  ofi: {
    fr: "Opportunités d'amélioration (OFI) : suggestions pour améliorer l'efficacité du système sans non-conformité constatée.",
    en: "Opportunities for Improvement (OFI): suggestions to improve system effectiveness without identified non-conformity.",
  },
  actionClosureRate: {
    fr: "Taux de clôture = (Actions fermées / Actions totales) × 100. Inclut les actions complétées et vérifiées efficaces.",
    en: "Closure rate = (Closed actions / Total actions) × 100. Includes completed and verified effective actions.",
  },
  avgClosureDays: {
    fr: "Délai moyen de clôture = Moyenne(Date de clôture - Date de création) sur les actions fermées. Exprimé en jours.",
    en: "Average closure time = Average(Closure date - Creation date) for closed actions. Expressed in days.",
  },
  overdueActions: {
    fr: "Actions en retard : actions ouvertes dont la date d'échéance est dépassée (échéance < aujourd'hui).",
    en: "Overdue actions: open actions whose due date has passed (due date < today).",
  },
  riskScore: {
    fr: "Score de risque moyen calculé selon la formule : Gravité × Occurrence × Détectabilité. Échelle de 1 à 100.",
    en: "Average risk score calculated as: Severity × Occurrence × Detectability. Scale from 1 to 100.",
  },
};

export default KPICard;
