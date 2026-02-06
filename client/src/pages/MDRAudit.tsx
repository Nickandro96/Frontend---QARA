/**
 * MDR Audit Page - VERSION ULTRA-COMPLÈTE (V4)
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
    {},
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

  // Filter questions based on UI selection (Process)
  const allQuestions = Array.isArray(questionsDataRaw?.questions) ? questionsDataRaw.questions : [];
  const filteredQuestions = selectedProcess === "all" 
    ? allQuestions 
    : allQuestions.filter((q: any) => q.processId === selectedProcess || q.process === selectedProcess);

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

  // Get unique processes for the filter
  const uniqueProcesses = Array.from(new Set(allQuestions.map((q: any) => q.processId || q.process))).filter(Boolean);

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
                  {/* Process list will be populated once questions are loaded, but for now we show static or empty */}
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
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
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
            <Button variant="outline" size="sm" className="gap-2">
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
              <CardDescription>Essayez de changer de processus ou de rôle.</CardDescription>
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
                    <Badge variant="outline" className="capitalize">
                      {currentQuestion?.processId || currentQuestion?.process || "Général"}
                    </Badge>
                    <Badge className={
                      currentQuestion?.criticality === "critical" || currentQuestion?.criticality === "high" 
                        ? "bg-red-100 text-red-700 hover:bg-red-100" 
                        : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                    }>
                      {currentQuestion?.criticality || "Medium"}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl leading-tight text-slate-900">
                    {currentQuestion?.questionText}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 pt-2">
                  {/* Status Selection */}
                  <div className="space-y-4">
                    <Label className="text-base font-bold text-slate-800">Statut de conformité</Label>
                    <RadioGroup 
                      value={responses[currentQuestion?.id]?.responseValue || ""} 
                      onValueChange={(val) => handleResponseChange(currentQuestion.id, "responseValue", val)}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    >
                      {COMPLIANCE_OPTIONS.map((opt) => (
                        <div key={opt.value} className={`relative flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          responses[currentQuestion?.id]?.responseValue === opt.value 
                            ? "border-blue-600 bg-blue-50" 
                            : "border-slate-100 hover:border-slate-200"
                        }`}>
                          <RadioGroupItem value={opt.value} id={opt.value} className="sr-only" />
                          <Label htmlFor={opt.value} className="flex items-center gap-3 cursor-pointer w-full font-medium text-slate-700">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              responses[currentQuestion?.id]?.responseValue === opt.value ? "border-blue-600" : "border-slate-300"
                            }`}>
                              {responses[currentQuestion?.id]?.responseValue === opt.value && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                            </div>
                            {opt.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Note / Réponse */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-bold text-slate-800">Réponse / Note technique</Label>
                      <Button variant="ghost" size="sm" className="text-blue-600 h-8 gap-1">
                        <MessageSquare className="h-4 w-4" />
                        Aide IA
                      </Button>
                    </div>
                    <Textarea 
                      placeholder="Décrivez comment vous répondez à cette exigence..."
                      className="min-h-[120px] bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                      value={responses[currentQuestion?.id]?.note || ""}
                      onChange={(e) => handleResponseChange(currentQuestion.id, "note", e.target.value)}
                    />
                  </div>

                  {/* Commentaire */}
                  <div className="space-y-3">
                    <Label className="text-base font-bold text-slate-800">Commentaire (interne)</Label>
                    <Textarea 
                      placeholder="Notes pour l'équipe, points à revoir..."
                      className="min-h-[80px] bg-slate-50 border-slate-200"
                      value={responses[currentQuestion?.id]?.responseComment || ""}
                      onChange={(e) => handleResponseChange(currentQuestion.id, "responseComment", e.target.value)}
                    />
                  </div>

                  {/* Evidence Upload */}
                  <div className="space-y-3">
                    <Label className="text-base font-bold text-slate-800">Documents justificatifs</Label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group">
                      <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2 group-hover:text-blue-500 transition-colors" />
                      <p className="text-sm font-medium text-slate-600">Cliquez pour ajouter des preuves</p>
                      <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG, DOCX (Max 10MB)</p>
                    </div>
                  </div>

                  {/* Navigation & Actions */}
                  <div className="flex flex-col md:flex-row gap-4 pt-4 border-t">
                    <div className="flex gap-2 flex-1">
                      <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0} className="flex-1 md:flex-none">
                        <ChevronLeft className="mr-2 h-4 w-4" /> Précédent
                      </Button>
                      <Button variant="outline" onClick={handleNext} disabled={currentQuestionIndex === filteredQuestions.length - 1} className="flex-1 md:flex-none">
                        Suivant <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => handleSaveResponse(currentQuestion.id)} className="gap-2" disabled={saveResponseMutation.isPending}>
                        <Save className="h-4 w-4" /> Enregistrer
                      </Button>
                      <Button onClick={() => handleSaveResponse(currentQuestion.id, true)} className="gap-2 bg-blue-600 hover:bg-blue-700" disabled={saveResponseMutation.isPending}>
                        Enregistrer et continuer <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Unsaved Warning */}
      {hasUnsavedChanges && (
        <div className="bg-amber-500 text-white text-center py-1.5 text-xs font-bold uppercase tracking-widest animate-pulse">
          Modifications non enregistrées
        </div>
      )}
    </div>
  );
}
