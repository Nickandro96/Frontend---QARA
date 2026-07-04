import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperStep {
  id: string;
  label: string;
  /** Étape grisée/non pertinente pour le moment (ex. Marchés si MDSAP non coché). */
  disabled?: boolean;
}

interface StepperProps {
  steps: StepperStep[];
  currentStepId: string;
  /** Étapes déjà validées (coche). N'inclut pas nécessairement l'étape courante. */
  completedStepIds?: string[];
  /** Appelé uniquement pour une étape complétée ou courante, jamais une étape future non visitée. */
  onStepClick?: (stepId: string) => void;
  className?: string;
}

/**
 * Stepper générique horizontal, réutilisable — voir docs/audit/12-onboarding.md.
 * Aucun composant équivalent n'existait auparavant : ISOAuditWizard.tsx et
 * MDRAudit.tsx géraient chacun leur propre état d'étapes localement.
 */
export function Stepper({ steps, currentStepId, completedStepIds = [], onStepClick, className }: StepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);
  const progressPercent = steps.length > 1 ? (Math.max(currentIndex, 0) / (steps.length - 1)) * 100 : 0;

  return (
    <nav aria-label="Étapes" className={cn("w-full", className)}>
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = completedStepIds.includes(step.id);
          const isCurrent = step.id === currentStepId;
          const isClickable = !step.disabled && (isCompleted || isCurrent) && !!onStepClick;

          return (
            <li key={step.id} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(step.id)}
                aria-current={isCurrent ? "step" : undefined}
                aria-disabled={step.disabled || undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  step.disabled && "cursor-not-allowed opacity-40",
                  !step.disabled && isClickable && "cursor-pointer hover:text-primary",
                  !isClickable && !step.disabled && "cursor-default"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    isCurrent && !isCompleted && "border-primary text-primary",
                    !isCurrent && !isCompleted && "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "hidden whitespace-nowrap sm:inline",
                    isCurrent ? "text-foreground" : !isCompleted ? "text-muted-foreground" : undefined
                  )}
                >
                  {step.label}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded transition-colors",
                    index < currentIndex ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted-foreground/10">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </nav>
  );
}
