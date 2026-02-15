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

function CriticalityBadge({ level }: { level?: string | null }) {
  const v = (level || "").toLowerCase();
  const label = level || "n/a";

  const variant =
    v === "critical" || v === "very_high"
      ? "destructive"
      : v === "high"
      ? "destructive"
      : v === "medium"
      ? "secondary"
      : "outline";

  return (
    <Badge variant={variant as any} className="whitespace-nowrap">
      {label}
    </Badge>
  );
}

function ResponseBadge({ value }: { value?: ResponseValue | null }) {
  const v = value || "in_progress";
  const map: Record<string, { label: string; cls: string; icon?: React.ReactNode }> = {
    compliant: { label: "Conforme", cls: "bg-green-600 text-white", icon: <CheckCircle2 className="h-4 w-4" /> },
    non_compliant: { label: "Non conforme", cls: "bg-red-600 text-white", icon: <AlertCircle className="h-4 w-4" /> },
    partial: { label: "Partiel", cls: "bg-amber-600 text-white" },
    not_applicable: { label: "N/A", cls: "bg-slate-500 text-white" },
    in_progress: { label: "En cours", cls: "bg-blue-600 text-white" },
  };

  const cfg = map[v] || map.in_progress;

  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm", cfg.cls)}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
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

  // ✅ Fetch existing responses from backend (DB)
  // Backend may return either:
  //   - an array of responses (legacy)
  //   - an object wrapper { responses: [...] }
  // Normalize here so the questionnaire never crashes due to shape drift.
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
    // reset index on new audit load
    setCurrentIndex(0);
  }, [enabled, auditContext?.auditId]);

  // Autosave message clear
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

  const handleSetResponseValue = (value: ResponseValue) => {
    if (!currentQuestion?.questionKey) return;
    setDraft(currentQuestion.questionKey, {
      responseValue: value,
      role: auditContext?.economicRole ?? null,
      processId: (auditContext as any)?.processIds?.[0] ?? null,
    });
  };

  const handleSetComment = (v: string) => {
    if (!currentQuestion?.questionKey) return;
    setDraft(currentQuestion.questionKey, { responseComment: v });
  };

  const handleSetNote = (v: string) => {
    if (!currentQuestion?.questionKey) return;
    setDraft(currentQuestion.questionKey, { note: v });
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
    const row = localDrafts[currentQuestion.questionKey];
    if (!row) {
      setSaveMessage("Rien à enregistrer");
      return;
    }

    try {
      setSaving(true);
      await persistOne(row);
      lastSaveRef.current = Date.now();
      setSaveMessage("Enregistré ✅");
      // Clear local draft after successful save (optional)
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

  const handleSaveAllDrafts = async () => {
    const list = Object.values(localDrafts || {});
    if (!list.length) {
      setSaveMessage("Aucun brouillon à enregistrer");
      return;
    }

    try {
      setSaving(true);
      for (const row of list) {
        await persistOne(row);
      }
      lastSaveRef.current = Date.now();
      setSaveMessage("Tout enregistré ✅");
      setLocalDrafts({});
    } catch (e) {
      console.error(e);
      setSaveMessage("Erreur d’enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1));

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

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={goBackToWizard}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Wizard
          </Button>

          <div>
            <div className="text-xl font-semibold">
              {(auditContext as any)?.auditName || "Audit MDR"}
            </div>
            <div className="text-sm text-muted-foreground">
              Rôle: <span className="font-medium">{(auditContext as any)?.economicRole || "—"}</span> · Référentiel:{" "}
              <span className="font-medium">{safeArray<number>((auditContext as any)?.referentialIds).join(", ") || "—"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              {answeredCount}/{totalQuestions} répondu
            </div>
            <div className="w-40">
              <Progress value={progressPct} />
            </div>
            <Badge variant="outline">{progressPct}%</Badge>
          </div>

          <Button onClick={handleSaveAllDrafts} disabled={saving || Object.keys(localDrafts).length === 0}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Enregistrer tout
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                Question {currentIndex + 1} / {totalQuestions}
              </div>
              <Separator orientation="vertical" className="h-5" />
              <CriticalityBadge level={currentQuestion?.criticality ?? null} />
              {currentResponse?.responseValue ? <ResponseBadge value={currentResponse.responseValue} /> : null}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={goPrev} disabled={currentIndex === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Précédent
              </Button>
              <Button variant="secondary" onClick={goNext} disabled={currentIndex >= totalQuestions - 1}>
                Suivant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-lg font-semibold">{currentQuestion?.title || "Question"}</div>
            <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
              {currentQuestion?.article ? (
                <Badge variant="outline" className="whitespace-nowrap">
                  <FileText className="mr-2 h-3.5 w-3.5" />
                  {currentQuestion.article}
                </Badge>
              ) : null}
              {currentQuestion?.annexe ? (
                <Badge variant="outline" className="whitespace-nowrap">
                  {currentQuestion.annexe}
                </Badge>
              ) : null}
              {currentQuestion?.questionType ? (
                <Badge variant="outline" className="whitespace-nowrap">
                  {currentQuestion.questionType}
                </Badge>
              ) : null}
            </div>

            <div className="mt-2 whitespace-pre-wrap leading-relaxed">{currentQuestion?.questionText}</div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={currentResponse?.responseValue === "compliant" ? "default" : "secondary"}
                onClick={() => handleSetResponseValue("compliant")}
              >
                Conforme
              </Button>
              <Button
                variant={currentResponse?.responseValue === "non_compliant" ? "destructive" : "secondary"}
                onClick={() => handleSetResponseValue("non_compliant")}
              >
                Non conforme
              </Button>
              <Button
                variant={currentResponse?.responseValue === "partial" ? "default" : "secondary"}
                onClick={() => handleSetResponseValue("partial")}
              >
                Partiel
              </Button>
              <Button
                variant={currentResponse?.responseValue === "not_applicable" ? "outline" : "secondary"}
                onClick={() => handleSetResponseValue("not_applicable")}
              >
                N/A
              </Button>
              <Button
                variant={currentResponse?.responseValue === "in_progress" ? "outline" : "secondary"}
                onClick={() => handleSetResponseValue("in_progress")}
              >
                En cours
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Commentaire / Constat</div>
                <Textarea
                  value={localDrafts[currentQuestion!.questionKey]?.responseComment ?? currentResponse?.responseComment ?? ""}
                  onChange={(e) => handleSetComment(e.target.value)}
                  placeholder="Décris les preuves, observations terrain, écarts…"
                  className="min-h-[140px]"
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Note / Action</div>
                <Textarea
                  value={localDrafts[currentQuestion!.questionKey]?.note ?? currentResponse?.note ?? ""}
                  onChange={(e) => handleSetNote(e.target.value)}
                  placeholder="Plan d’action, responsables, délais…"
                  className="min-h-[140px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4" />
                {saveMessage ? <span className="font-medium">{saveMessage}</span> : <span>Les modifications sont en brouillon tant que tu n’enregistres pas.</span>}
              </div>

              <Button onClick={handleSaveCurrent} disabled={saving || !localDrafts[currentQuestion!.questionKey]}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Enregistrer
              </Button>
            </div>

            {currentQuestion?.expectedEvidence ? (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Éléments de preuve attendus
                  </div>
                  <div className="text-sm whitespace-pre-wrap text-muted-foreground">{currentQuestion.expectedEvidence}</div>
                </div>
              </>
            ) : null}

            {currentQuestion?.risks ? (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Risques
                  </div>
                  <div className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {typeof currentQuestion.risks === "string" ? currentQuestion.risks : JSON.stringify(currentQuestion.risks, null, 2)}
                  </div>
                </div>
              </>
            ) : null}

            {(currentQuestion?.interviewFunctions && currentQuestion.interviewFunctions.length > 0) ? (
              <>
                <Separator />
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
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Navigation rapide (index) · Clique pour aller à une question
            </div>
            <div className="text-sm text-muted-foreground">
              Dernier enregistrement:{" "}
              <span className="font-medium">
                {lastSaveRef.current ? new Date(lastSaveRef.current).toLocaleTimeString() : "—"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {questions.slice(0, 120).map((q, idx) => {
              const r = responsesMap.get(q.questionKey);
              const done = r?.responseValue && r.responseValue !== "in_progress";
              return (
                <Button
                  key={q.questionKey}
                  variant={idx === currentIndex ? "default" : done ? "secondary" : "outline"}
                  className="h-8 px-3 text-xs"
                  onClick={() => setCurrentIndex(idx)}
                >
                  {idx + 1}
                </Button>
              );
            })}
            {questions.length > 120 ? (
              <Badge variant="outline" className="h-8 flex items-center">
                +{questions.length - 120}…
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
