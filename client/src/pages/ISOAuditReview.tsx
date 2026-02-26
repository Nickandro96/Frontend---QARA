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

export default function ISOAuditReview() {
  const [, params] = useRoute("/iso/audit/:auditId/review");
  const auditId = params?.auditId ? Number(params.auditId) : null;
  const enabled = !!auditId && Number.isFinite(auditId);

  const [, setLocation] = useLocation();

  const utils = trpc.useUtils();

  const dashboardQuery = trpc.iso.getAuditDashboard.useQuery({ auditId: (auditId ?? 0) as number }, { enabled });

  const listAuditsQuery = trpc.iso.listAudits.useQuery(undefined, { enabled: true });

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

  function escapeHtml(s: string) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function downloadAsWord(filename: string, htmlBody: string) {
    const full = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(filename)}</title>
<style>
  body{font-family:Calibri,Arial,sans-serif; font-size:11pt; color:#111827;}
  h1{font-size:18pt;margin:0 0 8px 0;}
  h2{font-size:14pt;margin:18px 0 8px 0;}
  h3{font-size:12pt;margin:14px 0 6px 0;}
  .meta{font-size:10pt;color:#374151;margin-bottom:10px;}
  .pill{display:inline-block;padding:2px 8px;border-radius:999px;border:1px solid #e5e7eb;font-size:9pt;margin-right:6px;}
  table{border-collapse:collapse;width:100%; margin-top:8px;}
  th,td{border:1px solid #e5e7eb;padding:6px;vertical-align:top;}
  th{background:#f8fafc;text-align:left;}
  .small{font-size:9pt;color:#4b5563;}
  .nc{color:#b91c1c;font-weight:600;}
  .partial{color:#b45309;font-weight:600;}
  .ok{color:#047857;font-weight:600;}
</style>
</head>
<body>
${htmlBody}
</body>
</html>`;
    const blob = new Blob([full], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".doc") ? filename : `${filename}.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const downloadReport = async () => {
    if (!auditId) return;
    const report = await utils.iso.getAuditReport.fetch({ auditId });

    const a = (report as any)?.audit || {};
    const questions = Array.isArray((report as any)?.questions) ? (report as any).questions : [];

    const findings = questions.filter((q: any) => q.responseValue === "non_compliant" || q.responseValue === "partial");
    const answered = questions.filter((q: any) => q.responseValue && q.responseValue !== "in_progress").length;
    const total = questions.length;

    const now = new Date();
    const docName = `Rapport_Audit_ISO_${a?.id ?? auditId}_${now.toISOString().slice(0, 10)}`;

    const html = `
      <h1>Rapport d’audit – ISO</h1>
      <div class="meta">
        <span class="pill">Audit #${escapeHtml(a?.id)}</span>
        <span class="pill">Statut: ${escapeHtml(a?.status ?? "n/a")}</span>
        <span class="pill">Référentiel: ${escapeHtml(((a?.referentialIds ?? [])[0] === 3 ? "ISO 13485:2016" : "ISO 9001:2015"))}</span>
        <span class="pill">Site: ${escapeHtml(a?.siteName ?? "n/a")}</span>
      </div>

      <h2>1. Informations générales</h2>
      <table>
        <tr><th>Intitulé</th><td>${escapeHtml(a?.name ?? "")}</td></tr>
        <tr><th>Date de génération</th><td>${escapeHtml(now.toLocaleString())}</td></tr>
        <tr><th>Périmètre (processus drilldown)</th><td>${escapeHtml((a?.processIds ?? []).join(" • ") || "n/a")}</td></tr>
        <tr><th>Référentiel</th><td>${escapeHtml(((a?.referentialIds ?? [])[0] === 3 ? "ISO 13485:2016" : "ISO 9001:2015"))}</td></tr>
      </table>

      <h2>2. Synthèse</h2>
      <table>
        <tr><th>Total questions (scope audit)</th><td>${total}</td></tr>
        <tr><th>Questions répondues</th><td>${answered}</td></tr>
        <tr><th>Constats (NC + partiels)</th><td>${findings.length}</td></tr>
      </table>
      <p class="small">
        Note: ce rapport est généré automatiquement à partir des réponses saisies dans l’outil. Il est conçu pour un format « IRCA-like »
        (constats, preuves attendues, commentaires, actions) et peut être enrichi avec des champs audit (équipe, méthode, durée, etc.).
      </p>

      <h2>3. Constats et écarts</h2>
      <table>
        <thead>
          <tr>
            <th>Article / Annexe</th>
            <th>Question</th>
            <th>Statut</th>
            <th>Criticité</th>
            <th>Risque</th>
            <th>Preuves attendues</th>
            <th>Commentaire / Note</th>
          </tr>
        </thead>
        <tbody>
          ${
            findings.length
              ? findings
                  .map((q: any) => {
                    const status = String(q.responseValue || "");
                    const cls = status === "non_compliant" ? "nc" : "partial";
                    return `
                      <tr>
                        <td>${escapeHtml(q.article ?? "")}${q.annexe ? " / " + escapeHtml(q.annexe) : ""}</td>
                        <td>${escapeHtml(q.questionText ?? "")}</td>
                        <td class="${cls}">${escapeHtml(status)}</td>
                        <td>${escapeHtml(q.criticality ?? "")}</td>
                        <td>${escapeHtml(q.risk ?? "")}</td>
                        <td>${escapeHtml(q.expectedEvidence ?? "")}</td>
                        <td>${escapeHtml(q.responseComment ?? "")}${q.note ? "<br/><span class='small'>Note: " + escapeHtml(q.note) + "</span>" : ""}</td>
                      </tr>
                    `;
                  })
                  .join("")
              : `<tr><td colspan="7" class="small">Aucun écart (NC/partiel) détecté dans les réponses enregistrées.</td></tr>`
          }
        </tbody>
      </table>

      <h2>4. Liste complète (traceability)</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Article</th>
            <th>Question</th>
            <th>Statut</th>
            <th>Commentaire</th>
          </tr>
        </thead>
        <tbody>
          ${
            questions
              .map((q: any, idx: number) => {
                const s = String(q.responseValue || "in_progress");
                const cls = s === "non_compliant" ? "nc" : s === "partial" ? "partial" : "ok";
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${escapeHtml(q.article ?? "")}</td>
                    <td>${escapeHtml(q.questionText ?? "")}</td>
                    <td class="${cls}">${escapeHtml(s)}</td>
                    <td>${escapeHtml(q.responseComment ?? "")}</td>
                  </tr>
                `;
              })
              .join("")
          }
        </tbody>
      </table>

      <h2>5. Conclusion</h2>
      <p>
        Sur la base du périmètre audité, le niveau de conformité observé doit être confirmé par revue des preuves et validation de la
        criticité des écarts. Les actions correctives/préventives (CAPA) devront être planifiées, assignées et suivies jusqu’à
        vérification d’efficacité.
      </p>
    `;

    downloadAsWord(docName, html);
  };

  if (!enabled) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="space-y-3 p-6">
            <div className="font-semibold">Audit invalide</div>
            <div className="text-sm text-muted-foreground">ID audit manquant.</div>
            <Button variant="secondary" onClick={() => setLocation("/iso/audit")}>Retour</Button>
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
          <CardContent className="space-y-2 p-6">
            <div className="flex items-center gap-2 text-rose-700"><AlertCircle className="h-4 w-4" /> Erreur</div>
            <div className="text-sm text-muted-foreground">{(dashboardQuery.error as any)?.message || "Impossible de charger la review"}</div>
            <Button variant="secondary" onClick={() => setLocation(`/iso/audit/${auditId}`)}>Reprendre audit</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 print:bg-white md:p-6" id="print-area">
      <style>{`@media print {.no-print{display:none!important;} .print-grid{grid-template-columns:1fr!important;} }`}</style>

      <div className="no-print sticky top-0 z-20 mb-4 border-b border-slate-200 bg-slate-50/95 pb-3 backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">Audit Review & Dashboard</h1>
            <div className="text-sm text-slate-600">
              {(data?.audit?.name || `Audit #${auditId}`)} • {data?.audit?.siteName || "Site non renseigné"}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Statut: {data?.audit?.status || "draft"}</Badge>
            <Badge variant="outline">Progression: {percent(stats.answered, stats.totalQuestions)}%</Badge>
            <Button variant="outline" onClick={() => setLocation("/iso/audit")}><ArrowLeft className="mr-2 h-4 w-4" />Liste audits</Button>
            <Button variant="outline" onClick={downloadReport}><Download className="mr-2 h-4 w-4" />Télécharger rapport</Button>
            <Button variant="outline" onClick={printReport}><Printer className="mr-2 h-4 w-4" />Imprimer rapport</Button>
            <Button variant="outline" onClick={() => setLocation(`/iso/audit/${auditId}`)}><RefreshCw className="mr-2 h-4 w-4" />Reprendre audit</Button>
          </div>
        </div>
      </div>

      <div className="print-grid grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
        <Card className="xl:col-span-1"><CardContent className="p-4"><div className="text-xs text-slate-500">Total questions</div><div className="text-2xl font-semibold">{stats.totalQuestions}</div></CardContent></Card>
        <Card className="xl:col-span-1"><CardContent className="p-4"><div className="text-xs text-slate-500">Répondu</div><div className="text-2xl font-semibold">{stats.answered}</div></CardContent></Card>
        <Card className="xl:col-span-1"><CardContent className="p-4"><div className="text-xs text-slate-500">Conformes</div><div className="text-2xl font-semibold text-emerald-700">{stats.compliant}</div></CardContent></Card>
        <Card className="xl:col-span-1"><CardContent className="p-4"><div className="text-xs text-slate-500">Partiels</div><div className="text-2xl font-semibold text-amber-600">{stats.partial}</div></CardContent></Card>
        <Card className="xl:col-span-1"><CardContent className="p-4"><div className="text-xs text-slate-500">Non conformes</div><div className="text-2xl font-semibold text-rose-700">{stats.non_compliant}</div></CardContent></Card>
        <Card className="xl:col-span-1"><CardContent className="p-4"><div className="text-xs text-slate-500">N/A</div><div className="text-2xl font-semibold text-slate-700">{stats.not_applicable}</div></CardContent></Card>
        <Card className="xl:col-span-1"><CardContent className="p-4"><div className="text-xs text-slate-500">Score conformité</div><div className="text-2xl font-semibold">{stats.score}%</div></CardContent></Card>
      </div>

      <div className="print-grid mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-5">
          <CardContent className="space-y-3 p-4">
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
          <CardContent className="space-y-3 p-4">
            <div className="font-medium">Heatmap Processus × Statut (fallback table)</div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Process</th>
                    <th className="px-3 py-2 text-left">Conforme</th>
                    <th className="px-3 py-2 text-left">Partiel</th>
                    <th className="px-3 py-2 text-left">NOK</th>
                    <th className="px-3 py-2 text-left">N/A</th>
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

      <div className="print-grid mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <CardContent className="space-y-3 p-4">
            <div className="font-medium">Top risques / NC majeures</div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Article</th>
                    <th className="px-3 py-2 text-left">Question</th>
                    <th className="px-3 py-2 text-left">Criticité</th>
                    <th className="px-3 py-2 text-left">Statut</th>
                    <th className="no-print px-3 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {topRisks.map((risk: any) => (
                    <tr key={risk.questionKey} className="border-t align-top">
                      <td className="whitespace-nowrap px-3 py-2">{risk.article || "n/a"}</td>
                      <td className="px-3 py-2">{risk.questionText}</td>
                      <td className="px-3 py-2">{risk.criticality || "n/a"}</td>
                      <td className="px-3 py-2">
                        <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${statusTone[risk.responseValue as StatusKey] || "bg-slate-300"}`} />
                        {risk.responseValue}
                      </td>
                      <td className="no-print px-3 py-2">
                        <Button size="sm" variant="outline" onClick={() => setLocation(`/iso/audit/${auditId}`)}>Ouvrir question</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-5">
          <CardContent className="space-y-3 p-4">
            <div className="font-medium">Mes audits</div>
            <Separator />
            <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
              {auditsHistory.map((audit: any) => (
                <div key={audit.id} className="rounded-lg border bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">{audit.name}</div>
                    <Badge variant="outline">{audit.status || "draft"}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    rôle: {audit.economicRole || "n/a"} • MAJ: {audit.updatedAt ? new Date(audit.updatedAt).toLocaleDateString() : "n/a"}
                  </div>
                  <div className="no-print mt-2 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setLocation(`/iso/audit/${audit.id}`)}>Reprendre</Button>
                    <Button size="sm" variant="outline" onClick={() => setLocation(`/iso/audit/${audit.id}/review`)}>Review</Button>
                    <Button size="sm" variant="outline" onClick={printReport}><Download className="mr-1 h-3.5 w-3.5" />Imprimer</Button>
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
