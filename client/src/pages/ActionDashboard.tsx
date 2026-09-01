import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  ClipboardCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  Calendar,
  User,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function ActionDashboard() {
  const { user } = useAuth();
  const { data: dashboard, isLoading } = trpc.capa.dashboard.useQuery();
  const utils = trpc.useUtils();
  const watchItemId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("watchItemId") : null;
  const { data: audits } = trpc.audit.list.useQuery(undefined, { enabled: Boolean(watchItemId) });
  const [watchAuditId, setWatchAuditId] = useState("");
  const createFromWatch = trpc.capa.createFromWatchItem.useMutation({
    onSuccess: (action) => {
      toast.success("Action CAPA créée depuis la veille");
      utils.capa.dashboard.invalidate();
      window.history.replaceState({}, "", "/action-plan");
      if (action?.auditId) window.location.href = `/audits/${action.auditId}/capa`;
    },
    onError: (error) => toast.error(error.message),
  });

  const actions = dashboard?.actions ?? [];
  const totalActions = actions.length;
  const completedActions = dashboard?.stats.clotureesCeMois ?? 0;
  const overdueActions = dashboard?.stats.enRetard ?? 0;

  const getStatusBadge = (action: any) => {
    const isOverdue = !String(action.statut).startsWith("cloturee") && action.dueDate && new Date(action.dueDate) < new Date();
    if (String(action.statut).startsWith("cloturee")) return <Badge className="bg-green-100 text-green-800">Terminée</Badge>;
    if (isOverdue) return <Badge className="bg-red-100 text-red-800">En retard</Badge>;
    if (action.statut === "en_cours" || action.statut === "a_verifier") return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">Planifiée</Badge>;
  };

  return (
    <div>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Plan d'action, {user?.name || user?.email}
          </h1>
          <p className="text-text-secondary text-lg">
            Actions correctives et préventives issues de vos audits
          </p>
        </div>

        {watchItemId && <Card className="border-red-200 bg-red-50 p-5"><h2 className="font-semibold">Créer une CAPA depuis l’alerte réglementaire</h2><p className="mt-1 text-sm text-muted-foreground">Choisissez l’audit auquel rattacher cette action. La source et le lien vers l’alerte seront conservés.</p><div className="mt-4 flex flex-col gap-3 sm:flex-row"><Select value={watchAuditId} onValueChange={setWatchAuditId}><SelectTrigger className="sm:w-96"><SelectValue placeholder="Sélectionner un audit"/></SelectTrigger><SelectContent>{(audits ?? []).map((audit:any)=><SelectItem key={audit.id} value={String(audit.id)}>{audit.name ?? `Audit ${audit.id}`}</SelectItem>)}</SelectContent></Select><Button disabled={!watchAuditId || createFromWatch.isPending} onClick={()=>createFromWatch.mutate({auditId:Number(watchAuditId),watchItemId})}>Créer l’action CAPA</Button></div></Card>}

        {isLoading ? (
          <Card className="p-8 text-center text-muted-foreground">Chargement…</Card>
        ) : totalActions === 0 && (dashboard?.unplanned.length ?? 0) === 0 ? (
          <Card className="p-8 text-center space-y-4">
            <ClipboardCheck className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              Aucune action pour le moment — les actions issues de vos audits apparaîtront ici.
            </p>
            <Link href="/audits">
              <Button className="gap-2">
                Voir mes audits
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <ClipboardCheck className="w-6 h-6 text-blue-500" />
                  <span className="text-3xl font-bold">{totalActions}</span>
                </div>
                <p className="text-sm text-muted-foreground">Actions CAPA</p>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <ClipboardCheck className="w-6 h-6 text-green-500" />
                  <span className="text-3xl font-bold">{completedActions}</span>
                </div>
                <p className="text-sm text-muted-foreground">Clôturées ce mois</p>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  <span className="text-3xl font-bold">{overdueActions}</span>
                </div>
                <p className="text-sm text-muted-foreground">En retard</p>
              </Card>
              <Card className="p-6"><div className="flex items-center justify-between mb-2"><AlertCircle className="w-6 h-6 text-orange-500"/><span className="text-3xl font-bold">{dashboard?.stats.ncOuvertes ?? 0}</span></div><p className="text-sm text-muted-foreground">NC sans CAPA</p></Card>
            </div>

            {(dashboard?.unplanned.length ?? 0) > 0 && <section><h2 className="mb-3 text-xl font-semibold">NC sans CAPA — à traiter</h2><div className="space-y-3">{dashboard!.unplanned.map((nc:any)=><Card key={`${nc.auditId}:${nc.questionKey}`} className="border-l-4 border-l-orange-500 p-4"><div className="flex items-start justify-between gap-4"><div><div className="flex gap-2"><Badge variant="destructive">{nc.criticality}</Badge><Badge variant="outline">{nc.articleReference ?? "Référence non renseignée"}</Badge></div><h3 className="mt-2 font-medium">{String(nc.questionText).slice(0,100)}{String(nc.questionText).length>100?"…":""}</h3><p className="text-sm text-muted-foreground">{nc.auditName}{nc.processName?` — ${nc.processName}`:""}</p></div><Link href={`/audits/${nc.auditId}/capa`}><Button size="sm">Créer et analyser la CAPA</Button></Link></div></Card>)}</div></section>}

            <div className="space-y-3">
              {actions.some((action:any)=>action.source === "veille_reglementaire") && <h2 className="text-xl font-semibold">Issues de la veille réglementaire</h2>}
              {actions.map((action: any) => (
                <Card key={action.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(action)}
                        {action.dueDate && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(action.dueDate).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold mb-1">{action.actionRetenue || action.actionRecommandee}</h4>
                      <p className="text-sm text-muted-foreground">{action.ecartIdentifie}</p>
                      {action.responsible && (
                        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Responsable: {action.responsible}
                        </p>
                      )}
                      {action.auditName && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Issu de l'audit : {action.auditName}
                        </p>
                      )}
                      {action.source === "veille_reglementaire" && <div className="mt-2"><Badge variant="outline">Veille réglementaire</Badge>{action.watchItem?.sourceUrl && <a className="ml-2 text-sm text-blue-700 underline" href={action.watchItem.sourceUrl} target="_blank" rel="noreferrer">Retour à la source officielle ↗</a>}</div>}
                    </div>
                    {action.auditId && (
                      <Link href={`/audits/${action.auditId}/capa`}>
                        <Button variant="ghost" size="sm" className="gap-2">
                          Voir l'audit
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
