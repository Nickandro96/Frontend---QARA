import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";

import { useWatchUpdates, useWatchRefreshMutation } from "@/api/watch";
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
  const [filters, setFilters] = React.useState<WatchFiltersValue>({
    search: "",
    type: "ALL",
    impact: "ALL",
    status: "ALL",
  });

  const query = useWatchUpdates({
    limit: 80,
    offset: 0,
    search: filters.search || undefined,
    type: filters.type === "ALL" ? undefined : (filters.type as any),
    impactLevel: filters.impact === "ALL" ? undefined : (filters.impact as any),
    status: filters.status === "ALL" ? undefined : (filters.status as any),
  });

  const refresh = useWatchRefreshMutation();
  const [selected, setSelected] = React.useState<WatchUpdate | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const data = query.data as any;
  const items: WatchUpdate[] = (data?.items ?? []) as WatchUpdate[];
  const meta: WatchMeta | undefined = data?.meta as WatchMeta | undefined;
  const profile: CompanyProfile | undefined = data?.companyProfile as CompanyProfile | undefined;

  const kpis = React.useMemo(() => computeKpis(items), [items]);

  const openDetails = (u: WatchUpdate) => {
    setSelected(u);
    setDrawerOpen(true);
  };

  const onReset = () => setFilters({ search: "", type: "ALL", impact: "ALL", status: "ALL" });

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

      <WatchFilters value={filters} onChange={setFilters} onReset={onReset} />

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
