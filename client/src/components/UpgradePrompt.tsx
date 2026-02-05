import { AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "wouter";

interface UpgradePromptProps {
  feature: string;
  requiredTier: "Pro" | "Expert" | "Entreprise";
  message?: string;
}

export function UpgradePrompt({
  feature,
  requiredTier,
  message,
}: UpgradePromptProps) {
  const defaultMessage = `Cette fonctionnalité nécessite un abonnement ${requiredTier}. Passez à un plan supérieur pour y accéder.`;

  return (
    <Alert className="border-primary/50 bg-primary/5">
      <Sparkles className="h-5 w-5 text-primary" />
      <AlertTitle className="text-lg font-semibold">
        Fonctionnalité {requiredTier}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-4">
        <p className="text-muted-foreground">{message || defaultMessage}</p>
        <div className="flex gap-3">
          <Link href="/pricing">
            <Button size="sm" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Voir les plans
            </Button>
          </Link>
          <Button size="sm" variant="outline" asChild>
            <a
              href="https://help.manus.im"
              target="_blank"
              rel="noopener noreferrer"
            >
              En savoir plus
            </a>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

interface FeatureLockedProps {
  feature: string;
  requiredTier: "Pro" | "Expert" | "Entreprise";
  children?: React.ReactNode;
}

/**
 * Wrapper component that shows an upgrade prompt instead of the children
 */
export function FeatureLocked({
  feature,
  requiredTier,
  children,
}: FeatureLockedProps) {
  return (
    <div className="space-y-6">
      <UpgradePrompt feature={feature} requiredTier={requiredTier} />
      {children && (
        <div className="relative">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center space-y-4 p-6 bg-card border rounded-lg shadow-lg max-w-md">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">Aperçu verrouillé</h3>
              <p className="text-sm text-muted-foreground">
                Passez à {requiredTier} pour accéder à cette fonctionnalité
              </p>
              <Link href="/pricing">
                <Button className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Débloquer maintenant
                </Button>
              </Link>
            </div>
          </div>
          <div className="opacity-30 pointer-events-none">{children}</div>
        </div>
      )}
    </div>
  );
}
