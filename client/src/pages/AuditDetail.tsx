import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { auditTypeLabel } from "@/lib/auditLabels";
import { Shield, Loader2, FileText, Calendar, User, MapPin, CheckCircle2, XCircle, AlertCircle, Clock, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

const AUDIT_NATURE_LABEL: Record<string, string> = {
  interne: "Interne",
  fournisseur: "Fournisseur",
  blanc: "Audit à blanc",
  revue_conformite: "Revue de conformité",
};

export default function AuditDetail() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading } = useAuth();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const auditId = params.id ? parseInt(params.id) : null;

  // Fetch audit details
  const { data: audit, isLoading: auditLoading, refetch: refetchAudit } = trpc.audit.getById.useQuery(
    { id: auditId! },
    { enabled: isAuthenticated && !!auditId }
  );

  // Résolution du référentiel par code (jamais par ID en dur), même
  // mécanisme que AuditHistory.tsx (CORRECTIONS.md LOT 5, BUG 1).
  const { data: referentialsData } = trpc.referentials.list.useQuery();
  const codeById = new Map(
    (Array.isArray(referentialsData) ? referentialsData : []).map((r: any) => [Number(r.id), String(r.code).toUpperCase()])
  );

  const reopenAudit = trpc.audit.reopen.useMutation();
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const normalizedReopenReason = reopenReason.trim();
  const reopenReasonIsValid = normalizedReopenReason.length >= 5 && normalizedReopenReason.length <= 2000;

  const handleReopenAudit = async () => {
    if (!audit) return;
    try {
      await reopenAudit.mutateAsync({ auditId: audit.id, reason: normalizedReopenReason });
      await refetchAudit();
      toast.success("Audit réouvert avec succès");
      setReopenDialogOpen(false);
      setReopenReason("");
      navigate(`/audit/${audit.id}/questionnaire`);
    } catch {
      toast.error("Impossible de réouvrir l'audit", {
        description: "La réouverture n'a pas pu être enregistrée. Réessayez dans quelques instants.",
      });
    }
  };

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

  // Informations d'audit (Tâche D.7) — section éditable post-création,
  // facultative, alimente le rapport (page de garde / section 1 / annexes).
  const updateReportFields = trpc.audit.updateReportFields.useMutation();
  const [auditNature, setAuditNature] = useState("");
  const [scopeExclusions, setScopeExclusions] = useState("");
  const [auditTeam, setAuditTeam] = useState<Array<{ name: string; role: string; email: string }>>([]);
  const [representatives, setRepresentatives] = useState<Array<{ name: string; function: string }>>([]);

  useEffect(() => {
    if (!audit) return;
    setAuditNature((audit as any).auditNature || "");
    setScopeExclusions((audit as any).scopeExclusions || "");
    try {
      const team = (audit as any).auditTeam ? JSON.parse((audit as any).auditTeam) : [];
      setAuditTeam(Array.isArray(team) ? team : []);
    } catch {
      setAuditTeam([]);
    }
    try {
      const reps = (audit as any).auditeesRepresentatives ? JSON.parse((audit as any).auditeesRepresentatives) : [];
      setRepresentatives(Array.isArray(reps) ? reps : []);
    } catch {
      setRepresentatives([]);
    }
  }, [audit]);

  const handleSaveAuditInfo = async () => {
    if (!auditId) return;
    try {
      await updateReportFields.mutateAsync({
        id: auditId,
        auditNature: (auditNature || undefined) as any,
        scopeExclusions: scopeExclusions || undefined,
        auditTeam: auditTeam.filter((m) => m.name.trim()).length > 0
          ? auditTeam.filter((m) => m.name.trim())
          : undefined,
        auditeesRepresentatives: representatives.filter((r) => r.name.trim()).length > 0
          ? representatives.filter((r) => r.name.trim())
          : undefined,
      });
      await refetchAudit();
      toast.success("Informations d'audit enregistrées");
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement des informations d'audit");
    }
  };

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
  // Aucun statut "Overdue" n'existe réellement en base (actions.status:
  // open/in_progress/closed uniquement, voir drizzle/schema.ts) — dérivé
  // ici de dueDate plutôt que comparé à une valeur qui n'arrive jamais
  // (CORRECTIONS.md LOT 5, trouvé en corrigeant BUG 1/2).
  const overdueActions = actions?.filter(
    (a) => a.status !== 'Completed' && a.dueDate && new Date(a.dueDate) < new Date()
  ).length || 0;

  // Status badge styling — vraies valeurs de l'enum backend (schema.ts /
  // audit-router.ts), pas les libellés PascalCase inventés qui ne
  // matchaient jamais rien (CORRECTIONS.md LOT 5, BUG 1).
  const getStatusBadge = (status: string) => {
    const styles = {
      draft: "bg-gray-100 text-gray-800",
      planned: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      closed: "bg-purple-100 text-purple-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      draft: "Brouillon",
      planned: "Planifié",
      in_progress: "En cours",
      completed: "Terminé",
      closed: "Clôturé",
      cancelled: "Annulé",
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
        
        <div className="flex items-center gap-2">
          {audit.status === 'completed' && (
            <Button size="lg" variant="outline" className="gap-2" onClick={() => setReopenDialogOpen(true)} disabled={reopenAudit.isPending}>
              <Clock className="h-5 w-5" />
              Réouvrir l'audit
            </Button>
          )}

          {['draft', 'planned', 'in_progress'].includes(audit.status) && (
            <Button size="lg" variant="outline" className="gap-2" onClick={() => navigate(`/audit/${audit.id}/questionnaire`)}>
              <Clock className="h-5 w-5" />
              Reprendre l'audit
            </Button>
          )}

          {/* Generate Report Button - Only show for completed audits */}
          {audit.status === 'completed' && (
            <Link href={`/reports/generate?auditId=${audit.id}`}>
              <Button size="lg" className="gap-2">
                <FileText className="h-5 w-5" />
                Générer Rapport
              </Button>
            </Link>
          )}
        </div>
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
              <p className="text-base font-semibold">{(audit as any).auditors || 'Non spécifié'}</p>
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
              <p className="text-base font-semibold">{auditTypeLabel(audit.type)}</p>
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plan d'Actions ({totalActions})</CardTitle>
              <CardDescription>Actions correctives et préventives</CardDescription>
            </div>
            <Link href={`/audits/${audit.id}/capa`}>
              <Button variant="outline" size="sm">Plan d'action CAPA complet</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {actions && actions.length > 0 ? (
            <div className="space-y-3">
              {actions.map((action) => {
                const isOverdue = action.status !== 'Completed' && action.dueDate && new Date(action.dueDate) < new Date();
                return (
                <div key={action.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={action.status === 'Completed' ? 'default' : 'secondary'}>
                          {action.status === 'Completed' ? 'Terminée' :
                           isOverdue ? 'En retard' :
                           action.status === 'InProgress' ? 'En cours' : 'Planifiée'}
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
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3" />
              <p>Aucune action définie pour cet audit</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations d'audit (Tâche D.7) — facultatif, alimente le rapport */}
      <Card>
        <CardHeader>
          <CardTitle>Informations d'audit</CardTitle>
          <CardDescription>
            Facultatif — alimente la page de garde et le contexte du rapport (ISO 19011). Non renseigné
            si laissé vide, jamais de valeur par défaut inventée.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="auditNature">Nature de l'audit</Label>
            <Select value={auditNature} onValueChange={setAuditNature}>
              <SelectTrigger id="auditNature" className="mt-1">
                <SelectValue placeholder="Non renseigné" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AUDIT_NATURE_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="scopeExclusions">Exclusions de périmètre (avec justification)</Label>
            <Textarea
              id="scopeExclusions"
              className="mt-1"
              placeholder="Ex. : Exclusion ISO 13485 §7.3 (conception) — non applicable, activité de distribution uniquement."
              value={scopeExclusions}
              onChange={(e) => setScopeExclusions(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Équipe d'audit</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAuditTeam([...auditTeam, { name: "", role: "", email: "" }])}
              >
                <Plus className="h-3 w-3 mr-1" /> Ajouter
              </Button>
            </div>
            {auditTeam.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun membre renseigné.</p>
            )}
            <div className="space-y-2">
              {auditTeam.map((member, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    placeholder="Nom"
                    value={member.name}
                    onChange={(e) => {
                      const next = [...auditTeam];
                      next[i] = { ...next[i], name: e.target.value };
                      setAuditTeam(next);
                    }}
                  />
                  <Input
                    placeholder="Rôle (auditeur, observateur...)"
                    value={member.role}
                    onChange={(e) => {
                      const next = [...auditTeam];
                      next[i] = { ...next[i], role: e.target.value };
                      setAuditTeam(next);
                    }}
                  />
                  <Input
                    placeholder="Email (optionnel)"
                    value={member.email}
                    onChange={(e) => {
                      const next = [...auditTeam];
                      next[i] = { ...next[i], email: e.target.value };
                      setAuditTeam(next);
                    }}
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => setAuditTeam(auditTeam.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Personnes rencontrées (représentants de l'audité)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRepresentatives([...representatives, { name: "", function: "" }])}
              >
                <Plus className="h-3 w-3 mr-1" /> Ajouter
              </Button>
            </div>
            {representatives.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune personne renseignée.</p>
            )}
            <div className="space-y-2">
              {representatives.map((rep, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    placeholder="Nom"
                    value={rep.name}
                    onChange={(e) => {
                      const next = [...representatives];
                      next[i] = { ...next[i], name: e.target.value };
                      setRepresentatives(next);
                    }}
                  />
                  <Input
                    placeholder="Fonction"
                    value={rep.function}
                    onChange={(e) => {
                      const next = [...representatives];
                      next[i] = { ...next[i], function: e.target.value };
                      setRepresentatives(next);
                    }}
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => setRepresentatives(representatives.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSaveAuditInfo} disabled={updateReportFields.isPending}>
            {updateReportFields.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...
              </>
            ) : (
              "Enregistrer les informations d'audit"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Note about report generation */}
      {audit.status !== 'completed' && (
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

      <Dialog
        open={reopenDialogOpen}
        onOpenChange={(open) => {
          if (reopenAudit.isPending) return;
          setReopenDialogOpen(open);
          if (!open) setReopenReason("");
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Réouvrir cet audit ?</DialogTitle>
            <DialogDescription>
              La réouverture permettra de modifier à nouveau les réponses et les informations de l’audit.
              Indiquez la raison de cette décision afin d’en assurer la traçabilité.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="reopen-reason">Motif de la réouverture</Label>
              <span className="text-xs text-muted-foreground">{reopenReason.length}/2000</span>
            </div>
            <Textarea
              id="reopen-reason"
              value={reopenReason}
              maxLength={2000}
              rows={5}
              placeholder="Ex. : ajout de preuves complémentaires demandé lors de la revue."
              onChange={(event) => setReopenReason(event.target.value)}
              disabled={reopenAudit.isPending}
            />
            {reopenReason.length > 0 && normalizedReopenReason.length < 5 && (
              <p className="text-sm text-destructive">Le motif doit comporter au moins 5 caractères significatifs.</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReopenDialogOpen(false)} disabled={reopenAudit.isPending}>
              Annuler
            </Button>
            <Button type="button" onClick={handleReopenAudit} disabled={!reopenReasonIsValid || reopenAudit.isPending}>
              {reopenAudit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer la réouverture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
