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
  const [selectedReferential, setSelectedReferential] = useState<string>("all");
  const [selectedProcess, setSelectedProcess] = useState<string>("all");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCreatingAudit, setIsCreatingAudit] = useState(false);

  const { data: questions } = trpc.questions.list.useQuery(
    {
      referentialId: selectedReferential !== "all" ? parseInt(selectedReferential) : undefined,
      processId: selectedProcess !== "all" ? parseInt(selectedProcess) : undefined,
      economicRole: selectedRole || undefined,
    },
    { enabled: isAuthenticated && !!selectedRole }
  );

  const createAuditMutation = trpc.audit.create.useMutation({
    onSuccess: (data) => {
      toast.success("✅ Audit créé avec succès");
      setIsCreatingAudit(false);
    },
    onError: (error) => {
      toast.error("❌ Erreur lors de la création : " + (error.message || "Erreur inconnue"));
      setIsCreatingAudit(false);
    },
  });

  const handleCreateAudit = async () => {
    // Validation stricte
    if (!selectedRole) {
      toast.error("⚠️ Veuillez sélectionner un rôle légal");
      return;
    }

    if (!selectedReferential || selectedReferential === "all") {
      toast.error("⚠️ Veuillez sélectionner un référentiel");
      return;
    }

    if (!selectedProcess || selectedProcess === "all") {
      toast.error("⚠️ Veuillez sélectionner un processus");
      return;
    }

    setIsCreatingAudit(true);

    try {
      await createAuditMutation.mutateAsync({
        auditType: "internal",
        name: `Audit ${selectedReferential} - ${new Date().toLocaleDateString("fr-FR")}`,
        referentialIds: [parseInt(selectedReferential)],
      });
    } catch (error) {
      console.error("Erreur lors de la création d'audit :", error);
    }
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
              <Link href="/mdr/audit">
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
                value={selectedRole || "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    setSelectedRole(null);
                  } else {
                    setSelectedRole(value as "fabricant" | "importateur" | "distributeur");
                  }
                  setCurrentQuestionIndex(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('audit.selectLegalRole', 'Sélectionnez votre rôle légal')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Sélectionner un rôle --</SelectItem>
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
                <label className="text-sm font-medium mb-2 block">{t('audit.referential', 'Référentiel')} *</label>
                <Select
                  value={selectedReferential}
                  onValueChange={(v) => {
                    setSelectedReferential(v);
                    setCurrentQuestionIndex(0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('audit.selectReferential', 'Sélectionnez un référentiel')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">-- Tous les référentiels --</SelectItem>
                    {Array.isArray(referentials) && referentials.map((ref) => (
                      <SelectItem key={String(ref.id ?? Math.random())} value={String(ref.id ?? "none")}>
                        {String(ref.name ?? "Référentiel sans nom")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">{t('audit.process', 'Processus')} *</label>
                <Select
                  value={selectedProcess}
                  onValueChange={(v) => {
                    setSelectedProcess(v);
                    setCurrentQuestionIndex(0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('audit.selectProcess', 'Sélectionnez un processus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">-- Tous les processus --</SelectItem>
                    {Array.isArray(processes) && processes.map((proc) => (
                      <SelectItem key={String(proc.id ?? Math.random())} value={String(proc.id ?? "none")}>
                        {String(proc.name ?? "Processus sans nom")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bouton de création d'audit */}
            <div className="pt-4">
              <Button
                onClick={handleCreateAudit}
                disabled={isCreatingAudit || !selectedRole || selectedReferential === "all" || selectedProcess === "all"}
                className="w-full"
              >
                {isCreatingAudit ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Créer l'audit
                  </>
                )}
              </Button>
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
        ) : Array.isArray(questions) && questions.length > 0 ? (
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

            {/* Question Card */}
            {questions[currentQuestionIndex] && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{String(questions[currentQuestionIndex].referentialCode ?? "")}</Badge>
                    <Badge variant="secondary">{String(questions[currentQuestionIndex].processName ?? "")}</Badge>
                  </div>
                  <CardTitle className="text-xl">
                    {String(questions[currentQuestionIndex].questionDetailed ?? questions[currentQuestionIndex].questionShort ?? "")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Options de réponse */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-20 flex flex-col gap-2 border-2 hover:border-green-500 hover:bg-green-50">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <span className="text-xs font-medium">Conforme</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col gap-2 border-2 hover:border-red-500 hover:bg-red-50">
                      <XCircle className="h-6 w-6 text-red-500" />
                      <span className="text-xs font-medium">Non-Conforme</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col gap-2 border-2 hover:border-yellow-500 hover:bg-yellow-50">
                      <MinusCircle className="h-6 w-6 text-yellow-500" />
                      <span className="text-xs font-medium">Partielle</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col gap-2 border-2 hover:border-gray-500 hover:bg-gray-50">
                      <AlertCircle className="h-6 w-6 text-gray-500" />
                      <span className="text-xs font-medium">N/A</span>
                    </Button>
                  </div>

                  {/* Commentaires */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Commentaires</label>
                    <Textarea
                      placeholder="Ajouter des détails, preuves ou observations..."
                      className="min-h-24"
                    />
                  </div>

                  {/* Evidence Upload */}
                  <EvidenceUpload />
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucune question disponible</h3>
              <p className="text-muted-foreground">
                Veuillez sélectionner un référentiel et un processus valides
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
