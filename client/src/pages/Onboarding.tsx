import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActiveReferential, saveOnboardingState } from "@/lib/onboarding";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getMaxReferentiels, getPlanLabel } from "@/lib/plans";
import { CheckCircle2, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

const referentials: { id: ActiveReferential; label: string; description: string }[] = [
  { id: "mdr", label: "MDR", description: "Reglement (UE) 2017/745" },
  { id: "ivdr", label: "IVDR", description: "Reglement (UE) 2017/746" },
  { id: "fda-qmsr", label: "FDA QMSR", description: "Qualite et voie US" },
  { id: "mdsap", label: "MDSAP", description: "Programme multi-marches" },
  { id: "iso-13485", label: "ISO 13485", description: "Systeme qualite DM" },
  { id: "iso-14971", label: "ISO 14971", description: "Gestion des risques" },
  { id: "iso-9001", label: "ISO 9001", description: "Qualite transverse" },
];

const roles = [
  { id: "fabricant", label: "Fabricant" },
  { id: "mandataire", label: "Mandataire" },
  { id: "importateur", label: "Importateur" },
  { id: "distributeur", label: "Distributeur" },
];

const markets = ["UE", "US", "UK", "Suisse", "Canada", "Australie"];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  const maxReferentiels = getMaxReferentiels(profile, user);
  const planLabel = getPlanLabel(profile?.subscriptionTier);
  const [step, setStep] = useState(0);
  const [selectedReferentials, setSelectedReferentials] = useState<ActiveReferential[]>([]);
  const [economicRole, setEconomicRole] = useState("");
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);

  const canContinue = useMemo(() => {
    if (step === 0) return selectedReferentials.length > 0;
    if (step === 1) return Boolean(economicRole);
    if (step === 2) return selectedMarkets.length > 0;
    return true;
  }, [economicRole, selectedMarkets.length, selectedReferentials.length, step]);

  const toggleReferential = (id: ActiveReferential) => {
    setSelectedReferentials((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= maxReferentiels) return current;
      return [...current, id];
    });
  };

  const toggleMarket = (market: string) => {
    setSelectedMarkets((current) =>
      current.includes(market) ? current.filter((item) => item !== market) : [...current, market]
    );
  };

  const finish = () => {
    saveOnboardingState({
      referentials: selectedReferentials,
      economicRole,
      markets: selectedMarkets,
      completedAt: new Date().toISOString(),
    });
    navigate("/dashboard");
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#3b6fe0]">Onboarding QARA</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#0e1c3d]">Configurez votre espace de conformite</h1>
        <p className="mt-2 text-sm text-[#6b7688]">4 etapes pour activer les bons referentiels et ouvrir le dashboard.</p>
      </div>

      <Card className="border-[#dfe4ea] shadow-sm">
        <CardHeader>
          <CardTitle>Etape {step + 1} sur 4</CardTitle>
          <CardDescription>
            {step === 0 && "Selectionnez les referentiels actifs."}
            {step === 1 && "Precisez votre role economique."}
            {step === 2 && "Indiquez les marches vises."}
            {step === 3 && "Verifiez l'apercu chiffre avant validation."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 0 ? (
            <div>
              {Number.isFinite(maxReferentiels) ? (
                <p className="mb-3 text-sm text-[#6b7688]">
                  {planLabel} : {selectedReferentials.length}/{maxReferentiels} referentiel(s) selectionnable(s).
                </p>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                {referentials.map((item) => {
                  const selected = selectedReferentials.includes(item.id);
                  const locked = !selected && selectedReferentials.length >= maxReferentiels;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={locked}
                      onClick={() => toggleReferential(item.id)}
                      className={[
                        "rounded-lg border p-4 text-left transition",
                        selected
                          ? "border-[#3b6fe0] bg-[#e9efff]"
                          : locked
                            ? "cursor-not-allowed border-[#dfe4ea] bg-[#f5f6f8] opacity-60"
                            : "border-[#dfe4ea] bg-white hover:border-[#9fb3e8]",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{item.label}</span>
                        {selected ? <CheckCircle2 className="h-4 w-4 text-[#3b6fe0]" /> : null}
                        {locked ? <Lock className="h-4 w-4 text-[#9aa4b2]" /> : null}
                      </div>
                      <p className="mt-1 text-sm text-[#6b7688]">{item.description}</p>
                      {locked ? (
                        <p className="mt-1 text-xs font-medium text-[#9aa4b2]">Plan Pro requis pour ajouter ce referentiel</p>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setEconomicRole(role.id)}
                  className={[
                    "rounded-lg border p-4 text-left font-semibold transition",
                    economicRole === role.id ? "border-[#3b6fe0] bg-[#e9efff]" : "border-[#dfe4ea] bg-white hover:border-[#9fb3e8]",
                  ].join(" ")}
                >
                  {role.label}
                </button>
              ))}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {markets.map((market) => (
                <button
                  key={market}
                  type="button"
                  onClick={() => toggleMarket(market)}
                  className={[
                    "rounded-lg border p-4 text-left font-semibold transition",
                    selectedMarkets.includes(market) ? "border-[#3b6fe0] bg-[#e9efff]" : "border-[#dfe4ea] bg-white hover:border-[#9fb3e8]",
                  ].join(" ")}
                >
                  {market}
                </button>
              ))}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryTile label="Referentiels" value={String(selectedReferentials.length)} />
              <SummaryTile label="Role" value={roles.find((role) => role.id === economicRole)?.label || "-"} />
              <SummaryTile label="Marches" value={String(selectedMarkets.length)} />
            </div>
          ) : null}

          <div className="mt-6 flex justify-between gap-3">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep((current) => current - 1)}>
              Precedent
            </Button>
            {step < 3 ? (
              <Button disabled={!canContinue} onClick={() => setStep((current) => current + 1)}>
                Suivant
              </Button>
            ) : (
              <Button onClick={finish}>Ouvrir le dashboard</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#dfe4ea] bg-white p-4">
      <div className="text-xs uppercase tracking-[0.14em] text-[#6b7688]">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-[#0e1c3d]">{value}</div>
    </div>
  );
}
