import React, { useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ArrowLeft, Download, Printer, RefreshCw } from "lucide-react";

type StatusKey = "compliant" | "partial" | "non_compliant" | "not_applicable" | "in_progress";

const statusTone: Record<StatusKey, string> = {
  compliant: "bg-emerald-600",
  partial: "bg-amber-500",
  non_compliant: "bg-rose-600",
  not_applicable: "bg-slate-500",
  in_progress: "bg-slate-300",
};

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export default function MDRAuditReview() {
  const [, params] = useRoute("/mdr/audit/:auditId/review");
  const auditId = params?.auditId ? Number(params.auditId) : null;
  const enabled = !!auditId && Number.isFinite(auditId);

  const [, setLocation] = useLocation();

  const dashboardQuery = trpc.mdr.getAuditDashboard.useQuery(
    { auditId: (auditId ?? 0) as number },
    { enabled }
  );

  const listAuditsQuery = trpc.mdr.listAudits.useQuery(undefined, { enabled: true });

  const data = dashboardQuery.data as any;
  const stats = data?.stats || {
    totalQuestions: 0,
    answered: 0,
    compliant: 0,
    partial: 0,
    non_compliant: 0,
    not_applicable: 0,
    in_progress: 0,
    score: 0,
  };

  const statusList = [
    { key: "compliant", label: "Conformes", value: stats.compliant },
    { key: "partial", label: "Partiels", value: stats.partial },
    { key: "non_compliant", label: "Non conformes", value: stats.non_compliant },
    { key: "not_applicable", label: "N/A", value: stats.not_applicable },
    { key: "in_progress", label: "En cours", value: stats.in_progress },
  ] as Array<{ key: StatusKey; label: string; value: number }>;

  const topRisks = useMemo(() => (Array.isArray(data?.topRisks) ? data.topRisks : []), [data]);
  const auditsHistory = useMemo(() => {
    const rows = (listAuditsQuery.data as any)?.audits;
    return Array.isArray(rows) ? rows : [];
  }, [listAuditsQuery.data]);

  const printReport = () => window.print();

  if (!enabled) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="font-semibold">Audit invalide</div>
            <div className="text-sm text-muted-foreground">ID audit manquant.</div>
            <Button variant="secondary" onClick={() => setLocation("/mdr")}>Retour</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (dashboardQuery.isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Chargement dashboard audit...</div>;
  }

  if (dashboardQuery.error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-rose-700"><AlertCircle className="h-4 w-4" /> Erreur</div>
            <div className="text-sm text-muted-foreground">{(dashboardQuery.error as any)?.message || "Impossible de charger la review"}</div>
            <Button variant="secondary" onClick={() => setLocation(`/mdr/audit/${auditId}`)}>Reprendre audit</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen print:bg-white" id="print-area">
      <style>{`@media print {.no-print{display:none!important;} .print-grid{grid-template-columns:1fr!important;} }`}</style>

      <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur border-b border-slate-200 pb-3 mb-4 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-900">Audit Review & Dashboard</h1>
            <div className="text-sm text-slate-600">
              {(data?.audit?.name || `Audit #${auditId}`)} • {data?.audit?.siteName || "Site non renseigné"}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Statut: {data?.audit?.status || "draft"}</Badge>
            <Badge variant="outline">Progression: {percent(stats.answered, stats.totalQuestions)}%</Badge>
            <Button variant="outline" onClick={() => setLocation("/mdr")}><ArrowLeft className="h-4 w-4 mr-2" />Liste audits</Button>
            <Button variant="outline" onClick={printReport}><Printer className="h-4 w-4 mr-2" />Imprimer rapport</Button>
            <Button variant="outline" onClick={() => setLocation(`/mdr/audit/${auditId}`)}><RefreshCw className="h-4 w-4 mr-2" />Reprendre audit</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3 print-grid">
        <Card className="xl:col-span-1"><CardContent className="p-4"><div className="text-xs text-slate-500">Total questions</div><div className="text-2xl font-semibold">{stats.totalQuestions}</div></CardContent></Card>
        <Card className="xl:col-span-1"><CardContent className="p-4"><div className="text-xs text-slate-500">Répondu</div><div className="text-2xl font-semibold">{stats.answered}</div></CardContent></Card>
        <Card className="xl:col-span-1"><CardContent className="p-4"><div className="text-xs text-slate-500">Conformes</div><div className="text-2xl font-semibold text-emerald-700">{stats.compliant}</div></CardContent></Card>
        <Card className="xl:col-span-1"><CardContent className="p-4"><div className="text-xs text-slate-500">Partiels</div><div className="text-2xl font-semibold text-amber-600">{stats.partial}</div></CardContent></Card>
        <Card className="xl:col-span-1"><CardContent className="p-4"><div className="text-xs text-slate-500">Non conformes</div><div className="text-2xl font-semibold text-rose-700">{stats.non_compliant}</div></CardContent></Card>
        <Card className="xl:col-span-1"><CardContent className="p-4"><div className="text-xs text-slate-500">N/A</div><div className="text-2xl font-semibold text-slate-700">{stats.not_applicable}</div></CardContent></Card>
        <Card className="xl:col-span-1"><CardContent className="p-4"><div className="text-xs text-slate-500">Score conformité</div><div className="text-2xl font-semibold">{stats.score}%</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mt-4 print-grid">
        <Card className="xl:col-span-5">
          <CardContent className="p-4 space-y-3">
            <div className="font-medium">Répartition statuts</div>
            {statusList.map((row) => (
              <div key={row.key} className="space-y-1">
                <div className="flex justify-between text-sm"><span>{row.label}</span><span>{row.value}</span></div>
                <Progress value={percent(row.value, Math.max(stats.totalQuestions, 1))} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="xl:col-span-7">
          <CardContent className="p-4 space-y-3">
            <div className="font-medium">Heatmap Processus × Statut (fallback table)</div>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-3 py-2">Process</th>
                    <th className="text-left px-3 py-2">Conforme</th>
                    <th className="text-left px-3 py-2">Partiel</th>
                    <th className="text-left px-3 py-2">NOK</th>
                    <th className="text-left px-3 py-2">N/A</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries((data?.breakdown?.process || {}) as Record<string, any>).map(([processId, values]: any) => (
                    <tr key={processId} className="border-t">
                      <td className="px-3 py-2">{processId}</td>
                      <td className="px-3 py-2">{values?.compliant || 0}</td>
                      <td className="px-3 py-2">{values?.partial || 0}</td>
                      <td className="px-3 py-2">{values?.non_compliant || 0}</td>
                      <td className="px-3 py-2">{values?.not_applicable || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mt-4 print-grid">
        <Card className="xl:col-span-7">
          <CardContent className="p-4 space-y-3">
            <div className="font-medium">Top risques / NC majeures</div>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-3 py-2">Article</th>
                    <th className="text-left px-3 py-2">Question</th>
                    <th className="text-left px-3 py-2">Criticité</th>
                    <th className="text-left px-3 py-2">Statut</th>
                    <th className="text-left px-3 py-2 no-print">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {topRisks.map((risk: any) => (
                    <tr key={risk.questionKey} className="border-t align-top">
                      <td className="px-3 py-2 whitespace-nowrap">{risk.article || "n/a"}</td>
                      <td className="px-3 py-2">{risk.questionText}</td>
                      <td className="px-3 py-2">{risk.criticality || "n/a"}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-block h-2.5 w-2.5 rounded-full mr-2 ${statusTone[risk.responseValue as StatusKey] || "bg-slate-300"}`} />
                        {risk.responseValue}
                      </td>
                      <td className="px-3 py-2 no-print">
                        <Button size="sm" variant="outline" onClick={() => setLocation(`/mdr/audit/${auditId}`)}>Ouvrir question</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-5">
          <CardContent className="p-4 space-y-3">
            <div className="font-medium">Mes audits</div>
            <Separator />
            <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
              {auditsHistory.map((audit: any) => (
                <div key={audit.id} className="rounded-lg border p-3 bg-white">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm">{audit.name}</div>
                    <Badge variant="outline">{audit.status || "draft"}</Badge>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    rôle: {audit.economicRole || "n/a"} • MAJ: {audit.updatedAt ? new Date(audit.updatedAt).toLocaleDateString() : "n/a"}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 no-print">
                    <Button size="sm" variant="outline" onClick={() => setLocation(`/mdr/audit/${audit.id}`)}>Reprendre</Button>
                    <Button size="sm" variant="outline" onClick={() => setLocation(`/mdr/audit/${audit.id}/review`)}>Review</Button>
                    <Button size="sm" variant="outline" onClick={printReport}><Download className="h-3.5 w-3.5 mr-1" />Imprimer</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
