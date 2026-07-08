import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { Link } from "wouter";
import { PlanTier, getPlanLabel } from "@/lib/plans";

type LockedFeatureProps = {
  feature: string;
  description?: string;
  requiredPlan?: PlanTier;
  variant?: "page" | "block";
};

/**
 * Ecran ou bloc verrouille reutilisable : une fonctionnalite verrouillee
 * reste toujours visible (jamais masquee, jamais une erreur), avec un
 * cadenas, le plan requis et un CTA vers /account.
 */
export function LockedFeature({
  feature,
  description,
  requiredPlan = "pro",
  variant = "page",
}: LockedFeatureProps) {
  const content = (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-[#dfe4ea] bg-white p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef1f5] text-[#6b7688]">
        <Lock className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[#0e1c3d]">{feature}</h2>
        <p className="mt-1 text-sm text-[#6b7688]">
          {description ?? `Cette fonctionnalite necessite le ${getPlanLabel(requiredPlan)}.`}
        </p>
      </div>
      <Link href="/account">
        <Button className="gap-2">Passer au {getPlanLabel(requiredPlan)}</Button>
      </Link>
    </div>
  );

  if (variant === "block") {
    return content;
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center">
      {content}
    </div>
  );
}
