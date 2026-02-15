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

  // local overwrites remote
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
  // exemples possibles: "MDR 2017/745 – Article 113", "Article 2", "MDR ... Article 1"
  const m = String(article).match(/article\s*([0-9]{1,3})/i);
  if (m?.[1]) return `Article ${m[1]}`;
  // fallback: si déjà court
  if (String(article).toLowerCase().includes("article")) return String(article).replace(/MDR.*?–\s*/i, "").trim();
  return String(article).trim();
}

function formatCriticality(level?: string | null) {
  const v = (level || "").toLowerCase().trim();
  if (!v) return { label: "Criticité n/a", variant: "outline" as const };
  if (v === "critical" || v === "very_high" || v === "high") return { label: "Criticité élevée", variant: "destructive" as const };
  if (v === "medium") return { label: "Criticité moyenne", variant: "secondary" as const };
  if (v === "low") return { label: "Criticité faible", variant: "outline" as const };
  // fallback
  return { label: `Criticité ${level}`, variant: "outline" as const };
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

  const lastSaveRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ✅ Audit context (role, processes, etc.)
  const {
    data: auditContext,
    isLoading: loadingContext,
    error: contextError,
  } = trpc.mdr.getAuditContext.useQuery({ auditId: (auditId ?? 0) as number }, { enabled });

  // ✅ Questions for this audit
  const {
    data: questionsPayload,
    isLoading: loadingQuestions,
    error: questionsError,
  } = trpc.mdr.getQuestionsForAudit.useQuery({ auditId: (auditId ?? 0) as number }, { enabled });

  const questions: Question[] = useMemo(() => {
    const q = (questionsPayload as any)?.questions;
    return Array.isArray(q) ? q : [];
  }, [questionsPayload]);

  // ✅ Existing responses
  const {
    data: responsesData,
    isLoading: loadingResponses,
    error: responsesError,
  } = trpc.mdr.getResponses.useQuery({ auditId: (auditId ?? 0) as number }, { enabled });

  const existingResponses: ResponseRow[] = useMemo(() => {
    // compat: array legacy OU wrapper { responses: [...] }
    if (Array.isArray(responsesData)) return responsesData as any;
    const wrapped = (responsesData as any)?.responses;
    return Array.isArray(wrapped) ? wrapped : [];
  }, [responsesData]);

  // ✅ Save response mutation
  const saveResponseMutation = trpc.mdr.saveResponse.useMutation();

  // Merge remote + local
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

  // ---- UI setters (capture-style fields) ----
  // "Réponse / Note" (champ principal)
  const handleSetMainAnswer = (v: string) => {
    if (!currentQuestion?.questionKey) return;
    setDraft(currentQuestion.questionKey, { responseComment: v });
  };

  // "Commentaire (optionnel)"
  const handleSetOptionalComment = (v: string) => {
    if (!currentQuestion?.questionKey) return;
    setDraft(currentQuestion.questionKey, { note: v });
  };

  // Conformité : Conforme / NOK / N/A
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
    if (!currentQuestion?.questionKey) return;

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

    // si rien n’a changé localement et que c’est déjà en DB, on laisse passer sans bloquer
    const hasLocal = !!localDrafts[currentQuestion.questionKey];
    const hasAnyValue =
      !!mergedRow.responseComment ||
      !!mergedRow.note ||
      (mergedRow.evidenceFiles && mergedRow.evidenceFiles.length > 0) ||
      (mergedRow.responseValue && mergedRow.responseValue !== "in_progress");

    if (!hasLocal && !hasAnyValue) {
      setSaveMessage("Rien à enregistrer");
      return;
    }

    try {
      setSaving(true);
      await persistOne(mergedRow);
      lastSaveRef.current = Date.now();
      setSaveMessage("Enregistré ✅");

      // clear local draft for this question
      setLocalDrafts((prev) => {
        const next = { ...prev };
        delete next[currentQuestion.questionKey];
        return next;
      });
    } catch (e) {
      console.error(e);
      setSaveMessage("Erreur d’enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1));

  const handleSaveAndContinue = async () => {
    await handleSaveCurrent();
    // si save fail, on ne force pas le next
    // (saveMessage est mis à jour)
    if (saveResponseMutation.isError) return;
    goNext();
  };

  const goBackToWizard = () => setLocation("/mdr");

  const loading = loadingContext || loadingQuestions || loadingResponses;

  // ---- STATES ----
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

  // ---- DERIVED UI VALUES ----
  const articleBadge = extractArticleBadge(currentQuestion?.article ?? null);
  const crit = formatCriticality(currentQuestion?.criticality ?? null);

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

  return (
    <div className="p-6 space-y-4">
      {/* Header (minimal comme capture) */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Question {currentIndex + 1} sur {totalQuestions}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={goPrev} disabled={currentIndex === 0}>
            Précédent
          </Button>
          <Button variant="secondary" onClick={goNext} disabled={currentIndex >= totalQuestions - 1}>
            Suivant
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6 space-y-6">
          {/* Badges + Question */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {articleBadge ? (
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {articleBadge}
                </Badge>
              ) : null}
              <Badge variant={crit.variant as any} className="rounded-full px-3 py-1">
                {crit.label}
              </Badge>
            </div>

            <div className="text-2xl font-semibold leading-snug">
              {currentQuestion?.questionText || currentQuestion?.title || "Question"}
            </div>
          </div>

          {/* Réponse / Note (champ principal) */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Réponse / Note</div>
            <Input
              value={mainAnswerValue}
              onChange={(e) => handleSetMainAnswer(e.target.value)}
              placeholder="Décrivez votre réponse, les mesures mises en place, ou les éléments de contexte..."
              className="h-11"
            />
            <div className="text-xs text-muted-foreground">
              Documentez votre réponse avant de définir le statut de conformité
            </div>
          </div>

          {/* Statut de conformité (3 boutons larges) */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Statut de conformité</div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Button
                variant={valueNow === "compliant" ? "default" : "outline"}
                className={cn("h-11 justify-center", valueNow === "compliant" && "shadow-sm")}
                onClick={() => handleSetCompliance("compliant")}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Conforme
              </Button>

              <Button
                variant={valueNow === "non_compliant" ? "default" : "outline"}
                className={cn("h-11 justify-center", valueNow === "non_compliant" && "shadow-sm")}
                onClick={() => handleSetCompliance("non_compliant")}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                NOK
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

          {/* Documents justificatifs */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Documents justificatifs</div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 justify-center"
              onClick={handlePickFiles}
            >
              <Upload className="mr-2 h-4 w-4" />
              Ajouter des documents
            </Button>

            <div className="text-xs text-muted-foreground">
              Ajoutez des preuves documentaires pour justifier votre réponse
            </div>

            {evidenceNames.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {evidenceNames.slice(0, 8).map((name, idx) => (
                  <Badge key={`${name}-${idx}`} variant="secondary" className="max-w-full truncate">
                    {name}
                  </Badge>
                ))}
                {evidenceNames.length > 8 ? (
                  <Badge variant="outline">+{evidenceNames.length - 8}</Badge>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Commentaire optionnel */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Commentaire (optionnel)</div>
            <Textarea
              value={optionalCommentValue}
              onChange={(e) => handleSetOptionalComment(e.target.value)}
              placeholder="Ajoutez des notes ou des précisions..."
              className="min-h-[120px]"
            />
          </div>

          {/* Bouton IA (placeholder) */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 justify-center"
            onClick={() => {
              // Placeholder safe (aucune API)
              setSaveMessage("IA: bientôt (Copilot V3) ✨");
            }}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Obtenir une recommandation IA
          </Button>

          {/* Footer actions */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                {saveMessage ? <span className="font-medium">{saveMessage}</span> : <span>Les modifications restent en brouillon tant que vous n’enregistrez pas.</span>}
              </div>

              {/* petit indicateur discret (facultatif) */}
              <div className="hidden md:flex items-center gap-2">
                <span>{answeredCount}/{totalQuestions}</span>
                <div className="w-28">
                  <Progress value={progressPct} />
                </div>
                <Badge variant="outline">{progressPct}%</Badge>
              </div>
            </div>

            <Button
              onClick={handleSaveAndContinue}
              disabled={saving}
              className="w-full h-12 text-base"
            >
              {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Enregistrer et continuer
            </Button>
          </div>

          {/* Optionnel : Preuves attendues / Risques / Fonctions (tu peux les masquer si tu veux ultra minimal) */}
          {(currentQuestion?.expectedEvidence || currentQuestion?.risks || (currentQuestion?.interviewFunctions && currentQuestion.interviewFunctions.length > 0)) ? (
            <>
              <Separator />

              {currentQuestion?.expectedEvidence ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Éléments de preuve attendus
                  </div>
                  <div className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {currentQuestion.expectedEvidence}
                  </div>
                </div>
              ) : null}

              {currentQuestion?.risks ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Risques
                  </div>
                  <div className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {typeof currentQuestion.risks === "string"
                      ? currentQuestion.risks
                      : JSON.stringify(currentQuestion.risks, null, 2)}
                  </div>
                </div>
              ) : null}

              {currentQuestion?.interviewFunctions && currentQuestion.interviewFunctions.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Fonctions à interviewer</div>
                  <div className="flex flex-wrap gap-2">
                    {safeArray<any>(currentQuestion.interviewFunctions).map((f, idx) => (
                      <Badge key={idx} variant="outline">
                        {String(f)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {/* Petit bouton retour wizard (discret) */}
          <div className="pt-2">
            <Button variant="secondary" onClick={() => setLocation("/mdr")} className="w-full md:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour Wizard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
