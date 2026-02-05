import { UpgradeRequired } from "@/components/UpgradeRequired";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Shield, Loader2, CheckCircle2, ArrowRight, ArrowLeft, Flag, AlertCircle, FileText, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

type DeviceClass = "I" | "II" | "III" | null;
type Pathway = "Exempt" | "510(k)" | "De Novo" | "PMA" | null;

export default function FdaClassification() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });

  // Block FREE users
  if (isAuthenticated && profile && profile.subscriptionTier === 'free' && user?.role !== 'admin') {
    return <UpgradeRequired feature="Classification FDA (US)" />;
  }
  const [, setLocation] = useLocation();

  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Device information
  const [deviceName, setDeviceName] = useState("");
  const [deviceDescription, setDeviceDescription] = useState("");
  const [intendedUse, setIntendedUse] = useState("");

  // Classification questions
  const [isImplantable, setIsImplantable] = useState<boolean | null>(null);
  const [isSupportingLife, setIsSupportingLife] = useState<boolean | null>(null);
  const [hasSignificantRisk, setHasSignificantRisk] = useState<boolean | null>(null);
  const [hasPredicateDevice, setHasPredicateDevice] = useState<boolean | null>(null);
  const [predicateName, setPredicateName] = useState("");
  const [predicate510k, setPredicate510k] = useState("");

  // Results
  const [deviceClass, setDeviceClass] = useState<DeviceClass>(null);
  const [pathway, setPathway] = useState<Pathway>(null);
  const [justification, setJustification] = useState("");

  const saveClassificationMutation = trpc.fdaClassification.save.useMutation({
    onSuccess: () => {
      toast.success("Classification FDA sauvegardée avec succès !");
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const determineClassification = () => {
    let detectedClass: DeviceClass = "I";
    let detectedPathway: Pathway = "Exempt";
    let reasoning = "";

    // Classification logic
    if (isSupportingLife) {
      detectedClass = "III";
      reasoning = "Le dispositif est destiné à maintenir la vie (life-supporting/life-sustaining), ce qui le classe automatiquement en **Class III** selon la FDA.";
    } else if (isImplantable && hasSignificantRisk) {
      detectedClass = "III";
      reasoning = "Le dispositif est implantable et présente un risque significatif, ce qui le classe en **Class III**.";
    } else if (isImplantable || hasSignificantRisk) {
      detectedClass = "II";
      reasoning = "Le dispositif est soit implantable, soit présente un risque significatif, ce qui le classe en **Class II**.";
    } else {
      detectedClass = "I";
      reasoning = "Le dispositif présente un risque faible et n'est ni implantable ni life-supporting, ce qui le classe en **Class I**.";
    }

    // Pathway determination
    if (detectedClass === "III") {
      detectedPathway = "PMA";
      reasoning += "\n\n**Pathway réglementaire : PMA (Premarket Approval)**\n\nLes dispositifs de Class III nécessitent un PMA, le processus d'approbation le plus rigoureux de la FDA. Vous devrez fournir des données cliniques complètes démontrant la sécurité et l'efficacité du dispositif.";
    } else if (detectedClass === "II") {
      if (hasPredicateDevice) {
        detectedPathway = "510(k)";
        reasoning += `\n\n**Pathway réglementaire : 510(k) Premarket Notification**\n\nVous avez identifié un predicate device (${predicateName || "à préciser"}${predicate510k ? ` - ${predicate510k}` : ""}). Vous pouvez soumettre un 510(k) pour démontrer la substantial equivalence à ce predicate.`;
      } else {
        detectedPathway = "De Novo";
        reasoning += "\n\n**Pathway réglementaire : De Novo Classification Request**\n\nVotre dispositif est nouveau (pas de predicate) et de Class II. Vous devez soumettre une demande De Novo pour établir une nouvelle classification et définir les special controls nécessaires.";
      }
    } else {
      // Class I
      detectedPathway = "Exempt";
      reasoning += "\n\n**Pathway réglementaire : Exempt**\n\nLa plupart des dispositifs de Class I sont exemptés de 510(k). Vous devez néanmoins enregistrer votre établissement (FDA Registration) et lister votre dispositif (Device Listing).";
    }

    setDeviceClass(detectedClass);
    setPathway(detectedPathway);
    setJustification(reasoning);
    setStep(5);
  };

  const handleSaveClassification = () => {
    if (!deviceClass || !pathway) {
      toast.error("Classification incomplète");
      return;
    }

    saveClassificationMutation.mutate({
      deviceName,
      deviceDescription,
      intendedUse,
      deviceClass,
      pathway,
      predicateDevice: hasPredicateDevice ? predicateName : null,
      predicate510k: hasPredicateDevice ? predicate510k : null,
      justification,
      answers: JSON.stringify({
        isImplantable,
        isSupportingLife,
        hasSignificantRisk,
        hasPredicateDevice,
      }),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <Shield className="h-6 w-6 text-primary" />
                <span className="font-bold">MDR Compliance</span>
              </div>
            </Link>
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              <Flag className="h-4 w-4" />
              <span>FDA Classification (US)</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline">{user?.name || "Profil"}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-4xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Étape {step} sur {totalSteps}</span>
            <span className="text-sm text-muted-foreground">{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <Progress value={(step / totalSteps) * 100} className="h-2" />
        </div>

        {/* Step 1: Device Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Informations sur le dispositif</CardTitle>
              <CardDescription>
                Décrivez votre dispositif médical pour commencer la classification FDA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nom du dispositif</label>
                <Input
                  placeholder="Ex: Moniteur cardiaque portable"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description technique</label>
                <Textarea
                  placeholder="Décrivez les caractéristiques techniques, les matériaux, les composants..."
                  value={deviceDescription}
                  onChange={(e) => setDeviceDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Intended Use (Utilisation prévue)</label>
                <Textarea
                  placeholder="Décrivez l'utilisation clinique prévue, les indications, la population cible..."
                  value={intendedUse}
                  onChange={(e) => setIntendedUse(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!deviceName || !deviceDescription || !intendedUse}
                >
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Risk Assessment */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Évaluation des risques</CardTitle>
              <CardDescription>
                Répondez aux questions suivantes pour déterminer la classe FDA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-700">
                      Ces questions permettent de déterminer si votre dispositif est de Class I (risque faible), Class II (risque modéré), ou Class III (risque élevé).
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-3">Le dispositif est-il destiné à maintenir la vie (life-supporting/life-sustaining) ?</p>
                  <div className="flex gap-3">
                    <Button
                      variant={isSupportingLife === true ? "default" : "outline"}
                      onClick={() => setIsSupportingLife(true)}
                      className="flex-1"
                    >
                      Oui
                    </Button>
                    <Button
                      variant={isSupportingLife === false ? "default" : "outline"}
                      onClick={() => setIsSupportingLife(false)}
                      className="flex-1"
                    >
                      Non
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-3">Le dispositif est-il implantable ?</p>
                  <div className="flex gap-3">
                    <Button
                      variant={isImplantable === true ? "default" : "outline"}
                      onClick={() => setIsImplantable(true)}
                      className="flex-1"
                    >
                      Oui
                    </Button>
                    <Button
                      variant={isImplantable === false ? "default" : "outline"}
                      onClick={() => setIsImplantable(false)}
                      className="flex-1"
                    >
                      Non
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-3">Le dispositif présente-t-il un risque significatif de maladie ou blessure ?</p>
                  <div className="flex gap-3">
                    <Button
                      variant={hasSignificantRisk === true ? "default" : "outline"}
                      onClick={() => setHasSignificantRisk(true)}
                      className="flex-1"
                    >
                      Oui
                    </Button>
                    <Button
                      variant={hasSignificantRisk === false ? "default" : "outline"}
                      onClick={() => setHasSignificantRisk(false)}
                      className="flex-1"
                    >
                      Non
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Précédent
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={isSupportingLife === null || isImplantable === null || hasSignificantRisk === null}
                >
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Predicate Device */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Predicate Device</CardTitle>
              <CardDescription>
                Existe-t-il un dispositif similaire déjà commercialisé aux États-Unis ?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-700 mb-2">
                      Un <strong>predicate device</strong> est un dispositif légalement commercialisé aux États-Unis auquel votre dispositif peut être comparé pour démontrer la substantial equivalence (510(k)).
                    </p>
                    <p className="text-sm text-blue-700">
                      Recherchez dans la base de données FDA : <a href="https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPMN/pmn.cfm" target="_blank" rel="noopener noreferrer" className="underline">510(k) Premarket Notification Database</a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-3">Avez-vous identifié un predicate device ?</p>
                  <div className="flex gap-3">
                    <Button
                      variant={hasPredicateDevice === true ? "default" : "outline"}
                      onClick={() => setHasPredicateDevice(true)}
                      className="flex-1"
                    >
                      Oui
                    </Button>
                    <Button
                      variant={hasPredicateDevice === false ? "default" : "outline"}
                      onClick={() => setHasPredicateDevice(false)}
                      className="flex-1"
                    >
                      Non
                    </Button>
                  </div>
                </div>

                {hasPredicateDevice === true && (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Nom du predicate device</label>
                      <Input
                        placeholder="Ex: Acme Cardiac Monitor"
                        value={predicateName}
                        onChange={(e) => setPredicateName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Numéro 510(k) du predicate</label>
                      <Input
                        placeholder="Ex: K123456"
                        value={predicate510k}
                        onChange={(e) => setPredicate510k(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Précédent
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  disabled={hasPredicateDevice === null || (hasPredicateDevice === true && (!predicateName || !predicate510k))}
                >
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review & Calculate */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Révision des informations</CardTitle>
              <CardDescription>
                Vérifiez les informations avant de calculer la classification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Dispositif</h3>
                  <p className="text-sm"><strong>Nom :</strong> {deviceName}</p>
                  <p className="text-sm"><strong>Description :</strong> {deviceDescription}</p>
                  <p className="text-sm"><strong>Intended Use :</strong> {intendedUse}</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Caractéristiques</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Life-supporting :</strong> {isSupportingLife ? "Oui" : "Non"}</p>
                    <p><strong>Implantable :</strong> {isImplantable ? "Oui" : "Non"}</p>
                    <p><strong>Risque significatif :</strong> {hasSignificantRisk ? "Oui" : "Non"}</p>
                    <p><strong>Predicate device :</strong> {hasPredicateDevice ? `Oui (${predicateName})` : "Non"}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Précédent
                </Button>
                <Button onClick={determineClassification}>
                  Calculer la classification
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Results */}
        {step === 5 && deviceClass && pathway && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <CardTitle>Classification FDA déterminée</CardTitle>
              </div>
              <CardDescription>
                Voici la classification et le pathway réglementaire recommandés
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 border-2 border-blue-500 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-2">Classification FDA</p>
                  <p className="text-4xl font-bold text-blue-600">Class {deviceClass}</p>
                </div>
                <div className="p-6 border-2 border-purple-500 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-2">Pathway réglementaire</p>
                  <p className="text-2xl font-bold text-purple-600">{pathway}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Justification
                </h3>
                <div className="prose prose-sm max-w-none whitespace-pre-line">
                  {justification}
                </div>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-900 mb-1">Avertissement</p>
                    <p className="text-sm text-orange-700">
                      Cette classification est une estimation basée sur les informations fournies. Pour une classification officielle, consultez la base de données FDA ou contactez un expert en affaires réglementaires.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Nouvelle classification
                </Button>
                <Button
                  onClick={handleSaveClassification}
                  disabled={saveClassificationMutation.isPending}
                >
                  {saveClassificationMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Sauvegarder
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
