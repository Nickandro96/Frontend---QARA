import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";

import { useWatchUpdates, useWatchRefreshMutation, useWatchSources, useUnreadCount, useMarkAsRead, useWatchExport, useWatchExports, useWatchNotifications, useMarkNotificationRead, useWatchWebhooks, useCreateWatchWebhook, useDeleteWatchWebhook, useTestWatchWebhook } from "@/api/watch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WatchFilters, type WatchFiltersValue } from "./WatchFilters";
import { WatchFeed } from "./WatchFeed";
import { UpdateDetailsDrawer } from "./UpdateDetailsDrawer";
import { CompanyProfilePanel } from "./CompanyProfilePanel";
import type { WatchUpdate, WatchMeta, CompanyProfile } from "./types";

function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleString();
}

function computeKpis(items: WatchUpdate[]) {
  const now = Date.now();
  const since7d = now - 7 * 24 * 60 * 60 * 1000;
  const new7d = items.filter((i) => new Date(i.publishedAt as any).getTime() >= since7d).length;
  const critical = items.filter((i) => i.impactLevel === "Critical").length;
  const standards = items.filter((i) => i.type === "STANDARD").length;
  const guidanceUpdated = items.filter((i) => i.type === "GUIDANCE" && i.status === "UPDATED").length;
  return { new7d, critical, standards, guidanceUpdated };
}

export function WatchDashboard() {
  const initialShowAll = React.useMemo(() => localStorage.getItem("qara-watch-show-all") === "true", []);
  const [filters, setFilters] = React.useState<WatchFiltersValue>({
    search: "",
    type: "ALL",
    impact: "ALL",
    status: "ALL",
    market:"ALL", role:"ALL", sourceId:"ALL", readStatus:"all", sortBy:"relevance", showAll:initialShowAll,
  });

  const query = useWatchUpdates({
    limit: 80,
    offset: 0,
    search: filters.search || undefined,
    type: filters.type === "ALL" ? undefined : (filters.type as any),
    impactLevel: filters.impact === "ALL" ? undefined : (filters.impact as any),
    status: filters.status === "ALL" ? undefined : (filters.status as any),
    marketsImpacted: filters.market === "ALL" ? undefined : [filters.market], rolesImpacted: filters.role === "ALL" ? undefined : [filters.role], sourceIds: filters.sourceId === "ALL" ? undefined : [filters.sourceId], readStatus: filters.readStatus, sortBy: filters.sortBy, showAll:filters.showAll,
  });
  const sourcesQuery=useWatchSources(); const unreadQuery=useUnreadCount(); const markRead=useMarkAsRead();
  const notifications=useWatchNotifications();const markNotification=useMarkNotificationRead();const exportPdf=useWatchExport();const exportsHistory=useWatchExports();const webhooks=useWatchWebhooks();const createWebhook=useCreateWatchWebhook();const deleteWebhook=useDeleteWatchWebhook();const testWebhook=useTestWatchWebhook();
  const [exportForm,setExportForm]=React.useState({startDate:new Date(Date.now()-30*86400000).toISOString().slice(0,10),endDate:new Date().toISOString().slice(0,10),language:"fr" as "fr"|"en",status:"draft" as "draft"|"final",includeInformational:false});const [downloadUrl,setDownloadUrl]=React.useState<string|null>(null);const [webhookUrl,setWebhookUrl]=React.useState("");const [webhookSecret,setWebhookSecret]=React.useState<string|null>(null);

  const refresh = useWatchRefreshMutation();
  const [selected, setSelected] = React.useState<WatchUpdate | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const data = query.data as any;
  const items: WatchUpdate[] = (data?.items ?? []) as WatchUpdate[];
  const meta: WatchMeta | undefined = data?.meta as WatchMeta | undefined;
  const profile: CompanyProfile | undefined = data?.companyProfile as CompanyProfile | undefined;

  const kpis = React.useMemo(() => computeKpis(items), [items]);
  React.useEffect(()=>{localStorage.setItem("qara-watch-show-all",String(filters.showAll));},[filters.showAll]);

  const openDetails = (u: WatchUpdate) => {
    if(u.isRead===false) markRead.mutate({itemId:u.id},{onSuccess:()=>{query.refetch();unreadQuery.refetch();}});
    setSelected(u);
    setDrawerOpen(true);
  };

  const onReset = () => setFilters({ search: "", type: "ALL", impact: "ALL", status: "ALL", market:"ALL",role:"ALL",sourceId:"ALL",readStatus:"all",sortBy:"relevance",showAll:false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Veille réglementaire</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            Dernière synchro: <span className="font-medium">{formatDateTime(meta?.lastRefresh)}</span>
            {meta?.stale ? <span className="ml-2"><Badge variant="secondary">Cache stale</Badge></span> : null}
            {meta?.refreshInProgress ? (
              <span className="ml-2 inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs">Refresh en cours</span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => refresh.mutate({ trigger: "manual" })}
            disabled={refresh.isPending}
          >
            {refresh.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Rafraîchir (admin)
          </Button>
        </div>
      </div>

      {meta?.degraded ? (
        <Alert>
          <AlertTitle>Mode dégradé</AlertTitle>
          <AlertDescription>
            Certaines sources externes sont indisponibles. Le feed affiche le cache DB. (Détails source dans la liste ci-dessous)
          </AlertDescription>
        </Alert>
      ) : null}

      {meta?.sourceHealth?.length ? (
        <div className="flex flex-wrap gap-2">
          {meta.sourceHealth.map((s) => (
            <Badge key={s.name} variant={s.ok ? "outline" : "destructive"}>
              {s.name}: {s.ok ? "OK" : "DOWN"}{s.items != null ? ` • ${s.items}` : ""}
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="grid gap-2 md:grid-cols-3">{((sourcesQuery.data as any)?.sources??[]).map((s:any)=>{const age=s.lastSuccessAt?Date.now()-new Date(s.lastSuccessAt).getTime():Infinity;const state=s.lastError?"Erreur":age>86400000?"Données de plus de 24h":"À jour";return <div key={s.id} className="rounded border bg-card p-3 text-xs"><div className="font-medium">{s.name}</div><div>last_success_at : {formatDateTime(s.lastSuccessAt)}</div><Badge variant={s.lastError?"destructive":"outline"}>{state}</Badge>{s.lastError?<div className="mt-1 text-destructive">Erreur : {String(s.lastError).slice(0,100)}</div>:null}</div>})}</div>
      <div className="text-sm">Éléments non lus : <Badge variant="destructive">{(unreadQuery.data as any)?.count??0}</Badge></div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Nouveautés (7j)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{kpis.new7d}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Critical</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{kpis.critical}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Normes</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{kpis.standards}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Guidance révisées</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{kpis.guidanceUpdated}</CardContent>
        </Card>
      </div>

      {profile ? <CompanyProfilePanel profile={profile} /> : null}
      {data?.scoringApplied ? <div className="rounded-lg border bg-muted/30 p-3 text-sm"><span className="font-medium">Votre veille est personnalisée pour :</span> {(data.profileUsed?.referentials??[]).join(", ")||"tous référentiels"} | Marché {(data.profileUsed?.markets??[]).join(", ")||"tous"} | {(data.profileUsed?.roles??[]).join(", ")||"tous rôles"} | {data.hiddenBelowThreshold??0} item(s) masqué(s) sous le seuil de pertinence</div> : <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">Aucun profil de veille enregistré : tous les items sont affichés.</div>}
      {data?.limited?<Alert><AlertTitle>Historique limité</AlertTitle><AlertDescription>{data.upgradeMessage}</AlertDescription></Alert>:null}
      <Card><CardHeader><CardTitle className="text-sm">Notifications réglementaires <Badge variant="destructive">{(notifications.data as any)?.unreadCount??0}</Badge></CardTitle></CardHeader><CardContent className="space-y-2">{((notifications.data as any)?.notifications??[]).slice(0,5).map((n:any)=><button key={n.notification.id} className="block w-full rounded border p-2 text-left text-xs" onClick={()=>markNotification.mutate({notificationId:n.notification.id},{onSuccess:()=>notifications.refetch()})}><span className="font-medium">{n.item.title}</span><span className="block text-muted-foreground">{n.item.sourceName}</span></button>)}{!(notifications.data as any)?.unreadCount?<div className="text-xs text-muted-foreground">Aucune notification non lue.</div>:null}</CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">Rapport PDF de surveillance</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-5"><Input type="date" value={exportForm.startDate} onChange={e=>setExportForm(s=>({...s,startDate:e.target.value}))}/><Input type="date" value={exportForm.endDate} onChange={e=>setExportForm(s=>({...s,endDate:e.target.value}))}/><Select value={exportForm.language} onValueChange={language=>setExportForm(s=>({...s,language:language as any}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="fr">Français</SelectItem><SelectItem value="en">English</SelectItem></SelectContent></Select><Select value={exportForm.status} onValueChange={status=>setExportForm(s=>({...s,status:status as any}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="draft">Brouillon</SelectItem><SelectItem value="final">Final</SelectItem></SelectContent></Select><Button disabled={exportPdf.isPending} onClick={()=>exportPdf.mutate(exportForm,{onSuccess:(r:any)=>{setDownloadUrl(r.url);exportsHistory.refetch()}})}>{exportPdf.isPending?"Génération…":"Générer le PDF"}</Button>{downloadUrl?<a className="text-sm underline" href={downloadUrl} target="_blank" rel="noreferrer">Télécharger le rapport</a>:null}{((exportsHistory.data as any)?.exports??[]).slice(0,3).map((report:any)=><a key={report.id} className="text-xs underline" href={report.url} target="_blank" rel="noreferrer">{report.periodStart} → {report.periodEnd}</a>)}{exportPdf.error?<div className="text-xs text-destructive">{exportPdf.error.message}</div>:null}</CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">Webhooks Enterprise</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex gap-2"><Input placeholder="https://qms.example.com/qara" value={webhookUrl} onChange={e=>setWebhookUrl(e.target.value)}/><Button onClick={()=>createWebhook.mutate({url:webhookUrl,events:["action_required"]},{onSuccess:(r:any)=>{setWebhookSecret(r.secret);setWebhookUrl("");webhooks.refetch()}})}>Créer</Button></div>{webhookSecret?<Alert><AlertTitle>Secret — affiché une seule fois</AlertTitle><AlertDescription className="break-all">{webhookSecret}</AlertDescription></Alert>:null}{((webhooks.data as any)?.webhooks??[]).map((w:any)=><div key={w.id} className="flex items-center justify-between rounded border p-2 text-xs"><span>{w.url} — {w.active?"Actif":"Désactivé"}</span><div className="flex gap-2"><Button size="sm" variant="outline" onClick={()=>testWebhook.mutate({webhookId:w.id})}>Tester</Button><Button size="sm" variant="secondary" onClick={()=>deleteWebhook.mutate({webhookId:w.id},{onSuccess:()=>webhooks.refetch()})}>Supprimer</Button></div></div>)}{testWebhook.data?<div className="text-xs text-emerald-700">Webhook de test envoyé.</div>:null}{webhooks.error?<div className="text-xs text-muted-foreground">Disponible avec le plan Entreprise.</div>:null}</CardContent></Card>

      <WatchFilters value={filters} onChange={setFilters} onReset={onReset} sources={(sourcesQuery.data as any)?.sources??[]} />

      {query.isLoading ? (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Chargement…
        </div>
      ) : query.isError ? (
        <div className="rounded-lg border bg-card p-6 text-sm text-destructive">
          Erreur de chargement de la veille.
        </div>
      ) : (
        <WatchFeed items={items} onOpenDetails={openDetails} />
      )}

      <UpdateDetailsDrawer open={drawerOpen} onOpenChange={setDrawerOpen} update={selected} />
    </div>
  );
}
