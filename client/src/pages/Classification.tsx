import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Download, FileText, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportClassificationToExcel, exportClassificationToPDF } from "@/lib/exportUtils";
import { useAuth } from "@/_core/hooks/useAuth";
import { UpgradeRequired } from "@/components/UpgradeRequired";
import { getLoginUrl } from "@/const";

type WizardStep = 
  | "general"
  | "invasiveness"
  | "duration"
  | "anatomical_site"
  | "function_energy"
  | "sterility"
  | "special_cases"
  | "software"
  | "result";

interface ClassificationAnswers {
  // Informations générales
  device_name?: string;
  device_description?: string;
  device_type?: "dm" | "accessoire";
  is_active?: boolean;
  is_software?: boolean;
  
  // Invasivité
  invasiveness?: "non-invasif" | "invasif_orifice" | "chirurgical";
  implantable?: boolean;
  contact_nervous_system?: boolean;
  contact_circulatory_system?: boolean;
  
  // Durée
  duration?: "transitoire" | "court_terme" | "long_terme";
  
  // Site anatomique
  contact_site?: string[];
  wound_depth?: "superficielle" | "profonde";
  
  // Fonction/énergie
  function?: string[];
  danger_level?: "potentiellement_dangereux" | "normal";
  // Compléments nécessaires Annexe VIII
  modify_composition_simple?: boolean;
  disinfection_target?: "non_invasif" | "invasif" | "implantable";
  other_function_text?: string;
  
  // Stérilité/mesure
  provided_sterile?: boolean;
  has_measuring_function?: boolean;
  reusable_surgical?: boolean;
  
  // Cas spéciaux
  incorporates_drug?: boolean;
  incorporates_blood_derivative?: boolean;
  contains_absorbable_substance?: boolean;
  contains_nanomaterials?: boolean;
  high_internal_exposure?: boolean;
  contains_animal_tissue?: boolean;
  biological_effect?: boolean;
  
  // Logiciel
  software_purpose?: string[];
}

function uniq<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }

function normalizeClassificationResult(raw: any) {
  // tRPC client usually unwraps to the procedure output.
  // However, network previews often show { result: { data: ... } }.
  const unwrapped =
    raw?.result?.data ??
    raw?.data ??
    raw;

  if (!unwrapped || typeof unwrapped !== "object") return unwrapped;

  return {
    ...unwrapped,
    appliedRules: Array.isArray((unwrapped as any).appliedRules) ? (unwrapped as any).appliedRules : [],
    recommendations: Array.isArray((unwrapped as any).recommendations) ? (unwrapped as any).recommendations : [],
    missingData: Array.isArray((unwrapped as any).missingData) ? (unwrapped as any).missingData : [],
  };
}

export default function Classification() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  
  const [currentStep, setCurrentStep] = useState<WizardStep>("general");
  const [answers, setAnswers] = useState<ClassificationAnswers>({});
  const [classificationResult, setClassificationResult] = useState<any>(null);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  // ✅ Hooks must be called unconditionally. Keep mutations above any early returns.
  const classifyMutation = trpc.classification.classify.useMutation({
    onSuccess: (result) => {
      setClassificationResult(normalizeClassificationResult(result));
      setCurrentStep("result");
      toast.success(t("classification.successMessage", "Classification effectuée avec succès !"));
    },
    onError: (error) => {
      toast.error(t("classification.errorMessage", "Erreur : {{message}}", { message: error.message }));
    },
  });

  // ✅ Avoid side-effects inside render
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check subscription tier
  const tier = profile?.subscriptionTier?.toUpperCase();
  if (tier === "FREE") {
    return <UpgradeRequired feature="la classification MDR" />;
  }

  const steps: { id: WizardStep; title: string; description: string }[] = [
    { id: "general", title: t('classification.steps.general', 'Informations générales'), description: t('classification.steps.generalDesc', 'Type de dispositif') },
    { id: "invasiveness", title: t('classification.steps.invasiveness', 'Invasivité'), description: t('classification.steps.invasivenessDesc', 'Contact avec le corps') },
    { id: "duration", title: t('classification.steps.duration', 'Durée d\'utilisation'), description: t('classification.steps.durationDesc', 'Temps de contact') },
    { id: "anatomical_site", title: t('classification.steps.anatomicalSite', 'Site anatomique'), description: t('classification.steps.anatomicalSiteDesc', 'Partie du corps') },
    { id: "function_energy", title: t('classification.steps.functionEnergy', 'Fonction & Énergie'), description: t('classification.steps.functionEnergyDesc', 'Usage et énergie') },
    { id: "sterility", title: t('classification.steps.sterility', 'Stérilité & Mesure'), description: t('classification.steps.sterilityDesc', 'Caractéristiques spéciales') },
    { id: "special_cases", title: t('classification.steps.specialCases', 'Cas spéciaux'), description: t('classification.steps.specialCasesDesc', 'Substances et matériaux') },
    { id: "software", title: t('classification.steps.software', 'Logiciel'), description: t('classification.steps.softwareDesc', 'Si applicable') },
    { id: "result", title: t('classification.steps.result', 'Résultat'), description: t('classification.steps.resultDesc', 'Classification finale') }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const updateAnswer = (key: keyof ClassificationAnswers, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayValue = (key: keyof ClassificationAnswers, value: string) => {
    setAnswers(prev => {
      const currentArray = (prev[key] as string[]) || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value];
      return { ...prev, [key]: newArray };
    });
  };

  // ✅ Validation "Annexe VIII-ready" (bloquant)
  const getStepErrors = (step: WizardStep, a: ClassificationAnswers): string[] => {
    const errs: string[] = [];

    const requireBool = (label: string, v: boolean | undefined) => {
      if (v === undefined) errs.push(label);
    };

    const requireNonEmptyArray = (label: string, v: string[] | undefined) => {
      if (!v || v.length === 0) errs.push(label);
    };

    switch (step) {
      case "general":
        if (!a.device_type) errs.push("Type de dispositif (DM / accessoire)");
        requireBool("Dispositif actif (Oui/Non)", a.is_active);
        requireBool("Logiciel (Oui/Non)", a.is_software);
        break;

      case "invasiveness":
        if (!a.invasiveness) errs.push("Niveau d’invasivité");
        if (a.invasiveness && a.invasiveness !== "non-invasif") {
          requireBool("Implantable (Oui/Non)", a.implantable);
          requireBool("Contact système nerveux central (Oui/Non)", a.contact_nervous_system);
          requireBool("Contact système circulatoire central (Oui/Non)", a.contact_circulatory_system);
        }
        break;

      case "duration":
        if (!a.duration) errs.push("Durée de contact (transitoire / court terme / long terme)");
        break;

      case "anatomical_site":
        requireNonEmptyArray("Site(s) anatomique(s) de contact", a.contact_site);
        if (a.contact_site?.includes("peau_lesee") && !a.wound_depth) {
          errs.push("Profondeur de la plaie (superficielle / profonde)");
        }
        break;

      case "function_energy":
        requireNonEmptyArray("Fonction(s) du dispositif (au moins 1)", a.function);

        // Danger level requis pour règles sur dispositifs actifs / énergie / monitoring critique / radiations
        if (
          a.function?.includes("administrer_energie") ||
          a.function?.includes("diagnostic_monitoring") ||
          a.function?.includes("monitoring_vital") ||
          a.function?.includes("radiations_ionisantes") ||
          a.function?.includes("administrer_medicament")
        ) {
          if (!a.danger_level) errs.push("Danger potentiel (normal / potentiellement dangereux)");
        }

        // Exception Annexe VIII : modification par filtration/centrifugation/échanges de gaz/chaleur
        if (a.function?.includes("modifier_composition") && typeof a.modify_composition_simple !== "boolean") {
          errs.push("Type de modification (filtration/centrifugation/échanges gaz/chaleur : Oui/Non)");
        }

        // Désinfection / stérilisation : cible nécessaire (non invasif / invasif / implantable)
        if (a.function?.includes("sterilisation_dm") && !a.disinfection_target) {
          errs.push("Type de dispositif ciblé par la désinfection/stérilisation");
        }

        // Autre fonction : texte obligatoire
        if (a.function?.includes("autre")) {
          const t = (a.other_function_text ?? "").trim();
          if (!t) errs.push("Description de la fonction (autre) - texte requis");
        }
        break;

      case "sterility":
        requireBool("Fourni stérile (Oui/Non)", a.provided_sterile);
        requireBool("Fonction de mesure (Oui/Non)", a.has_measuring_function);
        requireBool("Instrument chirurgical réutilisable (Oui/Non)", a.reusable_surgical);
        break;

      case "special_cases":
        // Si nanomatériaux → exposition interne doit être renseignée
        if (a.contains_nanomaterials) requireBool("Exposition interne élevée (Oui/Non)", a.high_internal_exposure);
        break;

      case "software":
        // Ce step n’est obligatoire que si is_software = true
        if (a.is_software) {
          requireNonEmptyArray("Finalité du logiciel (au moins 1)", a.software_purpose);
          if (!a.danger_level) errs.push("Impact clinique du logiciel (normal / potentiellement dangereux)");
        }
        break;

      case "result":
        break;
    }

    return errs;
  };

  const showStepErrors = (errs: string[]) => {
    toast.error("Champs obligatoires manquants", {
      description: errs.map((e) => `• ${e}`).join("\n"),
    });
  };


  const goToNextStep = () => {
    const errs = getStepErrors(currentStep, answers);
    if (errs.length) {
      showStepErrors(errs);
      return;
    }

    if (currentStepIndex < steps.length - 2) {
      // Skip software step if not applicable
      const next = steps[currentStepIndex + 1].id;
      if (next === "software" && !answers.is_software) {
        setCurrentStep("result");
        // Submit immediately (all previous steps validated)
        classifyMutation.mutate({
          ...answers,
          software_purpose: answers.software_purpose ?? [],
        });
        return;
      }
      setCurrentStep(next);
    } else {
      // Soumettre la classification (validation globale avant envoi)
      const globalMissing: string[] = [];
      for (const s of steps.map((x) => x.id)) {
        globalMissing.push(...getStepErrors(s, answers));
      }
      if (globalMissing.length) {
        showStepErrors(uniq(globalMissing));
        return;
      }
      classifyMutation.mutate({
        ...answers,
        software_purpose: answers.software_purpose ?? [],
      });
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };
  
  const handleExportExcel = async () => {
    if (!classificationResult) {
      toast.error("Aucun résultat de classification disponible");
      return;
    }
    
    setExportingExcel(true);
    try {
      await exportClassificationToExcel(
        answers.device_name || "Dispositif",
        classificationResult.resultingClass,
        classificationResult.appliedRules || [],
        classificationResult.justification
      );
      toast.success("✅ Export Excel téléchargé avec succès !");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("❌ Erreur lors de l'export Excel");
    } finally {
      setExportingExcel(false);
    }
  };
  
  const handleExportPDF = () => {
    if (!classificationResult) {
      toast.error("Aucun résultat de classification disponible");
      return;
    }
    
    setExportingPDF(true);
    try {
      exportClassificationToPDF(
        answers.device_name || "Dispositif",
        classificationResult.resultingClass,
        classificationResult.appliedRules || [],
        classificationResult.justification
      );
      toast.success("✅ Export PDF téléchargé avec succès !");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("❌ Erreur lors de l'export PDF");
    } finally {
      setExportingPDF(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case "general":
        return Boolean(answers.device_type) && answers.is_active !== undefined && answers.is_software !== undefined;
      case "invasiveness":
        if (answers.invasiveness === undefined) return false;
        if (answers.invasiveness !== "non-invasif") {
          return (
            answers.implantable !== undefined &&
            answers.contact_nervous_system !== undefined &&
            answers.contact_circulatory_system !== undefined
          );
        }
        return true;
      case "duration":
        // ✅ Durée = critère clé Annexe VIII. On la rend obligatoire pour une classification fiable.
        return answers.duration !== undefined;
      case "anatomical_site": {
        const sitesOk = Array.isArray(answers.contact_site) && answers.contact_site.length > 0;
        if (!sitesOk) return false;
        if (answers.contact_site?.includes("peau_lesee")) {
          return answers.wound_depth !== undefined;
        }
        return true;
      }
      case "function_energy": {
        const funcsOk = Array.isArray(answers.function) && answers.function.length > 0;
        if (!funcsOk) return false;
        const needsDanger =
          answers.function?.includes("administrer_energie") ||
          answers.function?.includes("administrer_medicament") ||
          answers.is_software === true;
        if (needsDanger && !answers.danger_level) return false;
        return true;
      }
      case "sterility":
        return (
          answers.provided_sterile !== undefined &&
          answers.has_measuring_function !== undefined &&
          answers.reusable_surgical !== undefined
        );
      case "software":
        return !answers.is_software || (Array.isArray(answers.software_purpose) && answers.software_purpose.length > 0 && !!answers.danger_level);
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {t('classification.title', 'Classification de Dispositif Médical')}
          </h1>
          <p className="text-slate-600">
            {t('classification.subtitle', 'Annexe VIII - Règlement (UE) 2017/745 (MDR)')}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              {t('classification.stepOf', 'Étape {{current}} sur {{total}}', { current: currentStepIndex + 1, total: steps.length })}
            </span>
            <span className="text-sm text-slate-600">
              {t('classification.percentComplete', '{{percent}}% complété', { percent: Math.round(progress) })}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{steps[currentStepIndex].title}</CardTitle>
            <CardDescription>{steps[currentStepIndex].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step: General */}
            {currentStep === "general" && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    {t('classification.deviceName', 'Nom du dispositif médical')}
                  </Label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-md"
                    placeholder={t('classification.deviceNamePlaceholder', 'Ex: Cathéter veineux central')}
                    value={answers.device_name || ""}
                    onChange={(e) => updateAnswer("device_name", e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    {t('classification.description', 'Description')} ({t('common.optional', 'optionnelle')})
                  </Label>
                  <textarea
                    className="w-full px-4 py-2 border rounded-md"
                    rows={3}
                    placeholder={t('classification.descriptionPlaceholder', 'Brève description du dispositif et de son usage')}
                    value={answers.device_description || ""}
                    onChange={(e) => updateAnswer("device_description", e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    {t('classification.deviceType', 'Type de dispositif')} *
                  </Label>
                  <RadioGroup
                    value={answers.device_type}
                    onValueChange={(value) => updateAnswer("device_type", value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dm" id="dm" />
                      <Label htmlFor="dm" className="cursor-pointer">
                        {t('classification.medicalDevice', 'Dispositif médical')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="accessoire" id="accessoire" />
                      <Label htmlFor="accessoire" className="cursor-pointer">
                        {t('classification.accessory', 'Accessoire de dispositif médical')}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    {t('classification.isActive', 'Est-ce un dispositif actif ?')} *
                  </Label>
                  <p className="text-sm text-slate-600 mb-3">
                    <Info className="inline w-4 h-4 mr-1" />
                    {t('classification.isActiveHint', 'Un dispositif actif fonctionne grâce à une source d\'\u00e9nergie (électrique, pneumatique, etc.)')}
                  </p>
                  <RadioGroup
                    value={answers.is_active?.toString()}
                    onValueChange={(value) => updateAnswer("is_active", value === "true")}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="active-yes" />
                      <Label htmlFor="active-yes" className="cursor-pointer">{t('common.yes', 'Oui')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="active-no" />
                      <Label htmlFor="active-no" className="cursor-pointer">{t('common.no', 'Non')}</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    {t('classification.isSoftware', 'Est-ce un logiciel médical ?')}
                  </Label>
                  <RadioGroup
                    value={answers.is_software?.toString()}
                    onValueChange={(value) => updateAnswer("is_software", value === "true")}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="software-yes" />
                      <Label htmlFor="software-yes" className="cursor-pointer">{t('common.yes', 'Oui')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="software-no" />
                      <Label htmlFor="software-no" className="cursor-pointer">{t('common.no', 'Non')}</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step: Invasiveness */}
            {currentStep === "invasiveness" && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    {t('classification.invasivenessLevel', 'Niveau d\'invasivité')} *
                  </Label>
                  <RadioGroup
                    value={answers.invasiveness}
                    onValueChange={(value) => updateAnswer("invasiveness", value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="non-invasif" id="non-invasif" />
                      <Label htmlFor="non-invasif" className="cursor-pointer">
                        {t('classification.nonInvasive', 'Non invasif (pas de pénétration du corps)')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="invasif_orifice" id="invasif_orifice" />
                      <Label htmlFor="invasif_orifice" className="cursor-pointer">
                        {t('classification.invasiveOrifice', 'Invasif par un orifice corporel')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="chirurgical" id="chirurgical" />
                      <Label htmlFor="chirurgical" className="cursor-pointer">
                        {t('classification.surgicallyInvasive', 'Chirurgicalement invasif (pénètre le corps par incision)')}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {answers.invasiveness !== "non-invasif" && (
                  <>
                    <div>
                      <Label className="text-base font-semibold mb-3 block">
                        {t('classification.isImplantable', 'Le dispositif est-il implantable ?')}
                      </Label>
                      <p className="text-sm text-slate-600 mb-3">
                        <Info className="inline w-4 h-4 mr-1" />
                        {t('classification.isImplantableHint', 'Un dispositif implantable reste dans le corps pendant au moins 30 jours')}
                      </p>
                      <RadioGroup
                        value={answers.implantable?.toString()}
                        onValueChange={(value) => updateAnswer("implantable", value === "true")}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="implantable-yes" />
                          <Label htmlFor="implantable-yes" className="cursor-pointer">{t('common.yes', 'Oui')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="implantable-no" />
                          <Label htmlFor="implantable-no" className="cursor-pointer">{t('common.no', 'Non')}</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label className="text-base font-semibold mb-3 block">
                        {t('classification.contactNervousSystem', 'Le dispositif est-il en contact avec le système nerveux central ?')}
                      </Label>
                      <RadioGroup
                        value={answers.contact_nervous_system?.toString()}
                        onValueChange={(value) => updateAnswer("contact_nervous_system", value === "true")}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="nervous-yes" />
                          <Label htmlFor="nervous-yes" className="cursor-pointer">{t('common.yes', 'Oui')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="nervous-no" />
                          <Label htmlFor="nervous-no" className="cursor-pointer">{t('common.no', 'Non')}</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label className="text-base font-semibold mb-3 block">
                        {t('classification.contactCirculatorySystem', 'Le dispositif est-il en contact avec le système circulatoire central ?')}
                      </Label>
                      <p className="text-sm text-slate-600 mb-3">
                        <Info className="inline w-4 h-4 mr-1" />
                        {t('classification.contactCirculatorySystemHint', 'Cœur, artères pulmonaires, aorte, artères coronaires, carotides, etc.')}
                      </p>
                      <RadioGroup
                        value={answers.contact_circulatory_system?.toString()}
                        onValueChange={(value) => updateAnswer("contact_circulatory_system", value === "true")}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="circulatory-yes" />
                          <Label htmlFor="circulatory-yes" className="cursor-pointer">{t('common.yes', 'Oui')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="circulatory-no" />
                          <Label htmlFor="circulatory-no" className="cursor-pointer">{t('common.no', 'Non')}</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step: Duration */}
{currentStep === "duration" && (
  <div className="space-y-6">
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        La durée d’utilisation est un critère clé de l’Annexe VIII. Même pour les DM non invasifs, elle améliore la précision de la classification.
      </AlertDescription>
    </Alert>

    <div>
      <Label className="text-base font-semibold mb-3 block">
        {t('classification.durationOfUse', "Durée d'utilisation")} *
      </Label>
      <RadioGroup
        value={answers.duration}
        onValueChange={(value) => updateAnswer("duration", value)}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="transitoire" id="transitoire" />
          <Label htmlFor="transitoire" className="cursor-pointer">
            {t('classification.transient', 'Transitoire (≤ 60 minutes)')}
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="court_terme" id="court_terme" />
          <Label htmlFor="court_terme" className="cursor-pointer">
            {t('classification.shortTerm', 'Court terme (> 60 min à ≤ 30 jours)')}
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="long_terme" id="long_terme" />
          <Label htmlFor="long_terme" className="cursor-pointer">
            {t('classification.longTerm', 'Long terme (> 30 jours)')}
          </Label>
        </div>
      </RadioGroup>
    </div>
  </div>
)}


            {/* Step: Anatomical Site */}
            {currentStep === "anatomical_site" && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Site(s) anatomique(s) de contact (sélection multiple)
                  </Label>
                  <div className="space-y-2">
                    {[
                      { value: "peau_intacte", label: "Peau intacte" },
                      { value: "peau_lesee", label: "Peau lésée" },
                      { value: "muqueuse", label: "Muqueuse" },
                      { value: "sang", label: "Sang" },
                      { value: "organes", label: "Organes internes" },
                      { value: "os", label: "Os" },
                      { value: "dent", label: "Dent/Tissu dentaire" },
                      { value: "oeil", label: "Œil" },
                      { value: "systeme_circulatoire_central", label: "Système circulatoire central" },
                      { value: "systeme_nerveux_central", label: "Système nerveux central" }
                    ].map(site => (
                      <div key={site.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={site.value}
                          checked={answers.contact_site?.includes(site.value)}
                          onCheckedChange={() => toggleArrayValue("contact_site", site.value)}
                        />
                        <Label htmlFor={site.value} className="cursor-pointer">
                          {site.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {answers.contact_site?.includes("peau_lesee") && (
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Profondeur de la plaie
                    </Label>
                    <RadioGroup
                      value={answers.wound_depth}
                      onValueChange={(value) => updateAnswer("wound_depth", value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="superficielle" id="superficielle" />
                        <Label htmlFor="superficielle" className="cursor-pointer">
                          Superficielle (épiderme uniquement)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="profonde" id="profonde" />
                        <Label htmlFor="profonde" className="cursor-pointer">
                          Profonde (derme pénétré, cicatrisation par seconde intention)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </div>
            )}

            {/* Step: Function & Energy */}
            {currentStep === "function_energy" && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    Finalité / fonction(s) principale(s) du dispositif (sélection multiple)
                  </Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sélectionnez toutes les fonctions qui correspondent à l&apos;intention d&apos;usage revendiquée.
                    Certaines réponses déclenchent des questions complémentaires nécessaires pour appliquer les règles de l&apos;Annexe VIII (MDR 2017/745).
                  </p>

                  <div className="space-y-5">
                    {/* Groupe 1: Dispositifs non actifs – support / barrière */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">Non actif – support / protection / compression</div>
                      {[
                        { value: "support_compression_orthese", label: "Support, compression, immobilisation, orthèse, bas de contention, bandage de maintien" },
                        { value: "barriere_mecanique", label: "Barrière mécanique / protection (ex. pansement barrière, écran, protection cutanée)" },
                      ].map(func => (
                        <div key={func.value} className="flex items-start space-x-2">
                          <Checkbox
                            id={func.value}
                            checked={answers.function?.includes(func.value)}
                            onCheckedChange={() => toggleArrayValue("function", func.value)}
                          />
                          <Label htmlFor={func.value} className="cursor-pointer leading-snug">
                            {func.label}
                          </Label>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Groupe 2: Gestion de liquides / tissus (non invasif) */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">Gestion de sang / liquides corporels / tissus (non invasif)</div>
                      {[
                        { value: "canaliser_stocker_sang", label: "Canaliser ou stocker du sang, liquides corporels, tissus ou cellules" },
                        { value: "modifier_composition", label: "Modifier la composition biologique/chimique (ex. dialyse, adsorption, échanges ioniques, purification)" },
                      ].map(func => (
                        <div key={func.value} className="flex items-start space-x-2">
                          <Checkbox
                            id={func.value}
                            checked={answers.function?.includes(func.value)}
                            onCheckedChange={() => toggleArrayValue("function", func.value)}
                          />
                          <Label htmlFor={func.value} className="cursor-pointer leading-snug">
                            {func.label}
                          </Label>
                        </div>
                      ))}

                      {/* Sous-question: exception règle 3 (filtration/centrifugation...) */}
                      {answers.function?.includes("modifier_composition") && (
                        <div className="ml-6 mt-2 space-y-2">
                          <Label className="text-sm font-medium block">
                            La modification est-elle réalisée uniquement par filtration/centrifugation/échanges de gaz ou de chaleur (sans ajout de substances) ?
                          </Label>
                          <RadioGroup
                            value={answers.modify_composition_simple ? "yes" : answers.modify_composition_simple === false ? "no" : ""}
                            onValueChange={(v) => updateAnswer("modify_composition_simple", v === "yes")}
                            className="space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="mcs_yes" />
                              <Label htmlFor="mcs_yes">Oui</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="mcs_no" />
                              <Label htmlFor="mcs_no">Non</Label>
                            </div>
                          </RadioGroup>
                          <p className="text-xs text-muted-foreground">
                            Nécessaire pour distinguer la classe IIa vs IIb selon l&apos;Annexe VIII (règle sur la modification de composition).
                          </p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Groupe 3: Dispositifs actifs – thérapeutiques / diagnostiques */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">Dispositif actif – énergie / diagnostic / monitoring</div>
                      {[
                        { value: "administrer_energie", label: "Administrer ou échanger de l'énergie (ex. chaleur, froid, ultrasons, RF, laser, stimulation électrique, ventilation, perfusion motorisée…)" },
                        { value: "diagnostic_monitoring", label: "Diagnostic ou monitoring (mesure/surveillance d'un paramètre physiologique)" },
                        { value: "monitoring_vital", label: "Monitoring de paramètres vitaux dont les variations peuvent entraîner un danger immédiat" },
                        { value: "radiations_ionisantes", label: "Émettre des radiations ionisantes (imagerie / radiothérapie / CT, etc.)" },
                      ].map(func => (
                        <div key={func.value} className="flex items-start space-x-2">
                          <Checkbox
                            id={func.value}
                            checked={answers.function?.includes(func.value)}
                            onCheckedChange={() => toggleArrayValue("function", func.value)}
                          />
                          <Label htmlFor={func.value} className="cursor-pointer leading-snug">
                            {func.label}
                          </Label>
                        </div>
                      ))}

                      {(answers.function?.includes("administrer_energie") ||
                        answers.function?.includes("diagnostic_monitoring") ||
                        answers.function?.includes("monitoring_vital") ||
                        answers.function?.includes("radiations_ionisantes")) && (
                        <div className="ml-6 mt-2 space-y-2">
                          <Label className="text-sm font-medium block">
                            Le fonctionnement peut-il présenter un danger potentiel pour le patient (énergie/pilotage/monitoring critique) ?
                          </Label>
                          <RadioGroup
                            value={answers.danger_level ?? ""}
                            onValueChange={(v) => updateAnswer("danger_level", v)}
                            className="space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="normal" id="dl_normal" />
                              <Label htmlFor="dl_normal">Normal</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="potentiellement_dangereux" id="dl_danger" />
                              <Label htmlFor="dl_danger">Potentiellement dangereux</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Groupe 4: Substances / stérilisation / contraception */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">Autres finalités pertinentes pour la classification</div>
                      {[
                        { value: "administrer_medicament", label: "Administrer, retirer ou contrôler l'administration de médicaments/substances/fluids (ex. pompe, perfuseur, injecteur)" },
                        { value: "contraception", label: "Contraception ou prévention des IST" },
                        { value: "sterilisation_dm", label: "Désinfection, nettoyage, rinçage ou stérilisation d'autres dispositifs médicaux" },
                      ].map(func => (
                        <div key={func.value} className="flex items-start space-x-2">
                          <Checkbox
                            id={func.value}
                            checked={answers.function?.includes(func.value)}
                            onCheckedChange={() => toggleArrayValue("function", func.value)}
                          />
                          <Label htmlFor={func.value} className="cursor-pointer leading-snug">
                            {func.label}
                          </Label>
                        </div>
                      ))}

                      {answers.function?.includes("sterilisation_dm") && (
                        <div className="ml-6 mt-2 space-y-2">
                          <Label className="text-sm font-medium block">
                            Type de dispositif ciblé par la désinfection/stérilisation
                          </Label>
                          <RadioGroup
                            value={answers.disinfection_target ?? ""}
                            onValueChange={(v) => updateAnswer("disinfection_target", v)}
                            className="space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="non_invasif" id="dt_non" />
                              <Label htmlFor="dt_non">Dispositifs non invasifs</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="invasif" id="dt_inv" />
                              <Label htmlFor="dt_inv">Dispositifs invasifs / instruments chirurgicaux</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="implantable" id="dt_impl" />
                              <Label htmlFor="dt_impl">Dispositifs implantables</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Groupe 5: Autre */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">Autre (si aucune option ne correspond)</div>
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="autre_fonction"
                          checked={answers.function?.includes("autre")}
                          onCheckedChange={() => toggleArrayValue("function", "autre")}
                        />
                        <Label htmlFor="autre_fonction" className="cursor-pointer leading-snug">
                          Autre fonction à préciser
                        </Label>
                      </div>
                      {answers.function?.includes("autre") && (
                        <div className="ml-6">
                          <Textarea
                            value={answers.other_function_text ?? ""}
                            onChange={(e) => updateAnswer("other_function_text", e.target.value)}
                            placeholder="Décrivez brièvement la fonction/intention d'usage (1–3 phrases)"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
{/* Step: Sterility */}
            {currentStep === "sterility" && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Le dispositif est-il fourni stérile ?
                  </Label>
                  <RadioGroup
                    value={answers.provided_sterile?.toString()}
                    onValueChange={(value) => updateAnswer("provided_sterile", value === "true")}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="sterile-yes" />
                      <Label htmlFor="sterile-yes" className="cursor-pointer">Oui</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="sterile-no" />
                      <Label htmlFor="sterile-no" className="cursor-pointer">Non</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Le dispositif a-t-il une fonction de mesure ?
                  </Label>
                  <p className="text-sm text-slate-600 mb-3">
                    <Info className="inline w-4 h-4 mr-1" />
                    Ex: thermomètre, tensiomètre, glucomètre, etc.
                  </p>
                  <RadioGroup
                    value={answers.has_measuring_function?.toString()}
                    onValueChange={(value) => updateAnswer("has_measuring_function", value === "true")}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="measuring-yes" />
                      <Label htmlFor="measuring-yes" className="cursor-pointer">Oui</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="measuring-no" />
                      <Label htmlFor="measuring-no" className="cursor-pointer">Non</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Est-ce un instrument chirurgical réutilisable ?
                  </Label>
                  <RadioGroup
                    value={answers.reusable_surgical?.toString()}
                    onValueChange={(value) => updateAnswer("reusable_surgical", value === "true")}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="reusable-yes" />
                      <Label htmlFor="reusable-yes" className="cursor-pointer">Oui</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="reusable-no" />
                      <Label htmlFor="reusable-no" className="cursor-pointer">Non</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step: Special Cases */}
            {currentStep === "special_cases" && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Substances et matériaux spéciaux
                  </Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="incorporates_drug"
                        checked={answers.incorporates_drug}
                        onCheckedChange={(checked) => updateAnswer("incorporates_drug", checked)}
                      />
                      <Label htmlFor="incorporates_drug" className="cursor-pointer">
                        Incorpore une substance médicamenteuse
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="incorporates_blood_derivative"
                        checked={answers.incorporates_blood_derivative}
                        onCheckedChange={(checked) => updateAnswer("incorporates_blood_derivative", checked)}
                      />
                      <Label htmlFor="incorporates_blood_derivative" className="cursor-pointer">
                        Incorpore un dérivé de sang ou plasma humain
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="contains_absorbable_substance"
                        checked={answers.contains_absorbable_substance}
                        onCheckedChange={(checked) => updateAnswer("contains_absorbable_substance", checked)}
                      />
                      <Label htmlFor="contains_absorbable_substance" className="cursor-pointer">
                        Contient une substance absorbable/résorbable
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="contains_nanomaterials"
                        checked={answers.contains_nanomaterials}
                        onCheckedChange={(checked) => updateAnswer("contains_nanomaterials", checked)}
                      />
                      <Label htmlFor="contains_nanomaterials" className="cursor-pointer">
                        Contient des nanomatériaux
                      </Label>
                    </div>

                    {answers.contains_nanomaterials && (
                      <div className="ml-6">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="high_internal_exposure"
                            checked={answers.high_internal_exposure}
                            onCheckedChange={(checked) => updateAnswer("high_internal_exposure", checked)}
                          />
                          <Label htmlFor="high_internal_exposure" className="cursor-pointer">
                            Exposition interne élevée aux nanomatériaux
                          </Label>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="contains_animal_tissue"
                        checked={answers.contains_animal_tissue}
                        onCheckedChange={(checked) => updateAnswer("contains_animal_tissue", checked)}
                      />
                      <Label htmlFor="contains_animal_tissue" className="cursor-pointer">
                        Incorpore des tissus/cellules d'origine animale
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="biological_effect"
                        checked={answers.biological_effect}
                        onCheckedChange={(checked) => updateAnswer("biological_effect", checked)}
                      />
                      <Label htmlFor="biological_effect" className="cursor-pointer">
                        A un effet biologique ou est absorbé/métabolisé
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Software */}
            {currentStep === "software" && (
              <div className="space-y-6">
                {answers.is_software ? (
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Usage du logiciel (sélection multiple)
                    </Label>
                    <div className="space-y-2">
                      {[
                        { value: "decision_support", label: "Fournit des informations pour support décision (diagnostic/thérapeutique)" },
                        { value: "critical_decision", label: "Décisions ayant impact sur diagnostic/monitoring/traitement" },
                        { value: "life_threatening", label: "Décisions pouvant causer décès ou détérioration grave" }
                      ].map(purpose => (
                        <div key={purpose.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={purpose.value}
                            checked={answers.software_purpose?.includes(purpose.value)}
                            onCheckedChange={() => toggleArrayValue("software_purpose", purpose.value)}
                          />
                          <Label htmlFor={purpose.value} className="cursor-pointer">
                            {purpose.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Cette section ne s'applique que si le dispositif est un logiciel médical.
                      Passez à l'étape suivante.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Step: Result */}
            {currentStep === "result" && classificationResult && (
              <div className="space-y-6">
                {/* Classe finale */}
                <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('classification.deviceClass', 'Classe du dispositif')}</h2>
                  <div className="text-6xl font-bold text-blue-600 mb-4">
                    {classificationResult.resultingClass}
                  </div>
                  <Badge variant={classificationResult.confidence === "high" ? "default" : "secondary"}>
                    {t('classification.confidence', 'Confiance')} : {classificationResult.confidence === "high" ? t('classification.confidenceHigh', 'Élevée') : classificationResult.confidence === "medium" ? t('classification.confidenceMedium', 'Moyenne') : t('classification.confidenceLow', 'Faible')}
                  </Badge>
                  
                  {/* Boutons d'export */}
                  <div className="flex gap-3 justify-center mt-6">
                    <Button
                      variant="outline"
                      onClick={handleExportExcel}
                      disabled={exportingExcel}
                    >
                      {exportingExcel ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="mr-2 h-4 w-4" />
                      )}
                      {t('classification.exportExcel', 'Exporter Excel')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleExportPDF}
                      disabled={exportingPDF}
                    >
                      {exportingPDF ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="mr-2 h-4 w-4" />
                      )}
                      {t('classification.exportPDF', 'Exporter PDF')}
                    </Button>
                  </div>
                </div>

                {/* Règles appliquées */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">{t('classification.appliedRules', 'Règles appliquées')}</h3>
                  <div className="space-y-2">
                    {(classificationResult.appliedRules ?? []).map((rule: any) => (
                      <Card key={rule.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                              <p className="font-semibold">{t('classification.rule', 'Règle')} {rule.number} : {rule.title}</p>
                              <p className="text-sm text-slate-600 mt-1">{rule.rationale}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Justification */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">{t('classification.detailedJustification', 'Justification détaillée')}</h3>
                  <Card>
                    <CardContent className="pt-4">
                      <pre className="whitespace-pre-wrap text-sm text-slate-700">
                        {classificationResult.justification}
                      </pre>
                    </CardContent>
                  </Card>
                </div>

                {/* Recommandations */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">{t('classification.recommendations', 'Recommandations next-step')}</h3>
                  <div className="space-y-2">
                    {(classificationResult.recommendations ?? []).map((rec: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-slate-50 rounded-md">
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Données manquantes */}
                {(classificationResult.missingData ?? []).length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-semibold mb-2">{t('classification.missingData', 'Données manquantes')} :</p>
                      <ul className="list-disc list-inside space-y-1">
                        {(classificationResult.missingData ?? []).map((data: string, index: number) => (
                          <li key={index} className="text-sm">{data}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    {t('classification.exportPDF', 'Exporter PDF')}
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <FileText className="w-4 h-4 mr-2" />
                    {t('classification.exportExcel', 'Exporter Excel')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        {currentStep !== "result" && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {t('common.previous', 'Précédent')}
            </Button>
            <Button
              onClick={goToNextStep}
              disabled={!canProceed() || classifyMutation.isPending}
            >
              {currentStepIndex === steps.length - 2 ? t('classification.classify', 'Classifier') : t('common.next', 'Suivant')}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {currentStep === "result" && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentStep("general");
                setAnswers({});
                setClassificationResult(null);
              }}
            >
              {t('classification.newClassification', 'Nouvelle classification')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
