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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";

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
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [auditId, setAuditId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("fabricant");
  const [selectedProcess, setSelectedProcess] = useState<string>("all");
  const [isAuditStarted, setIsAuditStarted] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("");
  const [auditName, setAuditName] = useState<string>("");
  const [auditScope, setAuditScope] = useState<string>("");
  const [auditMethod, setAuditMethod] = useState<string>("on_site");
  const [auditeeContactName, setAuditeeContactName] = useState<string>("");
  const [auditeeContactEmail, setAuditeeContactEmail] = useState<string>("");
  
  // 1. DATA FETCHING
  const { data: qualification } = trpc.mdr.getQualification.useQuery({});
  const { data: processesData, isLoading: loadingProcesses } = trpc.mdr.getProcesses.useQuery();
  const { data: sitesData } = trpc.sites.list.useQuery();
  const { data: organizationsData } = trpc.organizations.list.useQuery();
  
  const createAudit = trpc.audit.create.useMutation({
    onSuccess: (data) => {
      if (data?.auditId) {
        setAuditId(data.auditId);
        setIsAuditStarted(true);
        toast.success("✅ Audit démarré");
      }
    },
    onError: (error) => {
      toast.error("❌ Erreur lors de la création de l'audit: " + error.message);
    }
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

  useEffect(() => {
    setAuditName(`Audit MDR (${selectedRole}) - ${new Date().toLocaleDateString("fr-FR")}`);
  }, [selectedRole]);

  const startAudit = () => {
    if (!selectedRole) {
      toast.error("Veuillez sélectionner un rôle économique");
      return;
    }
    
    if (!selectedSiteId) {
      toast.error("Veuillez sélectionner un site");
      return;
    }
    
    const finalAuditName = auditName || `Audit MDR (${selectedRole}) - ${new Date().toLocaleDateString("fr-FR")}`;
    
    // Find MDR referential ID if possible, otherwise use fallback 1
    createAudit.mutate({
      auditType: "mdr",
      name: finalAuditName,
      siteId: parseInt(selectedSiteId),
      organizationId: selectedOrganizationId ? parseInt(selectedOrganizationId) : undefined,
      referentialIds: [1], // Use an array of numbers as expected by the backend
      economicRole: selectedRole,
      processesSelected: selectedProcess === "all" ? "[]" : JSON.stringify([selectedProcess]),
      auditScope: auditScope,
      auditMethod: auditMethod,
      auditeeContactName: auditeeContactName,
      auditeeContactEmail: auditeeContactEmail,
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Authentification requise</CardTitle>
            <CardDescription>Veuillez vous connecter pour accéder à l'audit</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/login")} className="w-full">Se connecter</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuditStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Configuration de l'Audit MDR</CardTitle>
            <CardDescription>Préparez votre session d'audit réglementaire</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Rôle Économique *</Label>
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
              <Label>Site / Localisation *</Label>
              <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un site" />
                </SelectTrigger>
                <SelectContent>
                  {sitesData?.map((site: any) => (
                    <SelectItem key={site.id} value={String(site.id)}>{site.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Organisation (optionnel)</Label>
              <Select value={selectedOrganizationId} onValueChange={setSelectedOrganizationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une organisation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Aucune --</SelectItem>
                  {organizationsData?.map((org: any) => (
                    <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Nom de l'audit</Label>
              <input
                type="text"
                value={auditName}
                onChange={(e) => setAuditName(e.target.value)}
                placeholder="Audit MDR (Fabricant) - 10/02/2026"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Périmètre / Scope (optionnel)</Label>
              <Textarea
                value={auditScope}
                onChange={(e) => setAuditScope(e.target.value)}
                placeholder="Décrivez le périmètre de l'audit"
                className="min-h-20"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Méthode d'audit</Label>
              <Select value={auditMethod} onValueChange={setAuditMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez la méthode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_site">Sur site</SelectItem>
                  <SelectItem value="remote">À distance</SelectItem>
                  <SelectItem value="hybrid">Hybride</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Contact auditée - Nom (optionnel)</Label>
              <input
                type="text"
                value={auditeeContactName}
                onChange={(e) => setAuditeeContactName(e.target.value)}
                placeholder="Nom du contact"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Contact auditée - Email (optionnel)</Label>
              <input
                type="email"
                value={auditeeContactEmail}
                onChange={(e) => setAuditeeContactEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
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
                    <div className="p-2 text-xs text-slate-500 italic">Aucun processus spécifique trouvé (mode global)</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={startAudit} className="w-full h-12 text-lg" disabled={createAudit.isPending || !selectedSiteId}>
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
              <Button onClick={() => setIsAuditStarted(false)} className="mt-6">Modifier la configuration</Button>
            </Card>
          ) : currentQuestion ? (
            <div className={`transition-all duration-300 ${isTransitioning ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"}`}>
              <Card className="shadow-md border-none overflow-hidden">
                <div className="h-1.5 bg-blue-600" />
                <CardHeader className="bg-white border-b">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 uppercase text-[10px]">MDR</Badge>
                    {currentQuestion.criticality === "high" && <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 uppercase text-[10px]">Critique</Badge>}
                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 uppercase text-[10px]">{currentQuestion.processId || currentQuestion.process || "Général"}</Badge>
                    {currentQuestion.article && <Badge variant="secondary" className="text-[10px]">{currentQuestion.article}</Badge>}
                  </div>
                  <CardTitle className="text-xl text-slate-800 leading-tight">
                    {currentQuestion.title || "Question d'audit"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-8 bg-white">
                  {/* Question Text */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {currentQuestion.questionText}
                    </p>
                  </div>

                  {/* Expected Evidence */}
                  {currentQuestion.expectedEvidence && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                        <FileText className="h-3 w-3" /> Preuves attendues
                      </Label>
                      <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 text-sm text-slate-700">
                        {Array.isArray(currentQuestion.expectedEvidence) ? (
                          <ul className="list-disc list-inside space-y-1">
                            {currentQuestion.expectedEvidence.map((e: string, i: number) => <li key={i}>{e}</li>)}
                          </ul>
                        ) : (
                          <p>{currentQuestion.expectedEvidence}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Interview Functions */}
                  {currentQuestion.interviewFunctions && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                        <MessageSquare className="h-3 w-3" /> Fonctions à interroger
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(currentQuestion.interviewFunctions) ? currentQuestion.interviewFunctions : [currentQuestion.interviewFunctions]).map((f: any, i: number) => (
                          <Badge key={i} variant="outline" className="bg-white">{typeof f === 'string' ? f : f.name || JSON.stringify(f)}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Compliance Status */}
                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-slate-800 font-bold text-base">Statut de Conformité</Label>
                    <RadioGroup 
                      value={responses[currentQuestion.id]?.responseValue || ""} 
                      onValueChange={(val) => handleResponseChange(currentQuestion.id, "responseValue", val)}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    >
                      {COMPLIANCE_OPTIONS.map((option) => (
                        <div key={option.value} className="relative">
                          <RadioGroupItem value={option.value} id={option.value} className="peer sr-only" />
                          <Label
                            htmlFor={option.value}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-slate-50 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50/50 ${
                              responses[currentQuestion.id]?.responseValue === option.value ? "border-blue-600 bg-blue-50/50" : "border-slate-200"
                            }`}
                          >
                            <span className="font-semibold">{option.label}</span>
                            <div className={`w-4 h-4 rounded-full border-2 ${responses[currentQuestion.id]?.responseValue === option.value ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}>
                              {responses[currentQuestion.id]?.responseValue === option.value && <div className="w-1.5 h-1.5 bg-white rounded-full m-auto mt-0.5" />}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Technical Note / Observations */}
                  <div className="space-y-3">
                    <Label htmlFor="note" className="text-slate-800 font-bold text-base">Note Technique / Observations</Label>
                    <Textarea
                      id="note"
                      placeholder="Saisissez ici les détails techniques, observations ou justifications..."
                      className="min-h-[120px] bg-slate-50 focus:bg-white transition-colors"
                      value={responses[currentQuestion.id]?.note || ""}
                      onChange={(e) => handleResponseChange(currentQuestion.id, "note", e.target.value)}
                    />
                  </div>

                  {/* Internal Comments */}
                  <div className="space-y-3">
                    <Label htmlFor="comment" className="text-slate-800 font-bold text-base">Commentaires Internes</Label>
                    <Textarea
                      id="comment"
                      placeholder="Commentaires pour l'équipe interne (non inclus dans le rapport final)..."
                      className="min-h-[80px] bg-slate-50 focus:bg-white transition-colors border-dashed"
                      value={responses[currentQuestion.id]?.responseComment || ""}
                      onChange={(e) => handleResponseChange(currentQuestion.id, "responseComment", e.target.value)}
                    />
                  </div>

                  {/* Evidence Upload Area */}
                  <div className="space-y-3 pt-4 border-t">
                    <Label className="text-slate-800 font-bold text-base">Preuves & Documents</Label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors bg-slate-50/50 group cursor-pointer">
                      <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2 group-hover:text-blue-500 transition-colors" />
                      <p className="text-sm font-medium text-slate-600">Cliquez pour ajouter des fichiers de preuve</p>
                      <p className="text-xs text-slate-400 mt-1">PDF, Images, Word (Max 10MB)</p>
                    </div>
                  </div>
                </CardContent>
                
                {/* Navigation Footer */}
                <CardHeader className="bg-slate-50 border-t flex flex-row items-center justify-between p-4">
                  <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                    <ChevronLeft className="h-4 w-4 mr-2" /> Précédent
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="bg-white"
                      onClick={() => handleSaveResponse(currentQuestion.id)}
                      disabled={saveResponseMutation.isPending || !hasUnsavedChanges}
                    >
                      {saveResponseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Enregistrer
                    </Button>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleSaveResponse(currentQuestion.id, true)}
                      disabled={saveResponseMutation.isPending}
                    >
                      {currentQuestionIndex === filteredQuestions.length - 1 ? "Terminer" : "Enregistrer et continuer"}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
