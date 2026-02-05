import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Shield, Loader2, CheckCircle2, XCircle, MinusCircle, AlertCircle, Sparkles, Lock, FileUp } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const DEMO_MAX_QUESTIONS = 5;

export function AuditDemo() {
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [demoCompleted, setDemoCompleted] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<number | null>(null);

  // Demo responses (not saved to database)
  const [responses, setResponses] = useState<Record<number, {
    response: string;
    status: "conforme" | "nok" | "na" | null;
  }>>({});

  // Check if user has already used their demo
  const { data: demoUsage, isLoading: loadingDemo } = trpc.demo.checkUsage.useQuery();
  
  // Get ISO 13485 questions only (demo is limited to ISO 13485)
  const { data: questions, isLoading: loadingQuestions } = trpc.demo.getQuestions.useQuery(
    undefined,
    { enabled: !demoUsage?.hasUsedDemo }
  );

  // Get processes list
  const { data: processes } = trpc.processes.list.useQuery();

  const markDemoUsedMutation = trpc.demo.markAsUsed.useMutation();

  const currentQuestion = questions?.[currentQuestionIndex];
  const currentResponse = currentQuestion ? responses[currentQuestion.id] : undefined;
  const progress = ((currentQuestionIndex + 1) / DEMO_MAX_QUESTIONS) * 100;

  const handleNext = () => {
    if (currentQuestionIndex < DEMO_MAX_QUESTIONS - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Demo completed
      setDemoCompleted(true);
      markDemoUsedMutation.mutate();
    }
  };

  const handleResponseChange = (questionId: number, field: "response" | "status", value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      }
    }));
  };

  const criticityColors = {
    high: "bg-red-100 text-red-800 border-red-300",
    medium: "bg-amber-100 text-amber-800 border-amber-300",
    low: "bg-blue-100 text-blue-800 border-blue-300",
  };

  if (loadingDemo || loadingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // User has already used their demo
  if (demoUsage?.hasUsedDemo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white sticky top-0 z-50">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold">MDR Compliance</span>
            </div>
          </div>
        </header>
        <main className="container py-16 text-center max-w-2xl">
          <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Démo déjà utilisée</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Vous avez déjà utilisé votre démo gratuite. Pour accéder à toutes les fonctionnalités, abonnez-vous.
          </p>
          <Alert className="mb-8 bg-blue-50 border-blue-200 text-left">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Avec un abonnement, débloquez :</strong>
              <p className="mt-2 text-sm">
                ✅ Audits MDR, ISO 13485, ISO 9001, FDA illimités<br />
                ✅ Sauvegarde automatique de vos réponses<br />
                ✅ Exports PDF et Excel professionnels<br />
                ✅ IA contextuelle pour recommandations personnalisées<br />
                ✅ Dashboard de conformité complet<br />
                ✅ Classification des dispositifs médicaux
              </p>
            </AlertDescription>
          </Alert>
          <div className="flex gap-4 justify-center">
            <Link href="/pricing">
              <Button size="lg">
                Voir les tarifs
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg">
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Demo completed
  if (demoCompleted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white sticky top-0 z-50">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold">MDR Compliance</span>
            </div>
          </div>
        </header>
        <main className="container py-16 text-center max-w-2xl">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Démo terminée !</h2>
          <p className="text-lg text-muted-foreground mb-4">
            Vous avez découvert {DEMO_MAX_QUESTIONS} questions d'audit ISO 13485.
          </p>
          <Alert className="mb-8 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-900">
              <strong>⚠️ Vos réponses n'ont pas été sauvegardées.</strong>
              <p className="mt-2">
                Sans abonnement, vous ne pouvez pas utiliser la plateforme sérieusement.
                Abonnez-vous pour sauvegarder vos audits, exporter vos rapports, et accéder à toutes les fonctionnalités.
              </p>
            </AlertDescription>
          </Alert>
          <div className="grid gap-4 mb-8">
            <Card className="text-left">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Débloquez l'accès complet
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>✅ <strong>Audits illimités</strong> : MDR, ISO 13485, ISO 9001, FDA</p>
                <p>✅ <strong>Sauvegarde automatique</strong> : Reprenez où vous vous êtes arrêté</p>
                <p>✅ <strong>Exports professionnels</strong> : PDF et Excel audit-ready</p>
                <p>✅ <strong>IA contextuelle</strong> : Recommandations personnalisées par question</p>
                <p>✅ <strong>Dashboard complet</strong> : Scores, progression, drill-down</p>
                <p>✅ <strong>Classification DM</strong> : Déterminez la classe de votre dispositif</p>
                <p>✅ <strong>Documents obligatoires</strong> : Modèles MDR, ISO 13485, ISO 9001</p>
                <p>✅ <strong>Veille réglementaire</strong> : Alertes et mises à jour automatiques</p>
              </CardContent>
            </Card>
          </div>
          <div className="flex gap-4 justify-center">
            <Link href="/pricing">
              <Button size="lg">
                Voir les tarifs
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg">
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold">MDR Compliance - Démo</span>
          </div>
          <Link href="/pricing">
            <Button variant="outline" size="sm">
              Débloquer l'accès complet
            </Button>
          </Link>
        </div>
      </header>

      <main className="container py-8 max-w-4xl">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progression de la démo</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Demo notice */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Mode démo :</strong> Vous découvrez {DEMO_MAX_QUESTIONS} questions d'audit ISO 13485.
            Vos réponses ne seront pas sauvegardées. Pour un usage professionnel complet, abonnez-vous.
          </AlertDescription>
        </Alert>

        {/* Locked features notice */}
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Fonctionnalités réservées aux abonnés
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>🔒 Sauvegarde des réponses</p>
            <p>🔒 Exports PDF et Excel</p>
            <p>🔒 IA contextuelle</p>
            <p>🔒 Accès MDR, ISO 13485, FDA</p>
            <p>🔒 Dashboard de conformité</p>
          </CardContent>
        </Card>

        {/* Question navigation */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} sur {DEMO_MAX_QUESTIONS}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
            >
              Précédent
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
            >
              {currentQuestionIndex === DEMO_MAX_QUESTIONS - 1 ? "Terminer la démo" : "Suivant"}
            </Button>
          </div>
        </div>

        {/* Current question */}
        {currentQuestion && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">ISO 13485</Badge>
                    <Badge variant="outline">{currentQuestion.article}</Badge>
                    <Badge className={criticityColors[currentQuestion.criticality as keyof typeof criticityColors]}>
                      {currentQuestion.criticality === "high" && "Haute criticité"}
                      {currentQuestion.criticality === "medium" && "Criticité moyenne"}
                      {currentQuestion.criticality === "low" && "Criticité faible"}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{currentQuestion.questionText}</CardTitle>
                  <CardDescription className="mt-2">
                    <strong>Article :</strong> {currentQuestion.article}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Process Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Processus concerné</label>
                <Select
                  value={selectedProcess?.toString() || ""}
                  onValueChange={(value) => setSelectedProcess(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un processus" />
                  </SelectTrigger>
                  <SelectContent>
                    {processes?.map((process) => (
                      <SelectItem key={process.id} value={process.id.toString()}>
                        {process.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Indiquez quel processus de votre organisation est concerné par cette exigence
                </p>
              </div>

              {/* Response/Note Field */}
              <div>
                <label className="text-sm font-medium mb-2 block">Réponse / Note</label>
                <Textarea
                  placeholder="Décrivez votre réponse, les mesures mises en place, ou les éléments de contexte..."
                  value={currentResponse?.response || ""}
                  onChange={(e) => handleResponseChange(currentQuestion.id, "response", e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Documentez votre réponse avant de définir le statut de conformité
                </p>
              </div>

              {/* Status Selection */}
              <div>
                <label className="text-sm font-medium mb-3 block">Statut de conformité</label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={currentResponse?.status === "conforme" ? "default" : "outline"}
                    onClick={() => handleResponseChange(currentQuestion.id, "status", "conforme")}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Conforme
                  </Button>
                  <Button
                    variant={currentResponse?.status === "nok" ? "default" : "outline"}
                    onClick={() => handleResponseChange(currentQuestion.id, "status", "nok")}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    NOK
                  </Button>
                  <Button
                    variant={currentResponse?.status === "na" ? "default" : "outline"}
                    onClick={() => handleResponseChange(currentQuestion.id, "status", "na")}
                  >
                    <MinusCircle className="mr-2 h-4 w-4" />
                    N/A
                  </Button>
                </div>
              </div>

              {/* Document Upload (disabled in demo) */}
              <div>
                <label className="text-sm font-medium mb-2 block">Documents justificatifs</label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center bg-gray-50">
                  <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Upload de fichiers désactivé en mode démo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    🔒 Abonnez-vous pour joindre des preuves documentaires
                  </p>
                </div>
              </div>

              {/* AI Recommendations (locked) */}
              <div>
                <Button variant="outline" className="w-full" disabled>
                  <Lock className="mr-2 h-4 w-4" />
                  IA contextuelle (réservé aux abonnés)
                </Button>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  Obtenez des recommandations personnalisées par l'IA pour chaque question
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
