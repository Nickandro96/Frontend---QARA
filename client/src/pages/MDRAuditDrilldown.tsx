import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  Info,
  Loader2,
  Save,
  Upload,
  Sparkles,
} from "lucide-react";

type ResponseValue = "compliant" | "non_compliant" | "not_applicable" | "partial" | "in_progress";

type Question = {
  id: number;
  questionKey: string;
  questionText: string;
  questionType?: string | null;
  article?: string | null;
  annexe?: string | null;
  title?: string | null;
  expectedEvidence?: string | null;
  criticality?: string | null;
  risk?: any;
  risks?: any;
  interviewFunctions?: any[];
  economicRole?: string | null;
  applicableProcesses?: any[];
  referentialId?: number | null;
  processId?: number | null;
  displayOrder?: number | null;
};

type ResponseRow = {
  questionKey: string;
  responseValue: ResponseValue;
  responseComment?: string;
  note?: string;
  evidenceFiles?: string[];
  role?: string | null;
  processId?: string | null;
  updatedAt?: any;
};

function safeArray<T>(v: any): T[] {
  return Array.isArray(v) ? v : [];
}

function mergeResponsesPreferLocal(localList: ResponseRow[], remoteList: ResponseRow[]) {
  const map = new Map<string, ResponseRow>();

  for (const r of safeArray<ResponseRow>(remoteList || [])) {
    if (!r?.questionKey) continue;
    map.set(r.questionKey, r);
  }

  for (const r of safeArray<ResponseRow>(localList || [])) {
    if (!r?.questionKey) continue;
    map.set(r.questionKey, r);
  }

  return map;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function extractArticleBadge(article?: string | null) {
  if (!article) return null;
  const m = String(article).match(/article\s*([0-9]{1,3})/i);
  if (m?.[1]) return `Article ${m[1]}`;
  if (String(article).toLowerCase().includes("article")) return String(article).replace(/MDR.*?–\s*/i, "").trim();
  return String(article).trim();
}

function formatCriticality(level?: string | null) {
  const v = (level || "").toLowerCase().trim();
  if (!v) return { label: "Criticité n/a", variant: "outline" as const };
  if (v === "critical" || v === "very_high" || v === "high") return { label: "Criticité élevée", variant: "destructive" as const };
  if (v === "medium") return { label: "Criticité moyenne", variant: "secondary" as const };
  if (v === "low") return { label: "Criticité faible", variant: "outline" as const };
  return { label: `Criticité ${level}`, variant: "outline" as const };
}

function complianceScoreFromResponses(rows: ResponseRow[]) {
  if (!rows.length) return 100;

  const scoreMap: Record<ResponseValue, number> = {
    compliant: 100,
    partial: 60,
    non_compliant: 20,
    not_applicable: 100,
    in_progress: 50,
  };

  const avg = rows.reduce((acc, r) => acc + scoreMap[r.responseValue || "in_progress"], 0) / rows.length;
  return Math.round(avg);
}

function aiInsightsForQuestion(
  question: Question | null,
  valueNow: ResponseValue,
  expertMode: boolean,
  inspectorMode: boolean,
) {
  if (!question) return [] as string[];

  const base = [
    `Ce que l'ON cherche : preuve d'exécution réelle sur ${extractArticleBadge(question.article) || "l'exigence visée"}.`,
    "Où creuser : cohérence entre procédure, enregistrements et pratiques terrain.",
    "Qui interviewer : responsable process, PRRC et opérateur de première ligne.",
  ];

  if (valueNow === "partial") {
    return [
      ...base,
      "Risque probable : NC mineure évoluant en majeure si le pattern se répète.",
      "Impact certification : action corrective exigée avec délai contraint.",
      "Question complémentaire : montrer une preuve terrain datée des 90 derniers jours.",
    ];
  }

  if (valueNow === "non_compliant") {
    return [
      ...base,
      "Risque probable : NC majeure.",
      "Impact patient : signal faible de détection tardive possible.",
      "Priorité : vérifier cohérence PMS vs CER et déclenchement CAPA.",
    ];
  }

  if (expertMode || inspectorMode) {
    return [
      ...base,
      "Angle mort classique ON : procédure valide mais non appliquée en routine.",
      "Piège réglementaire : KPI sans seuil d'alerte opérationnel.",
    ];
  }

  return base;
}

function formatRiskText(risk: any): string {
  if (!risk) {
    return "Si non conforme, justifier l'impact certification, patient et inspection, puis documenter le plan d'action correctif.";
  }

  if (typeof risk === "string") return risk;

  try {
    return JSON.stringify(risk, null, 2);
  } catch {
    return String(risk);
  }
}

export default function MDRAuditDrilldown() {
  const [, params] = useRoute("/mdr/audit/:auditId");
  const auditId = params?.auditId ? Number(params.auditId) : null;

  const enabled = !!auditId && Number.isFinite(auditId);
  const [, setLocation] = useLocation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [localDrafts, setLocalDrafts] = useState<Record<string, ResponseRow>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [aiEnabled, setAiEnabled] = useState(true);
  const [expertMode, setExpertMode] = useState(false);
  const [inspectorMode, setInspectorMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"context" | "copilot" | "evidence">("context");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    data: auditContext,
    isLoading: loadingContext,
    error: contextError,
  } = trpc.mdr.getAuditContext.useQuery({ auditId: (auditId ?? 0) as number }, { enabled });

  const {
    data: questionsPayload,
    isLoading: loadingQuestions,
    error: questionsError,
  } = trpc.mdr.getQuestionsForAudit.useQuery({ auditId: (auditId ?? 0) as number }, { enabled });

  const questions: Question[] = useMemo(() => {
    const q = (questionsPayload as any)?.questions;
    return Array.isArray(q) ? q : [];
  }, [questionsPayload]);

  const {
    data: responsesData,
    isLoading: loadingResponses,
    error: responsesError,
  } = trpc.mdr.getResponses.useQuery({ auditId: (auditId ?? 0) as number }, { enabled });

  const existingResponses: ResponseRow[] = useMemo(() => {
    if (Array.isArray(responsesData)) return responsesData as any;
    const wrapped = (responsesData as any)?.responses;
    return Array.isArray(wrapped) ? wrapped : [];
  }, [responsesData]);

  const saveResponseMutation = trpc.mdr.saveResponse.useMutation();

  const responsesMap = useMemo(() => {
    const localList = Object.values(localDrafts);
    return mergeResponsesPreferLocal(localList, existingResponses || []);
  }, [localDrafts, existingResponses]);

  const totalQuestions = questions.length;

  const currentQuestion = useMemo(() => {
    if (!questions || questions.length === 0) return null;
    return questions[Math.min(Math.max(currentIndex, 0), questions.length - 1)];
  }, [questions, currentIndex]);

  const currentResponse = useMemo(() => {
    if (!currentQuestion?.questionKey) return null;
    return responsesMap.get(currentQuestion.questionKey) || null;
  }, [responsesMap, currentQuestion]);

  const answeredCount = useMemo(() => {
    let c = 0;
    for (const q of questions) {
      const r = responsesMap.get(q.questionKey);
      if (r?.responseValue && r.responseValue !== "in_progress") c++;
    }
    return c;
  }, [questions, responsesMap]);

  const progressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const complianceScore = useMemo(() => {
    const rows: ResponseRow[] = [];
    for (const q of questions) {
      const r = responsesMap.get(q.questionKey);
      if (r) rows.push(r);
    }
    return complianceScoreFromResponses(rows);
  }, [questions, responsesMap]);

  const statusStats = useMemo(() => {
    const stats = {
      compliant: 0,
      partial: 0,
      non_compliant: 0,
      not_applicable: 0,
      in_progress: 0,
    } as Record<ResponseValue, number>;

    for (const q of questions) {
      const rv = responsesMap.get(q.questionKey)?.responseValue || "in_progress";
      stats[rv] += 1;
    }

    return stats;
  }, [questions, responsesMap]);

  useEffect(() => {
    if (!enabled) return;
    if (!auditContext) return;
    setCurrentIndex(0);
  }, [enabled, (auditContext as any)?.auditId]);

  useEffect(() => {
    if (!saveMessage) return;
    const t = window.setTimeout(() => setSaveMessage(null), 2500);
    return () => window.clearTimeout(t);
  }, [saveMessage]);

  const setDraft = (questionKey: string, patch: Partial<ResponseRow>) => {
    setLocalDrafts((prev) => {
      const existing = prev[questionKey] || ({ questionKey } as ResponseRow);
      return {
        ...prev,
        [questionKey]: {
          ...existing,
          ...patch,
          questionKey,
        },
      };
    });
  };

  const handleSetMainAnswer = (v: string) => {
    if (!currentQuestion?.questionKey) return;
    setDraft(currentQuestion.questionKey, { responseComment: v });
  };

  const handleSetOptionalComment = (v: string) => {
    if (!currentQuestion?.questionKey) return;
    setDraft(currentQuestion.questionKey, { note: v });
  };

  const handleSetCompliance = (value: ResponseValue) => {
    if (!currentQuestion?.questionKey) return;
    setDraft(currentQuestion.questionKey, {
      responseValue: value,
      role: (auditContext as any)?.economicRole ?? null,
      processId: (auditContext as any)?.processIds?.[0] ?? null,
    });
  };

  const handlePickFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!currentQuestion?.questionKey) return;
    const names = files ? Array.from(files).map((f) => f.name) : [];
    const existing = safeArray<string>(localDrafts[currentQuestion.questionKey]?.evidenceFiles ?? currentResponse?.evidenceFiles);
    const merged = Array.from(new Set([...existing, ...names])).filter(Boolean);
    setDraft(currentQuestion.questionKey, { evidenceFiles: merged });
  };

  const persistOne = async (row: ResponseRow) => {
    if (!enabled || !auditId) return;

    await saveResponseMutation.mutateAsync({
      auditId,
      questionKey: row.questionKey,
      responseValue: row.responseValue || "in_progress",
      responseComment: row.responseComment ?? "",
      note: row.note ?? "",
      evidenceFiles: row.evidenceFiles ?? [],
      role: row.role ?? null,
      processId: row.processId ?? null,
    });
  };

  const handleSaveCurrent = async () => {
    if (!currentQuestion?.questionKey) return false;

    const mergedRow: ResponseRow = {
      questionKey: currentQuestion.questionKey,
      responseValue: localDrafts[currentQuestion.questionKey]?.responseValue ?? currentResponse?.responseValue ?? "in_progress",
      responseComment: localDrafts[currentQuestion.questionKey]?.responseComment ?? currentResponse?.responseComment ?? "",
      note: localDrafts[currentQuestion.questionKey]?.note ?? currentResponse?.note ?? "",
      evidenceFiles:
        localDrafts[currentQuestion.questionKey]?.evidenceFiles ??
        safeArray<string>(currentResponse?.evidenceFiles),
      role: localDrafts[currentQuestion.questionKey]?.role ?? currentResponse?.role ?? ((auditContext as any)?.economicRole ?? null),
      processId: localDrafts[currentQuestion.questionKey]?.processId ?? currentResponse?.processId ?? ((auditContext as any)?.processIds?.[0] ?? null),
    };

    const hasAnyValue =
      !!mergedRow.responseComment ||
      !!mergedRow.note ||
      (mergedRow.evidenceFiles && mergedRow.evidenceFiles.length > 0) ||
      (mergedRow.responseValue && mergedRow.responseValue !== "in_progress");

    if (!hasAnyValue) {
      setSaveMessage("Rien à enregistrer");
      return true;
    }

    try {
      setSaving(true);
      await persistOne(mergedRow);
      setSaveMessage("Enregistré ✅");

      // garde la ligne localement pour que progression et score restent cohérents immédiatement
      setLocalDrafts((prev) => ({
        ...prev,
        [currentQuestion.questionKey]: mergedRow,
      }));

      return true;
    } catch (e) {
      console.error(e);
      setSaveMessage("Erreur d’enregistrement");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1));

  const handleSaveAndContinue = async () => {
    const ok = await handleSaveCurrent();
    if (!ok) return;
    goNext();
  };

  const goBackToWizard = () => setLocation("/mdr");

  const loading = loadingContext || loadingQuestions || loadingResponses;

  if (!enabled) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <div className="font-semibold">Audit invalide</div>
                <div className="text-sm text-muted-foreground">ID d’audit manquant ou incorrect.</div>
              </div>
            </div>

            <div className="mt-4">
              <Button onClick={goBackToWizard} variant="secondary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-10 flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <div>Chargement du questionnaire…</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (contextError || questionsError || responsesError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <div className="font-semibold">Erreur de chargement</div>
                <div className="text-sm text-muted-foreground">
                  {(contextError as any)?.message ||
                    (questionsError as any)?.message ||
                    (responsesError as any)?.message ||
                    "Une erreur est survenue."}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Button onClick={goBackToWizard} variant="secondary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-6 w-6 text-muted-foreground" />
              <div>
                <div className="font-semibold">Aucune question</div>
                <div className="text-sm text-muted-foreground">
                  Aucune question n’a été trouvée pour cet audit (filtrage rôle/process/référentiel).
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={goBackToWizard} variant="secondary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const articleBadge = extractArticleBadge(currentQuestion?.article ?? null);
  const crit = formatCriticality(currentQuestion?.criticality ?? null);
  const riskText = formatRiskText(currentQuestion?.risks ?? currentQuestion?.risk ?? null);

  const valueNow: ResponseValue =
    localDrafts[currentQuestion!.questionKey]?.responseValue ??
    (currentResponse?.responseValue as ResponseValue) ??
    "in_progress";

  const mainAnswerValue =
    localDrafts[currentQuestion!.questionKey]?.responseComment ??
    currentResponse?.responseComment ??
    "";

  const optionalCommentValue =
    localDrafts[currentQuestion!.questionKey]?.note ??
    currentResponse?.note ??
    "";

  const evidenceNames =
    localDrafts[currentQuestion!.questionKey]?.evidenceFiles ??
    safeArray<string>(currentResponse?.evidenceFiles);

  const aiInsights = aiEnabled
    ? aiInsightsForQuestion(currentQuestion, valueNow, expertMode, inspectorMode)
    : ["Copilot désactivé. Activez IA ON pour obtenir des suggestions contextuelles."];

  const weakSignals = Array.from(responsesMap.values()).filter(
    (r) => r.responseValue === "partial" || r.responseValue === "non_compliant",
  ).length;

  const showCoherenceAlert = weakSignals >= 2 || valueNow === "non_compliant";

  const statusRows: Array<{ label: string; key: ResponseValue; dot: string; tone: string }> = [
    { label: "Conforme", key: "compliant", dot: "bg-emerald-500", tone: "text-emerald-700" },
    { label: "Partiel", key: "partial", dot: "bg-amber-500", tone: "text-amber-700" },
    { label: "Non conforme", key: "non_compliant", dot: "bg-rose-600", tone: "text-rose-700" },
    { label: "N/A", key: "not_applicable", dot: "bg-slate-400", tone: "text-slate-700" },
    { label: "En cours", key: "in_progress", dot: "bg-slate-300", tone: "text-slate-600" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 bg-slate-50/60">
      <Card className="shadow-sm border-slate-200 bg-white/95 backdrop-blur">
        <CardContent className="p-4 md:p-5 flex flex-col gap-4">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
            <div>
              <div className="text-base md:text-lg font-semibold text-slate-900">
                {(auditContext as any)?.auditName || `Audit MDR #${auditId}`}
              </div>
              <div className="text-sm text-muted-foreground">
                Progression {progressPct}% • Score conformité live {complianceScore}%
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={crit.variant as any}>{crit.label}</Badge>
              <Button
                type="button"
                variant={expertMode ? "default" : "outline"}
                size="sm"
                onClick={() => setExpertMode((v) => !v)}
              >
                Mode Expert
              </Button>
              <Button
                type="button"
                variant={aiEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setAiEnabled((v) => !v)}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                IA ON/OFF
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Progress value={progressPct} className="h-2" />
            <Badge variant="outline" className="whitespace-nowrap">{answeredCount}/{totalQuestions}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <Card className="xl:col-span-8 shadow-sm border-slate-200 bg-white">
          <CardContent className="p-5 md:p-6 space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {articleBadge ? <Badge variant="outline">{articleBadge}</Badge> : null}
                <Badge variant="secondary">Question {currentIndex + 1} / {totalQuestions}</Badge>
                {currentQuestion?.questionType ? <Badge variant="outline">{currentQuestion.questionType}</Badge> : null}
              </div>

              <h2 className="text-xl md:text-[30px] leading-tight font-semibold text-slate-900 tracking-tight">
                {currentQuestion?.questionText || currentQuestion?.title || "Question"}
              </h2>

              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-rose-700">
                      Risque à justifier en cas de non-conformité
                    </div>
                    <div className="mt-1 text-sm text-rose-900 whitespace-pre-wrap">{riskText}</div>
                  </div>
                  <Badge className="bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-100">
                    Gravité: {crit.label.replace("Criticité ", "")}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Analyse auditeur / observations terrain</div>
              <Textarea
                value={mainAnswerValue}
                onChange={(e) => handleSetMainAnswer(e.target.value)}
                placeholder="Décrivez les constats terrain, la cohérence documentaire, les preuves vérifiées, les écarts observés et le lien direct avec le risque réglementaire/patient."
                className="min-h-[140px]"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Statut de conformité</div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                <Button
                  variant={valueNow === "compliant" ? "default" : "outline"}
                  className={cn("h-11 justify-center", valueNow === "compliant" && "shadow-sm")}
                  onClick={() => handleSetCompliance("compliant")}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Conforme
                </Button>

                <Button
                  variant={valueNow === "partial" ? "default" : "outline"}
                  className={cn("h-11 justify-center", valueNow === "partial" && "shadow-sm")}
                  onClick={() => handleSetCompliance("partial")}
                >
                  Partiel
                </Button>

                <Button
                  variant={valueNow === "non_compliant" ? "destructive" : "outline"}
                  className={cn("h-11 justify-center", valueNow === "non_compliant" && "shadow-sm")}
                  onClick={() => handleSetCompliance("non_compliant")}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Non conforme
                </Button>

                <Button
                  variant={valueNow === "not_applicable" ? "default" : "outline"}
                  className={cn("h-11 justify-center", valueNow === "not_applicable" && "shadow-sm")}
                  onClick={() => handleSetCompliance("not_applicable")}
                >
                  N/A
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Commentaire (optionnel)</div>
              <Input
                value={optionalCommentValue}
                onChange={(e) => handleSetOptionalComment(e.target.value)}
                placeholder="Ex: périmètre limité, justification d'applicabilité, décision de traitement du risque..."
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Preuves / documents</div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />

              <Button type="button" variant="outline" className="w-full h-11 justify-center" onClick={handlePickFiles}>
                <Upload className="mr-2 h-4 w-4" />
                Ajouter des documents
              </Button>

              {evidenceNames.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {evidenceNames.slice(0, 8).map((name, idx) => (
                    <Badge key={`${name}-${idx}`} variant="secondary" className="max-w-full truncate">
                      {name}
                    </Badge>
                  ))}
                  {evidenceNames.length > 8 ? <Badge variant="outline">+{evidenceNames.length - 8}</Badge> : null}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">Aucun document sélectionné.</div>
              )}
            </div>

            <div className="flex flex-col lg:flex-row gap-2 lg:justify-between">
              <div className="flex gap-2">
                <Button variant="secondary" onClick={goPrev} disabled={currentIndex === 0}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Précédent
                </Button>
                <Button variant="secondary" onClick={goNext} disabled={currentIndex >= totalQuestions - 1}>
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <Button onClick={handleSaveAndContinue} disabled={saving} className="h-11 px-5">
                {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                Enregistrer et continuer
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                {saveMessage ? <span className="font-medium">{saveMessage}</span> : <span>Brouillon local actif jusqu’à enregistrement.</span>}
              </div>
              <Button variant="ghost" size="sm" onClick={goBackToWizard}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour wizard
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-4 shadow-sm border-slate-200 bg-white">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                size="sm"
                variant={activeTab === "context" ? "default" : "outline"}
                onClick={() => setActiveTab("context")}
              >
                Contexte
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeTab === "copilot" ? "default" : "outline"}
                onClick={() => setActiveTab("copilot")}
              >
                IA Copilot
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeTab === "evidence" ? "default" : "outline"}
                onClick={() => setActiveTab("evidence")}
              >
                Preuves
              </Button>
            </div>

            {activeTab === "context" && (
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Article MDR</div>
                  <div className="font-medium">{currentQuestion?.article || "n/a"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Rôle économique</div>
                  <div className="font-medium">{currentQuestion?.economicRole || (auditContext as any)?.economicRole || "n/a"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Processus</div>
                  <div className="font-medium">
                    {safeArray<any>(currentQuestion?.applicableProcesses).length > 0
                      ? safeArray<any>(currentQuestion?.applicableProcesses).join(", ")
                      : "n/a"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Annexe</div>
                  <div className="font-medium">{currentQuestion?.annexe || "n/a"}</div>
                </div>
              </div>
            )}

            {activeTab === "copilot" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Audit Copilot</div>
                  <Button
                    type="button"
                    size="sm"
                    variant={inspectorMode ? "destructive" : "outline"}
                    onClick={() => setInspectorMode((v) => !v)}
                  >
                    Mode Inspecteur ON
                  </Button>
                </div>

                <ul className="space-y-2 text-sm text-slate-700">
                  {aiInsights.map((insight, idx) => (
                    <li key={`${idx}-${insight}`} className="rounded-md border border-slate-200 p-2 bg-slate-50">
                      {insight}
                    </li>
                  ))}
                </ul>

                {inspectorMode ? (
                  <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
                    <div className="font-medium mb-1">Simulation audit ON</div>
                    <div>"Montrez la preuve terrain la plus récente qui contredit le moins votre procédure."</div>
                  </div>
                ) : null}

                {showCoherenceAlert ? (
                  <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                    Attention : signaux faibles détectés. Vérifier cohérence PMS / CER / CAPA avant clôture.
                  </div>
                ) : null}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setSaveMessage("IA : recommandations générées localement (mode soft)")}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Rafraîchir suggestions
                </Button>
              </div>
            )}

            {activeTab === "evidence" && (
              <div className="space-y-3 text-sm">
                <div className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents attendus
                </div>

                <div className="whitespace-pre-wrap text-muted-foreground">
                  {currentQuestion?.expectedEvidence || "Aucune preuve attendue spécifiée pour cette question."}
                </div>

                {currentQuestion?.interviewFunctions && currentQuestion.interviewFunctions.length > 0 ? (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="font-medium">Fonctions à interviewer</div>
                      <div className="flex flex-wrap gap-2">
                        {safeArray<any>(currentQuestion.interviewFunctions).map((f, idx) => (
                          <Badge key={idx} variant="outline">
                            {String(f)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200 bg-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-medium">Table de progression audit</div>
            <Button type="button" variant="outline" size="sm" onClick={() => setSaveMessage("Mode impression rapport : bientôt") }>
              Générer rapport audit
            </Button>
          </div>

          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Statut</th>
                  <th className="text-left px-3 py-2 font-medium">Volume</th>
                  <th className="text-left px-3 py-2 font-medium">%</th>
                  <th className="text-left px-3 py-2 font-medium">Tendance</th>
                </tr>
              </thead>
              <tbody>
                {statusRows.map((row) => {
                  const count = statusStats[row.key] || 0;
                  const pct = totalQuestions > 0 ? Math.round((count / totalQuestions) * 100) : 0;
                  const trend =
                    row.key === "non_compliant"
                      ? "⚠ prioritaire"
                      : row.key === "partial"
                        ? "à réduire"
                        : row.key === "compliant"
                          ? "stable"
                          : "en cours";

                  return (
                    <tr key={row.key} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <span className={cn("inline-block h-2.5 w-2.5 rounded-full mr-2 align-middle", row.dot)} />
                        <span className={cn("align-middle", row.tone)}>{row.label}</span>
                      </td>
                      <td className="px-3 py-2">{count}</td>
                      <td className="px-3 py-2">{pct}%</td>
                      <td className="px-3 py-2 text-slate-500">{trend}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {questions.map((q, idx) => {
              const rv = responsesMap.get(q.questionKey)?.responseValue || "in_progress";
              const cls =
                rv === "compliant"
                  ? "bg-emerald-600"
                  : rv === "partial"
                    ? "bg-amber-500"
                    : rv === "non_compliant"
                      ? "bg-rose-600"
                      : rv === "not_applicable"
                        ? "bg-slate-400"
                        : "bg-slate-300";

              return (
                <button
                  key={q.questionKey}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "h-8 w-8 rounded-full text-white text-xs font-semibold",
                    cls,
                    idx === currentIndex && "ring-2 ring-offset-2 ring-slate-700",
                  )}
                  title={`Q${idx + 1} - ${rv}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
