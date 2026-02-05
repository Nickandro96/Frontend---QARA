/**
 * ISO Audit Page
 * Interactive questionnaire for ISO 9001/13485 compliance audit
 */

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const CRITICALITY_COLORS = {
  critical: "bg-red-100 text-red-800 border-red-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  low: "bg-green-100 text-green-800 border-green-300",
};

const ECONOMIC_ROLES = [
  { value: "fabricant", label: "Fabricant", description: "Fabrique ou fait fabriquer un dispositif médical" },
  { value: "importateur", label: "Importateur", description: "Met pour la première fois un dispositif sur le marché" },
  { value: "distributeur", label: "Distributeur", description: "Fournit un dispositif sans le modifier" },
];

const BUSINESS_PROCESSES = [
  { value: "conception", label: "Conception", description: "Conception et développement" },
  { value: "fabrication", label: "Fabrication", description: "Production et fabrication" },
  { value: "distribution", label: "Distribution", description: "Distribution et commercialisation" },
  { value: "stockage", label: "Stockage", description: "Stockage et entreposage" },
  { value: "installation", label: "Installation", description: "Installation et mise en service" },
  { value: "maintenance", label: "Maintenance", description: "Maintenance et entretien" },
  { value: "service_apres_vente", label: "Service après-vente", description: "Support et service client" },
];

export default function ISOAudit() {
  const [, setLocation] = useLocation();
  // Using sonner toast
  
  // Read standard from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const standardFromUrl = urlParams.get('standard');
  
  const [selectedStandard, setSelectedStandard] = useState<string>(standardFromUrl || "");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, {
    responseValue: string;
    responseComment: string;
  }>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [auditId, setAuditId] = useState<number | null>(null);
  
  // Auto-create audit on mount if none exists
  const createAudit = trpc.audit.create.useMutation({
    onSuccess: (data) => {
      setAuditId(data.auditId);
    },
  });
  
  useEffect(() => {
    if (!auditId && selectedStandard && showQuestionnaire && !createAudit.isPending && !createAudit.isSuccess) {
      const referentialId = selectedStandard === "9001" ? 2 : 3;
      createAudit.mutate({
        auditType: "internal",
        name: `Audit ISO ${selectedStandard} - ${new Date().toLocaleDateString("fr-FR")}`,
        referentialIds: [referentialId],
      });
    }
  }, [selectedStandard, showQuestionnaire, auditId, createAudit.isPending, createAudit.isSuccess]);
  
  // Get user's qualification
  const { data: qualification, isLoading: loadingQualification } = trpc.iso.getQualification.useQuery({});
  
  // Get standards list
  const { data: standards } = trpc.iso.getStandards.useQuery();
  
  // Get questions for selected standard (only when showQuestionnaire is true)
  const { data: questionsData, isLoading: loadingQuestions, error: questionsError } = trpc.iso.getQuestions.useQuery(
    { 
      standard: selectedStandard as "9001" | "13485",
      economicRole: selectedRole as "fabricant" | "importateur" | "distributeur" | undefined,
      processes: selectedProcesses.length > 0 ? selectedProcesses : undefined,
    },
    { enabled: !!selectedStandard && showQuestionnaire }
  );
  
  const saveResponseMutation = trpc.iso.saveResponse.useMutation({
    onSuccess: () => {
      toast.success("✅ Réponse sauvegardée", {
        description: "Votre réponse a été enregistrée avec succès",
      });
    },
    onError: (error) => {
      toast.error("❌ Erreur", {
        description: error.message,
      });
    },
  });
  
  const handleResponseChange = (questionId: number, field: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }));
    setHasUnsavedChanges(true);
    
    // Auto-advance to next question after selecting compliance status
    if (field === 'responseValue' && value) {
      // Show checkmark feedback
      setShowCheckmark(true);
      
      // Clear existing timeout
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
      
      // Auto-advance after 1.5 seconds
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        setShowCheckmark(false);
        if (currentQuestionIndex < (questionsData?.questions.length || 0) - 1) {
          setIsTransitioning(true);
          setTimeout(() => {
            setCurrentQuestionIndex(prev => prev + 1);
            setIsTransitioning(false);
          }, 300);
        }
      }, 1500);
    }
  };
  
  const handleSaveResponse = async (questionId: number) => {
    const response = responses[questionId];
    if (!response?.responseValue) {
      return; // Skip if no response value
    }
    
    if (!auditId) {
      toast.error("❌ Erreur", {
        description: "Audit non créé. Veuillez patienter...",
      });
      return;
    }
    
    await saveResponseMutation.mutateAsync({
      auditId,
      questionId,
      responseValue: response.responseValue as any,
      responseComment: response.responseComment || undefined,
    });
    setHasUnsavedChanges(false);
  };
  
  // Auto-save current question response
  const currentQuestion = questionsData?.questions[currentQuestionIndex];
  const currentResponse = responses[currentQuestion?.id || 0];
  
  const { isSaving, lastSaved } = useAutoSave({
    data: currentResponse,
    onSave: async (data) => {
      if (currentQuestion && data?.responseValue) {
        await handleSaveResponse(currentQuestion.id);
      }
    },
    delay: 30000, // 30 seconds
    enabled: !!currentQuestion && hasUnsavedChanges && !!selectedStandard,
  });
  
  const handleNext = async () => {
    if (!currentQuestion) return;
    
    // Auto-save before moving to next
    await handleSaveResponse(currentQuestion.id);
    
    if (currentQuestionIndex < (questionsData?.questions.length || 0) - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setIsTransitioning(false);
      }, 300);
    } else {
      // Last question - redirect to results
      if (auditId) {
        toast.success("Audit terminé !", {
          description: "Redirection vers les résultats...",
        });
        setTimeout(() => {
          setLocation(`/audit/${auditId}/results`);
        }, 1500);
      }
    }
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  // Show loading while creating audit or loading data
  if (loadingQualification || loadingQuestions || createAudit.isPending || (selectedStandard && showQuestionnaire && !auditId)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {createAudit.isPending || (selectedStandard && !auditId) 
              ? "Création de l'audit en cours..."
              : "Chargement..."}
          </p>
        </div>
      </div>
    );
  }
  
  if (!qualification) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Veuillez d'abord compléter votre qualification ISO.
            <Button
              variant="link"
              className="ml-2"
              onClick={() => setLocation("/iso/qualification")}
            >
              Aller à la qualification →
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Show standard selection if not selected yet
  if (!selectedStandard) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Audit ISO</h1>
          <p className="text-muted-foreground">
            Sélectionnez la norme ISO à auditer
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Sélection de la norme</CardTitle>
            <CardDescription>
              Choisissez la norme ISO pour laquelle vous souhaitez réaliser l'audit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedStandard} onValueChange={setSelectedStandard}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une norme ISO" />
              </SelectTrigger>
              <SelectContent>
                {standards?.map((standard) => (
                  <SelectItem key={standard.code} value={standard.code}>
                    <div>
                      <div className="font-medium">{standard.name}</div>
                      <div className="text-xs text-muted-foreground">{standard.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Normes disponibles : {qualification.targetStandards.join(", ")}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show role and process selection if standard is selected but not confirmed
  if (selectedStandard && !showQuestionnaire) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Configuration Audit ISO {selectedStandard}</h1>
          <p className="text-muted-foreground">
            Sélectionnez votre rôle et les processus concernés
          </p>
        </div>

        {/* Role Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Rôle Économique</CardTitle>
            <CardDescription>
              Sélectionnez votre rôle principal dans la chaîne d'approvisionnement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>Rôle économique *</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez votre rôle" />
              </SelectTrigger>
              <SelectContent>
                {ECONOMIC_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div>
                      <div className="font-medium">{role.label}</div>
                      <div className="text-xs text-muted-foreground">{role.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Process Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Processus Concernés</CardTitle>
            <CardDescription>
              Sélectionnez les processus métier que vous souhaitez auditer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BUSINESS_PROCESSES.map((process) => (
                <div
                  key={process.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedProcesses.includes(process.value)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => {
                    setSelectedProcesses(prev =>
                      prev.includes(process.value)
                        ? prev.filter(p => p !== process.value)
                        : [...prev, process.value]
                    );
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{process.label}</div>
                      <div className="text-xs text-muted-foreground">{process.description}</div>
                    </div>
                    {selectedProcesses.includes(process.value) && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            onClick={() => {
              if (!selectedRole) {
                toast.error("⚠️ Champ requis", {
                  description: "Veuillez sélectionner votre rôle économique",
                });
                return;
              }
              if (selectedProcesses.length === 0) {
                toast.error("⚠️ Sélection requise", {
                  description: "Veuillez sélectionner au moins un processus",
                });
                return;
              }
              setShowQuestionnaire(true);
            }}
            className="flex-1"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Démarrer l'audit
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedStandard("")}
          >
            Retour
          </Button>
        </div>
      </div>
    );
  }
  
  if (loadingQuestions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (questionsError) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{questionsError.message}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!questionsData || questionsData.questions.length === 0) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Aucune question disponible pour cette norme. Veuillez contacter le support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const progress = ((currentQuestionIndex + 1) / questionsData.questions.length) * 100;
  
  return (
    <div className="container max-w-5xl py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Audit ISO {selectedStandard}</h1>
            <p className="text-muted-foreground">
              Rôle : <Badge variant="outline">
                {selectedRole === 'fabricant' && 'Fabricant'}
                {selectedRole === 'importateur' && 'Importateur'}
                {selectedRole === 'distributeur' && 'Distributeur'}
              </Badge>
              {selectedProcesses.length > 0 && (
                <span className="ml-2">
                  Processus : <Badge variant="secondary">
                    {selectedProcesses.map((p: string) => {
                      const labels: Record<string, string> = {
                        'conception': 'Conception',
                        'fabrication': 'Fabrication',
                        'distribution': 'Distribution',
                        'stockage': 'Stockage',
                        'installation': 'Installation',
                        'maintenance': 'Maintenance',
                        'service_apres_vente': 'Service après-vente'
                      };
                      return labels[p] || p;
                    }).join(', ')}
                  </Badge>
                </span>
              )}
              {questionsData.excludedClauses.length > 0 && (
                <span className="ml-2">
                  Exclusions : <Badge variant="secondary">{questionsData.excludedClauses.join(", ")}</Badge>
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Question</div>
            <div className="text-2xl font-bold">
              {currentQuestionIndex + 1} / {questionsData.questions.length}
            </div>
            {isSaving && (
              <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Sauvegarde...
              </div>
            )}
            {!isSaving && lastSaved && (
              <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Sauvegardé {new Date(lastSaved).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
        
        <Progress value={progress} className="h-2" />
      </div>
      
      {/* Question Card */}
      <Card className={`mb-6 transition-opacity duration-300 ${
        isTransitioning ? "opacity-0" : "opacity-100"
      }`}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">
                {currentQuestion.questionText}
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                {currentQuestion.article && (
                  <Badge variant="outline">{currentQuestion.article}</Badge>
                )}
                {currentQuestion.annexe && (
                  <Badge variant="secondary">{currentQuestion.annexe}</Badge>
                )}
                <Badge className={CRITICALITY_COLORS[currentQuestion.criticality as keyof typeof CRITICALITY_COLORS]}>
                  {currentQuestion.criticality === "high" && "Élevée"}
                  {currentQuestion.criticality === "medium" && "Moyenne"}
                  {currentQuestion.criticality === "low" && "Faible"}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedStandard("");
                setCurrentQuestionIndex(0);
              }}
            >
              Changer de norme
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Risk warning */}
          {currentQuestion.risks && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <strong>⚠️ Risque si non-conforme :</strong>
                <p className="mt-1">{currentQuestion.risks}</p>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Compliance Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Statut de conformité *</Label>
              {showCheckmark && (
                <div className="flex items-center gap-2 text-green-600 animate-in fade-in duration-300">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Réponse enregistrée</span>
                </div>
              )}
            </div>
            <RadioGroup
              value={currentResponse?.responseValue || ""}
              onValueChange={(value) => handleResponseChange(currentQuestion.id, "responseValue", value)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COMPLIANCE_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-center space-x-2 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      currentResponse?.responseValue === option.value
                        ? option.color
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => handleResponseChange(currentQuestion.id, "responseValue", option.value)}
                  >
                    <RadioGroupItem value={option.value} id={`${currentQuestion.id}-${option.value}`} />
                    <Label htmlFor={`${currentQuestion.id}-${option.value}`} className="cursor-pointer flex-1">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
          
          {/* Comments */}
          <div className="space-y-3">
            <Label>Commentaires et preuves</Label>
            <Textarea
              placeholder="Décrivez les preuves de conformité, les documents associés, ou les actions correctives prévues..."
              value={currentResponse?.responseComment || ""}
              onChange={(e) => handleResponseChange(currentQuestion.id, "responseComment", e.target.value)}
              rows={4}
            />
          </div>
          
          {/* Expected Evidence */}
          {currentQuestion.expectedEvidence && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <strong className="text-blue-900">Preuves attendues :</strong>
                  <p className="text-sm text-blue-800 mt-1">{currentQuestion.expectedEvidence}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Guidance Notes */}
          {currentQuestion.guidanceNotes && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <strong className="text-gray-900">Notes d'orientation :</strong>
              <p className="text-sm text-gray-700 mt-1">{currentQuestion.guidanceNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Navigation */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          ← Précédent
        </Button>
        
        <Button
          onClick={() => handleSaveResponse(currentQuestion.id)}
          variant="outline"
          disabled={saveResponseMutation.isPending}
        >
          {saveResponseMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Sauvegarder
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={currentQuestionIndex === questionsData.questions.length - 1}
          className="ml-auto"
        >
          Suivant →
        </Button>
        
        {currentQuestionIndex === questionsData.questions.length - 1 && (
          <Button
            onClick={() => {
              toast.success("✅ Audit terminé", {
                description: "Toutes les questions ont été complétées",
              });
              setLocation("/audits");
            }}
            variant="default"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Terminer l'audit
          </Button>
        )}
      </div>
    </div>
  );
}
