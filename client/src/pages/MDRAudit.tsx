import { useState, useEffect, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, FileText, ChevronLeft, ChevronRight, CheckCircle2, Lightbulb } from "lucide-react";
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

const RESPONSE_STATUSES = [
  { ui: "Conforme", backend: "compliant", color: "bg-green-500" },
  { ui: "NOK", backend: "non_compliant", color: "bg-red-500" },
  { ui: "N/A", backend: "not_applicable", color: "bg-gray-500" },
  { ui: "Partiel", backend: "partial", color: "bg-yellow-500" },
  { ui: "En cours", backend: "in_progress", color: "bg-blue-500" },
];

interface Question {
  id: string | number;
  questionKey: string;
  article?: string;
  annexe?: string;
  title?: string;
  questionText: string;
  criticality: string;
  risks?: string;
  expectedEvidence?: string;
  processId?: string | number;
  processName?: string;
  referenceLabel?: string;
}

interface AuditResponse {
  questionKey: string;
  responseValue: string;
  responseComment?: string;
  note?: string;
  evidenceFiles?: string[];
}

export default function MDRAudit() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/mdr/audit/:id");
  
  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [auditId, setAuditId] = useState<number | null>(params?.id ? parseInt(params.id) : null);
  const [isAuditCreated, setIsAuditCreated] = useState(!!params?.id);
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

  // Drill-down state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentResponseValue, setCurrentResponseValue] = useState<string | undefined>(undefined);
  const [currentResponseComment, setCurrentResponseComment] = useState<string>("");
  const [currentAiSuggestion, setCurrentAiSuggestion] = useState<string | null>(null);
  
  // Data fetching
  const { data: qualification } = trpc.mdr.getQualification.useQuery({});
  const { data: processesData, isLoading: loadingProcesses } = trpc.mdr.getProcesses.useQuery();
  const { data: sitesData, isLoading: loadingSites, refetch: refetchSites } = trpc.sites.list.useQuery();
  const { data: organizationsData } = trpc.organizations.list.useQuery();
  
  const createAudit = trpc.audits.create.useMutation({
    onSuccess: (data) => {
      if (data?.auditId) {
        setAuditId(data.auditId);
        setIsAuditCreated(true);
        toast.success("✅ Audit créé avec succès");
        setLocation(`/mdr/audit/${data.auditId}`); // Redirect directly to drill-down
        toast.info("Audit créé ! Redirection vers le questionnaire...");
      }
    },
    onError: (error) => {
      toast.error("❌ Erreur lors de la création de l\'audit: " + error.message);
    }
  });

  // New tRPC queries for drill-down
  const { data: auditContext, isLoading: loadingAuditContext } = trpc.mdr.getAuditContext.useQuery(
    { auditId: auditId as number },
    { enabled: !!auditId }
  );

  const { data: questionsData, isLoading: loadingQuestions } = trpc.mdr.getQuestionsForAudit.useQuery(
    { auditId: auditId as number },
    { enabled: !!auditId }
  );

  const { data: existingResponses, refetch: refetchResponses } = trpc.mdr.getResponses.useQuery(
    { auditId: auditId as number },
    { enabled: !!auditId }
  );

  const saveResponseMutation = trpc.mdr.saveResponse.useMutation({
    onSuccess: () => {
      toast.success("Réponse enregistrée !");
      refetchResponses(); // Refresh responses after saving
    },
    onError: (error) => {
      toast.error("Erreur lors de l\'enregistrement de la réponse: " + error.message);
    },
  });

  const getAiSuggestionMutation = trpc.mdr.getAiSuggestion.useMutation({
    onSuccess: (data) => {
      setCurrentAiSuggestion(data.suggestion);
    },
    onError: (error) => {
      toast.error("Erreur lors de la génération de la suggestion IA: " + error.message);
    },
  });

  // Initialize from params or profile
  useEffect(() => {
    if (params?.id) {
      const id = parseInt(params.id);
      setAuditId(id);
      setIsAuditCreated(true);
    } else if (qualification?.economicRole) {
      setSelectedRole(qualification.economicRole);
    }
  }, [params, qualification]);

  // Auto-generate audit name
  useEffect(() => {
    if (!auditName) {
      setAuditName(`Audit MDR (${selectedRole}) - ${new Date().toLocaleDateString("fr-FR")}`);
    }
  }, [selectedRole]);

  // Update current response state when question or existing responses change
  useEffect(() => {
    if (questionsData?.questions && existingResponses) {
      const currentQuestion = questionsData.questions[currentQuestionIndex];
      if (currentQuestion) {
        const response = existingResponses.find(r => r.questionKey === currentQuestion.questionKey);
        setCurrentResponseValue(response?.responseValue);
        setCurrentResponseComment(response?.responseComment || "");
        setCurrentAiSuggestion(null); // Clear AI suggestion for new question
      }
    }
  }, [currentQuestionIndex, questionsData, existingResponses]);

  // Handle site creation
  const handleSiteCreated = (siteId: number) => {
    setSelectedSiteId(String(siteId));
    refetchSites();
  };

  // Validation for Step 1
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

  // Handle Step 1 submission
  const handleStep1Submit = () => {
    if (!isStep1Valid()) {
      toast.error("Veuillez remplir tous les champs obligatoires de l\'étape 1");
      return;
    }

    createAudit.mutate({
      auditType: "internal",
      standard: "MDR",
      name: auditName,
      siteId: parseInt(selectedSiteId),
      organizationId: selectedOrganizationId ? parseInt(selectedOrganizationId) : undefined,
      referentialIds: [1],
      economicRole: selectedRole,
      processesSelected: selectedProcess === "all" ? [] : [selectedProcess],
      scope: auditScope,
      auditMethod: auditMethod as "on_site" | "remote" | "hybrid",
      plannedStartDate: new Date(plannedStartDate),
      plannedEndDate: plannedEndDate ? new Date(plannedEndDate) : undefined,
      auditLeader: auditLeader,
      auditeeMainContact: auditeeMainContact,
      auditeeContactEmail: auditeeContactEmail,
    });
  };

  const handleSaveAndContinue = useCallback(async () => {
    if (!auditId || !questionsData?.questions) return;

    const currentQuestion = questionsData.questions[currentQuestionIndex];
    if (!currentQuestion || !currentResponseValue) {
      toast.error("Veuillez sélectionner une réponse pour continuer.");
      return;
    }

    await saveResponseMutation.mutateAsync({
      auditId,
      questionKey: currentQuestion.questionKey,
      responseValue: currentResponseValue as any,
      responseComment: currentResponseComment,
      note: currentResponseComment,
      role: auditContext?.economicRole,
      processId: String(currentQuestion.processId),
      evidenceFiles: [],
    });

    if (currentQuestionIndex < questionsData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      toast.success("Toutes les questions ont été traitées !");
      setLocation(`/audit/${auditId}/results`);
    }
  }, [auditId, questionsData, currentQuestionIndex, currentResponseValue, currentResponseComment, saveResponseMutation, auditContext, setLocation]);

  const handleGetAiSuggestion = useCallback(() => {
    if (!auditId || !questionsData?.questions) return;
    const currentQuestion = questionsData.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    getAiSuggestionMutation.mutate({
      auditId,
      questionKey: currentQuestion.questionKey,
      current: {
        responseValue: currentResponseValue as any,
        responseComment: currentResponseComment,
        role: auditContext?.economicRole,
        processId: String(currentQuestion.processId),
      },
    });
  }, [auditId, questionsData, currentQuestionIndex, currentResponseValue, currentResponseComment, auditContext, getAiSuggestionMutation]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Authentification requise</CardTitle>
            <CardDescription>Veuillez vous connecter pour accéder à l\'audit</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/login")} className="w-full">Se connecter</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render drill-down UI if auditId is present
  if (match && auditId) {
    if (loadingAuditContext || loadingQuestions) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="ml-2">Chargement de l\'audit...</p>
        </div>
      );
    }

    if (!questionsData || !auditContext || questionsData.questions.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <Card className="w-full max-w-2xl shadow-lg">
            <CardHeader className="text-center">
              <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
              <CardTitle className="text-2xl">Aucune question trouvée</CardTitle>
              <CardDescription>Veuillez vérifier la configuration de l\'audit (rôle, processus) ou les questions disponibles.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/audits")} className="w-full">Retour à la liste des audits</Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    const questions = questionsData.questions;
    const totalQuestions = questions.length;
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Audit MDR: {auditContext.auditName || `ID ${auditId}`}</CardTitle>
            <CardDescription>
              Question {currentQuestionIndex + 1} / {totalQuestions}
              <Progress value={progress} className="mt-2" />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {currentQuestion.article && <Badge variant="secondary">Article: {currentQuestion.article}</Badge>}
              {currentQuestion.annexe && <Badge variant="secondary">Annexe: {currentQuestion.annexe}</Badge>}
              {currentQuestion.criticality && <Badge variant="secondary">Criticité: {currentQuestion.criticality}</Badge>}
              {currentQuestion.processName && <Badge variant="secondary">Processus: {currentQuestion.processName}</Badge>}
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-semibold">{currentQuestion.questionText}</Label>
            </div>

            {currentQuestion.risks && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-semibold">Risque associé :</span> {currentQuestion.risks}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="response-comment">Réponse / Note</Label>
              <Textarea
                id="response-comment"
                value={currentResponseComment}
                onChange={(e) => setCurrentResponseComment(e.target.value)}
                placeholder="Saisissez votre réponse ou vos notes ici..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Statut de conformité</Label>
              <div className="flex gap-2">
                {RESPONSE_STATUSES.map(status => (
                  <Button
                    key={status.backend}
                    variant={currentResponseValue === status.backend ? "default" : "outline"}
                    className={currentResponseValue === status.backend ? status.color : ""}
                    onClick={() => setCurrentResponseValue(status.backend)}
                  >
                    {status.ui}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2 border p-4 rounded-md bg-gray-50">
              <Label>Documents justificatifs</Label>
              <p className="text-sm text-gray-500">Fonctionnalité d\'upload non implémentée dans cette version.</p>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={handleGetAiSuggestion}
                disabled={getAiSuggestionMutation.isPending}
              >
                {getAiSuggestionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Lightbulb className="h-4 w-4 mr-2" />
                )}
                Obtenir une recommandation IA
              </Button>
              {currentAiSuggestion && (
                <Alert className="mt-2">
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription className="whitespace-pre-wrap">
                    {currentAiSuggestion}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex justify-between gap-4 pt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
              <Button
                onClick={handleSaveAndContinue}
                disabled={saveResponseMutation.isPending || !currentResponseValue}
              >
                {saveResponseMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Enregistrer et Continuer
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render wizard UI if no auditId is present in URL
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Démarrer un Audit MDR</CardTitle>
          <CardDescription>Étape 1/1 - Informations critiques</CardDescription>
          <Progress value={50} className="mt-4" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-slate-700">Identification</h3>
            <div className="space-y-2">
              <Label>Rôle Économique *</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ECONOMIC_ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
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
              ) : (
                <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un site" /></SelectTrigger>
                  <SelectContent>
                    {sitesData?.sites.map(site => (
                      <SelectItem key={site.id} value={String(site.id)}>{site.name}</SelectItem>
                    ))}
                    <Button variant="ghost" className="w-full justify-start" onClick={() => setShowSiteModal(true)}>
                      + Ajouter un nouveau site
                    </Button>
                  </SelectContent>
                </Select>
              )}
              <SiteCreationModal isOpen={showSiteModal} onClose={() => setShowSiteModal(false)} onSiteCreated={handleSiteCreated} />
            </div>
            <div className="space-y-2">
              <Label>Organisation (optionnel)</Label>
              <Select value={selectedOrganizationId} onValueChange={setSelectedOrganizationId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une organisation" /></SelectTrigger>
                <SelectContent>
                  {organizationsData?.organizations.map(org => (
                    <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="audit-name">Nom de l\'Audit *</Label>
              <Input id="audit-name" value={auditName} onChange={(e) => setAuditName(e.target.value)} placeholder="Ex: Audit MDR annuel 2024" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audit-scope">Périmètre de l\'Audit *</Label>
              <Textarea id="audit-scope" value={auditScope} onChange={(e) => setAuditScope(e.target.value)} placeholder="Ex: Conception, fabrication et distribution..." className="min-h-24" />
            </div>
            <div className="space-y-2">
              <Label>Méthode d\'Audit *</Label>
              <Select value={auditMethod} onValueChange={setAuditMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AUDIT_METHODS.map(method => (
                    <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="planned-start-date">Date de début prévue *</Label>
                <Input id="planned-start-date" type="date" value={plannedStartDate} onChange={(e) => setPlannedStartDate(e.target.value)} />
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="planned-end-date">Date de fin prévue</Label>
                <Input id="planned-end-date" type="date" value={plannedEndDate} onChange={(e) => setPlannedEndDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="audit-leader">Auditeur Responsable *</Label>
              <Input id="audit-leader" value={auditLeader} onChange={(e) => setAuditLeader(e.target.value)} placeholder="Nom de l\'auditeur principal" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auditee-main-contact">Contact Principal Audité *</Label>
              <Input id="auditee-main-contact" value={auditeeMainContact} onChange={(e) => setAuditeeMainContact(e.target.value)} placeholder="Nom du contact principal" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auditee-contact-email">Email du Contact Audité *</Label>
              <Input id="auditee-contact-email" type="email" value={auditeeContactEmail} onChange={(e) => setAuditeeContactEmail(e.target.value)} placeholder="Email du contact principal" />
            </div>
            <div className="space-y-2">
              <Label>Processus à auditer (optionnel)</Label>
              {loadingProcesses ? (
                <div className="flex items-center justify-center p-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Chargement des processus...
                </div>
              ) : (
                <Select value={selectedProcess} onValueChange={setSelectedProcess}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un processus" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les processus</SelectItem>
                    {processesData?.processes.map(process => (
                      <SelectItem key={process.id} value={process.id}>{process.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <div className="flex justify-end pt-6">
            <Button onClick={handleStep1Submit} disabled={createAudit.isPending}>
              {createAudit.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Création...</>
              ) : (
                <><ChevronRight className="h-4 w-4 mr-2" /> Démarrer l\'Audit</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
