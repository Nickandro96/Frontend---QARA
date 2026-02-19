/**
 * ISO Audit Wizard (aligned with MDR wizard UX)
 *
 * Goals:
 * - Wizard 3 étapes (métadonnées) comme MDR
 * - Liste des processus IDENTIQUE à MDR (source: trpc.mdr.getProcesses)
 * - Pas de rôle économique pour ISO 9001 / ISO 13485
 * - Compatibilité wouter (pas react-router)
 * - Support du query param ?standard=9001|13485 (liens Home existants)
 */

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, CheckCircle2, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { SiteCreationModal } from "@/components/SiteCreationModal";

const AUDIT_METHODS = [
  { value: "on_site", label: "Sur site" },
  { value: "remote", label: "À distance" },
  { value: "hybrid", label: "Hybride" },
];

type IsoStandardCode = "ISO9001" | "ISO13485";

function toIsoStandardCode(value: unknown): IsoStandardCode {
  const raw = String(value ?? "").trim();
  const v = raw.replace(/\s+/g, "").toUpperCase();
  // accept many shapes coming from DB / UI
  if (v === "ISO9001" || v === "9001" || v.endsWith("9001")) return "ISO9001";
  if (v === "ISO13485" || v === "13485" || v.endsWith("13485")) return "ISO13485";
  // default safe
  return "ISO9001";
}

function normalizeStandardFromQuery(): IsoStandardCode | null {
  const raw = new URLSearchParams(window.location.search).get("standard");
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v === "9001" || v === "iso9001") return "ISO9001";
  if (v === "13485" || v === "iso13485") return "ISO13485";
  return null;
}

export default function ISOAuditWizard() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Wizard state
  const [wizardStep, setWizardStep] = useState(0); // 0=standard, 1=critical, 2=context, 3=summary
  const [auditId, setAuditId] = useState<number | null>(null);
  const [showSiteModal, setShowSiteModal] = useState(false);

  // Step 0 - standard selection
  const [standardCode, setStandardCode] = useState<IsoStandardCode>("ISO9001");

  // Step 1 - critical fields
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [auditName, setAuditName] = useState<string>("");
  const [auditScope, setAuditScope] = useState<string>("");
  const [auditMethod, setAuditMethod] = useState<string>("on_site");
  const [plannedStartDate, setPlannedStartDate] = useState<string>("");
  const [plannedEndDate, setPlannedEndDate] = useState<string>("");
  const [auditLeader, setAuditLeader] = useState<string>("");
  const [auditeeMainContact, setAuditeeMainContact] = useState<string>("");
  const [auditeeContactEmail, setAuditeeContactEmail] = useState<string>("");
  const [selectedProcessMode, setSelectedProcessMode] = useState<string>("all"); // all | select
  // ⚠️ Keep as string to avoid NaN issues if API returns ids as strings
  const [selectedProcessIds, setSelectedProcessIds] = useState<string[]>([]);

  // Step 2 - context fields
  const [auditedEntityName, setAuditedEntityName] = useState<string>("");
  const [auditedEntityAddress, setAuditedEntityAddress] = useState<string>("");
  const [exclusions, setExclusions] = useState<string>("");
  const [productFamilies, setProductFamilies] = useState<string>("");
  const [markets, setMarkets] = useState<string>("");
  const [auditTeamMembers, setAuditTeamMembers] = useState<string>("");
  const [versionReferentials, setVersionReferentials] = useState<string>("");

  // Data fetching
  const { data: isoQualification, isLoading: loadingIsoQualification } = trpc.iso.getQualification.useQuery({});
  const { data: standards, isLoading: loadingStandards } = trpc.iso.getStandards.useQuery();

  // ✅ MUST be identical to MDR
  const { data: processesData, isLoading: loadingProcesses } = trpc.mdr.getProcesses.useQuery();
  const {
    data: sitesData,
    isLoading: loadingSites,
    refetch: refetchSites,
  } = trpc.mdr.getSites.useQuery();

  const processes = useMemo(() => {
    const arr = (processesData as any)?.processes;
    if (Array.isArray(arr)) return arr;
    if (Array.isArray(processesData)) return processesData as any[];
    return [] as any[];
  }, [processesData]);

  const sites = useMemo(() => {
    const arr = (sitesData as any)?.sites;
    if (Array.isArray(arr)) return arr;
    if (Array.isArray(sitesData)) return sitesData as any[];
    return [] as any[];
  }, [sitesData]);

  const selectedStandard = useMemo(() => {
    return (standards ?? []).find((s: any) => toIsoStandardCode(s.code) === standardCode) ?? null;
  }, [standards, standardCode]);

  const referentialIds = useMemo(() => {
    // Mapping DB: 2=ISO9001, 3=ISO13485
    return standardCode === "ISO9001" ? [2] : [3];
  }, [standardCode]);

  const selectedProcessIdsNumber = useMemo(() => {
    // Backend expects number[]; filter any non-numeric values defensively
    return selectedProcessIds
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n) && n > 0);
  }, [selectedProcessIds]);

  // Mutations
  const createOrUpdateAuditDraft = trpc.iso.createOrUpdateAuditDraft.useMutation({
    onSuccess: (res: any) => {
      const id = Number(res?.auditId);
      if (Number.isFinite(id) && id > 0) setAuditId(id);
    },
    onError: (err) => {
      toast.error("❌ Erreur", { description: err.message });
    },
  });

  const setAuditInProgress = trpc.iso.createOrUpdateAuditDraft.useMutation({
    onError: (err) => {
      toast.error("❌ Erreur", { description: err.message });
    },
  });

  const questionsForAudit = trpc.iso.getQuestionsForAudit.useQuery(
    { auditId: auditId ?? 0 },
    { enabled: !!auditId && wizardStep === 3 }
  );

  // Preselect from query (?standard=9001 or 13485)
  useEffect(() => {
    const fromQuery = normalizeStandardFromQuery();
    if (fromQuery) setStandardCode(fromQuery);
  }, []);

  // Auto-fill audit name when standard changes
  useEffect(() => {
    const now = new Date();
    const dd = now.toLocaleDateString("fr-FR");
    setAuditName(`Audit ${standardCode === "ISO9001" ? "ISO 9001" : "ISO 13485"} - ${dd}`);
  }, [standardCode]);

  const progressPercent = useMemo(() => {
    if (wizardStep <= 0) return 0;
    if (wizardStep === 1) return 33;
    if (wizardStep === 2) return 66;
    return 100;
  }, [wizardStep]);

  const isStep1Valid = () => {
    if (!selectedSiteId) return false;
    if (!auditName.trim()) return false;
    if (!plannedStartDate) return false;
    return true;
  };

  const upsertDraft = async (status: "draft" | "in_progress" = "draft") => {
    const effectiveProcessMode = selectedProcessIdsNumber.length > 0 ? "select" : selectedProcessMode;
    const payload: any = {
      auditId: auditId ?? undefined,
      standardCode,
      referentialIds,
      status,

      siteId: Number(selectedSiteId),
      name: auditName.trim(),

      scope: auditScope || null,
      method: auditMethod || null,
      startDate: plannedStartDate || null,
      endDate: plannedEndDate || null,

      // Backend validation expects strings (not null). Send empty strings when not provided.
      auditorName: (auditLeader ?? "").trim(),
      auditeeName: (auditeeMainContact ?? "").trim(),
      auditeeEmail: (auditeeContactEmail ?? "").trim(),

      // ✅ FIX: always persist selected processIds; force mode=select when at least one is selected
      processMode: effectiveProcessMode as any,
      processIds: selectedProcessIdsNumber,
entityName: auditedEntityName || null,
      address: auditedEntityAddress || null,
      exclusions: exclusions || null,
      productFamilies: productFamilies || null,
      markets: markets || null,
      auditTeam: auditTeamMembers || null,
      standardsVersion: versionReferentials || null,
    };

    const res: any = await createOrUpdateAuditDraft.mutateAsync(payload);
    const id = Number(res?.auditId);
    if (!Number.isFinite(id) || id <= 0) throw new Error("AuditId invalide");
    setAuditId(id);
    return id;
  };

  // Auth gate
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vous devez être connecté pour démarrer un audit ISO.
            <Button variant="link" className="ml-2" onClick={() => setLocation("/login")}>
              Se connecter
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loadingIsoQualification || loadingStandards || loadingProcesses || loadingSites) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!isoQualification) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Veuillez d'abord compléter votre qualification ISO.
            <Button variant="link" className="ml-2" onClick={() => setLocation("/iso/qualification")}
            >
              Compléter la qualification
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit ISO</h1>
          <p className="text-muted-foreground mt-1">
            Wizard de création d'audit (métadonnées + sélection processus) — sans rôle économique.
          </p>
        </div>
        {wizardStep > 0 && (
          <div className="w-[280px]">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Progression</span>
              <span>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} />
          </div>
        )}
      </div>

      {/* STEP 0 - Standard selection */}
      {wizardStep === 0 && (
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Sélection de la norme</CardTitle>
            <CardDescription>Choisissez la norme ISO à auditer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(standards ?? []).map((s: any) => (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => setStandardCode(toIsoStandardCode(s.code))}
                  className={
                    "text-left rounded-xl border p-4 transition hover:bg-muted/30 " +
                    (standardCode === toIsoStandardCode(s.code) ? "border-primary ring-2 ring-primary/20" : "")
                  }
                >
                  <div className="font-semibold">{s.label ?? s.name ?? s.code}</div>
                  <div className="text-sm text-muted-foreground mt-1">{s.description ?? ""}</div>
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setWizardStep(1)}>
                Continuer <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 1 - Critical */}
      {wizardStep === 1 && (
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Étape 1 — Informations critiques</CardTitle>
            <CardDescription>Ces informations sont nécessaires pour démarrer l'audit.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Norme sélectionnée</Label>
                <div className="rounded-lg border px-3 py-2 text-sm">
                  {selectedStandard?.label ?? (standardCode === "ISO9001" ? "ISO 9001" : "ISO 13485")}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Site *</Label>
                  <Button variant="link" className="h-auto p-0" onClick={() => setShowSiteModal(true)}>
                    + Ajouter un site
                  </Button>
                </div>
                <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Nom de l'audit *</Label>
                <Input value={auditName} onChange={(e) => setAuditName(e.target.value)} placeholder="Ex: Audit ISO 9001 - Site Paris" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Périmètre / Scope</Label>
                <Textarea value={auditScope} onChange={(e) => setAuditScope(e.target.value)} placeholder="Décrivez le périmètre de l'audit (processus, sites, exclusions…)" />
              </div>

              <div className="space-y-2">
                <Label>Méthode</Label>
                <Select value={auditMethod} onValueChange={setAuditMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date début prévue *</Label>
                <Input type="date" value={plannedStartDate} onChange={(e) => setPlannedStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Date fin prévue</Label>
                <Input type="date" value={plannedEndDate} onChange={(e) => setPlannedEndDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Auditeur / Lead</Label>
                <Input value={auditLeader} onChange={(e) => setAuditLeader(e.target.value)} placeholder="Nom de l'auditeur" />
              </div>
              <div className="space-y-2">
                <Label>Contact principal audité</Label>
                <Input value={auditeeMainContact} onChange={(e) => setAuditeeMainContact(e.target.value)} placeholder="Nom du contact" />
              </div>
              <div className="space-y-2">
                <Label>Email contact audité</Label>
                <Input value={auditeeContactEmail} onChange={(e) => setAuditeeContactEmail(e.target.value)} placeholder="email@exemple.com" />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Processus à auditer</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={selectedProcessMode === "all" ? "default" : "outline"}
                  onClick={() => {
                    setSelectedProcessMode("all");
                    setSelectedProcessIds([]);
                  }}
                >
                  Tous
                </Button>
                <Button
                  type="button"
                  variant={selectedProcessMode === "select" ? "default" : "outline"}
                  onClick={() => setSelectedProcessMode("select")}
                >
                  Sélection manuelle
                </Button>
              </div>

              {selectedProcessMode === "select" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {processes.map((p: any) => {
                    const id = String(p.id);
                    const checked = selectedProcessIds.includes(id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedProcessIds((prev) => (checked ? prev.filter((x) => x !== id) : [...prev, id]));
                        }}
                        className={
                          "text-left rounded-xl border p-3 transition hover:bg-muted/30 " +
                          (checked ? "border-primary ring-2 ring-primary/20" : "")
                        }
                      >
                        <div className="font-medium">{p.name}</div>
                        {p.description ? <div className="text-xs text-muted-foreground mt-1">{p.description}</div> : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setWizardStep(0)}>
                <ChevronLeft className="h-4 w-4 mr-2" /> Retour
              </Button>
              <Button
                disabled={!isStep1Valid() || createOrUpdateAuditDraft.isPending}
                onClick={async () => {
                  try {
                    await upsertDraft("draft");
                    setWizardStep(2);
                  } catch (e: any) {
                    toast.error("❌ Erreur", { description: e?.message ?? "Impossible de sauvegarder" });
                  }
                }}
              >
                {createOrUpdateAuditDraft.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sauvegarde…
                  </>
                ) : (
                  <>
                    Continuer <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2 - Context */}
      {wizardStep === 2 && (
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Étape 2 — Contexte & détails</CardTitle>
            <CardDescription>Facultatif, mais très utile pour un rapport premium.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Entité auditée</Label>
                <Input value={auditedEntityName} onChange={(e) => setAuditedEntityName(e.target.value)} placeholder="Nom de l'entité" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Adresse</Label>
                <Textarea value={auditedEntityAddress} onChange={(e) => setAuditedEntityAddress(e.target.value)} placeholder="Adresse complète" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Exclusions</Label>
                <Textarea value={exclusions} onChange={(e) => setExclusions(e.target.value)} placeholder="Exclusions (si applicable)" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Familles produits / services</Label>
                <Textarea value={productFamilies} onChange={(e) => setProductFamilies(e.target.value)} placeholder="Ex: Lits médicalisés, matelas, accessoires…" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Marchés</Label>
                <Textarea value={markets} onChange={(e) => setMarkets(e.target.value)} placeholder="Ex: France, UE, Export…" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Membres de l'équipe d'audit</Label>
                <Textarea value={auditTeamMembers} onChange={(e) => setAuditTeamMembers(e.target.value)} placeholder="Noms / fonctions" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Version / édition du référentiel</Label>
                <Input value={versionReferentials} onChange={(e) => setVersionReferentials(e.target.value)} placeholder="Ex: ISO 9001:2015" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setWizardStep(1)}>
                <ChevronLeft className="h-4 w-4 mr-2" /> Retour
              </Button>
              <Button
                disabled={createOrUpdateAuditDraft.isPending}
                onClick={async () => {
                  try {
                    await upsertDraft("draft");
                    setWizardStep(3);
                  } catch (e: any) {
                    toast.error("❌ Erreur", { description: e?.message ?? "Impossible de sauvegarder" });
                  }
                }}
              >
                {createOrUpdateAuditDraft.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sauvegarde…
                  </>
                ) : (
                  <>
                    Résumé <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3 - Summary */}
      {wizardStep === 3 && (
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Étape 3 — Résumé</CardTitle>
            <CardDescription>Vérifiez les paramètres et lancez l'audit.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border p-4">
                <div className="text-sm text-muted-foreground">Audit</div>
                <div className="font-semibold mt-1">{auditName}</div>
                <div className="text-sm text-muted-foreground mt-2">Norme</div>
                <div className="font-medium">{selectedStandard?.label ?? (standardCode === "ISO9001" ? "ISO 9001" : "ISO 13485")}</div>
                <div className="text-sm text-muted-foreground mt-2">Site</div>
                <div className="font-medium">{sites.find((s: any) => String(s.id) === String(selectedSiteId))?.name ?? "—"}</div>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Questions disponibles</div>
                    <div className="text-3xl font-bold mt-1">{questionsForAudit.data?.count ?? "—"}</div>
                  </div>
                  <div className="rounded-full border p-3">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">Audit ID: {auditId ?? "—"}</div>
              </div>
            </div>

            {questionsForAudit.isFetching ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Chargement des questions…
              </div>
            ) : null}

            {questionsForAudit.error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{questionsForAudit.error.message}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setWizardStep(2)}>
                <ChevronLeft className="h-4 w-4 mr-2" /> Retour
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => questionsForAudit.refetch()} disabled={questionsForAudit.isFetching}>
                  {questionsForAudit.isFetching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Rafraîchir…
                    </>
                  ) : (
                    "Rafraîchir"
                  )}
                </Button>

                <Button
                  onClick={async () => {
                    try {
                      const id = auditId ?? (await upsertDraft("draft"));

                      // ✅ FIX 2: do NOT overwrite process selection with a minimal payload.
                      // We just upsert as in_progress with the full payload (incl. processMode/processIds).
                      await upsertDraft("in_progress");

                      toast.success("Audit lancé", { description: "Redirection vers le questionnaire…" });
                      setTimeout(() => setLocation(`/iso/audit/${id}`), 400);
                    } catch (e: any) {
                      toast.error("❌ Erreur", { description: e?.message ?? "Impossible de démarrer" });
                    }
                  }}
                  disabled={setAuditInProgress.isPending}
                >
                  {setAuditInProgress.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Démarrage…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Démarrer l'audit
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Site modal */}
      <SiteCreationModal
        open={showSiteModal}
        onOpenChange={setShowSiteModal}
        onSiteCreated={async () => {
          await refetchSites();
        }}
      />
    </div>
  );
}
