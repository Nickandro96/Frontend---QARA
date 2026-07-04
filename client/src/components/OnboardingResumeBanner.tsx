import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

/**
 * Bannière "Reprendre la configuration" (SPEC-onboarding-ecrans.md, "Le gate
 * d'onboarding") : affichée si l'onboarding a été entamé mais pas terminé.
 */
export function OnboardingResumeBanner() {
  const { isAuthenticated } = useAuth();
  const { data: status } = trpc.onboarding.getGateStatus.useQuery(undefined, { enabled: isAuthenticated });

  if (!status || !status.onboardingStarted || status.onboardingComplete) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-amber-900">
          Votre configuration d'audit n'est pas terminée — reprenez là où vous vous êtes arrêté.
        </p>
        <Link href="/onboarding">
          <Button size="sm" variant="outline" className="gap-1 border-amber-300 text-amber-900 hover:bg-amber-100">
            Reprendre la configuration
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
