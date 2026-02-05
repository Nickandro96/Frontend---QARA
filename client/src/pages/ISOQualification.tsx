/**
 * ISO Qualification Page
 * Determines user's ISO certification targets (9001/13485)
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Award, Building2, FileText } from "lucide-react";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const ISO_STANDARDS = [
  {
    code: "9001",
    name: "ISO 9001:2015",
    description: "Systèmes de management de la qualité - Exigences générales",
    color: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    code: "13485",
    name: "ISO 13485:2016",
    description: "Dispositifs médicaux - Systèmes de management de la qualité",
    color: "bg-purple-100 text-purple-800 border-purple-300",
  },
];

const ORGANIZATION_TYPES = [
  { value: "manufacturer", label: "Fabricant", description: "Conception et/ou fabrication de produits" },
  { value: "service_provider", label: "Prestataire de services", description: "Fourniture de services uniquement" },
  { value: "both", label: "Les deux", description: "Fabrication et services" },
];

const COMMON_EXCLUDED_CLAUSES = [
  { value: "7.3", label: "7.3 - Conception et développement", description: "Pas d'activité de conception" },
  { value: "8.3", label: "8.3 - Conception et développement (ISO 9001)", description: "Pas d'activité de conception" },
];

export default function ISOQualification() {
  const [, setLocation] = useLocation();
  // Using sonner toast
  
  const [targetStandards, setTargetStandards] = useState<string[]>([]);
  const [organizationType, setOrganizationType] = useState<string>("manufacturer");
  const [economicRole, setEconomicRole] = useState<string>("");
  const [processes, setProcesses] = useState<string[]>([]);
  const [certificationScope, setCertificationScope] = useState("");
  const [excludedClauses, setExcludedClauses] = useState<string[]>([]);
  
  // Get existing qualification
  const { data: existingQualification, isLoading: loadingQualification } = trpc.iso.getQualification.useQuery({});
  
  // Load existing data if available
  useEffect(() => {
    if (existingQualification) {
      setTargetStandards(existingQualification.targetStandards || []);
      setOrganizationType(existingQualification.organizationType);
      setEconomicRole(existingQualification.economicRole || "");
      setProcesses(existingQualification.processes || []);
      setCertificationScope(existingQualification.certificationScope || "");
      setExcludedClauses(existingQualification.excludedClauses || []);
    }
  }, [existingQualification]);
  
  const saveQualificationMutation = trpc.iso.saveQualification.useMutation({
    onSuccess: (data) => {
      toast.success("✅ Qualification ISO enregistrée", {
        description: data.message,
      });
      // Redirect to audit page
      setTimeout(() => setLocation("/iso/audit"), 1000);
    },
    onError: (error) => {
      toast.error("❌ Erreur", {
        description: error.message,
      });
    },
  });
  
  const handleSubmit = () => {
    if (targetStandards.length === 0) {
      toast.error("⚠️ Sélection requise", {
        description: "Veuillez sélectionner au moins une norme ISO",
      });
      return;
    }
    
    saveQualificationMutation.mutate({
      targetStandards: targetStandards as ("9001" | "13485")[],
      organizationType: organizationType as "manufacturer" | "service_provider" | "both",
      economicRole: economicRole as "fabricant" | "importateur" | "distributeur" | "mandataire" | undefined,
      processes: processes,
      certificationScope: certificationScope || undefined,
      excludedClauses: excludedClauses.length > 0 ? excludedClauses : undefined,
    });
  };
  
  const toggleStandard = (code: string) => {
    setTargetStandards(prev =>
      prev.includes(code) ? prev.filter(s => s !== code) : [...prev, code]
    );
  };
  
  const toggleExcludedClause = (clause: string) => {
    setExcludedClauses(prev =>
      prev.includes(clause) ? prev.filter(c => c !== clause) : [...prev, clause]
    );
  };
  
  if (loadingQualification) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Qualification ISO</h1>
        <p className="text-muted-foreground">
          Définissez vos objectifs de certification ISO 9001 et/ou ISO 13485
        </p>
      </div>
      
      {existingQualification && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            Vous avez déjà complété votre qualification ISO. Vous pouvez la modifier ci-dessous.
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Normes Cibles
          </CardTitle>
          <CardDescription>
            Sélectionnez les normes ISO pour lesquelles vous souhaitez vous certifier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {ISO_STANDARDS.map((standard) => (
              <div
                key={standard.code}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  targetStandards.includes(standard.code)
                    ? standard.color
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => toggleStandard(standard.code)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{standard.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">{standard.description}</div>
                  </div>
                  {targetStandards.includes(standard.code) && (
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Type d'Organisation
          </CardTitle>
          <CardDescription>
            Sélectionnez le type d'activité de votre organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={organizationType} onValueChange={setOrganizationType}>
            <div className="space-y-3">
              {ORGANIZATION_TYPES.map((type) => (
                <div
                  key={type.value}
                  className={`flex items-center space-x-2 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    organizationType === type.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setOrganizationType(type.value)}
                >
                  <RadioGroupItem value={type.value} id={type.value} />
                  <Label htmlFor={type.value} className="cursor-pointer flex-1">
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Rôle Économique
          </CardTitle>
          <CardDescription>
            Sélectionnez votre rôle dans la chaîne de valeur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { value: "fabricant", label: "Fabricant", description: "Conception et/ou fabrication de produits" },
              { value: "importateur", label: "Importateur", description: "Import de produits depuis hors UE" },
              { value: "distributeur", label: "Distributeur", description: "Distribution de produits sur le marché" },
              { value: "mandataire", label: "Mandataire", description: "Représentant autorisé du fabricant" },
            ].map((role) => (
              <label
                key={role.value}
                className={`flex items-center space-x-3 p-4 border-2 rounded-lg transition-colors cursor-pointer ${
                  economicRole === role.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name="economicRole"
                  value={role.value}
                  checked={economicRole === role.value}
                  onChange={(e) => setEconomicRole(e.target.value)}
                  className="h-4 w-4 text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="font-medium">{role.label}</div>
                  <div className="text-xs text-muted-foreground">{role.description}</div>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Processus Concernés
          </CardTitle>
          <CardDescription>
            Sélectionnez les processus que vous réalisez
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { value: "conception", label: "Conception & Développement", description: "R&D, design, prototypage" },
              { value: "fabrication", label: "Fabrication", description: "Production, assemblage, contrôle qualité" },
              { value: "distribution", label: "Distribution", description: "Logistique, expédition, entreposage" },
              { value: "stockage", label: "Stockage", description: "Gestion des stocks, traçabilité" },
              { value: "installation", label: "Installation", description: "Mise en service, formation utilisateurs" },
              { value: "maintenance", label: "Maintenance & SAV", description: "Support technique, réparations" },
            ].map((process) => (
              <label
                key={process.value}
                className={`flex items-start space-x-3 p-3 border rounded-lg transition-colors cursor-pointer ${
                  processes.includes(process.value)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <input
                  type="checkbox"
                  value={process.value}
                  checked={processes.includes(process.value)}
                  onChange={(e) => {
                    setProcesses(prev =>
                      e.target.checked
                        ? [...prev, process.value]
                        : prev.filter(p => p !== process.value)
                    );
                  }}
                  className="h-4 w-4 mt-1 text-primary focus:ring-primary rounded"
                />
                <div className="flex-1">
                  <div className="font-medium">{process.label}</div>
                  <div className="text-xs text-muted-foreground">{process.description}</div>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Périmètre de Certification
          </CardTitle>
          <CardDescription>
            Décrivez le périmètre de votre certification (produits, services, sites)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ex: Conception, fabrication et distribution de dispositifs médicaux de classe IIa pour le diagnostic in vitro..."
            value={certificationScope}
            onChange={(e) => setCertificationScope(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Exclusions (optionnel)</CardTitle>
          <CardDescription>
            Sélectionnez les clauses non applicables à votre organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {COMMON_EXCLUDED_CLAUSES.map((clause) => (
              <div
                key={clause.value}
                className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  excludedClauses.includes(clause.value)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => toggleExcludedClause(clause.value)}
              >
                <Checkbox
                  checked={excludedClauses.includes(clause.value)}
                  onCheckedChange={() => toggleExcludedClause(clause.value)}
                />
                <div className="flex-1">
                  <div className="font-medium">{clause.label}</div>
                  <div className="text-xs text-muted-foreground">{clause.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-8 flex gap-4">
        <Button
          onClick={handleSubmit}
          disabled={saveQualificationMutation.isPending}
          className="flex-1"
        >
          {saveQualificationMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Enregistrer et Continuer
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setLocation("/dashboard")}
        >
          Annuler
        </Button>
      </div>
    </div>
  );
}
