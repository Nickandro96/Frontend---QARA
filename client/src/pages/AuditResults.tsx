/**
 * Audit Results Page
 * Displays comprehensive results and statistics for a completed audit
 */

import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Download, ArrowLeft, CheckCircle2, XCircle, AlertTriangle, MinusCircle } from "lucide-react";
import { toast } from "sonner";

export default function AuditResults() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const auditId = parseInt(params.id || "0");

  const { data: audit, isLoading: loadingAudit } = trpc.audit.get.useQuery({ auditId });
  const { data: stats, isLoading: loadingStats } = trpc.audit.getStats.useQuery({ auditId });
  const generatePDFMutation = trpc.audit.generatePDF.useMutation();

  const handleDownloadPDF = async () => {
    toast.info("Génération du rapport PDF en cours...");
    try {
      const result = await generatePDFMutation.mutateAsync({ auditId });
      
      // Convert base64 to blob and download
      const byteCharacters = atob(result.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Rapport téléchargé avec succès");
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      toast.error("Erreur lors de la génération du rapport");
    }
  };

  if (loadingAudit || loadingStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!audit || !stats) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Audit non trouvé</h3>
            <Button onClick={() => setLocation("/audits")} className="mt-4">
              Retour à l'historique
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const complianceScore = stats.complianceScore || 0;
  const totalAnswered = stats.total - stats.notApplicable;

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/audits")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{audit.name}</h1>
            <p className="text-muted-foreground mt-1">
              Résultats de l'audit
            </p>
          </div>
        </div>
        <Button onClick={handleDownloadPDF}>
          <Download className="h-4 w-4 mr-2" />
          Télécharger le rapport PDF
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Score de Conformité</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {complianceScore.toFixed(1)}%
            </div>
            <Progress value={complianceScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Conforme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-3xl font-bold">{stats.compliant}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {totalAnswered > 0 ? ((stats.compliant / totalAnswered) * 100).toFixed(1) : 0}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Non-Conforme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-3xl font-bold">{stats.nonCompliant}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {totalAnswered > 0 ? ((stats.nonCompliant / totalAnswered) * 100).toFixed(1) : 0}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Partiellement Conforme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="text-3xl font-bold">{stats.partial}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {totalAnswered > 0 ? ((stats.partial / totalAnswered) * 100).toFixed(1) : 0}% du total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Statistiques Détaillées</CardTitle>
          <CardDescription>
            Répartition complète des réponses de l'audit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <div className="font-semibold">Conforme</div>
                  <div className="text-sm text-muted-foreground">
                    Exigences pleinement satisfaites
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {stats.compliant}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-3">
                <XCircle className="h-6 w-6 text-red-600" />
                <div>
                  <div className="font-semibold">Non-Conforme</div>
                  <div className="text-sm text-muted-foreground">
                    Exigences non satisfaites, actions correctives requises
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {stats.nonCompliant}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <div>
                  <div className="font-semibold">Partiellement Conforme</div>
                  <div className="text-sm text-muted-foreground">
                    Exigences partiellement satisfaites, améliorations nécessaires
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {stats.partial}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <MinusCircle className="h-6 w-6 text-gray-600" />
                <div>
                  <div className="font-semibold">Non Applicable</div>
                  <div className="text-sm text-muted-foreground">
                    Exigences non applicables au contexte
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {stats.notApplicable}
              </Badge>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total des questions évaluées</span>
              <span>{stats.total}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
              <span>Questions applicables</span>
              <span>{totalAnswered}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de l'Audit</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            {audit.auditorName && (
              <>
                <dt className="text-sm font-medium text-muted-foreground">Auditeur</dt>
                <dd className="text-sm">{audit.auditorName}</dd>
              </>
            )}
            {audit.auditorEmail && (
              <>
                <dt className="text-sm font-medium text-muted-foreground">Email auditeur</dt>
                <dd className="text-sm">{audit.auditorEmail}</dd>
              </>
            )}
            {audit.startDate && (
              <>
                <dt className="text-sm font-medium text-muted-foreground">Date de début</dt>
                <dd className="text-sm">{new Date(audit.startDate).toLocaleDateString("fr-FR")}</dd>
              </>
            )}
            {audit.endDate && (
              <>
                <dt className="text-sm font-medium text-muted-foreground">Date de fin</dt>
                <dd className="text-sm">{new Date(audit.endDate).toLocaleDateString("fr-FR")}</dd>
              </>
            )}
            <dt className="text-sm font-medium text-muted-foreground">Créé le</dt>
            <dd className="text-sm">{new Date(audit.createdAt).toLocaleDateString("fr-FR")}</dd>
            {audit.closedAt && (
              <>
                <dt className="text-sm font-medium text-muted-foreground">Clôturé le</dt>
                <dd className="text-sm">{new Date(audit.closedAt).toLocaleDateString("fr-FR")}</dd>
              </>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
