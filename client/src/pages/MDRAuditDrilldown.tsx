import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, CheckCircle2, Lightbulb } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

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
  criticality?: string;

  // backend can return either risk or risks
  risk?: string;
  risks?: string;

  expectedEvidence?: string;

  processId?: string | number;
  processName?: string;

  referenceLabel?: string;
}

interface AuditResponseLocal {
  questionKey: string;
  responseValue: string;
  responseComment?: string;
  note?: string;
  evidenceFiles?: string[];
  updatedAt: string;
}

function coerceAuditId(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === "string") {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function getLocalKey(auditId: number) {
  // ✅ keep stable key (typo "mrd" kept to not break existing users)
  return `qara:mrd:audit:${auditId}:responses:v1`;
}

function readLocalResponses(auditId: number): Record<string, AuditResponseLocal> {
  try {
    const raw = localStorage.getItem(getLocalKey(auditId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, AuditResponseLocal>;
  } catch {
    return {};
  }
}

function writeLocalResponses(auditId: number, map: Record<string, AuditResponseLocal>) {
  try {
    localStorage.setItem(getLocalKey(auditId), JSON.stringify(map));
  } catch {
    // ignore
  }
}

function mergeResponsesPreferLocal(
  localMap: Record<string, AuditResponseLocal>,
  remoteList: Array<{
    questionKey: string;
    responseValue: string;
    responseComment?: string;
    note?: string;
    evidenceFiles?: string[];
    updatedAt?: string | null;
  }>
): Record<string, AuditResponseLocal> {
  const remoteMap: Record<string, AuditResponseLocal> = {};

  for (const r of remoteList || []) {
    if (!r?.questionKey) continue;
    remoteMap[r.questionKey] = {
      questionKey: r.questionKey,
      responseValue: r.responseValue,
      responseComment: r.responseComment ?? "",
      note: r.note ?? "",
      evidenceFiles: Array.isArray(r.evidenceFiles) ? r.evidenceFiles : [],
      updatedAt: (r.updatedAt as string) ?? new Date().toISOString(),
    };
  }

  // ✅ Local wins (prevents "I just typed something" being overridden by remote refetch)
  return { ...remoteMap, ...localMap };
}

export default function MDRAuditDrilldown() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // ✅ param name = auditId (cohérent avec /mdr/audit/:auditId)
  const [match, params] = useRoute("/mdr/audit/:auditId");

  const auditId = useMemo(() => coerceAuditId(params?.auditId), [params?.auditId]);
  const enabled = !!auditId;

  // Drill-down state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentResponseValue, setCurrentResponseValue] = useState<string | undefined>(undefined);
  const [currentResponseComment, setCurrentResponseComment] = useState<string>("");
  const [currentAiSuggestion, setCurrentAiSuggestion] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // Local responses cache (keyed by questionKey)
  const [responsesMap, setResponsesMap] = useState<Record<string, AuditResponseLocal>>({});

  // Fetch audit context
  const {
    data: auditContext,
    isLoading: loadingAuditContext,
    error: auditContextError,
  } = trpc.mdr.getAuditContext.useQuery({ auditId: (auditId ?? 0) as number }, { enabled });

  // Fetch questions
  const {
    data: questionsData,
    isLoading: loadingQuestions,
    error: questionsError,
  } = trpc.mdr.getQuestionsForAudit.useQuery({ auditId: (auditId ?? 0) as number }, { enabled });

  // ✅ Fetch existing responses from backend (DB)
  const {
    data: existingResponses,
    isLoading: loadingResponses,
    error: responsesError,
  } = trpc.mdr.getResponses.useQuery({ auditId: (auditId ?? 0) as number }, { enabled });

  // ✅ Save response (DB upsert)
  const saveResponseMutation = trpc.mdr.saveResponse.useMutation({
    onError: (e) => {
      toast.error(`❌ Erreur enregistrement: ${e.message}`);
    },
  });

  // Normalize questionsData shape (array OR {questions})
  const questions: Question[] = useMemo(() => {
    if (Array.isArray(questionsData)) return questionsData as any;
    const maybe = (questionsData as any)?.questions;
    return Array.isArray(maybe) ? (maybe as any) : [];
  }, [questionsData]);

  const totalQuestions = questions.length;

  // ✅ keep index valid if questions arrive late / filtered list changes
  useEffect(() => {
    if (totalQuestions <= 0) {
      setCurrentQuestionIndex(0);
      return;
    }
    setCurrentQuestionIndex((prev) => Math.min(Math.max(prev, 0), totalQuestions - 1));
  }, [totalQuestions]);

  const currentQuestion = questions[currentQuestionIndex];

  // ✅ answered counter (NO HOOK) -> évite le crash hooks (#310)
  const answeredCount = (() => {
    try {
      const vals = Object.values(responsesMap || {});
      let c = 0;
      for (const v of vals) {
        if (v?.responseValue) c += 1;
      }
      return c;
    } catch {
      return 0;
    }
  })();

  // Load local responses once auditId is known
  useEffect(() => {
    if (!auditId) return;
    const local = readLocalResponses(auditId);
    setResponsesMap(local);
  }, [auditId]);

  // ✅ Merge remote responses into local map (local wins) once remote loaded
  useEffect(() => {
    if (!auditId) return;
    if (!existingResponses) return;

    const local = readLocalResponses(auditId);
    const merged = mergeResponsesPreferLocal(local, existingResponses as any);

    setResponsesMap(merged);
    writeLocalResponses(auditId, merged);
  }, [auditId, existingResponses]);

  // Update current response state when question changes OR responsesMap changes
  useEffect(() => {
    if (!auditId || !currentQuestion) return;

    const stored = responsesMap[currentQuestion.questionKey];
    setCurrentResponseValue(stored?.responseValue);
    setCurrentResponseComment(stored?.responseComment || "");
    setCurrentAiSuggestion(null);
  }, [auditId, currentQuestionIndex, currentQuestion?.questionKey, responsesMap, currentQuestion]);

  const handleSaveAndContinue = useCallback(async () => {
    if (!auditId || !currentQuestion) return;

    if (!currentResponseValue) {
      toast.error("Veuillez sélectionner une réponse pour continuer.");
      return;
    }

    const payloadLocal: AuditResponseLocal = {
      questionKey: currentQuestion.questionKey,
      responseValue: currentResponseValue,
      responseComment: currentResponseComment,
      note: currentResponseComment,
      evidenceFiles: [],
      updatedAt: new Date().toISOString(),
    };

    // ✅ 1) Save locally immediately (instant UX / anti-perte)
    const nextMap = {
      ...responsesMap,
      [currentQuestion.questionKey]: payloadLocal,
    };
    setResponsesMap(nextMap);
    writeLocalResponses(auditId, nextMap);

    // ✅ 2) Save to backend (DB)
    setIsSaving(true);
    try {
      await saveResponseMutation.mutateAsync({
        auditId,
        questionKey: currentQuestion.questionKey,
        responseValue: currentResponseValue as any,
        responseComment: currentResponseComment ?? "",
        note: currentResponseComment ?? "",
        role: (auditContext as any)?.economicRole ?? null,
        // backend expects numeric string or null
        processId:
          currentQuestion.processId !== undefined && currentQuestion.processId !== null
            ? String(currentQuestion.processId)
            : null,
        evidenceFiles: [],
      });

      toast.success("✅ Réponse enregistrée");
    } catch {
      // onError handles toast
    } finally {
      setIsSaving(false);
    }

    // ✅ 3) Move next
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      toast.success("✅ Toutes les questions ont été traitées !");
      setLocation(`/audit/${auditId}/results`);
    }
  }, [
    auditId,
    currentQuestion,
    currentResponseValue,
    currentResponseComment,
    responsesMap,
    currentQuestionIndex,
    totalQuestions,
    setLocation,
    saveResponseMutation,
    auditContext,
  ]);

  const handleGetAiSuggestion = useCallback(() => {
    setCurrentAiSuggestion(
      "Suggestion IA :\n" +
        "- Citer les preuves disponibles (procédure, enregistrements, lien eQMS).\n" +
        "- Décrire comment la conformité est démontrée.\n" +
        "- Si NOK/Partiel : actions correctives, responsable, délai, preuve attendue."
    );
  }, []);

  // -------- UI guards --------

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Authentification requise</CardTitle>
            <CardDescription>Veuillez vous connecter pour accéder à l’audit</CardDescription>
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

  if (!match || !auditId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Audit non spécifié</CardTitle>
            <CardDescription>Veuillez fournir un ID d’audit valide dans l’URL.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/audits")} className="w-full">
              Retour à la liste des audits
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingAuditContext || loadingQuestions || loadingResponses) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2">Chargement de l’audit...</p>
      </div>
    );
  }

  if (auditContextError || questionsError || responsesError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader className="text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Erreur de chargement</CardTitle>
            <CardDescription>
              Une erreur est survenue lors du chargement des données de l’audit. Veuillez réessayer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm whitespace-pre-wrap">
                {String(
                  (auditContextError as any)?.message ||
                    (questionsError as any)?.message ||
                    (responsesError as any)?.message ||
                    "Erreur inconnue"
                )}
              </AlertDescription>
            </Alert>

            <Button onClick={() => setLocation("/audits")} className="w-full">
              Retour à la liste des audits
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader className="text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Aucune question trouvée</CardTitle>
            <CardDescription>
              Vérifiez la configuration de l’audit (rôle, processus) ou les questions disponibles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/audits")} className="w-full">
              Retour à la liste des audits
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;
  const riskText = currentQuestion.risks || currentQuestion.risk;
  const evidenceText = currentQuestion.expectedEvidence;
  const auditTitle = (auditContext as any)?.auditName || (auditContext as any)?.name || `Audit MDR: ID ${auditId}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{auditTitle}</CardTitle>
          <CardDescription>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                Question {currentQuestionIndex + 1} / {totalQuestions}
              </div>
              <div className="text-xs text-slate-500">
                Réponses enregistrées: <strong>{answeredCount}</strong> / {totalQuestions}
              </div>
            </div>
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

          {riskText && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-semibold">Risque associé :</span> {riskText}
              </AlertDescription>
            </Alert>
          )}

          {evidenceText && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <span className="font-semibold">Éléments de preuve attendus :</span> {evidenceText}
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
            <div className="flex gap-2 flex-wrap">
              {RESPONSE_STATUSES.map((status) => (
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
            <p className="text-sm text-gray-500">Fonctionnalité d’upload non implémentée dans cette version.</p>
          </div>

          <div className="space-y-2">
            <Button variant="outline" onClick={handleGetAiSuggestion}>
              <Lightbulb className="h-4 w-4 mr-2" />
              Obtenir une recommandation IA
            </Button>

            {currentAiSuggestion && (
              <Alert className="mt-2">
                <Lightbulb className="h-4 w-4" />
                <AlertDescription className="whitespace-pre-wrap">{currentAiSuggestion}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex justify-between gap-4 pt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0 || isSaving}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>

            <Button onClick={handleSaveAndContinue} disabled={!currentResponseValue || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Enregistrer et Continuer
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
