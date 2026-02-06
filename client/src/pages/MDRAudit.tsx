/**
 * MDR Audit Page - VERSION ULTRA-TOLÉRANTE
 * Interactive questionnaire for MDR 2017/745 compliance audit
 * Secured against undefined properties and rendering errors.
 */

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle2, FileText, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAutoSave } from "@/hooks/useAutoSave";

const COMPLIANCE_OPTIONS = [
  { value: "compliant", label: "Conforme", color: "bg-green-100 text-green-800 border-green-300" },
  { value: "non_compliant", label: "Non-Conforme", color: "bg-red-100 text-red-800 border-red-300" },
  { value: "partial", label: "Partiellement Conforme", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { value: "not_applicable", label: "Non Applicable", color: "bg-gray-100 text-gray-800 border-gray-300" },
];

const CRITICALITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  low: "bg-green-100 text-green-800 border-green-300",
};

export default function MDRAudit() {
  const [, setLocation] = useLocation();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, {
    responseValue: string;
    responseComment: string;
  }>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [auditId, setAuditId] = useState<number | null>(null);
  
  // 1. SAFE DATA FETCHING
  const { data: qualification, isLoading: loadingQualification } = trpc.mdr.getQualification.useQuery({});
  
  const createAudit = trpc.audit.create.useMutation({
    onSuccess: (data) => {
      if (data?.auditId) setAuditId(data.auditId);
    },
  });
  
  useEffect(() => {
    if (!auditId && qualification && !createAudit.isPending && !createAudit.isSuccess) {
      createAudit.mutate({
        auditType: "internal",
        name: `Audit MDR - ${new Date().toLocaleDateString("fr-FR")}`,
        referentialIds: [1],
      });
    }
  }, [qualification, auditId, createAudit.isPending, createAudit.isSuccess]);
  
  const { data: questionsDataRaw, isLoading: loadingQuestions, error: questionsError } = trpc.mdr.getQuestions.useQuery(
    {},
    { enabled: !!qualification }
  );

  // 2. SAFE DATA NORMALIZATION (Frontend Fallback)
  const questionsData = {
    questions: Array.isArray(questionsDataRaw?.questions) ? questionsDataRaw.questions : [],
    totalQuestions: questionsDataRaw?.totalQuestions || 0,
    userRole: String(questionsDataRaw?.userRole || qualification?.economicRole || "fabricant")
  };
  
  const saveResponseMutation = trpc.mdr.saveResponse.useMutation({
    onSuccess: () => {
      toast.success("✅ Réponse sauvegardée");
    },
    onError: (error) => {
      toast.error("❌ Erreur: " + error.message);
    },
  });
  
  const handleResponseChange = (questionId: any, field: string, value: string) => {
    const qId = String(questionId ?? "0");
    setResponses(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        [field]: value,
      },
    }));
    setHasUnsavedChanges(true);
    
    if (field === 'responseValue' && value) {
      setShowCheckmark(true);
      if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
      
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        setShowCheckmark(false);
        if (currentQuestionIndex < (questionsData.questions.length || 0) - 1) {
          setIsTransitioning(true);
          setTimeout(() => {
            setCurrentQuestionIndex(prev => prev + 1);
            setIsTransitioning(false);
          }, 300);
        }
      }, 1500);
    }
  };
  
  const handleSaveResponse = async (questionId: any) => {
    const qId = String(questionId ?? "0");
    const response = responses[qId];
    if (!response?.responseValue || !auditId) return;
    
    await saveResponseMutation.mutateAsync({
      auditId,
      questionId: qId,
      responseValue: response.responseValue as any,
      responseComment: response.responseComment || undefined,
    });
    setHasUnsavedChanges(false);
  };
  
  const currentQuestion = questionsData.questions[currentQuestionIndex] || null;
  const currentQId = String(currentQuestion?.id ?? "0");
  const currentResponse = responses[currentQId];
  
  const { isSaving, lastSaved } = useAutoSave({
    data: currentResponse,
    onSave: async (data) => {
      if (currentQuestion && data?.responseValue) {
        await handleSaveResponse(currentQuestion.id);
      }
    },
    delay: 30000,
    enabled: !!currentQuestion && hasUnsavedChanges,
  });
  
  const handleNext = async () => {
    if (!currentQuestion) return;
    await handleSaveResponse(currentQuestion.id);
    
    if (currentQuestionIndex < questionsData.questions.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setIsTransitioning(false);
      }, 300);
    } else if (auditId) {
      toast.success("Audit terminé !");
      setTimeout(() => setLocation(`/audit/${auditId}/results`), 1500);
    }
  };
  
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
    };
  }, []);
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1);
  };
  
  // 3. RENDER LOGIC WITH FALLBACKS
  if (loadingQualification || loadingQuestions || createAudit.isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
      </div>
    );
  }
  
  if (!qualification) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Veuillez compléter votre qualification MDR.</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (questionsError || questionsData.questions.length === 0) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {questionsError?.message || "Aucune question disponible. Veuillez recharger la page."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const progress = ((currentQuestionIndex + 1) / questionsData.questions.length) * 100;
  
  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Audit MDR 2017/745</h1>
            <p className="text-muted-foreground">
              Rôle : <Badge variant="outline">{String(qualification.economicRole ?? "Fabricant")}</Badge>
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Question</div>
            <div className="text-2xl font-bold">
              {currentQuestionIndex + 1} / {questionsData.questions.length}
            </div>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <Card className={`mb-6 transition-opacity duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
        <CardHeader>
          <CardTitle className="text-xl mb-2">
            {String(currentQuestion.questionShort || currentQuestion.questionText || "Sans titre")}
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            {currentQuestion.article && <Badge variant="outline">{String(currentQuestion.article)}</Badge>}
            {currentQuestion.annexe && <Badge variant="outline">{String(currentQuestion.annexe)}</Badge>}
            <Badge className={CRITICALITY_COLORS[String(currentQuestion.criticality)] || "bg-gray-100"}>
              {String(currentQuestion.criticality || "medium")}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted rounded-lg text-sm">
            {String(currentQuestion.questionText || "Pas de description disponible.")}
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Statut de conformité *</Label>
              {showCheckmark && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            </div>
            <RadioGroup
              value={currentResponse?.responseValue || ""}
              onValueChange={(v) => handleResponseChange(currentQuestion.id, "responseValue", v)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COMPLIANCE_OPTIONS.map((opt) => {
                  const idSuffix = String(currentQuestion.id ?? currentQuestionIndex);
                  const inputId = `q-${idSuffix}-${opt.value}`;
                  return (
                    <div
                      key={opt.value}
                      className={`flex items-center space-x-2 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        currentResponse?.responseValue === opt.value ? opt.color : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleResponseChange(currentQuestion.id, "responseValue", opt.value)}
                    >
                      <RadioGroupItem value={opt.value} id={inputId} />
                      <Label htmlFor={inputId} className="cursor-pointer flex-1">{opt.label}</Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-3">
            <Label>Commentaires et preuves</Label>
            <Textarea
              placeholder="Preuves, documents, actions correctives..."
              value={currentResponse?.responseComment || ""}
              onChange={(e) => handleResponseChange(currentQuestion.id, "responseComment", e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="flex gap-4">
        <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>← Précédent</Button>
        <Button onClick={() => handleSaveResponse(currentQuestion.id)} variant="outline" disabled={saveResponseMutation.isPending}>
          {saveResponseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Sauvegarder
        </Button>
        <Button onClick={handleNext} className="ml-auto">
          {currentQuestionIndex === questionsData.questions.length - 1 ? "Terminer l'audit" : "Suivant →"}
        </Button>
      </div>
    </div>
  );
}
