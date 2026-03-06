import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportAuditExcel, exportAuditPdf } from "@/lib/fdaExports";
import { useLocation } from "wouter";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from "recharts";

export default function FdaDashboard() {
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const auditId = Number(search?.get("auditId") || 0);
  const [, setLocation] = useLocation();
  const { data, isLoading } = trpc.fda.getAuditDashboard.useQuery({ auditId }, { enabled: auditId > 0 });
  const { data: report } = trpc.fda.getReports.useQuery({ auditId }, { enabled: auditId > 0 });

  const radarData = useMemo(() => (data?.chapterScores || []).map((x: any) => ({ subject: x.chapter.slice(0, 24), score: x.score })), [data]);

  if (!auditId) {
    return <div className="container py-10">Aucun audit FDA sélectionné. <Button className="ml-2" onClick={() => setLocation('/us/fda-audit')}>Créer / reprendre un audit</Button></div>;
  }

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">FDA Dashboard</h1>
          <p className="text-muted-foreground mt-2">Vue exécutive FDA avec scoring, priorisation et CAPA-ready actions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => report && exportAuditPdf(report)}>Export PDF</Button>
          <Button onClick={() => report && exportAuditExcel(report)}>Export Excel</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardHeader><CardTitle>Score global</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data?.globalScore ?? "-"}</CardContent></Card>
        <Card><CardHeader><CardTitle>Non compliant</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data?.kpis?.nonCompliantQuestions ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>Preuves manquantes</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data?.kpis?.missingEvidence ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>High criticality open</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data?.kpis?.highCriticalityUntreated ?? 0}</CardContent></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Radar par chapitre</CardTitle></CardHeader>
          <CardContent className="h-[320px]">{!isLoading && <ResponsiveContainer width="100%" height="100%"><RadarChart data={radarData}><PolarGrid /><PolarAngleAxis dataKey="subject" /><Radar dataKey="score" /></RadarChart></ResponsiveContainer>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Heatmap / compliance by chapter</CardTitle><CardDescription>Lecture simple pour revue de direction</CardDescription></CardHeader>
          <CardContent className="h-[320px]">{!isLoading && <ResponsiveContainer width="100%" height="100%"><BarChart data={data?.chapterScores || []}><XAxis dataKey="chapter" hide /><YAxis /><Tooltip /><Bar dataKey="score" /></BarChart></ResponsiveContainer>}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Top 10 gaps</CardTitle></CardHeader>
        <CardContent className="space-y-3">{(data?.topGaps || []).map((gap: any, idx: number) => <div key={idx} className="border rounded-lg p-3"><div className="font-medium">{gap.title}</div><div className="text-sm text-muted-foreground mt-1">{gap.questionText}</div><div className="text-sm mt-2"><strong>Expected evidence:</strong> {gap.expectedEvidence || "N/A"}</div><div className="text-sm mt-1"><strong>Recommendation:</strong> {gap.recommendation}</div></div>)}</CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Timeline plan d'actions / CAPA</CardTitle></CardHeader>
        <CardContent className="space-y-3">{(data?.timeline || []).map((item: any) => <div key={item.id} className="border rounded-lg p-3"><div className="font-medium">{item.actionCode} · {item.title}</div><div className="text-sm text-muted-foreground">{item.description}</div><div className="text-sm mt-1">Status: {item.status}</div></div>)}</CardContent>
      </Card>
    </div>
  );
}
