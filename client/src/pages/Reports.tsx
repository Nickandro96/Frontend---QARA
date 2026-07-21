import { LockedFeature } from "@/components/LockedFeature";
import { hasCapability } from "@/lib/plans";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, FileSpreadsheet, FileText, Download } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { exportAuditToExcel, exportAuditToPDF } from "@/lib/exportUtils";
import { useState } from "react";

export default function Reports() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  const canExport = hasCapability("canExportReports", profile, user);
  const { data: globalScore } = trpc.audit.getScore.useQuery({}, { enabled: isAuthenticated });
  const [exporting, setExporting] = useState(false);

  // L'export porte sur l'audit le plus récent de l'utilisateur (audit.list
  // est déjà trié par date de création décroissante côté serveur) —
  // résolution du type par code de référentiel, jamais par ID en dur (voir
  // INVENTAIRE-BUGS.md #1/#2).
  const { data: audits } = trpc.audit.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: referentialsData } = trpc.referentials.list.useQuery();
  const primaryAudit = Array.isArray(audits) && audits.length > 0 ? (audits[0] as any) : null;
  const codeById = new Map(
    (Array.isArray(referentialsData) ? referentialsData : []).map((r: any) => [r.id, String(r.code).toUpperCase()])
  );
  const primaryAuditCodes = (
    primaryAudit?.referentialIds ? JSON.parse(primaryAudit.referentialIds) : []
  ).map((id: number) => codeById.get(id));
  const isMdr = primaryAuditCodes.includes("MDR");
  const isIso = primaryAuditCodes.includes("ISO9001") || primaryAuditCodes.includes("ISO13485");
  const primaryAuditId = primaryAudit?.id ?? 0;

  const mdrQuestions = trpc.mdr.getQuestionsForAudit.useQuery(
    { auditId: primaryAuditId },
    { enabled: isAuthenticated && isMdr && !!primaryAuditId }
  );
  const mdrResponses = trpc.mdr.getResponses.useQuery(
    { auditId: primaryAuditId },
    { enabled: isAuthenticated && isMdr && !!primaryAuditId }
  );
  const isoQuestions = trpc.iso.getQuestionsForAudit.useQuery(
    { auditId: primaryAuditId },
    { enabled: isAuthenticated && isIso && !!primaryAuditId }
  );
  const isoResponses = trpc.iso.getResponses.useQuery(
    { auditId: primaryAuditId },
    { enabled: isAuthenticated && isIso && !!primaryAuditId }
  );

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

  const handleExport = async (format: "excel" | "pdf") => {
    if (!user || !globalScore) {
      toast.error("Impossible d'exporter : données manquantes");
      return;
    }
    if (!primaryAudit) {
      toast.error("Aucun audit trouvé à exporter");
      return;
    }
    if (!isMdr && !isIso) {
      toast.error("Export non disponible pour ce type d'audit pour le moment (IVDR/FDA/MDSAP/ISO14971)");
      return;
    }

    setExporting(true);
    try {
      // Utilise le client tRPC déjà configuré (cookie de session inclus)
      // plutôt que des fetch() bruts vers un chemin/namespace inexistants
      // (voir INVENTAIRE-BUGS.md #2) — mdr/iso.getQuestionsForAudit et
      // getResponses existent déjà et sont déjà chargés ci-dessus.
      const rawQuestions = (isMdr ? mdrQuestions.data : isoQuestions.data) as any;
      const rawResponses = (isMdr ? mdrResponses.data : isoResponses.data) as any;
      const questionRows: any[] = Array.isArray(rawQuestions)
        ? rawQuestions
        : Array.isArray(rawQuestions?.questions)
          ? rawQuestions.questions
          : [];
      const responseRows: any[] = Array.isArray(rawResponses) ? rawResponses : [];

      if (questionRows.length === 0) {
        toast.error("Aucune question chargée pour cet audit — réessayez dans un instant");
        setExporting(false);
        return;
      }

      const questions = questionRows.map((q: any) => ({
        id: q.id,
        question: q.questionText,
        article: q.article || "",
        criticality: q.criticality || "",
      }));

      const responseByKey = new Map(responseRows.map((r: any) => [r.questionKey, r]));
      const RESPONSE_STATUS_MAP: Record<string, "conforme" | "nok" | "na"> = {
        compliant: "conforme",
        non_compliant: "nok",
        partial: "nok",
        not_applicable: "na",
      };
      const responses = questionRows
        .map((q: any) => {
          const r = responseByKey.get(q.questionKey);
          if (!r || r.responseValue === "in_progress" || !r.responseValue) return null;
          return {
            questionId: q.id,
            response: r.responseValue,
            status: RESPONSE_STATUS_MAP[r.responseValue] ?? "na",
            comment: r.responseComment || undefined,
          };
        })
        .filter(Boolean) as any[];

      if (format === "excel") {
        await exportAuditToExcel(
          globalScore,
          questions,
          responses,
          profile?.economicRole || "Fabricant"
        );
        toast.success("✅ Export Excel téléchargé avec succès !");
      } else {
        exportAuditToPDF(
          globalScore,
          questions,
          responses,
          profile?.economicRole || "Fabricant"
        );
        toast.success("✅ Export PDF téléchargé avec succès !");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("❌ Erreur lors de l'export. Veuillez réessayer.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Rapports & Exports</h1>

        {/* Score Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Résumé de Conformité</CardTitle>
            <CardDescription>Vue d'ensemble de votre audit actuel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Score Global</p>
                <p className="text-3xl font-bold text-primary">{globalScore?.score.toFixed(1) || "0"}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Conforme</p>
                <p className="text-3xl font-bold text-green-600">{globalScore?.conforme || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Non-conformités</p>
                <p className="text-3xl font-bold text-red-600">{globalScore?.nok || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">N/A</p>
                <p className="text-3xl font-bold text-gray-600">{globalScore?.na || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        {canExport ? (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <FileSpreadsheet className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Export Excel</CardTitle>
                <CardDescription>
                  Rapport détaillé avec résumé, résultats par processus, plan d'action et index des preuves
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => handleExport("excel")} className="w-full" disabled={exporting}>
                  {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Télécharger Excel
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-10 w-10 text-red-600 mb-2" />
                <CardTitle>Export PDF</CardTitle>
                <CardDescription>
                  Rapport professionnel prêt pour les audits ON et les inspections autorités
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => handleExport("pdf")} variant="outline" className="w-full" disabled={exporting}>
                  {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Télécharger PDF
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <LockedFeature
            feature="Export des rapports"
            description="Le rapport reste consultable à l'écran. L'export Excel/PDF nécessite le Plan Pro."
            variant="block"
          />
        )}

        {/* Advanced Features */}
        <div className="mt-8 space-y-6">
          <h2 className="text-2xl font-bold">Fonctionnalités Avancées</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Audit Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Rapports d'Audit Complets</CardTitle>
                <CardDescription>
                  Générez des rapports d'audit professionnels avec graphiques et annexes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Rapport complet avec graphiques Chart.js</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Plan d'action priorisé par criticité</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Index des preuves avec références</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Graphiques de progression temporelle</span>
                  </div>
                </div>
                <Link href="/reports/history">
                  <Button className="w-full mt-4">
                    Accéder aux Rapports d'Audit
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Comparative Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Rapports Comparatifs</CardTitle>
                <CardDescription>
                  Comparez l'évolution de la conformité entre deux audits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Delta de conformité (%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>NC fermées vs nouvelles NC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Évolution des actions correctives</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Recommandations automatisées</span>
                  </div>
                </div>
                <Link href="/reports/comparative">
                  <Button className="w-full mt-4" variant="outline">
                    Comparer des Audits
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Audits List */}
            <Card>
              <CardHeader>
                <CardTitle>Liste des Audits</CardTitle>
                <CardDescription>
                  Accédez à tous vos audits avec filtres et recherche
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Filtres par statut et site</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Recherche par nom/référence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Barre de progression conformité</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Accès rapide aux détails</span>
                  </div>
                </div>
                <Link href="/audits">
                  <Button className="w-full mt-4" variant="outline">
                    Voir Tous les Audits
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Audits</CardTitle>
                <CardDescription>
                  Vue d'ensemble avec accès rapide aux audits récents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>5 derniers audits affichés</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Bouton "Voir détails" pour chaque audit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Statut et dates visibles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Navigation fluide vers détails</span>
                  </div>
                </div>
                <Link href="/dashboard">
                  <Button className="w-full mt-4" variant="outline">
                    Retour au Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
