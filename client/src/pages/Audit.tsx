import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Shield, Loader2, CheckCircle2, XCircle, MinusCircle, Sparkles, AlertCircle, FileText } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { EvidenceUpload } from "@/components/EvidenceUpload";
import { UpgradeRequired } from "@/components/UpgradeRequired";
import { AuditDemo } from "@/components/AuditDemo";

export default function Audit() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: referentials } = trpc.referentials.list.useQuery();
  const { data: processes } = trpc.processes.list.useQuery();

  const [selectedRole, setSelectedRole] = useState<"fabricant" | "importateur" | "distributeur" | null>(null);
  const [selectedReferential, setSelectedReferential] = useState<number | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const { data: questions } = trpc.questions.list.useQuery(
    {
      referentialId: selectedReferential || undefined,
      processId: selectedProcess || undefined,
      economicRole: selectedRole || undefined,
    },
    { enabled: isAuthenticated && !!selectedRole }
  );

  const currentQuestion = questions?.[currentQuestionIndex];

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

  // Check subscription tier and admin bypass
  const isAdmin = profile?.user?.role === "admin";
  const tier = profile?.subscriptionTier?.toUpperCase();
  
  // Admin bypass: full access
  if (isAdmin) {
    // Admin has full access, continue to normal audit page
  } else if (tier === "FREE") {
    // FREE users get limited demo
    return <AuditDemo />;
  }

  if (!profile?.economicRole) {
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
        <main className="container py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">{t('audit.configRequired', 'Configuration requise')}</h2>
          <p className="text-muted-foreground mb-8">
            {t('audit.configRequiredDesc', 'Veuillez configurer votre rôle économique avant de commencer l\'audit')}
          </p>
          <Link href="/profile">
            <Button>{t('audit.configureProfile', 'Configurer mon profil')}</Button>
          </Link>
        </main>
      </div>
    );
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
            <nav className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/audit">
                <Button variant="ghost" className="font-medium">Audit</Button>
              </Link>
              <Link href="/reports">
                <Button variant="ghost">Rapports</Button>
              </Link>
              <Link href="/regulatory-watch">
                <Button variant="ghost">Veille</Button>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="outline">{user?.name || "Profil"}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-8">{t('audit.title', 'Audit de Conformité')}</h1>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('audit.filters', 'Filtres')}</CardTitle>
            <CardDescription>
              {t('audit.filtersDesc', 'Sélectionnez un référentiel et/ou un processus pour commencer')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rôle légal */}
            <div>
              <label className="text-sm font-medium mb-2 block">{t('audit.legalRole', 'Rôle légal')} *</label>
              <Select
                value={selectedRole || ""}
                onValueChange={(value) => {
                  setSelectedRole(value as "fabricant" | "importateur" | "distributeur");
                  setCurrentQuestionIndex(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('audit.selectLegalRole', 'Sélectionnez votre rôle légal')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fabricant">{t('audit.eu.roles.manufacturer', 'Fabricant')}</SelectItem>
                  <SelectItem value="importateur">{t('audit.eu.roles.importer', 'Importateur')}</SelectItem>
                  <SelectItem value="distributeur">{t('audit.eu.roles.distributor', 'Distributeur')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {t('audit.roleHint', 'Les questions affichées seront adaptées à votre rôle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('audit.referential', 'Référentiel')}</label>
              <Select
                value={selectedReferential?.toString() || "all"}
                onValueChange={(v) => {
                  setSelectedReferential(v === "all" ? null : parseInt(v));
                  setCurrentQuestionIndex(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('audit.allReferentials', 'Tous les référentiels')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('audit.allReferentials', 'Tous les référentiels')}</SelectItem>
                  {referentials?.map((ref) => (
                    <SelectItem key={ref.id} value={ref.id.toString()}>
                      {ref.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t('audit.process', 'Processus')}</label>
              <Select
                value={selectedProcess?.toString() || "all"}
                onValueChange={(v) => {
                  setSelectedProcess(v === "all" ? null : parseInt(v));
                  setCurrentQuestionIndex(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('audit.allProcesses', 'Tous les processus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('audit.allProcesses', 'Tous les processus')}</SelectItem>
                  {processes?.map((proc) => (
                    <SelectItem key={proc.id} value={proc.id.toString()}>
                      {proc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </div>
          </CardContent>
        </Card>

        {/* Message si pas de rôle sélectionné */}
        {!selectedRole ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">{t('audit.selectLegalRole', 'Sélectionnez votre rôle légal')}</h3>
              <p className="text-muted-foreground">
                {t('audit.selectRoleDesc', 'Choisissez votre rôle (Fabricant, Importateur ou Distributeur) pour voir les questions d\'audit pertinentes')}
              </p>
            </CardContent>
          </Card>
        ) : questions && questions.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} sur {questions.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  {t('common.previous', 'Précédent')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                  disabled={currentQuestionIndex === questions.length - 1}
                >
                  {t('common.next', 'Suivant')}
                </Button>
              </div>
            </div>

            {currentQuestion && (
              <QuestionCard
                question={currentQuestion}
                onNext={() => {
                  if (currentQuestionIndex < questions.length - 1) {
                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                  }
                }}
              />
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">
                {t('audit.noQuestions', 'Aucune question disponible pour les filtres sélectionnés')}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function QuestionCard({ question, onNext }: { question: any; onNext: () => void }) {
  const { t } = useTranslation();
  const { data: existingResponse } = trpc.audit.getResponse.useQuery({ questionId: question.id });
  const saveResponse = trpc.audit.saveResponse.useMutation();
  const getRecommendation = trpc.ai.getRecommendation.useMutation();

  const [response, setResponse] = useState(existingResponse?.response || "");
  const [status, setStatus] = useState<"conforme" | "nok" | "na" | null>(existingResponse?.status || null);
  const [comment, setComment] = useState(existingResponse?.comment || "");
  
  // Update state when existingResponse changes
  useState(() => {
    if (existingResponse) {
      setResponse(existingResponse.response || "");
      setStatus(existingResponse.status);
      setComment(existingResponse.comment || "");
    }
  });
  const [showAI, setShowAI] = useState(false);

  const handleSave = async () => {
    if (!status) {
      toast.error(t('audit.selectStatusError', 'Veuillez sélectionner un statut'));
      return;
    }

    try {
      await saveResponse.mutateAsync({
        questionId: question.id,
        response: response || undefined,
        status,
        comment: comment || undefined,
      });
      toast.success(t('audit.responseSaved', 'Réponse enregistrée'));
      onNext();
    } catch (error) {
      toast.error(t('audit.saveError', 'Erreur lors de l\'enregistrement'));
    }
  };

  const handleAI = async () => {
    setShowAI(true);
    if (!getRecommendation.data) {
      await getRecommendation.mutateAsync({ questionId: question.id });
    }
  };

  const criticityColors = {
    high: "bg-red-100 text-red-800 border-red-300",
    medium: "bg-amber-100 text-amber-800 border-amber-300",
    low: "bg-blue-100 text-blue-800 border-blue-300",
  };

  const criticityLabels = {
    high: t('audit.criticalityHigh', 'Haute criticité'),
    medium: t('audit.criticalityMedium', 'Criticité moyenne'),
    low: t('audit.criticalityLow', 'Criticité faible'),
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{question.article}</Badge>
              <Badge className={criticityColors[question.criticality as keyof typeof criticityColors]}>
                {criticityLabels[question.criticality as keyof typeof criticityLabels]}
              </Badge>
            </div>
            <CardTitle className="text-xl">{question.questionText}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Response/Note Field */}
        <div>
          <label className="text-sm font-medium mb-2 block">{t('audit.responseNote', 'Réponse / Note')}</label>
          <Textarea
            placeholder={t('audit.responseNotePlaceholder', 'Décrivez votre réponse, les mesures mises en place, ou les éléments de contexte...')}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t('audit.responseNoteHint', 'Documentez votre réponse avant de définir le statut de conformité')}
          </p>
        </div>

        {/* Status Selection */}
        <div>
          <label className="text-sm font-medium mb-3 block">{t('audit.complianceStatus', 'Statut de conformité')}</label>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant={status === "conforme" ? "default" : "outline"}
              className={status === "conforme" ? "status-conforme" : ""}
              onClick={() => setStatus("conforme")}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {t('audit.compliant', 'Conforme')}
            </Button>
            <Button
              variant={status === "nok" ? "default" : "outline"}
              className={status === "nok" ? "status-nok" : ""}
              onClick={() => setStatus("nok")}
            >
              <XCircle className="mr-2 h-4 w-4" />
              {t('audit.nonCompliant', 'NOK')}
            </Button>
            <Button
              variant={status === "na" ? "default" : "outline"}
              className={status === "na" ? "status-na" : ""}
              onClick={() => setStatus("na")}
            >
              <MinusCircle className="mr-2 h-4 w-4" />
              {t('audit.notApplicable', 'N/A')}
            </Button>
          </div>
        </div>

        {/* Document Upload */}
        <div>
          <label className="text-sm font-medium mb-2 block">{t('audit.supportingDocuments', 'Documents justificatifs')}</label>
          <EvidenceUpload questionId={question.id} />
          <p className="text-xs text-muted-foreground mt-1">
            {t('audit.supportingDocumentsHint', 'Ajoutez des preuves documentaires pour justifier votre réponse')}
          </p>
        </div>

        {/* Missing Documents Button (if NOK) */}
        {status === "nok" && (
          <MissingDocumentsButton questionId={question.id} />
        )}

        {/* Comment */}
        <div>
          <label className="text-sm font-medium mb-2 block">{t('audit.comment', 'Commentaire')} ({t('common.optional', 'optionnel')})</label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('audit.commentPlaceholder', 'Ajoutez des notes ou des précisions...')}
            rows={3}
          />
        </div>

        {/* AI Recommendation */}
        <div>
          <Button
            variant="outline"
            onClick={handleAI}
            disabled={getRecommendation.isPending}
            className="w-full"
          >
            {getRecommendation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('audit.generating', 'Génération...')}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {t('audit.getAIRecommendation', 'Obtenir une recommandation IA')}
              </>
            )}
          </Button>

          {showAI && getRecommendation.data && (
            <Card className="mt-4 bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-sm">{t('audit.aiRecommendation', 'Recommandation IA')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Streamdown>{typeof getRecommendation.data.recommendation === 'string' ? getRecommendation.data.recommendation : JSON.stringify(getRecommendation.data.recommendation)}</Streamdown>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={!status || saveResponse.isPending} className="flex-1">
            {saveResponse.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('audit.saving', 'Enregistrement...')}
              </>
            ) : (
              t('audit.saveAndContinue', 'Enregistrer et continuer')
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


// Composant pour afficher les documents manquants liés à une question NOK
function MissingDocumentsButton({ questionId }: { questionId: number }) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: relatedDocs, isLoading } = trpc.documents.getRelatedDocuments.useQuery({ questionId });
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{t('audit.searchingDocuments', 'Recherche des documents attendus...')}</span>
      </div>
    );
  }
  
  if (!relatedDocs || relatedDocs.length === 0) {
    return null;
  }
  
  return (
    <Card className="bg-amber-50 border-amber-200">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-amber-900 mb-2">
              {t('audit.expectedDocuments', 'Documents attendus pour cette exigence')}
            </h4>
            <p className="text-sm text-amber-800 mb-3">
              {t('audit.requiredDocumentsCount', '{{count}} document(s) obligatoire(s) identifié(s) pour démontrer la conformité :', { count: relatedDocs.length })}
            </p>
            <ul className="space-y-1 mb-3">
              {relatedDocs.slice(0, 3).map((doc) => (
                <li key={doc.id} className="text-sm text-amber-900 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {doc.documentName}
                </li>
              ))}
              {relatedDocs.length > 3 && (
                <li className="text-sm text-amber-800 italic">
                  {t('audit.andOthers', '... et {{count}} autre(s)', { count: relatedDocs.length - 3 })}
                </li>
              )}
            </ul>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/documents")}
              className="bg-white hover:bg-amber-100 border-amber-300"
            >
              <FileText className="w-4 h-4 mr-2" />
              {t('audit.viewMissingDocuments', 'Voir les documents manquants')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
