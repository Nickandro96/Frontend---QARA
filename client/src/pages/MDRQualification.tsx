/**
 * MDR Qualification Page
 * Determines user's economic role for MDR compliance
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Building2, Globe, Package } from "lucide-react";
import { toast } from "sonner";

const ECONOMIC_ROLES = [
  { value: "fabricant", label: "Fabricant", description: "Fabrique ou fait fabriquer un dispositif médical" },
  { value: "importateur", label: "Importateur", description: "Met pour la première fois un dispositif sur le marché UE" },
  { value: "distributeur", label: "Distributeur", description: "Fournit un dispositif sans le modifier" },
  { value: "mandataire", label: "Mandataire", description: "Représentant autorisé d'un fabricant hors UE" },
];

const DEVICE_CLASSES = [
  { value: "I", label: "Classe I", description: "Risque faible" },
  { value: "IIa", label: "Classe IIa", description: "Risque moyen" },
  { value: "IIb", label: "Classe IIb", description: "Risque élevé" },
  { value: "III", label: "Classe III", description: "Risque très élevé" },
];

const EU_MARKETS = [
  "FR", "DE", "IT", "ES", "NL", "BE", "AT", "PL", "SE", "DK", "FI", "IE", "PT", "CZ", "HU", "RO", "BG", "GR", "HR", "SK", "SI", "LT", "LV", "EE", "CY", "LU", "MT"
];

export default function MDRQualification() {
  const [, setLocation] = useLocation();
  // Using sonner toast
  
  const [economicRole, setEconomicRole] = useState<string>("");
  const [hasAuthorizedRepresentative, setHasAuthorizedRepresentative] = useState(false);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [certificationScope, setCertificationScope] = useState("");
  
  // Get existing qualification
  const { data: existingQualification, isLoading: loadingQualification } = trpc.mdr.getQualification.useQuery({});
  
  // Load existing data if available
  useState(() => {
    if (existingQualification) {
      setEconomicRole(existingQualification.economicRole);
      setHasAuthorizedRepresentative(existingQualification.hasAuthorizedRepresentative);
      setSelectedMarkets(existingQualification.targetMarkets || []);
      setSelectedClasses(existingQualification.deviceClasses || []);
    }
  });
  
  const saveQualificationMutation = trpc.mdr.saveQualification.useMutation({
    onSuccess: (data) => {
      toast.success("✅ Qualification MDR enregistrée", {
        description: data.message,
      });
      // Redirect to audit page
      setTimeout(() => setLocation("/mdr/audit"), 1000);
    },
    onError: (error) => {
      toast.error("❌ Erreur", {
        description: error.message,
      });
    },
  });
  
  const handleSubmit = () => {
    if (!economicRole) {
      toast.error("⚠️ Champ requis", {
        description: "Veuillez sélectionner votre rôle économique",
      });
      return;
    }
    
    saveQualificationMutation.mutate({
      economicRole: economicRole as "fabricant" | "importateur" | "distributeur" | "mandataire",
      hasAuthorizedRepresentative,
      targetMarkets: selectedMarkets.length > 0 ? selectedMarkets : undefined,
      deviceClasses: selectedClasses.length > 0 ? selectedClasses : undefined,
    });
  };
  
  const toggleMarket = (market: string) => {
    setSelectedMarkets(prev =>
      prev.includes(market) ? prev.filter(m => m !== market) : [...prev, market]
    );
  };
  
  const toggleClass = (deviceClass: string) => {
    setSelectedClasses(prev =>
      prev.includes(deviceClass) ? prev.filter(c => c !== deviceClass) : [...prev, deviceClass]
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
        <h1 className="text-3xl font-bold mb-2">Qualification MDR</h1>
        <p className="text-muted-foreground">
          Définissez votre profil réglementaire pour le Règlement (UE) 2017/745
        </p>
      </div>
      
      {existingQualification && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            Vous avez déjà complété votre qualification MDR. Vous pouvez la modifier ci-dessous.
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Rôle Économique
          </CardTitle>
          <CardDescription>
            Sélectionnez votre rôle principal dans la chaîne d'approvisionnement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Rôle économique *</Label>
            <Select value={economicRole} onValueChange={setEconomicRole}>
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
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasAuthorizedRepresentative"
              checked={hasAuthorizedRepresentative}
              onCheckedChange={(checked) => setHasAuthorizedRepresentative(checked as boolean)}
            />
            <Label htmlFor="hasAuthorizedRepresentative" className="cursor-pointer">
              J'ai un mandataire (représentant autorisé dans l'UE)
            </Label>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Marchés Cibles
          </CardTitle>
          <CardDescription>
            Sélectionnez les pays de l'UE où vous commercialisez vos dispositifs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {EU_MARKETS.map((market) => (
              <Badge
                key={market}
                variant={selectedMarkets.includes(market) ? "default" : "outline"}
                className="cursor-pointer justify-center"
                onClick={() => toggleMarket(market)}
              >
                {market}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Classes de Dispositifs
          </CardTitle>
          <CardDescription>
            Sélectionnez les classes de dispositifs que vous commercialisez
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEVICE_CLASSES.map((deviceClass) => (
              <div
                key={deviceClass.value}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedClasses.includes(deviceClass.value)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => toggleClass(deviceClass.value)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{deviceClass.label}</div>
                    <div className="text-xs text-muted-foreground">{deviceClass.description}</div>
                  </div>
                  {selectedClasses.includes(deviceClass.value) && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
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
