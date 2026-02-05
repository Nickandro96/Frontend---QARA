import { useState } from "react";
import { ChevronRight, X, RotateCcw, Building2, Layers, FileText, BookOpen, AlertTriangle, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface DrillLevel {
  id: string;
  type: "organization" | "site" | "process" | "referential" | "clause" | "requirement" | "finding" | "action";
  label: string;
  value: string;
  displayValue: string;
}

interface FunnelNavigatorProps {
  levels: DrillLevel[];
  onLevelClick: (level: DrillLevel) => void;
  onRemoveLevel: (levelId: string) => void;
  onReset: () => void;
  onBack: () => void;
  className?: string;
}

const levelIcons: Record<DrillLevel["type"], React.ReactNode> = {
  organization: <Building2 className="h-4 w-4" />,
  site: <Building2 className="h-4 w-4" />,
  process: <Layers className="h-4 w-4" />,
  referential: <FileText className="h-4 w-4" />,
  clause: <BookOpen className="h-4 w-4" />,
  requirement: <CheckSquare className="h-4 w-4" />,
  finding: <AlertTriangle className="h-4 w-4" />,
  action: <CheckSquare className="h-4 w-4" />,
};

const levelLabels: Record<DrillLevel["type"], { fr: string; en: string }> = {
  organization: { fr: "Organisation", en: "Organization" },
  site: { fr: "Site", en: "Site" },
  process: { fr: "Processus", en: "Process" },
  referential: { fr: "Référentiel", en: "Standard" },
  clause: { fr: "Clause", en: "Clause" },
  requirement: { fr: "Exigence", en: "Requirement" },
  finding: { fr: "Constat", en: "Finding" },
  action: { fr: "Action", en: "Action" },
};

export function FunnelNavigator({
  levels,
  onLevelClick,
  onRemoveLevel,
  onReset,
  onBack,
  className,
}: FunnelNavigatorProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Tous
        </Button>

        {levels.map((level, index) => (
          <div key={level.id} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 flex items-center gap-1 pr-1"
              onClick={() => onLevelClick(level)}
            >
              {levelIcons[level.type]}
              <span className="max-w-[150px] truncate">{level.displayValue}</span>
              {index === levels.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveLevel(level.id);
                  }}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      {levels.length > 0 && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Niveau précédent
          </Button>
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Réinitialiser
          </Button>
        </div>
      )}
    </div>
  );
}

// Funnel steps component for visual navigation
interface FunnelStepsProps {
  currentLevel: number;
  onStepClick: (step: number) => void;
}

const funnelSteps = [
  { level: 0, label: "Vue globale", icon: Building2 },
  { level: 1, label: "Site", icon: Building2 },
  { level: 2, label: "Processus", icon: Layers },
  { level: 3, label: "Référentiel", icon: FileText },
  { level: 4, label: "Clause", icon: BookOpen },
  { level: 5, label: "Exigence", icon: CheckSquare },
  { level: 6, label: "Constat", icon: AlertTriangle },
  { level: 7, label: "Action", icon: CheckSquare },
];

export function FunnelSteps({ currentLevel, onStepClick }: FunnelStepsProps) {
  return (
    <div className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
      {funnelSteps.map((step, index) => {
        const Icon = step.icon;
        const isActive = index <= currentLevel;
        const isCurrent = index === currentLevel;

        return (
          <div key={step.level} className="flex items-center">
            <button
              onClick={() => onStepClick(step.level)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                isActive ? "text-primary" : "text-muted-foreground",
                isCurrent && "bg-primary/10 ring-2 ring-primary/20",
                "hover:bg-muted"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium whitespace-nowrap">
                {step.label}
              </span>
            </button>
            {index < funnelSteps.length - 1 && (
              <div
                className={cn(
                  "w-8 h-0.5 mx-1",
                  index < currentLevel ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default FunnelNavigator;
