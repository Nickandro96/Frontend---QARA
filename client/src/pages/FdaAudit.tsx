import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Shield, Loader2, CheckCircle2, XCircle, MinusCircle, Sparkles, AlertCircle, FileText, Flag } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { EvidenceUpload } from "@/components/EvidenceUpload";

export default function FdaAudit() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  // FDA is now included in all plans (SOLO, PME, ENTREPRISE)
  const { data: referentials } = trpc.referentials.list.useQuery();
  const { data: processes } = trpc.processes.list.useQuery();

  // Filter FDA referentials only
  const fdaReferentials = referentials?.filter(r => r.code.startsWith('FDA_'));

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedReferential, setSelectedReferential] = useState<number | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [showAI, setShowAI] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  const { data: questions } = trpc.questions.list.useQuery(
    {
      referentialId: selectedReferential || undefined,
      processId: selectedProcess || undefined,
      economicRole: selectedRole as any || undefined,
    },
    { enabled: isAuthenticated && !!selectedRole }
  );

  const { data: userResponse } = trpc.audit.getResponse.useQuery(
    { questionId: questions?.[currentQuestionIndex]?.id || 0 },
    { enabled: isAuthenticated && !!questions?.[currentQuestionIndex] }
  );

  const { data: evidenceFiles } = trpc.evidence.list.useQuery(
    { questionId: questions?.[currentQuestionIndex]?.id || 0 },
    { enabled: isAuthenticated && !!questions?.[currentQuestionIndex] }
  );

  const saveResponseMutation = trpc.audit.saveResponse.useMutation({
    onSuccess: () => {
      toast.success("Réponse enregistrée avec succès");
      setResponse("");
      if (currentQuestionIndex < (questions?.length || 0) - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const getAiHelpMutation = trpc.ai.getRecommendation.useMutation({
    onSuccess: (data: any) => {
      setAiResponse(data.response);
      setShowAI(true);
    },
    onError: (error: any) => {
      toast.error(`Erreur IA: ${error.message}`);
    }
  });

  const currentQuestion = questions?.[currentQuestionIndex];

  const handleSaveResponse = (status: "conforme" | "nok" | "na") => {
    if (!currentQuestion) return;

    saveResponseMutation.mutate({
      questionId: currentQuestion.id,
      response: response,
      status,
      comment: ""
    });
  };

  const handleGetAiHelp = () => {
    if (!currentQuestion) return;

    getAiHelpMutation.mutate({
      questionId: currentQuestion.id,
      context: response || "Aucune réponse fournie"
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
              <span>FDA (US)</span>
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

      <main className="container py-8">
        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Audit FDA - Marché US</h3>
              <p className="text-sm text-blue-700">
                Cet audit couvre les exigences FDA pour le marché américain : QMSR (en vigueur 2 février 2026), 21 CFR Part 820, Registration & Listing, Premarket pathways (510(k), De Novo, PMA), et Postmarket requirements.
              </p>
            </div>
          </div>
        </div>

        {/* Role Selection */}
        {!selectedRole && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Sélectionnez votre rôle FDA</CardTitle>
              <CardDescription>
                Choisissez le rôle réglementaire de votre organisation sur le marché US
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-start"
                  onClick={() => setSelectedRole("manufacturer_us")}
                >
                  <span className="font-semibold">Manufacturer (US)</span>
                  <span className="text-xs text-muted-foreground">Fabricant établi aux États-Unis</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-start"
                  onClick={() => setSelectedRole("specification_developer")}
                >
                  <span className="font-semibold">Specification Developer</span>
                  <span className="text-xs text-muted-foreground">Développeur de spécifications (design authority)</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-start"
                  onClick={() => setSelectedRole("contract_manufacturer")}
                >
                  <span className="font-semibold">Contract Manufacturer</span>
                  <span className="text-xs text-muted-foreground">Sous-traitant de fabrication</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-start"
                  onClick={() => setSelectedRole("initial_importer")}
                >
                  <span className="font-semibold">Initial Importer</span>
                  <span className="text-xs text-muted-foreground">Premier importateur aux États-Unis</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        {selectedRole && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Rôle sélectionné</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-sm">
                    {selectedRole === "manufacturer_us" && "Manufacturer (US)"}
                    {selectedRole === "specification_developer" && "Specification Developer"}
                    {selectedRole === "contract_manufacturer" && "Contract Manufacturer"}
                    {selectedRole === "initial_importer" && "Initial Importer"}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSelectedRole(null);
                    setSelectedReferential(null);
                    setSelectedProcess(null);
                    setCurrentQuestionIndex(0);
                  }}>
                    Changer
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Référentiel FDA</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedReferential?.toString() || ""}
                  onValueChange={(value) => {
                    setSelectedReferential(parseInt(value));
                    setCurrentQuestionIndex(0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les référentiels FDA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les référentiels FDA</SelectItem>
                    {fdaReferentials?.map((ref) => (
                      <SelectItem key={ref.id} value={ref.id.toString()}>
                        {ref.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Processus</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedProcess?.toString() || ""}
                  onValueChange={(value) => {
                    setSelectedProcess(parseInt(value));
                    setCurrentQuestionIndex(0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les processus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les processus</SelectItem>
                    {processes?.map((proc) => (
                      <SelectItem key={proc.id} value={proc.id.toString()}>
                        {proc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Questions */}
        {selectedRole && questions && questions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Question Card */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{currentQuestion?.article}</Badge>
                    <span className="text-sm text-muted-foreground">
                      Question {currentQuestionIndex + 1} / {questions.length}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{currentQuestion?.questionText}</CardTitle>
                  <CardDescription>
                    Criticité: <Badge variant={currentQuestion?.criticality === "high" ? "destructive" : "secondary"}>
                      {currentQuestion?.criticality === "high" ? "Élevée" : currentQuestion?.criticality === "medium" ? "Moyenne" : "Faible"}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Response Field */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Votre réponse / Note</label>
                    <Textarea
                      placeholder="Décrivez votre situation actuelle, les documents disponibles, les processus en place..."
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      rows={4}
                      className="mb-2"
                    />
                  </div>

                  {/* Evidence Upload */}
                  {currentQuestion && (
                    <EvidenceUpload
                      questionId={currentQuestion.id}
                    />
                  )}

                  {/* Status Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleSaveResponse("conforme")}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={saveResponseMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Conforme
                    </Button>
                    <Button
                      onClick={() => handleSaveResponse("nok")}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      disabled={saveResponseMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      NOK
                    </Button>
                    <Button
                      onClick={() => handleSaveResponse("na")}
                      variant="outline"
                      className="flex-1"
                      disabled={saveResponseMutation.isPending}
                    >
                      <MinusCircle className="h-4 w-4 mr-2" />
                      N/A
                    </Button>
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                      disabled={currentQuestionIndex === 0}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                      disabled={currentQuestionIndex === questions.length - 1}
                    >
                      Suivant
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* AI Help Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    IA Contextuelle FDA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleGetAiHelp}
                    variant="outline"
                    className="w-full mb-4"
                    disabled={getAiHelpMutation.isPending}
                  >
                    {getAiHelpMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Obtenir de l'aide IA
                  </Button>

                  {showAI && aiResponse && (
                    <div className="prose prose-sm max-w-none">
                      <Streamdown>{aiResponse}</Streamdown>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Expected Evidence */}
              {currentQuestion?.expectedEvidence && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Preuves attendues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      {currentQuestion.expectedEvidence.map((evidence: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span>{evidence}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Risks */}
              {currentQuestion?.risks && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      Risques si NOK
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{currentQuestion.risks}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* No Questions */}
        {selectedRole && questions && questions.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucune question trouvée</h3>
              <p className="text-muted-foreground">
                Aucune question ne correspond aux filtres sélectionnés. Essayez de modifier vos critères.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
