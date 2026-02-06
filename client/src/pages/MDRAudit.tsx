/**
 * MDR Audit Page - VERSION ULTRA-COMPLÈTE (V5)
 * Interactive questionnaire for MDR 2017/745 compliance audit
 */

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, FileText, Save, CheckCircle2, ChevronLeft, ChevronRight, Upload, MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COMPLIANCE_OPTIONS = [
  { value: "compliant", label: "Conforme", color: "bg-green-100 text-green-800 border-green-300" },
  { value: "non_compliant", label: "Non-Conforme", color: "bg-red-100 text-red-800 border-red-300" },
  { value: "partial", label: "Partiellement Conforme", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { value: "not_applicable", label: "Non Applicable", color: "bg-gray-100 text-gray-800 border-gray-300" },
];

const ECONOMIC_ROLES = [
  { value: "fabricant", label: "Fabricant" },
  { value: "importateur", label: "Importateur" },
  { value: "distributeur", label: "Distributeur" },
  { value: "mandataire", label: "Mandataire" },
];

export default function MDRAudit() {
  const [, setLocation] = useLocation();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [auditId, setAuditId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("fabricant");
  const [selectedProcess, setSelectedProcess] = useState<string>("all");
  const [isAuditStarted, setIsAuditStarted] = useState(false);
  
  // 1. DATA FETCHING
  const { data: qualification } = trpc.mdr.getQualification.useQuery({});
  const { data: processesData, isLoading: loadingProcesses } = trpc.mdr.getProcesses.useQuery();
  
  const createAudit = trpc.audit.create.useMutation({
    onSuccess: (data) => {
      if (data?.auditId) {
        setAuditId(data.auditId);
        setIsAuditStarted(true);
        toast.success("✅ Audit démarré");
      }
    },
  });

  const { data: questionsDataRaw, isLoading: loadingQuestions } = trpc.mdr.getQuestions.useQuery(
    { selectedProcesses: selectedProcess === "all" ? [] : [selectedProcess] },
    { enabled: isAuditStarted }
  );

  const { data: existingResponses } = trpc.mdr.getResponses.useQuery(
    { auditId: auditId as number },
    { enabled: !!auditId }
  );

  // Sync existing responses
  useEffect(() => {
    if (existingResponses && Object.keys(responses).length === 0) {
      const newResponses: Record<string, any> = {};
      existingResponses.forEach((r: any) => {
        newResponses[r.questionKey] = {
          responseValue: r.responseValue,
          responseComment: r.responseComment,
          note: r.note,
        };
      });
      setResponses(newResponses);
    }
  }, [existingResponses]);

  useEffect(() => {
    if (qualification?.economicRole) {
      setSelectedRole(qualification.economicRole);
    }
  }, [qualification]);

  const startAudit = () => {
    if (!selectedRole) {
      toast.error("Veuillez sélectionner un rôle économique");
      return;
    }
    createAudit.mutate({
      auditType: "internal",
      name: `Audit MDR (${selectedRole}) - ${new Date().toLocaleDateString("fr-FR")}`,
      referentials: JSON.stringify([1]),
    });
  };

  const saveResponseMutation = trpc.mdr.saveResponse.useMutation({
    onSuccess: () => {
      toast.success("✅ Réponse sauvegardée");
      setHasUnsavedChanges(false);
    },
    onError: (error) => {
      toast.error("❌ Erreur: " + error.message);
    },
  });

  const handleResponseChange = (questionKey: string, field: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionKey]: {
        ...prev[questionKey],
        [field]: value,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveResponse = (questionKey: string, autoNext = false) => {
    const response = responses[questionKey];
    if (!response?.responseValue) {
      toast.error("Veuillez sélectionner un statut de conformité");
      return;
    }

    if (!auditId) return;

    saveResponseMutation.mutate({
      auditId,
      questionKey,
      responseValue: response.responseValue,
      responseComment: response.responseComment || "",
      note: response.note || "",
      role: selectedRole,
      processId: selectedProcess,
    });

    if (autoNext) handleNext();
  };

  const filteredQuestions = Array.isArray(questionsDataRaw?.questions) ? questionsDataRaw.questions : [];

  const handleNext = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setIsTransitioning(false);
      }, 200);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
        setIsTransitioning(false);
      }, 200);
    }
  };

  if (!isAuditStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Configuration de l'Audit MDR</CardTitle>
            <CardDescription>Préparez votre session d'audit réglementaire</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Rôle Économique</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre rôle" />
                </SelectTrigger>
                <SelectContent>
                  {ECONOMIC_ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Processus à auditer</Label>
              <Select value={selectedProcess} onValueChange={setSelectedProcess}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les processus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les processus</SelectItem>
                  {processesData?.processes?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                  {loadingProcesses && (
                    <div className="p-2 flex items-center justify-center text-xs text-slate-500">
                      <Loader2 className="h-3 w-3 animate-spin mr-2" /> Chargement des processus...
                    </div>
                  )}
                  {!loadingProcesses && (!processesData?.processes || processesData.processes.length === 0) && (
                    <div className="p-2 text-xs text-red-500">Erreur de chargement des processus</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={startAudit} className="w-full h-12 text-lg" disabled={createAudit.isPending}>
              {createAudit.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
              Démarrer l'Audit
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Chargement des questions MDR...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = filteredQuestions[currentQuestionIndex];
  const progress = filteredQuestions.length > 0 ? ((currentQuestionIndex + 1) / filteredQuestions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsAuditStarted(false)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold text-lg">Audit MDR 2017/745</h1>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Rôle : {selectedRole} | Processus : {selectedProcess === "all" ? "Tous" : selectedProcess}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="text-sm font-medium">{currentQuestionIndex + 1} / {filteredQuestions.length}</div>
              <Progress value={progress} className="w-32 h-2 mt-1" />
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setLocation("/")}>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Terminer
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {filteredQuestions.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <CardTitle>Aucune question trouvée</CardTitle>
              <CardDescription>Aucune question ne correspond à votre sélection de rôle ({selectedRole}) et de processus ({selectedProcess}).</CardDescription>
              <Button variant="outline" className="mt-6" onClick={() => setIsAuditStarted(false)}>Retour aux réglages</Button>
            </Card>
          ) : (
            <div className={`transition-all duration-300 ${isTransitioning ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"}`}>
              <Card className="border-none shadow-md overflow-hidden">
                <div className="bg-blue-600 h-1.5 w-full" />
                <CardHeader className="pb-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                      {currentQuestion?.article || "MDR"}
                    </Badge>
                    {currentQuestion?.criticality === "high" && (
                      <Badge variant="destructive" className="animate-pulse">CRITIQUE</Badge>
                    )}
                    <Badge variant="outline" className="text-slate-500">
                      {currentQuestion?.processId || currentQuestion?.process || "Général"}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl md:text-2xl leading-tight">
                    {currentQuestion?.questionText || "Question sans texte"}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-8 pt-4">
                  {/* Note Technique / Exigences */}
                  {currentQuestion?.note && (
                    <div className="bg-slate-50 border rounded-lg p-4">
                      <div className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                        <FileText className="h-4 w-4" />
                        Exigence technique / Note
                      </div>
                      <p className="text-slate-600 text-sm whitespace-pre-wrap">{currentQuestion.note}</p>
                    </div>
                  )}

                  {/* Statut de Conformité */}
                  <div className="space-y-4">
                    <Label className="text-base font-bold">Statut de conformité</Label>
                    <RadioGroup 
                      value={responses[currentQuestion.id]?.responseValue || ""} 
                      onValueChange={(val) => handleResponseChange(currentQuestion.id, "responseValue", val)}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    >
                      {COMPLIANCE_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-center">
                          <RadioGroupItem value={option.value} id={`${currentQuestion.id}-${option.value}`} className="sr-only" />
                          <Label
                            htmlFor={`${currentQuestion.id}-${option.value}`}
                            className={`flex-1 flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              responses[currentQuestion.id]?.responseValue === option.value
                                ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                                : "border-slate-100 bg-white hover:border-slate-200"
                            }`}
                          >
                            <span className="font-medium">{option.label}</span>
                            {responses[currentQuestion.id]?.responseValue === option.value && (
                              <CheckCircle2 className="h-5 w-5 text-blue-600" />
                            )}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Commentaires et Preuves */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="font-bold flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Commentaires / Observations
                      </Label>
                      <Textarea 
                        placeholder="Détails, preuves observées ou justifications..."
                        className="min-h-[120px] resize-none focus:ring-blue-500"
                        value={responses[currentQuestion.id]?.responseComment || ""}
                        onChange={(e) => handleResponseChange(currentQuestion.id, "responseComment", e.target.value)}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="font-bold flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Preuves / Documents (Upload)
                      </Label>
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                        <Upload className="h-8 w-8 text-slate-400 mb-2" />
                        <p className="text-xs text-slate-500 text-center font-medium">
                          Cliquez ou glissez-déposez vos fichiers ici<br/>
                          <span className="text-[10px] text-slate-400 font-normal">(PDF, JPG, PNG, DOCX)</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>

                {/* Navigation Footer */}
                <div className="bg-slate-50 border-t p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <Button 
                    variant="outline" 
                    onClick={handlePrevious} 
                    disabled={currentQuestionIndex === 0}
                    className="w-full sm:w-auto"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" /> Précédent
                  </Button>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      className="flex-1 sm:flex-none"
                      onClick={() => handleSaveResponse(currentQuestion.id)}
                      disabled={saveResponseMutation.isPending || !hasUnsavedChanges}
                    >
                      {saveResponseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Enregistrer
                    </Button>
                    <Button 
                      className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleSaveResponse(currentQuestion.id, true)}
                      disabled={saveResponseMutation.isPending}
                    >
                      Enregistrer & Continuer <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
