import { useMemo, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  Loader2,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Calendar,
  Factory,
  Building2,
  Layers,
  ArrowRight,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  CartesianGrid,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

type Kpis = {
  scoreGlobal?: number;
  progression?: number;
  conforme?: number;
  nonConforme?: number;
  answeredQuestions?: number;
  totalQuestions?: number;
  nonConformitiesCount?: number;
};

export default function DashboardExecutive() {
  // ✅ Hooks must be called unconditionally (React #310 prevention)
  const { user, isAuthenticated, loading } = useAuth();

  // Filters (UI only for now — you can wire them to backend inputs later)
  const [period, setPeriod] = useState<"3M" | "6M" | "12M">("12M");

  const profileQuery = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });

  const kpiQuery = trpc.dashboard.getKPIs.useQuery(undefined, { enabled: isAuthenticated });
  const trendQuery = trpc.dashboard.getScoreTrend.useQuery(undefined, { enabled: isAuthenticated });
  const processProgressQuery = trpc.dashboard.getProcessProgress.useQuery(undefined, { enabled: isAuthenticated });
  const findingsQuery = trpc.dashboard.getRecentFindings.useQuery({ limit: 6 }, { enabled: isAuthenticated });
  const recentAuditsQuery = trpc.audit.getRecentAudits.useQuery({ limit: 6 }, { enabled: isAuthenticated });

  // Loading / auth guards (after hooks are declared)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070B18]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const profile = profileQuery.data;
  const kpis: Kpis = kpiQuery.data ?? {};

  const trend = Array.isArray(trendQuery.data) ? trendQuery.data : [];
  const processProgressRaw = Array.isArray(processProgressQuery.data) ? processProgressQuery.data : [];
  const findings = Array.isArray(findingsQuery.data) ? findingsQuery.data : [];
  const recentAudits = Array.isArray(recentAuditsQuery.data) ? recentAuditsQuery.data : [];

  // Normalize process progress shape (your backend returns: { processId, processName, progress, score, answered, total })
  const processProgress = useMemo(() => {
    return processProgressRaw
      .map((p: any, idx: number) => ({
        id: Number(p.processId ?? p.id ?? idx),
        name: String(p.processName ?? p.name ?? `Process ${idx + 1}`),
        score: Number(p.score ?? 0),
        progress: Number(p.progress ?? p.progression ?? 0),
        answered: Number(p.answered ?? 0),
        total: Number(p.total ?? 0),
      }))
      .sort((a: any, b: any) => b.score - a.score);
  }, [processProgressRaw]);

  // Top risks (from latest NOK findings)
  const topRisks = useMemo(() => {
    const items = findings
      .map((f: any, idx: number) => {
        const title =
          (f.questionText ? String(f.questionText) : "") ||
          (f.article ? `Article ${String(f.article)}` : "") ||
          `Finding ${idx + 1}`;
        const processName = f.processName ? String(f.processName) : "Process";
        return { title, processName };
      })
      .slice(0, 10);

    // fallback if empty
    if (items.length === 0) {
      return [
        { title: "No recent NOK findings yet", processName: "—" },
        { title: "Start an audit to populate insights", processName: "—" },
      ];
    }
    return items;
  }, [findings]);

  // Radar maturity (derive from process score buckets)
  const radarData = useMemo(() => {
    // Heuristic mapping by keywords
    const buckets = [
      { key: "QMS", keywords: ["qms", "qualité", "management", "système"], value: 0 },
      { key: "Clinical", keywords: ["clinical", "clinique", "évaluation"], value: 0 },
      { key: "Risk Mgmt", keywords: ["risk", "risque", "14971", "amdec"], value: 0 },
      { key: "PMS", keywords: ["pms", "surveillance", "vigilance", "post"], value: 0 },
      { key: "Suppliers", keywords: ["supplier", "fournisseur", "achat", "sous-trait"], value: 0 },
      { key: "CAPA", keywords: ["capa", "nonconform", "déviation", "action"], value: 0 },
    ];

    if (processProgress.length === 0) {
      return buckets.map((b) => ({ subject: b.key, score: 20 }));
    }

    for (const p of processProgress) {
      const name = p.name.toLowerCase();
      const match = buckets.find((b) => b.keywords.some((k) => name.includes(k)));
      if (match) match.value = Math.max(match.value, p.score);
    }

    // fill missing with global score
    const global = Number(kpis.scoreGlobal ?? 0);
    return buckets.map((b) => ({
      subject: b.key,
      score: b.value > 0 ? Math.round(b.value) : Math.round(global || 25),
    }));
  }, [processProgress, kpis.scoreGlobal]);

  // Heatmap (simple matrix from top processes)
  const heatmapRows = useMemo(() => {
    const top = processProgress.slice(0, 6);
    if (top.length === 0) {
      return [
        { label: "CAPA", eu: 20, us: 20, asia: 20 },
        { label: "Clinical", eu: 20, us: 20, asia: 20 },
        { label: "Suppliers", eu: 20, us: 20, asia: 20 },
      ];
    }
    // Fake region splits (until you wire market/regional scoring)
    return top.map((p, i) => ({
      label: p.name,
      eu: Math.max(0, Math.min(100, p.score)),
      us: Math.max(0, Math.min(100, p.score - (i % 3) * 7)),
      asia: Math.max(0, Math.min(100, p.score - (i % 2) * 11)),
    }));
  }, [processProgress]);

  const scoreGlobal = Number(kpis.scoreGlobal ?? 0);
  const progression = Number(kpis.progression ?? 0);
  const majorNCs = Number(kpis.nonConformitiesCount ?? 0);

  return (
    <div className="min-h-screen bg-[#070B18] text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070B18]/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-400/10 border border-white/10 flex items-center justify-center shadow">
              <Shield className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="font-semibold">MDR Compliance</div>
              <div className="text-xs text-white/60">Executive Dashboard</div>
            </div>

            <nav className="ml-8 hidden md:flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-white/80 hover:text-white">
                  Dashboard
                </Button>
              </Link>
              <Link href="/dashboard-executive">
                <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/15">
                  Executive
                </Button>
              </Link>
              <Link href="/audits">
                <Button variant="ghost" className="text-white/80 hover:text-white">
                  Audits
                </Button>
              </Link>
              <Link href="/reports">
                <Button variant="ghost" className="text-white/80 hover:text-white">
                  Reports
                </Button>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <Badge className="bg-white/10 text-white border-white/10">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                Period: {period}
              </Badge>
              <Button
                variant="secondary"
                className="bg-white/10 text-white hover:bg-white/15"
                onClick={() => setPeriod((p) => (p === "12M" ? "6M" : p === "6M" ? "3M" : "12M"))}
              >
                Change period
              </Button>
            </div>
            <Link href="/profile">
              <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                {user?.name || "Profil"}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Title */}
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">
              Bienvenue, {user?.name || "Utilisateur"}
            </h1>
            <p className="text-white/60 mt-1">
              {profile?.economicRole
                ? `Rôle économique : ${String(profile.economicRole)}`
                : "Configurez votre profil pour personnaliser le scoring"}
            </p>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/mdr/audit">
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 shadow">
                Lancer un audit MDR <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <KpiTile
            title="Global Compliance"
            value={`${scoreGlobal.toFixed(1)}%`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            hint={`${Number(kpis.conforme ?? 0)} OK / ${Number(kpis.answeredQuestions ?? 0)} answered`}
          />
          <KpiTile
            title="Audit Progress"
            value={`${progression.toFixed(0)}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            hint={`${Number(kpis.answeredQuestions ?? 0)} / ${Number(kpis.totalQuestions ?? 0)} questions`}
          />
          <KpiTile
            title="Major NCs"
            value={`${majorNCs}`}
            icon={<XCircle className="h-5 w-5" />}
            hint="Require CAPA / evidence"
            accent="danger"
          />
          <KpiTile
            title="Data Coverage"
            value={`${Math.min(100, Math.round((Number(kpis.answeredQuestions ?? 0) / Math.max(1, Number(kpis.totalQuestions ?? 0))) * 100))}%`}
            icon={<Layers className="h-5 w-5" />}
            hint="Answered / total base"
          />
        </div>

        {/* Grid main */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Heatmap */}
          <Card className="xl:col-span-5 bg-white/5 border-white/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white">Risk Heatmap</CardTitle>
              <CardDescription className="text-white/60">Quick regional view (proxy)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="grid grid-cols-4 bg-white/5 text-xs text-white/70">
                  <div className="p-2">Area</div>
                  <div className="p-2 text-center">EU</div>
                  <div className="p-2 text-center">US</div>
                  <div className="p-2 text-center">ASIA</div>
                </div>

                {heatmapRows.slice(0, 6).map((r, idx) => (
                  <div key={idx} className="grid grid-cols-4 border-t border-white/10 text-sm">
                    <div className="p-2 text-white/80 truncate">{r.label}</div>
                    <HeatCell v={r.eu} />
                    <HeatCell v={r.us} />
                    <HeatCell v={r.asia} />
                  </div>
                ))}
              </div>

              <div className="mt-4 text-xs text-white/50">
                Hint: this becomes “real” once you wire market/site filters into dashboard.getScoring().
              </div>
            </CardContent>
          </Card>

          {/* Top risks */}
          <Card className="xl:col-span-4 bg-white/5 border-white/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white">Top Critical Risks</CardTitle>
              <CardDescription className="text-white/60">Based on latest NOK findings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topRisks.slice(0, 8).map((r, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-white/10 bg-gradient-to-r from-white/5 to-transparent hover:bg-white/10 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm text-white/90 line-clamp-2">{r.title}</div>
                        <div className="text-xs text-white/50 mt-1">{r.processName}</div>
                      </div>
                      <AlertTriangle className="h-4 w-4 text-amber-300/90 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="xl:col-span-4 bg-white/5 border-white/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white">AI Compliance Insights</CardTitle>
              <CardDescription className="text-white/60">Rule-based for now (safe)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Insight
                level={scoreGlobal >= 80 ? "ok" : scoreGlobal >= 60 ? "warn" : "risk"}
                text={
                  scoreGlobal >= 80
                    ? "Conformity score is strong. Focus on evidence consistency & sampling depth."
                    : scoreGlobal >= 60
                    ? "Score is moderate. Prioritize CAPA effectiveness and PMS alignment."
                    : "Low score detected. Audit readiness is at risk — tackle top NOK clusters first."
                }
              />
              <Insight
                level={progression >= 50 ? "ok" : "warn"}
                text={
                  progression >= 50
                    ? "Good progress. Consider generating an interim report for management review."
                    : "Low coverage. Complete key processes first to stabilize your score."
                }
              />
              <Insight
                level={majorNCs > 0 ? "risk" : "ok"}
                text={majorNCs > 0 ? "NOK findings present — open CAPA and attach objective evidence." : "No NOK yet — keep sampling smart."}
              />
            </CardContent>
          </Card>

          {/* Radar */}
          <Card className="xl:col-span-5 bg-white/5 border-white/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white">Organizational Maturity</CardTitle>
              <CardDescription className="text-white/60">Derived from process scores</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.15)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
                  <Radar dataKey="score" stroke="rgba(56,189,248,0.9)" fill="rgba(56,189,248,0.25)" />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* NC breakdown */}
          <Card className="xl:col-span-7 bg-white/5 border-white/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white">NCs Breakdown</CardTitle>
              <CardDescription className="text-white/60">Per process (proxy)</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-[240px]">
                <div className="text-xs text-white/60 mb-2">Process score distribution</div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processProgress.slice(0, 8)}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} interval={0} height={60} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} domain={[0, 100]} />
                    <ReTooltip
                      contentStyle={{ background: "rgba(7,11,24,0.95)", border: "1px solid rgba(255,255,255,0.12)" }}
                      labelStyle={{ color: "rgba(255,255,255,0.8)" }}
                    />
                    <Bar dataKey="score" fill="rgba(59,130,246,0.75)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="h-[240px]">
                <div className="text-xs text-white/60 mb-2">Score trend (last 6 points)</div>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} domain={[0, 100]} />
                    <ReTooltip
                      contentStyle={{ background: "rgba(7,11,24,0.95)", border: "1px solid rgba(255,255,255,0.12)" }}
                      labelStyle={{ color: "rgba(255,255,255,0.8)" }}
                    />
                    <Line type="monotone" dataKey="score" stroke="rgba(34,197,94,0.85)" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent audits */}
          <Card className="xl:col-span-7 bg-white/5 border-white/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white">Recent Audits</CardTitle>
              <CardDescription className="text-white/60">Latest activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAudits.length === 0 ? (
                  <div className="text-sm text-white/60">No audits yet.</div>
                ) : (
                  recentAudits.slice(0, 6).map((a: any) => (
                    <div
                      key={a.id}
                      className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="text-sm text-white/90 truncate">{a.name ?? `Audit #${a.id}`}</div>
                        <div className="text-xs text-white/50 mt-1 flex items-center gap-2">
                          <Factory className="h-3.5 w-3.5" />
                          <span className="truncate">{a.siteName ?? "Site"}</span>
                          <span className="text-white/30">•</span>
                          <span>{a.status ?? "—"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className="bg-white/10 text-white border-white/10">
                          {typeof a.conformityRate === "number" ? `${a.conformityRate}%` : "—"}
                        </Badge>
                        <Link href={`/audit/${a.id}`}>
                          <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/15">
                            Open
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* KPIs */}
          <Card className="xl:col-span-5 bg-white/5 border-white/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white">KPIs</CardTitle>
              <CardDescription className="text-white/60">Operational indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <KpiRow label="CAPA Closure (proxy)" value={`${Math.max(0, Math.min(100, Math.round(scoreGlobal)))}%`} />
              <KpiRow label="Evidence Coverage (proxy)" value={`${Math.max(0, Math.min(100, Math.round(progression)))}%`} />
              <KpiRow label="Doc deviations (NOK count)" value={`${majorNCs}`} />
              <Separator className="bg-white/10" />
              <div className="grid grid-cols-3 gap-3">
                <MiniTile icon={<Building2 className="h-4 w-4" />} title="Sites" value="All" />
                <MiniTile icon={<Layers className="h-4 w-4" />} title="Standard" value="MDR" />
                <MiniTile icon={<TrendingUp className="h-4 w-4" />} title="Trend" value={trend.length ? "OK" : "—"} />
              </div>

              <div className="mt-2">
                <div className="text-xs text-white/50 mb-2">Global progress</div>
                <Progress value={progression} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-xs text-white/40">
          Executive view • Designed for ON/ANSM-like review • Safe mode (no conditional hooks)
        </div>
      </main>
    </div>
  );
}

function KpiTile(props: {
  title: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  accent?: "danger" | "default";
}) {
  const danger = props.accent === "danger";
  return (
    <Card className="bg-white/5 border-white/10 shadow-lg overflow-hidden">
      <div className={`h-1 ${danger ? "bg-red-500/70" : "bg-gradient-to-r from-blue-500/60 to-cyan-400/40"}`} />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white/70 flex items-center justify-between">
          <span>{props.title}</span>
          <span className={`p-2 rounded-lg ${danger ? "bg-red-500/10" : "bg-white/5"} border border-white/10`}>
            {props.icon}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-semibold ${danger ? "text-red-300" : "text-white"}`}>{props.value}</div>
        {props.hint ? <div className="text-xs text-white/50 mt-2">{props.hint}</div> : null}
      </CardContent>
    </Card>
  );
}

function HeatCell({ v }: { v: number }) {
  // v: 0..100
  const bg =
    v >= 85
      ? "bg-emerald-500/40"
      : v >= 65
      ? "bg-lime-500/30"
      : v >= 45
      ? "bg-amber-500/35"
      : "bg-red-500/40";
  return <div className={`p-2 text-center border-l border-white/10 ${bg}`}>{Math.round(v)}%</div>;
}

function Insight({ level, text }: { level: "ok" | "warn" | "risk"; text: string }) {
  const icon =
    level === "ok" ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
    ) : level === "warn" ? (
      <AlertTriangle className="h-4 w-4 text-amber-300" />
    ) : (
      <XCircle className="h-4 w-4 text-red-300" />
    );

  const border =
    level === "ok"
      ? "border-emerald-300/20"
      : level === "warn"
      ? "border-amber-300/20"
      : "border-red-300/20";

  return (
    <div className={`p-3 rounded-xl bg-white/5 border ${border} flex items-start gap-3`}>
      <div className="mt-0.5">{icon}</div>
      <div className="text-sm text-white/80">{text}</div>
    </div>
  );
}

function KpiRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
      <div className="text-sm text-white/70">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function MiniTile({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center justify-between">
        <div className="text-xs text-white/60">{title}</div>
        <div className="text-white/70">{icon}</div>
      </div>
      <div className="text-sm font-semibold mt-1">{value}</div>
    </div>
  );
}
