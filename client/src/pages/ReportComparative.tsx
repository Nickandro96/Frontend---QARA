import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, TrendingDown, Minus, FileText, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function ReportComparative() {
  const { isAuthenticated, loading } = useAuth();
  const [audit1Id, setAudit1Id] = useState<string>("");
  const [audit2Id, setAudit2Id] = useState<string>("");

  const { data: audits } = trpc.audit.listAudits.useQuery({}, { enabled: isAuthenticated });
  const { data: comparison, isLoading: isComparing } = trpc.reports.compare.useQuery(
    { audit1Id: parseInt(audit1Id), audit2Id: parseInt(audit2Id) },
    { enabled: isAuthenticated && !!audit1Id && !!audit2Id }
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

  const completedAudits = audits?.filter(a => a.status === "completed") || [];

  const getTrendIcon = (delta: number) => {
    if (delta > 0) return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (delta < 0) return <TrendingDown className="h-5 w-5 text-red-600" />;
    return <Minus className="h-5 w-5 text-gray-400" />;
  };

  const getTrendColor = (delta: number) => {
    if (delta > 0) return "text-green-600";
    if (delta < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost">← Retour au Dashboard</Button>
          </Link>
          <h1 className="text-xl font-bold">Rapport Comparatif</h1>
          <div className="w-32" /> {/* Spacer */}
        </div>
      </header>

      <div className="container py-8 space-y-6">
        {/* Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Sélection des Audits à Comparer
            </CardTitle>
            <CardDescription>
              Choisissez deux audits terminés pour analyser l'évolution de la conformité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Audit Initial (Avant)</label>
                <Select value={audit1Id} onValueChange={setAudit1Id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un audit" />
                  </SelectTrigger>
                  <SelectContent>
                    {completedAudits.map((audit) => (
                      <SelectItem key={audit.id} value={audit.id.toString()}>
                        {audit.name} - {audit.startDate ? new Date(audit.startDate).toLocaleDateString("fr-FR") : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Audit Final (Après)</label>
                <Select value={audit2Id} onValueChange={setAudit2Id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un audit" />
                  </SelectTrigger>
                  <SelectContent>
                    {completedAudits.map((audit) => (
                      <SelectItem key={audit.id} value={audit.id.toString()}>
                        {audit.name} - {audit.startDate ? new Date(audit.startDate).toLocaleDateString("fr-FR") : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {audit1Id && audit2Id && audit1Id === audit2Id && (
              <p className="text-sm text-amber-600 mt-4">
                ⚠️ Veuillez sélectionner deux audits différents pour la comparaison
              </p>
            )}
          </CardContent>
        </Card>

        {/* Comparison Results */}
        {isComparing && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {comparison && audit1Id !== audit2Id && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Taux de Conformité</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{comparison.conformityRateDelta.toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground">
                        {comparison.audit1ConformityRate.toFixed(1)}% → {comparison.audit2ConformityRate.toFixed(1)}%
                      </p>
                    </div>
                    {getTrendIcon(comparison.conformityRateDelta)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Non-Conformités</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{comparison.totalFindingsDelta}</p>
                      <p className="text-sm text-muted-foreground">
                        {comparison.audit1TotalFindings} → {comparison.audit2TotalFindings}
                      </p>
                    </div>
                    {getTrendIcon(-comparison.totalFindingsDelta)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Actions Complétées</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{comparison.completedActionsDelta}</p>
                      <p className="text-sm text-muted-foreground">
                        {comparison.audit1CompletedActions} → {comparison.audit2CompletedActions}
                      </p>
                    </div>
                    {getTrendIcon(comparison.completedActionsDelta)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Findings Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Non-Conformités par Criticité</CardTitle>
                <CardDescription>
                  Comparaison détaillée des constats entre les deux audits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["critical", "high", "medium", "low"].map((criticality) => {
                    const audit1Count = comparison.audit1FindingsByCriticality[criticality] || 0;
                    const audit2Count = comparison.audit2FindingsByCriticality[criticality] || 0;
                    const delta = audit2Count - audit1Count;

                    const labels = {
                      critical: "Critiques",
                      high: "Majeures",
                      medium: "Mineures",
                      low: "Observations",
                    };

                    return (
                      <div key={criticality} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{labels[criticality as keyof typeof labels]}</p>
                          <p className="text-sm text-muted-foreground">
                            {audit1Count} → {audit2Count}
                          </p>
                        </div>
                        <div className={`flex items-center gap-2 ${getTrendColor(-delta)}`}>
                          {getTrendIcon(-delta)}
                          <span className="font-bold">{Math.abs(delta)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Closed and New Findings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">NC Fermées</CardTitle>
                  <CardDescription>
                    Non-conformités résolues entre les deux audits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {comparison.closedFindings.length > 0 ? (
                    <ul className="space-y-2">
                      {comparison.closedFindings.slice(0, 5).map((finding) => (
                        <li key={finding.id} className="text-sm border-l-2 border-green-500 pl-3 py-1">
                          {finding.title}
                        </li>
                      ))}
                      {comparison.closedFindings.length > 5 && (
                        <p className="text-sm text-muted-foreground pt-2">
                          ... et {comparison.closedFindings.length - 5} autres
                        </p>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune NC fermée</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-amber-600">Nouvelles NC</CardTitle>
                  <CardDescription>
                    Nouvelles non-conformités identifiées
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {comparison.newFindings.length > 0 ? (
                    <ul className="space-y-2">
                      {comparison.newFindings.slice(0, 5).map((finding) => (
                        <li key={finding.id} className="text-sm border-l-2 border-amber-500 pl-3 py-1">
                          {finding.title}
                        </li>
                      ))}
                      {comparison.newFindings.length > 5 && (
                        <p className="text-sm text-muted-foreground pt-2">
                          ... et {comparison.newFindings.length - 5} autres
                        </p>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune nouvelle NC</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions Recommandées</CardTitle>
                <CardDescription>
                  Suggestions basées sur l'analyse comparative
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {comparison.conformityRateDelta > 0 && (
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span className="text-sm">
                        Excellente progression ! Le taux de conformité a augmenté de {comparison.conformityRateDelta.toFixed(1)}%.
                      </span>
                    </li>
                  )}
                  {comparison.conformityRateDelta < 0 && (
                    <li className="flex items-start gap-2">
                      <span className="text-red-600">⚠</span>
                      <span className="text-sm">
                        Attention : Le taux de conformité a diminué de {Math.abs(comparison.conformityRateDelta).toFixed(1)}%. 
                        Analysez les nouvelles NC pour identifier les causes.
                      </span>
                    </li>
                  )}
                  {comparison.newFindings.length > 0 && (
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600">→</span>
                      <span className="text-sm">
                        {comparison.newFindings.length} nouvelles NC identifiées. Priorisez les NC critiques et majeures.
                      </span>
                    </li>
                  )}
                  {comparison.closedFindings.length > 0 && (
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span className="text-sm">
                        {comparison.closedFindings.length} NC fermées. Continuez vos efforts de remédiation.
                      </span>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Export Button */}
            <div className="flex justify-end">
              <Link href={`/reports/generate?auditId=${audit2Id}&compareWith=${audit1Id}`}>
                <Button className="gap-2">
                  <FileText className="h-4 w-4" />
                  Générer Rapport Comparatif PDF
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </>
        )}

        {!comparison && !isComparing && audit1Id && audit2Id && audit1Id !== audit2Id && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>Sélectionnez deux audits terminés pour voir la comparaison</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
