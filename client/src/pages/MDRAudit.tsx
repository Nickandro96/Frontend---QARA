/**
 * MDR Audit Page - VERSION ULTRA-TOLÉRANTE (V3)
 * Interactive questionnaire for MDR 2017/745 compliance audit
 * Secured against undefined properties and rendering errors.
 * Fixed: No automatic audit creation loop
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
  const [auditCreationAttempted, setAuditCreationAttempted] = useState(false);
  const [auditCreationError, setAuditCreationError] = useState<string | null>(null);
  
  // 1. SAFE DATA FETCHING
  const { data: qualification, isLoading: loadingQualification } = trpc.mdr.getQualification.useQuery({});
  
  const createAudit = trpc.audit.create.useMutation({
    onSuccess: (data) => {
      if (data?.auditId) {
        setAuditId(data.auditId);
        setAuditCreationError(null);
        toast.success("✅ Audit créé avec succès");
      }
    },
    onError: (error) => {
      const errorMessage = error.message || "Erreur lors de la création de l'audit";
      setAuditCreationError(errorMessage);
      console.error("[MDR AUDIT] Audit creation error:", errorMessage);
      toast.error("❌ " + errorMessage);
    },
  });
  
  // FIXED: Only create audit once, with proper error handling
  useEffect(() => {
    if (!auditCreationAttempted && qualification && !auditId && !createAudit.isPending) {
      setAuditCreationAttempted(true);
      
      createAudit.mutate({
        auditType: "internal",
        name: `Audit MDR - ${new Date().toLocaleDateString("fr-FR")}`,
        referentialIds: [1],
      });
    }
  }, [auditCreationAttempted, qualification, auditId, createAudit.isPending]);
  
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
    const qId = String(questionId ?? `fallback-q-${Date.now()}`);
    setResponses(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        [field]: value,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveResponse = (questionId: any) => {
    const qId = String(questionId ?? "");
    const response = responses[qId];
    
    if (!response) {
      toast.error("❌ Aucune réponse sélectionnée");
      return;
    }

    if (!auditId) {
      toast.error("❌ Audit non créé");
      return;
    }

    saveResponseMutation.mutate({
      auditId,
      questionId: typeof questionId === "number" ? questionId : 0,
      responseValue: response.responseValue,
      responseComment: response.responseComment || "",
    });

    setHasUnsavedChanges(false);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questionsData.questions.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  // LOADING STATE
  if (loadingQualification || loadingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Chargement de l'audit MDR...</p>
        </div>
      </div>
    );
  }

  // ERROR STATE - Audit creation failed
  if (auditCreationAttempted && auditCreationError && !auditId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Erreur de création d'audit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {String(auditCreationError ?? "Une erreur est survenue")}
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => {
                setAuditCreationAttempted(false);
                setAuditCreationError(null);
              }}
              className="w-full"
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // NO QUESTIONS STATE
  if (questionsData.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Aucune question disponible</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Les questions MDR ne sont pas disponibles pour le moment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questionsData.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questionsData.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Audit MDR 2017/745</h1>
            </div>
            <div className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} / {questionsData.questions.length}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Question Card */}
          <Card className={`transition-all duration-300 ${isTransitioning ? "opacity-50" : "opacity-100"}`}>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                  {String(currentQuestion?.referentialCode ?? "MDR")}
                </Badge>
                {currentQuestion?.criticality && (
                  <Badge className={CRITICALITY_COLORS[String(currentQuestion.criticality)] || "bg-gray-100"}>
                    {String(currentQuestion.criticality)}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl">
                {String(currentQuestion?.questionDetailed ?? currentQuestion?.questionShort ?? "Question sans titre")}
              </CardTitle>
              <CardDescription>
                {String(currentQuestion?.processName ?? "")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {/* Compliance Options */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Conformité</Label>
                <RadioGroup
                  value={responses[String(currentQuestion?.id ?? "")]?.responseValue || ""}
                  onValueChange={(value) => handleResponseChange(currentQuestion?.id, "responseValue", value)}
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {COMPLIANCE_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="cursor-pointer text-sm">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Comments */}
              <div>
                <Label htmlFor="comments" className="text-base font-semibold mb-2 block">
                  Commentaires
                </Label>
                <Textarea
                  id="comments"
                  placeholder="Ajouter des détails, preuves ou observations..."
                  value={responses[String(currentQuestion?.id ?? "")]?.responseComment || ""}
                  onChange={(e) => handleResponseChange(currentQuestion?.id, "responseComment", e.target.value)}
                  className="min-h-24"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                >
                  ← Précédent
                </Button>

                <Button
                  onClick={() => handleSaveResponse(currentQuestion?.id)}
                  disabled={saveResponseMutation.isPending}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saveResponseMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={currentQuestionIndex === questionsData.questions.length - 1}
                >
                  Suivant →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress Info */}
          <div className="mt-6 text-center text-sm text-gray-600">
            {hasUnsavedChanges && (
              <p className="text-orange-600 font-medium">⚠️ Modifications non sauvegardées</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
