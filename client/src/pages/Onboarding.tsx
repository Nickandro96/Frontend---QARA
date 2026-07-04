/**
 * Onboarding — wizard 4 étapes (Référentiels → Rôle → Marchés → Aperçu).
 * Voir SPEC-onboarding-logique.md / SPEC-onboarding-ecrans.md et
 * docs/audit/12-onboarding.md (backend---qara).
 *
 * Standalone (sans ModernSidebar/DashboardLayout), à l'image des wizards
 * existants (MDRAudit.tsx, ISOAuditWizard.tsx) qui masquent déjà la
 * navigation pendant un parcours guidé — cohérent avec la demande de
 * "choisir un seul layout" pour les pages d'app, hors périmètre wizard.
 */
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Check, ChevronDown, ShieldAlert } from "lucide-react";
import { Stepper, type StepperStep } from "@/components/ui/stepper";

type StepId = "referentiels" | "role" | "marches" | "apercu";
const STEP_ORDER: StepId[] = ["referentiels", "role", "marches", "apercu"];

interface Referential {
  code: string;
  label: string;
  aide: string;
  volume: number;
}
interface EconomicRole {
  code: string;
  label: string;
  description: string;
  exemple: string;
}
interface Market {
  code: string;
  label: string;
  autorite: string;
}
interface Situation {
  code: string;
  label: string;
}
interface ScopeOptions {
  referentials: Referential[];
  economicRoles: EconomicRole[];
  markets: Market[];
  situations: Situation[];
  shortcuts: Record<string, string[]>;
}
interface PreviewCount {
  total: number;
  parReferentiel: Record<string, number>;
}

function nextStepId(current: StepId, hasMdsap: boolean): StepId {
  const idx = STEP_ORDER.indexOf(current);
  for (let i = idx + 1; i < STEP_ORDER.length; i++) {
    if (STEP_ORDER[i] === "marches" && !hasMdsap) continue;
    return STEP_ORDER[i];
  }
  return current;
}
function prevStepId(current: StepId, hasMdsap: boolean): StepId {
  const idx = STEP_ORDER.indexOf(current);
  for (let i = idx - 1; i >= 0; i--) {
    if (STEP_ORDER[i] === "marches" && !hasMdsap) continue;
    return STEP_ORDER[i];
  }
  return current;
}

export default function Onboarding() {
  useAuth({ redirectOnUnauthenticated: true, redirectPath: "/login" });
  const [, navigate] = useLocation();

  const [currentStep, setCurrentStep] = useState<StepId>("referentiels");
  const [referentialCodes, setReferentialCodes] = useState<string[]>([]);
  const [economicRoles, setEconomicRoles] = useState<string[]>([]);
  const [markets, setMarkets] = useState<string[]>([]);
  const [situationTags, setSituationTags] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const hasMdsap = referentialCodes.includes("MDSAP");

  const optionsQuery = trpc.onboarding.getScopeOptions.useQuery();
  const myScopeQuery = trpc.onboarding.getMyScope.useQuery();

  useEffect(() => {
    if (hydrated || !myScopeQuery.data) return;
    const scope = myScopeQuery.data;
    if (scope.referentialCodes.length > 0) setReferentialCodes(scope.referentialCodes);
    if (scope.economicRoles.length > 0) setEconomicRoles(scope.economicRoles);
    if (scope.markets.length > 0) setMarkets(scope.markets);
    if (scope.situationTags.length > 0) setSituationTags(scope.situationTags);
    if (scope.currentStep && STEP_ORDER.includes(scope.currentStep as StepId)) {
      setCurrentStep(scope.currentStep as StepId);
    }
    setHydrated(true);
  }, [hydrated, myScopeQuery.data]);

  const previewQuery = trpc.onboarding.previewCount.useQuery(
    { referentialCodes, economicRoles, markets, situationTags },
    { enabled: hydrated }
  );

  const saveProgressMutation = trpc.onboarding.saveProgress.useMutation();
  const completeMutation = trpc.onboarding.complete.useMutation({
    onSuccess: (result: { auditId: number; questionCount: number }) => {
      navigate(`/mdr/audit/${result.auditId}`);
    },
  });

  const options: ScopeOptions | undefined = optionsQuery.data as ScopeOptions | undefined;
  const preview: PreviewCount | undefined = previewQuery.data as PreviewCount | undefined;

  const steps: StepperStep[] = [
    { id: "referentiels", label: "Référentiels" },
    { id: "role", label: "Rôle" },
    { id: "marches", label: "Marchés", disabled: !hasMdsap },
    { id: "apercu", label: "Aperçu" },
  ];
  const completedStepIds = STEP_ORDER.slice(0, STEP_ORDER.indexOf(currentStep));

  function persist(step: StepId) {
    saveProgressMutation.mutate({ referentialCodes, economicRoles, markets, situationTags, currentStep: step });
  }

  function goNext() {
    const next = nextStepId(currentStep, hasMdsap);
    setCurrentStep(next);
    persist(next);
  }
  function goPrev() {
    const prev = prevStepId(currentStep, hasMdsap);
    setCurrentStep(prev);
    persist(prev);
  }
  function goToStep(stepId: string) {
    setCurrentStep(stepId as StepId);
    persist(stepId as StepId);
  }

  const canContinue =
    (currentStep === "referentiels" && referentialCodes.length > 0) ||
    (currentStep === "role" && economicRoles.length > 0) ||
    (currentStep === "marches" && markets.length > 0);

  if (optionsQuery.isLoading || myScopeQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!options) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <p className="text-muted-foreground">Impossible de charger les options d'onboarding.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-8">
          <Stepper steps={steps} currentStepId={currentStep} completedStepIds={completedStepIds} onStepClick={goToStep} />
        </div>

        {currentStep === "referentiels" && (
          <StepReferentiels
            referentials={options.referentials}
            shortcuts={options.shortcuts}
            selected={referentialCodes}
            onChange={setReferentialCodes}
          />
        )}
        {currentStep === "role" && (
          <StepRole
            roles={options.economicRoles}
            situations={options.situations}
            selectedRoles={economicRoles}
            onChangeRoles={setEconomicRoles}
            selectedSituations={situationTags}
            onChangeSituations={setSituationTags}
          />
        )}
        {currentStep === "marches" && hasMdsap && (
          <StepMarches markets={options.markets} selected={markets} onChange={setMarkets} />
        )}
        {currentStep === "apercu" && (
          <StepApercu
            preview={preview}
            referentials={options.referentials}
            selectedReferentials={referentialCodes}
            selectedRoles={economicRoles}
            roleCatalog={options.economicRoles}
            onModify={() => goToStep("referentiels")}
            onStart={() =>
              completeMutation.mutate({ referentialCodes, economicRoles, markets, situationTags })
            }
            isStarting={completeMutation.isPending}
            startError={completeMutation.error?.message}
          />
        )}

        {currentStep !== "apercu" && (
          <div className="mt-6 flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm">
            <Button variant="outline" onClick={goPrev} disabled={currentStep === "referentiels"}>
              Retour
            </Button>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                {previewQuery.isFetching ? (
                  <Loader2 className="inline h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span className="text-foreground font-semibold">{preview?.total ?? 0}</span> question
                    {(preview?.total ?? 0) > 1 ? "s" : ""} sélectionnée{(preview?.total ?? 0) > 1 ? "s" : ""}
                  </>
                )}
              </span>
              <Button onClick={goNext} disabled={!canContinue}>
                Continuer
              </Button>
            </div>
          </div>
        )}

        {preview && preview.total === 0 && referentialCodes.length > 0 && economicRoles.length > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            Cette combinaison ne cible aucune question — ajoutez un référentiel.
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative w-full rounded-lg border-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
      }`}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}
      {children}
    </button>
  );
}

function StepReferentiels({
  referentials,
  shortcuts,
  selected,
  onChange,
}: {
  referentials: Referential[];
  shortcuts: Record<string, string[]>;
  selected: string[];
  onChange: (codes: string[]) => void;
}) {
  function toggle(code: string) {
    onChange(selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quels référentiels visez-vous ?</CardTitle>
        <CardDescription>Sélectionnez un ou plusieurs cadres. Vous pourrez en ajouter plus tard.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {Object.entries(shortcuts).map(([label, codes]) => (
            <Button key={label} type="button" variant="secondary" size="sm" onClick={() => onChange(codes)}>
              {label}
            </Button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {referentials.map((r) => (
            <ToggleCard key={r.code} selected={selected.includes(r.code)} onClick={() => toggle(r.code)}>
              <div className="pr-6">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{r.code}</span>
                  <Badge variant="outline">{r.volume} questions</Badge>
                </div>
                <p className="mt-1 text-sm text-foreground">{r.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{r.aide}</p>
              </div>
            </ToggleCard>
          ))}
        </div>

        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              <ChevronDown className="h-4 w-4" />
              Besoin d'aide pour choisir ?
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            Vous fabriquez des DM vendus en Europe → MDR + ISO 13485 + ISO 14971. Vous visez aussi les USA → ajoutez
            FDA/QMSR. Plusieurs marchés d'un coup → MDSAP.
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

function StepRole({
  roles,
  situations,
  selectedRoles,
  onChangeRoles,
  selectedSituations,
  onChangeSituations,
}: {
  roles: EconomicRole[];
  situations: Situation[];
  selectedRoles: string[];
  onChangeRoles: (roles: string[]) => void;
  selectedSituations: string[];
  onChangeSituations: (tags: string[]) => void;
}) {
  function toggleRole(code: string) {
    onChangeRoles(selectedRoles.includes(code) ? selectedRoles.filter((c) => c !== code) : [...selectedRoles, code]);
  }
  function toggleSituation(code: string) {
    onChangeSituations(
      selectedSituations.includes(code) ? selectedSituations.filter((c) => c !== code) : [...selectedSituations, code]
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quel est votre rôle ?</CardTitle>
        <CardDescription>Votre statut réglementaire détermine les obligations qui vous concernent.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {roles.map((r) => (
            <ToggleCard key={r.code} selected={selectedRoles.includes(r.code)} onClick={() => toggleRole(r.code)}>
              <div className="pr-6">
                <p className="font-semibold">{r.label}</p>
                <p className="mt-1 text-sm text-foreground">{r.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">{r.exemple}</p>
              </div>
            </ToggleCard>
          ))}
        </div>

        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              <ChevronDown className="h-4 w-4" />
              Situations particulières
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2 rounded-md bg-muted/50 p-3">
            {situations.map((s) => (
              <label key={s.code} className="flex items-center gap-2 text-sm">
                <Checkbox checked={selectedSituations.includes(s.code)} onCheckedChange={() => toggleSituation(s.code)} />
                {s.label}
              </label>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

function StepMarches({
  markets,
  selected,
  onChange,
}: {
  markets: Market[];
  selected: string[];
  onChange: (codes: string[]) => void;
}) {
  function toggle(code: string) {
    onChange(selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quels marchés visez-vous ?</CardTitle>
        <CardDescription>MDSAP couvre plusieurs pays aux exigences distinctes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {markets.map((m) => (
            <label
              key={m.code}
              className="flex items-center gap-2 rounded-md border p-3 text-sm hover:border-primary/40"
            >
              <Checkbox checked={selected.includes(m.code)} onCheckedChange={() => toggle(m.code)} />
              <span className="font-medium">{m.label}</span>
              <span className="text-xs text-muted-foreground">({m.autorite})</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Chaque marché ajoute ses exigences propres (délais de déclaration, enregistrement…). Cochez uniquement les
          pays réellement visés.
        </p>
      </CardContent>
    </Card>
  );
}

function StepApercu({
  preview,
  referentials,
  selectedReferentials,
  selectedRoles,
  roleCatalog,
  onModify,
  onStart,
  isStarting,
  startError,
}: {
  preview: PreviewCount | undefined;
  referentials: Referential[];
  selectedReferentials: string[];
  selectedRoles: string[];
  roleCatalog: EconomicRole[];
  onModify: () => void;
  onStart: () => void;
  isStarting: boolean;
  startError?: string;
}) {
  const total = preview?.total ?? 0;
  const estimateLowH = Math.round((total * 2) / 60 * 10) / 10;
  const estimateHighH = Math.round((total * 3) / 60 * 10) / 10;

  const referentialLabels = useMemo(
    () =>
      selectedReferentials.map((code) => {
        const r = referentials.find((ref) => ref.code === code);
        const count = preview?.parReferentiel[code] ?? 0;
        return `${r?.code ?? code} (${count})`;
      }),
    [selectedReferentials, referentials, preview]
  );
  const roleLabels = selectedRoles.map((code) => roleCatalog.find((r) => r.code === code)?.label ?? code);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Votre audit personnalisé est prêt.</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border-2 border-primary bg-primary/5 p-6 text-center">
          <p className="text-4xl font-bold text-primary">{total}</p>
          <p className="mt-1 text-sm font-medium text-foreground">questions rien que pour vous</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Référentiels : <span className="font-medium text-foreground">{referentialLabels.join(" · ")}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Rôle : <span className="font-medium text-foreground">{roleLabels.join(", ")}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Durée estimée :{" "}
            <span className="font-medium text-foreground">
              ~{estimateLowH}-{estimateHighH} h
            </span>
          </p>
        </div>

        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              <ChevronDown className="h-4 w-4" />
              Voir le détail par référentiel
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {selectedReferentials.map((code) => {
              const count = preview?.parReferentiel[code] ?? 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={code} className="flex items-center gap-2 text-sm">
                  <span className="w-24 shrink-0 font-medium">{code}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-10 shrink-0 text-right text-muted-foreground">{count}</span>
                </div>
              );
            })}
            <p className="pt-2 text-xs text-muted-foreground">
              Bonus : vos réponses couvriront aussi partiellement d'autres référentiels grâce aux correspondances
              croisées du corpus (visible dans le rapport d'audit).
            </p>
          </CollapsibleContent>
        </Collapsible>

        <p className="text-sm text-muted-foreground">
          Répondez honnêtement : plus vous êtes exigeant ici, plus votre audit externe sera serein.
        </p>

        {startError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {startError}
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-4">
          <Button variant="outline" onClick={onModify}>
            Modifier ma sélection
          </Button>
          <Button onClick={onStart} disabled={isStarting || total === 0}>
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création de l'audit...
              </>
            ) : (
              "Démarrer mon audit"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
