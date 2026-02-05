import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Shield, Loader2, FileText, Calendar, User, MapPin, CheckCircle2, XCircle, AlertCircle, Clock, ArrowLeft } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function AuditDetail() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading } = useAuth();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const auditId = params.id ? parseInt(params.id) : null;

  // Fetch audit details
  const { data: audit, isLoading: auditLoading } = trpc.audit.getById.useQuery(
    { id: auditId! },
    { enabled: isAuthenticated && !!auditId }
  );

  // Fetch findings for this audit
  const { data: findings } = trpc.findings.list.useQuery(
    { auditId: auditId! },
    { enabled: isAuthenticated && !!auditId }
  );

  // Fetch actions for this audit
  const { data: actions } = trpc.actions.list.useQuery(
    { auditId: auditId! },
    { enabled: isAuthenticated && !!auditId }
  );

  if (loading || auditLoading) {
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

  if (!audit) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Audit introuvable</CardTitle>
            <CardDescription>L'audit demandé n'existe pas ou vous n'avez pas les permissions pour y accéder.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate statistics
  const totalFindings = findings?.length || 0;
  const criticalFindings = findings?.filter(f => f.criticality === 'Critique').length || 0;
  const majorFindings = findings?.filter(f => f.criticality === 'Majeure').length || 0;
  const minorFindings = findings?.filter(f => f.criticality === 'Mineure').length || 0;
  const observations = findings?.filter(f => f.criticality === 'Observation').length || 0;

  const totalActions = actions?.length || 0;
  const completedActions = actions?.filter(a => a.status === 'Completed').length || 0;
  const overdueActions = actions?.filter(a => a.status === 'Overdue').length || 0;

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const styles = {
      Draft: "bg-gray-100 text-gray-800",
      InProgress: "bg-blue-100 text-blue-800",
      Completed: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      Draft: "Brouillon",
      InProgress: "En cours",
      Completed: "Terminé",
      Cancelled: "Annulé",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getCriticalityBadge = (criticality: string) => {
    const styles = {
      Critique: "bg-red-100 text-red-800",
      Majeure: "bg-orange-100 text-orange-800",
      Mineure: "bg-yellow-100 text-yellow-800",
      Observation: "bg-blue-100 text-blue-800",
    };
    return styles[criticality as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Détail de l'Audit</h1>
            <p className="text-muted-foreground">Référence: {audit.reference || `#${audit.id}`}</p>
          </div>
        </div>
        
        {/* Generate Report Button - Only show for completed audits */}
        {audit.status === 'Completed' && (
          <Link href={`/reports/generate?auditId=${audit.id}`}>
            <Button size="lg" className="gap-2">
              <FileText className="h-5 w-5" />
              Générer Rapport
            </Button>
          </Link>
        )}
      </div>

      {/* Audit Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Informations Générales
            </CardTitle>
            <Badge className={getStatusBadge(audit.status)}>
              {getStatusLabel(audit.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date de début</p>
              <p className="text-base font-semibold">
                {audit.startDate ? new Date(audit.startDate).toLocaleDateString('fr-FR') : 'Non définie'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date de fin</p>
              <p className="text-base font-semibold">
                {audit.endDate ? new Date(audit.endDate).toLocaleDateString('fr-FR') : 'Non définie'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Auditeur(s)</p>
              <p className="text-base font-semibold">{audit.auditors || 'Non spécifié'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Site</p>
              <p className="text-base font-semibold">{audit.siteName || 'Non spécifié'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Type d'audit</p>
              <p className="text-base font-semibold">{audit.type || 'Non spécifié'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Référentiel(s)</p>
              <p className="text-base font-semibold">{audit.referentialNames || 'Non spécifié'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Findings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Constats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalFindings}</div>
            <p className="text-xs text-muted-foreground mt-1">Tous types confondus</p>
          </CardContent>
        </Card>

        {/* Critical Findings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              NC Critiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{criticalFindings}</div>
            <p className="text-xs text-muted-foreground mt-1">Priorité maximale</p>
          </CardContent>
        </Card>

        {/* Major Findings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              NC Majeures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{majorFindings}</div>
            <p className="text-xs text-muted-foreground mt-1">À traiter rapidement</p>
          </CardContent>
        </Card>

        {/* Actions Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedActions}/{totalActions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overdueActions > 0 && (
                <span className="text-red-600 font-medium">{overdueActions} en retard</span>
              )}
              {overdueActions === 0 && "Toutes dans les temps"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Findings List */}
      <Card>
        <CardHeader>
          <CardTitle>Constats ({totalFindings})</CardTitle>
          <CardDescription>Liste des non-conformités et observations identifiées</CardDescription>
        </CardHeader>
        <CardContent>
          {findings && findings.length > 0 ? (
            <div className="space-y-3">
              {findings.map((finding) => (
                <div key={finding.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getCriticalityBadge(finding.criticality)}>
                          {finding.criticality}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {finding.processName || 'Processus non spécifié'}
                        </span>
                      </div>
                      <h4 className="font-semibold mb-1">{finding.title}</h4>
                      <p className="text-sm text-muted-foreground">{finding.description}</p>
                    </div>
                    <Badge variant="outline">
                      {finding.status === 'Open' ? 'Ouvert' : 
                       finding.status === 'InProgress' ? 'En cours' : 
                       finding.status === 'Closed' ? 'Fermé' : finding.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p>Aucun constat identifié pour cet audit</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions List */}
      <Card>
        <CardHeader>
          <CardTitle>Plan d'Actions ({totalActions})</CardTitle>
          <CardDescription>Actions correctives et préventives</CardDescription>
        </CardHeader>
        <CardContent>
          {actions && actions.length > 0 ? (
            <div className="space-y-3">
              {actions.map((action) => (
                <div key={action.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={action.status === 'Completed' ? 'default' : 'secondary'}>
                          {action.status === 'Completed' ? 'Terminée' :
                           action.status === 'InProgress' ? 'En cours' :
                           action.status === 'Overdue' ? 'En retard' : 'Planifiée'}
                        </Badge>
                        {action.dueDate && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(action.dueDate).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold mb-1">{action.title}</h4>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                      {action.responsible && (
                        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Responsable: {action.responsible}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3" />
              <p>Aucune action définie pour cet audit</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note about report generation */}
      {audit.status !== 'Completed' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Génération de rapport non disponible</p>
                <p className="text-sm text-blue-700 mt-1">
                  Le bouton "Générer Rapport" sera disponible une fois l'audit marqué comme "Terminé".
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
