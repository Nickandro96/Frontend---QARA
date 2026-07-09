import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRequiredPlanLabel, type PlanCapability } from "@/lib/plans";
import { ArrowRight, Lock, Shield } from "lucide-react";
import { Link } from "wouter";

type UpgradeRequiredProps = {
  feature: string;
  capability?: PlanCapability;
  requiredPlanLabel?: string;
};

export function UpgradeRequired({
  feature,
  capability,
  requiredPlanLabel,
}: UpgradeRequiredProps) {
  const planLabel = requiredPlanLabel || (capability ? getRequiredPlanLabel(capability) : "Plan Pro");

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#f4f6f9] px-4 py-10">
      <Card className="w-full max-w-xl border-[#dce3ef] shadow-sm">
        <CardContent className="space-y-6 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9efff] text-[#3b6fe0]">
            <Lock className="h-7 w-7" />
          </div>

          <div className="space-y-3">
            <Badge variant="outline" className="border-[#b9c8ef] text-[#2558c7]">
              Fonctionnalite verrouillee
            </Badge>
            <h1 className="text-2xl font-bold text-[#0e1c3d]">{feature}</h1>
            <p className="text-sm leading-6 text-[#526173]">
              Cette fonctionnalite est visible dans votre espace QARA, mais elle necessite le{" "}
              <span className="font-semibold text-[#0e1c3d]">{planLabel}</span>. Votre session reste active et vous pouvez continuer a utiliser les modules inclus dans votre plan.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/account">
              <Button className="gap-2 bg-[#3b6fe0] hover:bg-[#2558c7]">
                Passer au plan Pro
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2">
                <Shield className="h-4 w-4" />
                Retour dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
