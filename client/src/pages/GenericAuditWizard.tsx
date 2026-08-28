/**
 * Wizard d'audit générique — étapes D et "point d'entrée unique" (voir
 * CORRECTIONS.md).
 *
 * Sert tout référentiel via le routeur backend générique (trpc.audit.create
 * / getQuestionsForAudit / saveResponse / getStats), lui-même piloté par
 * referentialId — pas de code spécifique par référentiel ici. Le rôle
 * économique est TOUJOURS transmis (jamais omis), contrairement à
 * ISOAuditWizard.
 *
 * Étape 0 (sélection du référentiel) : affichée uniquement quand l'URL
 * n'a pas de ?ref= — c'est le cas du point d'entrée générique ("+ Nouvel
 * audit"). Les cartes par référentiel (MDR, IVDR, MDSAP...) continuent de
 * fournir ?ref= directement et sautent cette étape, comportement inchangé.
 *
 * Volontairement minimal au-delà de l'étape 0 (formulaire simple + liste de
 * questions) : les spécificités par référentiel (classe DM, gradation
 * MDSAP) arrivent dans une étape ultérieure, sous forme d'étapes
 * conditionnelles au-dessus de ce même socle générique — pas de wizard
 * dédié à réécrire.
 */
import { useMemo, useState } from "react";
import { Redirect, useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ChevronRight, FileText, Layers, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { SiteCreationModal } from "@/components/SiteCreationModal";

const TYPE_SECTIONS: Record<string, { label: string; icon: typeof ShieldCheck }> = {
  regulation: { label: "Règlements", icon: ShieldCheck },
  program: { label: "Programmes", icon: Layers },
  standard: { label: "Normes", icon: FileText },
};
const TYPE_ORDER = ["regulation", "program", "standard"];

const ECONOMIC_ROLES = [
  { value: "fabricant", label: "Fabricant" },
  { value: "mandataire", label: "Mandataire" },
  { value: "importateur", label: "Importateur" },
  { value: "distributeur", label: "Distributeur" },
];

const RESPONSE_VALUES = [
  { value: "compliant", label: "Conforme" },
  { value: "partial", label: "Partiellement conforme" },
  { value: "non_compliant", label: "Non conforme" },
  { value: "not_applicable", label: "Non applicable" },
];

function dedicatedAuditPath(referentialCode: string): string | null {
  const code = referentialCode.trim().toUpperCase();
  if (code === "MDR") return "/mdr/audit";
  if (code === "ISO9001") return "/iso/audit?standard=9001";
  if (code === "ISO13485") return "/iso/audit?standard=13485";
  return null;
}

export default function GenericAuditWizard() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const referentialCode = searchParams.get("ref") ?? "";
  const auditIdFromUrl = Number(searchParams.get("auditId"));

  // ✅ L'auditId vit dans l'URL (?auditId=), pas seulement en state : sans
  // ça, quitter/rafraîchir la page après création perdait irrémédiablement
  // l'accès aux questions (aucune route de reprise) — trouvé en testant
  // le parcours complet, pas seulement la création.
  const [auditId, setAuditId] = useState<number | null>(
    Number.isFinite(auditIdFromUrl) && auditIdFromUrl > 0 ? auditIdFromUrl : null
  );
  const [showSiteModal, setShowSiteModal] = useState(false);

  const [siteId, setSiteId] = useState<string>("");
  const [auditName, setAuditName] = useState<string>(`Audit ${referentialCode} - ${new Date().toLocaleDateString("fr-FR")}`);
  const [economicRole, setEconomicRole] = useState<string>("");
  const [processMode, setProcessMode] = useState<"all" | "select">("all");
  const [selectedProcessIds, setSelectedProcessIds] = useState<string[]>([]);

  const { data: referentialsData, isLoading: loadingReferentials } = trpc.referentials.list.useQuery();
  // Étape 0 uniquement : liste filtrée enabled=true pour le sélecteur de
  // référentiel. Le lookup par code ci-dessus (referentialsData) reste non
  // filtré pour qu'un lien direct ?ref= continue de fonctionner même si le
  // référentiel a été désactivé du sélecteur entre-temps.
  const { data: enabledReferentialsData, isLoading: loadingEnabledReferentials } = trpc.referentials.list.useQuery();
  const { data: processesData, isLoading: loadingProcesses } = trpc.mdr.getProcesses.useQuery();
  const { data: sitesData, isLoading: loadingSites, refetch: refetchSites } = trpc.mdr.getSites.useQuery();

  const referentialsByType = useMemo(() => {
    const list = (enabledReferentialsData ?? []) as any[];
    const groups: Record<string, any[]> = {};
    for (const r of list) {
      const type = TYPE_SECTIONS[r.type] ? r.type : "standard";
      (groups[type] ??= []).push(r);
    }
    for (const type of Object.keys(groups)) {
      groups[type].sort((a, b) => Number(a.id) - Number(b.id));
    }
    return groups;
  }, [enabledReferentialsData]);

  const processes = useMemo(() => {
    const arr = (processesData as any)?.processes;
    return Array.isArray(arr) ? arr : Array.isArray(processesData) ? (processesData as any[]) : [];
  }, [processesData]);

  const sites = useMemo(() => {
    const arr = (sitesData as any)?.sites;
    return Array.isArray(arr) ? arr : Array.isArray(sitesData) ? (sitesData as any[]) : [];
  }, [sitesData]);

  const referentiel = useMemo(
    () => (referentialsData ?? []).find((r: any) => String(r.code).toUpperCase() === referentialCode.toUpperCase()),
    [referentialsData, referentialCode]
  );

  const createAudit = trpc.audit.create.useMutation({
    onSuccess: (res: any) => {
      const id = Number(res?.auditId);
      if (Number.isFinite(id) && id > 0) {
        setAuditId(id);
        setLocation(`/audit/generic?ref=${referentialCode}&auditId=${id}`, { replace: true });
      }
    },
    onError: (err) => toast.error("❌ Erreur", { description: err.message }),
  });

  const questionsQuery = trpc.audit.getQuestionsForAudit.useQuery(
    { auditId: auditId ?? 0 },
    { enabled: !!auditId }
  );
  const statsQuery = trpc.audit.getStats.useQuery({ auditId: auditId ?? 0 }, { enabled: !!auditId });

  const saveResponse = trpc.audit.saveResponse.useMutation({
    onSuccess: () => {
      statsQuery.refetch();
      toast.success("Réponse enregistrée");
    },
    onError: (err) => toast.error("❌ Erreur", { description: err.message }),
  });

  const isFormValid = !!siteId && auditName.trim().length > 0 && !!economicRole && !!referentiel;

  const dedicatedPath = dedicatedAuditPath(referentialCode);

  const handleCreate = () => {
    if (!referentiel) {
      toast.error("❌ Référentiel introuvable", { description: `Code "${referentialCode}" non reconnu.` });
      return;
    }
    if (!economicRole) {
      toast.error("❌ Rôle économique requis", { description: "Sélectionnez votre rôle avant de créer l'audit." });
      return;
    }

    const processIds =
      processMode === "all"
        ? processes.map((p: any) => String(p.id ?? "").trim()).filter(Boolean)
        : selectedProcessIds;

    createAudit.mutate({
      auditType: referentialCode,
      name: auditName.trim(),
      referentialIds: [Number(referentiel.id)],
      siteId: Number(siteId),
      economicRole,
      processIds,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vous devez être connecté pour démarrer un audit.
            <Button variant="link" className="ml-2" onClick={() => setLocation("/login")}>
              Se connecter
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (dedicatedPath) {
    return <Redirect to={dedicatedPath} />;
  }

  // ---- Étape 0 : sélection du référentiel (point d'entrée générique) ----
  if (!referentialCode) {
    if (loadingEnabledReferentials) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        </div>
      );
    }

    const availableTypes = TYPE_ORDER.filter((type) => (referentialsByType[type]?.length ?? 0) > 0);

    return (
      <div className="container max-w-4xl py-10 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Nouvel audit</h1>
          <p className="text-muted-foreground">
            Choisissez le référentiel réglementaire ou normatif sur lequel démarrer votre audit.
          </p>
        </div>

        {availableTypes.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Aucun référentiel disponible pour le moment.</AlertDescription>
          </Alert>
        ) : (
          availableTypes.map((type) => {
            const section = TYPE_SECTIONS[type];
            const Icon = section.icon;
            return (
              <div key={type} className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  <Icon className="h-4 w-4" />
                  {section.label}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {referentialsByType[type].map((r: any) => (
                    <Card
                      key={r.id}
                      className="cursor-pointer transition-colors hover:border-primary hover:shadow-md"
                      onClick={() => setLocation(dedicatedAuditPath(String(r.code)) ?? `/audit/generic?ref=${r.code}`)}
                    >
                      <CardContent className="flex items-center justify-between gap-3 py-5">
                        <div>
                          <div className="font-medium">{r.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">{r.code}</div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  if (loadingReferentials || loadingProcesses || loadingSites) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  if (!referentiel) {
    return (
      <div className="container max-w-3xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Référentiel "{referentialCode}" introuvable en base. Contactez le support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ---- Étape 2 : questions ----
  if (auditId) {
    const questions = questionsQuery.data?.questions ?? [];
    const stats = statsQuery.data as any;

    return (
      <div className="container max-w-4xl py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Audit {referentiel.name}</CardTitle>
            <CardDescription>
              {questionsQuery.isLoading
                ? "Chargement des questions…"
                : `${questions.length} question(s) dans le périmètre — score actuel : ${stats?.score ?? 0}%`}
            </CardDescription>
          </CardHeader>
        </Card>

        {questionsQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : questions.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Aucune question dans le périmètre sélectionné (rôle/processus). Vérifiez votre sélection.
            </AlertDescription>
          </Alert>
        ) : (
          questions.map((q: any) => (
            <QuestionCard
              key={q.questionKey}
              question={q}
              onSave={(payload) => saveResponse.mutate({ auditId, questionKey: q.questionKey, ...payload })}
            />
          ))
        )}
      </div>
    );
  }

  // ---- Étape 1 : création ----
  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nouvel audit {referentiel.name}</CardTitle>
          <CardDescription>Référentiel, rôle et processus — le rôle économique est requis.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nom de l'audit</Label>
            <Input value={auditName} onChange={(e) => setAuditName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Site audité *</Label>
            <div className="flex gap-2">
              <Select value={siteId} onValueChange={setSiteId}>
                <SelectTrigger className="flex-1">
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
              <Button type="button" variant="outline" onClick={() => setShowSiteModal(true)}>
                + Site
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rôle économique *</Label>
            <Select value={economicRole} onValueChange={setEconomicRole}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner votre rôle" />
              </SelectTrigger>
              <SelectContent>
                {ECONOMIC_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Processus</Label>
            <Select value={processMode} onValueChange={(v) => setProcessMode(v as "all" | "select")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les processus</SelectItem>
                <SelectItem value="select">Sélection manuelle</SelectItem>
              </SelectContent>
            </Select>

            {processMode === "select" && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                {processes.map((p: any) => {
                  const id = String(p.id);
                  const checked = selectedProcessIds.includes(id);
                  return (
                    <label key={id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setSelectedProcessIds((prev) =>
                            e.target.checked ? [...prev, id] : prev.filter((x) => x !== id)
                          )
                        }
                      />
                      {p.name}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <Button className="w-full" disabled={!isFormValid || createAudit.isPending} onClick={handleCreate}>
            {createAudit.isPending ? "Création…" : "Créer l'audit"}
          </Button>
        </CardContent>
      </Card>

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

function QuestionCard({
  question,
  onSave,
}: {
  question: any;
  onSave: (payload: { responseValue: string; responseComment?: string }) => void;
}) {
  const [responseValue, setResponseValue] = useState<string>("");
  const [comment, setComment] = useState<string>("");

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="text-sm text-muted-foreground">
          {question.article ?? question.annexe ?? ""} {question.title ? `— ${question.title}` : ""}
        </div>
        <p className="font-medium">{question.questionText}</p>

        <Select value={responseValue} onValueChange={setResponseValue}>
          <SelectTrigger>
            <SelectValue placeholder="Réponse" />
          </SelectTrigger>
          <SelectContent>
            {RESPONSE_VALUES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Textarea
          placeholder="Commentaire / preuve (optionnel)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <Button
          size="sm"
          disabled={!responseValue}
          onClick={() => onSave({ responseValue, responseComment: comment || undefined })}
        >
          Enregistrer
        </Button>
      </CardContent>
    </Card>
  );
}
