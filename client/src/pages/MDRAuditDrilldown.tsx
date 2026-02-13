import { useState, useEffect, useCallback } from "react";
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

export default function MDRAuditDrilldown() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // ✅ FIX: param name = auditId (cohérent avec /mdr/audit/:auditId)
  const [match, params] = useRoute("/mdr/audit/:auditId");

  // ✅ FIX: conversion robuste + blocage queries si invalide
  const auditIdRaw = params?.auditId;
  const auditIdNum = Number(auditIdRaw);
  const auditId = auditIdRaw && !Number.isNaN(auditIdNum) ? auditIdNum : null;
  const enabled = !!auditId;

  // Drill-down state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentResponseValue, setCurrentResponseValue] = useState<string | undefined>(undefined);
  const [currentResponseComment, setCurrentResponseComment] = useState<string>("");
  const [currentAiSuggestion, setCurrentAiSuggestion] = useState<string | null>(null);

  // ✅ Local responses cache (frontend-only) to replace missing mdr.getResponses
  const [responsesByKey, setResponsesByKey] = useState<Record<string, AuditResponse>>({});

  // Data fetching
  const {
    data: auditContext,
    isLoading: loadingAuditContext,
    error: auditContextError,
  } = trpc.mdr.getAuditContext.useQuery({ auditId: auditId as number }, { enabled });

  // ✅ Your backend returns an ARRAY (not { questions: [...] })
  const {
    data: questionsData,
    isLoading: loadingQuestions,
    error: questionsError,
  } = trpc.mdr.getQuestionsForAudit.useQuery({ auditId: auditId as number }, { enabled });

  // ❌ Removed: trpc.mdr.getResponses (does not exist on backend -> 404)
  // const { data: existingResponses, refetch: refetchResponses, error: responsesError } =
  //   trpc.mdr.getResponses.useQuery({ auditId: auditId as number }, { enabled });

  const saveResponseMutation = trpc.mdr.saveResponse.useMutation({
    onSuccess: () => {
      toast.success("Réponse enregistrée !");
      // ✅ no refetch needed (we keep local cache)
    },
    onError: (error) => {
      toast.error("Erreur lors de l'enregistrement de la réponse: " + error.message);
    },
  });

  const getAiSuggestionMutation = trpc.mdr.getAiSuggestion.useMutation({
    onSuccess: (data) => {
      setCurrentAiSuggestion((data as any)?.suggestion ?? null);
    },
    onError: (error) => {
      toast.error("Erreur lors de la génération de la suggestion IA: " + error.message);
    },
  });

  // ✅ Normalize questions array regardless of backend shape
  const questions: Question[] = Array.isArray(questionsData)
    ? (questionsData as any[])
    : Array.isArray((questionsData as any)?.questions)
      ? ((questionsData as any).questions as any[])
      : [];

  // Update current response state when question or stored responses change
  useEffect(() => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion?.questionKey) return;

    const existing = responsesByKey[currentQuestion.questionKey];
    setCurrentResponseValue(existing?.responseValue);
    setCurrentResponseComment(existing?.responseComment || "");
    setCurrentAiSuggestion(null);
  }, [currentQuestionIndex, questions, responsesByKey]);

  const handleSaveAndContinue = useCallback(async () => {
    if (!auditId || !questions.length) return;

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion || !currentResponseValue) {
      toast.error("Veuillez sélectionner une réponse pour continuer.");
      return;
    }

    // ✅ Persist to backend (if your backend supports mdr.saveResponse)
    await saveResponseMutation.mutateAsync({
      auditId,
      questionKey: currentQuestion.questionKey,
      responseValue: currentResponseValue as any,
      responseComment: currentResponseComment,
      note: currentResponseComment,
      role: (auditContext as any)?.economicRole,
      processId: currentQuestion.processId ? String(currentQuestion.processId) : null,
      evidenceFiles: [],
    } as any);

    // ✅ Keep local cache so UI behaves like "existingResponses"
    setResponsesByKey((prev) => ({
      ...prev,
      [currentQuestion.questionKey]: {
        questionKey: currentQuestion.questionKey,
        responseValue: currentResponseValue,
        responseComment: currentResponseComment,
        note: currentResponseComment,
        evidenceFiles: [],
      },
    }));

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      toast.success("Toutes les questions ont été traitées !");
      setLocation(`/audit/${auditId}/results`);
    }
  }, [
    auditId,
    questions,
    currentQuestionIndex,
    currentResponseValue,
    currentResponseComment,
    saveResponseMutation,
    auditContext,
    setLocation,
  ]);

  const handleGetAiSuggestion = useCallback(() => {
    if (!auditId || !questions.length) return;
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    getAiSuggestionMutation.mutate({
      auditId,
      questionKey: currentQuestion.questionKey,
      current: {
        responseValue: currentResponseValue as any,
        responseComment: currentResponseComment,
        role: (auditContext as any)?.economicRole,
        processId: currentQuestion.processId ? String(currentQuestion.processId) : null,
      },
    } as any);
  }, [
    auditId,
    questions,
    currentQuestionIndex,
    currentResponseValue,
    currentResponseComment,
    auditContext,
    getAiSuggestionMutation,
  ]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Authentification requise</CardTitle>
            <CardDescription>Veuillez vous connecter pour accéder à l"audit</CardDescription>
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

  // ✅ FIX: si route non matchée ou auditId invalide => pas de tRPC, message clair
  if (!match || !auditId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Audit non spécifié</CardTitle>
            <CardDescription>Veuillez fournir un ID d"audit valide dans l"URL.</CardDescription>
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

  if (loadingAuditContext || loadingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2">Chargement de l"audit...</p>
      </div>
    );
  }

  if (auditContextError || questionsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader className="text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Erreur de chargement</CardTitle>
            <CardDescription>
              Une erreur est survenue lors du chargement des données de l"audit. Veuillez réessayer.
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

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader className="text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Aucune question trouvée</CardTitle>
            <CardDescription>
              Veuillez vérifier la configuration de l"audit (rôle, processus) ou les questions disponibles.
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Audit MDR: {(auditContext as any)?.auditName || `ID ${auditId}`}</CardTitle>
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
            <p className="text-sm text-gray-500">Fonctionnalité d"upload non implémentée dans cette version.</p>
          </div>

          <div className="space-y-2">
            <Button variant="outline" onClick={handleGetAiSuggestion} disabled={getAiSuggestionMutation.isPending}>
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
                <AlertDescription className="whitespace-pre-wrap">{currentAiSuggestion}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex justify-between gap-4 pt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>

            <Button onClick={handleSaveAndContinue} disabled={saveResponseMutation.isPending || !currentResponseValue}>
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
