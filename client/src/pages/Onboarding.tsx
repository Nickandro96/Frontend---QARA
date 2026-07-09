import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getMaxReferentiels, getPlanLabel } from "@/lib/plans";
import {
  ActiveReferential,
  getActiveReferentials,
  readOnboardingState,
  REFERENTIAL_CATALOG,
  saveOnboardingState,
} from "@/lib/onboarding";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

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
  const profileQuery = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  const updateProfile = trpc.profile.update.useMutation();
  const [step, setStep] = useState(0);
  const storedState = readOnboardingState();
  const [selectedReferentials, setSelectedReferentials] = useState<ActiveReferential[]>(storedState.referentials);
  const [economicRole, setEconomicRole] = useState(storedState.economicRole || "");
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(storedState.markets);
  const [saveWarning, setSaveWarning] = useState("");
  const maxReferentiels = getMaxReferentiels(profileQuery.data, user);
  const planLabel = getPlanLabel(profileQuery.data);

  useEffect(() => {
    if (!profileQuery.data) return;

    const activeReferentials = getActiveReferentials(profileQuery.data) as ActiveReferential[];
    if (activeReferentials.length > 0) setSelectedReferentials(activeReferentials);

    const profile = profileQuery.data as Record<string, unknown>;
    if (typeof profile.economicRole === "string") setEconomicRole(profile.economicRole);
  }, [profileQuery.data]);

  useEffect(() => {
    if (maxReferentiels === Number.POSITIVE_INFINITY) return;
    setSelectedReferentials((current) => current.slice(0, maxReferentiels));
  }, [maxReferentiels]);

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

  const finish = async () => {
    setSaveWarning("");
    saveOnboardingState({
      referentials: selectedReferentials,
      economicRole,
      markets: selectedMarkets,
      completedAt: new Date().toISOString(),
    });

    try {
      await updateProfile.mutateAsync({
        economicRole,
        activeFrameworks: selectedReferentials,
        activeReferentials: selectedReferentials,
        markets: selectedMarkets,
      } as any);
    } catch {
      setSaveWarning("Configuration conservee dans ce navigateur. La persistance serveur des referentiels reste a confirmer.");
    }

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
            <div className="grid gap-3 sm:grid-cols-2">
              {REFERENTIAL_CATALOG.map((item) => {
                const selected = selectedReferentials.includes(item.id);
                const locked = !selected && selectedReferentials.length >= maxReferentiels;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleReferential(item.id)}
                    disabled={locked}
                    className={[
                      "rounded-lg border p-4 text-left transition",
                      selected ? "border-[#3b6fe0] bg-[#e9efff]" : "border-[#dfe4ea] bg-white hover:border-[#9fb3e8]",
                      locked ? "cursor-not-allowed opacity-60" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{item.title}</span>
                      {selected ? <CheckCircle2 className="h-4 w-4 text-[#3b6fe0]" /> : null}
                      {locked ? <Lock className="h-4 w-4 text-[#8a95a8]" /> : null}
                    </div>
                    <p className="mt-1 text-sm text-[#6b7688]">{item.description}</p>
                  </button>
                );
              })}
              <div className="rounded-lg border border-[#dfe4ea] bg-[#f8fafc] p-4 text-sm text-[#526173] sm:col-span-2">
                {planLabel} : {maxReferentiels === Number.POSITIVE_INFINITY ? "referentiels illimites" : `${maxReferentiels} referentiel actif maximum`}.
                {user?.role === "admin" ? " Les administrateurs ne sont pas limites par cette regle UX." : null}
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
              <Button onClick={finish} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Ouvrir le dashboard
              </Button>
            )}
          </div>
          {saveWarning ? <p className="mt-3 text-sm text-[#b45309]">{saveWarning}</p> : null}
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
