import { UpgradeRequired } from "@/components/UpgradeRequired";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Shield, Loader2, FileSpreadsheet, FileText, Download } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { exportAuditToExcel, exportAuditToPDF } from "@/lib/exportUtils";
import { useState } from "react";

export default function Reports() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });

  // Block FREE users
  if (isAuthenticated && profile && profile.subscriptionTier === 'free' && user?.role !== 'admin') {
    return <UpgradeRequired feature="Rapports & Exports" />;
  }
  const { data: globalScore } = trpc.audit.getScore.useQuery({}, { enabled: isAuthenticated });
  const [exporting, setExporting] = useState(false);

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
    
    setExporting(true);
    try {
      // Fetch all questions for the user's role
      const questions = await fetch(`/api/trpc/questions.list?input=${encodeURIComponent(JSON.stringify({
        referentialId: undefined,
        processId: undefined,
        economicRole: profile?.economicRole || "fabricant"
      }))}`).then(r => r.json()).then(d => d.result?.data || []);
      
      // Fetch real user responses
      const questionIds = questions.map((q: any) => q.id);
      const responses = await fetch(`/api/trpc/audit.getResponses?input=${encodeURIComponent(JSON.stringify({
        questionIds
      }))}`).then(r => r.json()).then(d => d.result?.data || []);
      
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
                <Button variant="ghost">Audit</Button>
              </Link>
              <Link href="/reports">
                <Button variant="ghost" className="font-medium">Rapports</Button>
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
