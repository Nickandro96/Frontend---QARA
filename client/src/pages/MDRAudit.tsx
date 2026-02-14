/**
 * MDR Audit Page - WIZARD VERSION (V6)
 * Professional 3-step wizard for audit creation
 * Step 1: Critical fields (required to start audit)
 * Step 2: Context & metadata (optional enrichment)
 * Step 3: Results & summary (auto-filled)
 *
 * ✅ Fix included (this version):
 * - Actually USE the getQuestionsForAudit query result (data + loading + error)
 * - Ensure stable auditId usage and step transitions
 * - Fix sites query: use `trpc.mdr.getSites`
 * - Keep organizations query as-is (trpc.organizations.list)
 *
 * ✅ NEW FIX:
 * - On "Start Questionnaire" -> set audit status to "in_progress" BEFORE redirect
 */

import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, FileText, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { SiteCreationModal } from "@/components/SiteCreationModal";

const ECONOMIC_ROLES = [
  { value: "fabricant", label: "Fabricant" },
  { value: "importateur", label: "Importateur" },
  { value: "distributeur", label: "Distributeur" },
  { value: "mandataire", label: "Mandataire" },
];

const AUDIT_METHODS = [
  { value: "on_site", label: "Sur site" },
  { value: "remote", label: "À distance" },
  { value: "hybrid", label: "Hybride" },
];

function coerceAuditId(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === "string") {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  if (raw && typeof raw === "object" && "id" in (raw as any)) {
    const n = Number((raw as any).id);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

export default function MDRAudit() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Route param (if this component is also mounted on /mdr/audit/:auditId)
  const [, params] = useRoute("/mdr/audit/:auditId");

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);

  // Parse auditId safely (if present)
  const auditIdFromUrlRaw = params?.auditId;
  const auditIdFromUrlNum = auditIdFromUrlRaw ? Number(auditIdFromUrlRaw) : NaN;
  const auditIdFromUrl = auditIdFromUrlRaw && !Number.isNaN(auditIdFromUrlNum) ? auditIdFromUrlNum : null;

  const [auditId, setAuditId] = useState<number | null>(auditIdFromUrl);

  const [isAuditCreated, setIsAuditCreated] = useState(false);
  const [showSiteModal, setShowSiteModal] = useState(false);

  // Step 1: Critical fields
  const [selectedRole, setSelectedRole] = useState<string>("fabricant");
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("");
  const [auditName, setAuditName] = useState<string>("");
  const [auditScope, setAuditScope] = useState<string>("");
  const [auditMethod, setAuditMethod] = useState<string>("on_site");
  const [plannedStartDate, setPlannedStartDate] = useState<string>("");
  const [plannedEndDate, setPlannedEndDate] = useState<string>("");
  const [auditLeader, setAuditLeader] = useState<string>("");
  const [auditeeMainContact, setAuditeeMainContact] = useState<string>("");
  const [auditeeContactEmail, setAuditeeContactEmail] = useState<string>("");
  const [selectedProcess, setSelectedProcess] = useState<string>("all");

  // Step 2: Context fields
  const [auditedEntityName, setAuditedEntityName] = useState<string>("");
  const [auditedEntityAddress, setAuditedEntityAddress] = useState<string>("");
  const [exclusions, setExclusions] = useState<string>("");
  const [productFamilies, setProductFamilies] = useState<string>("");
  const [classDevices, setClassDevices] = useState<string>("");
  const [markets, setMarkets] = useState<string>("");
  const [auditTeamMembers, setAuditTeamMembers] = useState<string>("");
  const [versionReferentials, setVersionReferentials] = useState<string>("");

  // Data fetching
  const { data: qualification } = trpc.mdr.getQualification.useQuery({});
  const { data: processesData, isLoading: loadingProcesses } = trpc.mdr.getProcesses.useQuery();

  const {
    data: sitesData,
    isLoading: loadingSites,
    refetch: refetchSites,
  } = trpc.mdr.getSites.useQuery();

  const { data: organizationsData, isLoading: loadingOrganizations } = trpc.organizations.list.useQuery();

  const organizations = useMemo(() => {
    if (Array.isArray(organizationsData)) return organizationsData as any[];
    const maybe = (organizationsData as any)?.organizations;
    return Array.isArray(maybe) ? maybe : [];
  }, [organizationsData]);

  const sites = useMemo(() => {
    const maybe = (sitesData as any)?.sites;
    if (Array.isArray(maybe)) return maybe;
    return Array.isArray(sitesData as any) ? (sitesData as any) : [];
  }, [sitesData]);

  const processes = useMemo(() => {
    const maybe = (processesData as any)?.processes;
    if (Array.isArray(maybe)) return maybe;
    return Array.isArray(processesData as any) ? (processesData as any) : [];
  }, [processesData]);

  // date -> ISO string
  const toIsoOrNull = (dateStr: string) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  };

  const createOrUpdateAuditDraft = trpc.mdr.createOrUpdateAuditDraft.useMutation({
    onSuccess: async (data) => {
      const id = coerceAuditId((data as any)?.auditId);
      if (!id) {
        console.error("Bad createOrUpdateAuditDraft response:", data);
        toast.error("❌ Réponse API invalide: auditId introuvable");
        return;
      }

      setAuditId(id);
      setIsAuditCreated(true);

      toast.success("✅ Audit enregistré");
      setWizardStep(2);
    },
    onError: (error) => {
      toast.error("❌ Erreur lors de l'enregistrement de l'audit: " + error.message);
    },
  });

  const updateAuditMetadata = trpc.mdr.createOrUpdateAuditDraft.useMutation({
    onSuccess: () => {
      toast.success("✅ Métadonnées mises à jour");
      setWizardStep(3);
    },
    onError: (error) => {
      toast.error("❌ Erreur lors de la mise à jour: " + error.message);
    },
  });

  // used for "start questionnaire" status update
  const setAuditInProgress = trpc.mdr.createOrUpdateAuditDraft.useMutation({
    onError: (error) => {
      toast.error("❌ Impossible de démarrer l'audit: " + error.message);
    },
  });

  const auditIdNum = typeof auditId === "number" ? auditId : null;
  const canQueryByAuditId = !!auditIdNum && auditIdNum > 0;

  const {
    data: questionsPayload,
    isLoading: loadingQuestions,
    error: questionsError,
    refetch: refetchQuestions,
  } = trpc.mdr.getQuestionsForAudit.useQuery(
    { auditId: auditIdNum as number },
    { enabled: canQueryByAuditId }
  );

  const questions = useMemo(() => {
    const maybe = (questionsPayload as any)?.questions;
    return Array.isArray(maybe) ? maybe : [];
  }, [questionsPayload]);

  const questionsCount = questions.length;

  useEffect(() => {
    if (auditIdFromUrl && auditIdFromUrl > 0) {
      setAuditId(auditIdFromUrl);
      setIsAuditCreated(true);
      setWizardStep(3);
      return;
    }

    if (qualification?.economicRole) {
      setSelectedRole(qualification.economicRole);
    }
  }, [auditIdFromUrl, qualification]);

  useEffect(() => {
    if (!auditName) {
      setAuditName(`Audit MDR (${selectedRole}) - ${new Date().toLocaleDateString("fr-FR")}`);
    }
  }, [selectedRole]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSiteCreated = (siteId: number) => {
    setSelectedSiteId(String(siteId));
    refetchSites();
  };

  const isStep1Valid = () => {
    return (
      selectedSiteId &&
      auditScope &&
      auditMethod &&
      plannedStartDate &&
      auditLeader &&
      auditeeMainContact &&
      auditeeContactEmail
    );
  };

  const handleStep1Submit = () => {
    if (!isStep1Valid()) {
      toast.error("Veuillez remplir tous les champs obligatoires de l'étape 1");
      return;
    }

    const startIso = toIsoOrNull(plannedStartDate) ?? new Date().toISOString();
    const endIso = toIsoOrNull(plannedEndDate);

    createOrUpdateAuditDraft.mutate({
      siteId: parseInt(selectedSiteId, 10),
      name: auditName,

      auditType: "internal",
      type: "internal",

      status: "draft",

      referentialIds: [1],
      processIds: selectedProcess === "all" ? [] : [selectedProcess],

      economicRole: selectedRole as any,

      clientOrganization: selectedOrganizationId ? String(selectedOrganizationId) : null,
      siteLocation: null,

      auditorName: auditLeader || null,
      auditorEmail: auditeeContactEmail || null,

      startDate: startIso,
      endDate: endIso,
    });
  };

  const handleStep2Submit = () => {
    if (!auditIdNum || auditIdNum <= 0) return;

    const startIso = toIsoOrNull(plannedStartDate) ?? new Date().toISOString();
    const endIso = toIsoOrNull(plannedEndDate);

    updateAuditMetadata.mutate({
      auditId: auditIdNum,
      siteId: parseInt(selectedSiteId, 10),
      name: auditName,

      auditType: "internal",
      type: "internal",

      status: "draft",

      referentialIds: [1],
      processIds: selectedProcess === "all" ? [] : [selectedProcess],

      economicRole: selectedRole as any,

      clientOrganization: auditedEntityName
        ? auditedEntityName
        : selectedOrganizationId
          ? String(selectedOrganizationId)
          : null,
      siteLocation: auditedEntityAddress ? auditedEntityAddress : null,

      auditorName: auditLeader || null,
      auditorEmail: auditeeContactEmail || null,

      startDate: startIso,
      endDate: endIso,
    });
  };

  /**
   * ✅ NEW: set audit status to in_progress then redirect
   */
  const handleStartQuestions = async () => {
    if (!auditIdNum || auditIdNum <= 0) return;

    const startIso = toIsoOrNull(plannedStartDate) ?? new Date().toISOString();
    const endIso = toIsoOrNull(plannedEndDate);

    try {
      await setAuditInProgress.mutateAsync({
        auditId: auditIdNum,
        siteId: parseInt(selectedSiteId || "0", 10) || 1, // fallback safe
        name: auditName || `Audit MDR (${selectedRole}) - ${new Date().toLocaleDateString("fr-FR")}`,

        auditType: "internal",
        type: "internal",

        status: "in_progress",

        referentialIds: [1],
        processIds: selectedProcess === "all" ? [] : [selectedProcess],

        economicRole: selectedRole as any,

        clientOrganization: auditedEntityName
          ? auditedEntityName
          : selectedOrganizationId
            ? String(selectedOrganizationId)
            : null,
        siteLocation: auditedEntityAddress ? auditedEntityAddress : null,

        auditorName: auditLeader || null,
        auditorEmail: auditeeContactEmail || null,

        startDate: startIso,
        endDate: endIso,
      });
    } catch {
      // toast handled in onError
      // still allow navigation if you want; but safer to stop
      return;
    }

    setLocation(`/mdr/audit/${auditIdNum}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Authentification requise</CardTitle>
            <CardDescription>Veuillez vous connecter pour accéder à l'audit</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/login")} className="w-full">
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (wizardStep === 1 && !isAuditCreated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Démarrer un Audit MDR</CardTitle>
            <CardDescription>Étape 1/3 - Informations critiques (obligatoires)</CardDescription>
            <Progress value={33} className="mt-4" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-slate-700">Identification</h3>

              <div className="space-y-2">
                <Label>Rôle Économique *</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(ECONOMIC_ROLES ?? []).map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Site / Localisation *</Label>
                {loadingSites ? (
                  <div className="flex items-center justify-center p-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Chargement des sites...
                  </div>
                ) : sites.length === 0 ? (
                  <div className="space-y-2">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>Aucun site disponible.</AlertDescription>
                    </Alert>
                    <Button variant="outline" className="w-full" onClick={() => setShowSiteModal(true)}>
                      + Créer un nouveau site
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un site" />
                      </SelectTrigger>
                      <SelectContent>
                        {sites.map((site: any) => (
                          <SelectItem key={site.id} value={String(site.id)}>
                            {site.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" className="w-full" onClick={() => setShowSiteModal(true)}>
                      + Créer un nouveau site
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Organisation (optionnel)</Label>
                {loadingOrganizations ? (
                  <div className="flex items-center justify-center p-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Chargement des organisations...
                  </div>
                ) : (
                  <Select value={selectedOrganizationId} onValueChange={setSelectedOrganizationId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une organisation" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org: any) => (
                        <SelectItem key={org.id} value={String(org.id)}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Nom de l'audit</Label>
                <Input
                  value={auditName}
                  onChange={(e) => setAuditName(e.target.value)}
                  placeholder="Audit MDR (Fabricant) - 10/02/2026"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-slate-700">Périmètre</h3>

              <div className="space-y-2">
                <Label>Scope / Périmètre *</Label>
                <Textarea
                  value={auditScope}
                  onChange={(e) => setAuditScope(e.target.value)}
                  placeholder="Décrivez le périmètre de l'audit"
                  className="min-h-20"
                />
              </div>

              <div className="space-y-2">
                <Label>Méthode d'audit *</Label>
                <Select value={auditMethod} onValueChange={setAuditMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Processus à auditer</Label>
                {loadingProcesses ? (
                  <div className="flex items-center justify-center p-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Chargement des processus...
                  </div>
                ) : (
                  <Select value={selectedProcess} onValueChange={setSelectedProcess}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les processus</SelectItem>
                      {processes.map((process: any) => (
                        <SelectItem key={process.id} value={String(process.id)}>
                          {process.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-slate-700">Planification</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de démarrage prévue *</Label>
                  <Input type="date" value={plannedStartDate} onChange={(e) => setPlannedStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Date de fin prévue</Label>
                  <Input type="date" value={plannedEndDate} onChange={(e) => setPlannedEndDate(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-slate-700">Contacts</h3>

              <div className="space-y-2">
                <Label>Auditeur responsable *</Label>
                <Input
                  value={auditLeader}
                  onChange={(e) => setAuditLeader(e.target.value)}
                  placeholder="Nom de l'auditeur responsable"
                />
              </div>

              <div className="space-y-2">
                <Label>Contact auditée - Nom *</Label>
                <Input
                  value={auditeeMainContact}
                  onChange={(e) => setAuditeeMainContact(e.target.value)}
                  placeholder="Nom du contact principal"
                />
              </div>

              <div className="space-y-2">
                <Label>Contact auditée - Email *</Label>
                <Input
                  type="email"
                  value={auditeeContactEmail}
                  onChange={(e) => setAuditeeContactEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button variant="outline" className="flex-1" onClick={() => setLocation("/")}>
                Annuler
              </Button>
              <Button
                className="flex-1"
                onClick={handleStep1Submit}
                disabled={!isStep1Valid() || createOrUpdateAuditDraft.isPending}
              >
                {createOrUpdateAuditDraft.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    Continuer vers l'étape 2
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <SiteCreationModal
          isOpen={showSiteModal}
          onClose={() => setShowSiteModal(false)}
          onSiteCreated={handleSiteCreated}
        />
      </div>
    );
  }

  if (wizardStep === 2 && isAuditCreated && auditIdNum && auditIdNum > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl">Enrichir les Métadonnées</CardTitle>
            <CardDescription>Étape 2/3 - Contexte & détails (facultatif)</CardDescription>
            <Progress value={66} className="mt-4" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-slate-700">Identification Avancée</h3>

              <div className="space-y-2">
                <Label>Entité auditée - Nom</Label>
                <Input
                  value={auditedEntityName}
                  onChange={(e) => setAuditedEntityName(e.target.value)}
                  placeholder="Nom complet de l'entité"
                />
              </div>

              <div className="space-y-2">
                <Label>Entité auditée - Adresse</Label>
                <Textarea
                  value={auditedEntityAddress}
                  onChange={(e) => setAuditedEntityAddress(e.target.value)}
                  placeholder="Adresse complète"
                  className="min-h-16"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-slate-700">Périmètre Détaillé</h3>

              <div className="space-y-2">
                <Label>Exclusions</Label>
                <Textarea
                  value={exclusions}
                  onChange={(e) => setExclusions(e.target.value)}
                  placeholder="Éléments exclus du périmètre"
                  className="min-h-16"
                />
              </div>

              <div className="space-y-2">
                <Label>Familles de produits</Label>
                <Input
                  value={productFamilies}
                  onChange={(e) => setProductFamilies(e.target.value)}
                  placeholder="Ex: Seringues, Cathéters, Implants"
                />
              </div>

              <div className="space-y-2">
                <Label>Classification des dispositifs</Label>
                <Input
                  value={classDevices}
                  onChange={(e) => setClassDevices(e.target.value)}
                  placeholder="Ex: Classe IIb, Classe III"
                />
              </div>

              <div className="space-y-2">
                <Label>Marchés visés</Label>
                <Input value={markets} onChange={(e) => setMarkets(e.target.value)} placeholder="Ex: EU, US, ASEAN" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-slate-700">Équipe & Critères</h3>

              <div className="space-y-2">
                <Label>Membres de l'équipe d'audit</Label>
                <Textarea
                  value={auditTeamMembers}
                  onChange={(e) => setAuditTeamMembers(e.target.value)}
                  placeholder="Noms et rôles des auditeurs (un par ligne)"
                  className="min-h-16"
                />
              </div>

              <div className="space-y-2">
                <Label>Version des référentiels</Label>
                <Input
                  value={versionReferentials}
                  onChange={(e) => setVersionReferentials(e.target.value)}
                  placeholder="Ex: MDR 2017/745 v2.0"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button variant="outline" className="flex-1" onClick={() => setWizardStep(1)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button className="flex-1" onClick={handleStep2Submit} disabled={updateAuditMetadata.isPending}>
                {updateAuditMetadata.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  <>
                    Continuer vers l'étape 3
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (wizardStep === 3 && isAuditCreated && auditIdNum && auditIdNum > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Audit Prêt à Démarrer</CardTitle>
            <CardDescription>Étape 3/3 - Résumé & démarrage</CardDescription>
            <Progress value={100} className="mt-4" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Audit <strong>#{auditIdNum}</strong> créé avec succès. Vous pouvez maintenant démarrer le questionnaire
                MDR.
              </AlertDescription>
            </Alert>

            <div className="bg-white border rounded-lg p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-slate-700">Questions disponibles (filtrées par backend)</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchQuestions()}
                  disabled={!canQueryByAuditId || loadingQuestions}
                >
                  {loadingQuestions ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Refresh...
                    </>
                  ) : (
                    "Rafraîchir"
                  )}
                </Button>
              </div>

              {questionsError ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Erreur lors du chargement des questions: {(questionsError as any)?.message ?? "Erreur inconnue"}
                  </AlertDescription>
                </Alert>
              ) : loadingQuestions ? (
                <div className="flex items-center text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Chargement des questions...
                </div>
              ) : (
                <div className="text-slate-600">
                  <strong>{questionsCount}</strong> questions trouvées.
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-lg space-y-3 text-sm">
              <div>
                <strong>Rôle économique :</strong> {selectedRole}
              </div>
              <div>
                <strong>Processus sélectionné :</strong> {selectedProcess}
              </div>
              <div>
                <strong>Scope :</strong> {auditScope}
              </div>
              <div>
                <strong>Méthode :</strong> {auditMethod}
              </div>
              <div>
                <strong>Auditeur responsable :</strong> {auditLeader}
              </div>
              <div>
                <strong>Contact auditée :</strong> {auditeeMainContact} ({auditeeContactEmail})
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button variant="outline" className="flex-1" onClick={() => setWizardStep(2)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleStartQuestions}
                disabled={setAuditInProgress.isPending}
              >
                {setAuditInProgress.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Démarrage...
                  </>
                ) : (
                  <>
                    Démarrer le Questionnaire MDR
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
