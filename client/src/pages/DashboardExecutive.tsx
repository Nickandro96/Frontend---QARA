import { UpgradeRequired } from "@/components/UpgradeRequired";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  Shield,
  ArrowRight,
  Loader2,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Layers,
  FileText,
} from "lucide-react";
import { useMemo, useState } from "react";

// Existing dashboard components (already in your repo)
import { KPIDetailModal } from "@/components/dashboard-main/KPIDetailModal";
import { ProcessDetailModal } from "@/components/dashboard-main/ProcessDetailModal";
import { ScoreTrendChart } from "@/components/dashboard-main/ScoreTrendChart";
import { RecentFindingsTable } from "@/components/dashboard-main/RecentFindingsTable";
import { RecentAuditsTable } from "@/components/dashboard-main/RecentAuditsTable";

type ModalType = "score" | "progress" | "nonconformities";

export default function DashboardExecutive() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });

  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [kpiModalType, setKpiModalType] = useState<ModalType>("score");

  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<any>(null);
  const [selectedProcessScore, setSelectedProcessScore] = useState<any>(null);

  // Block FREE users
  if (isAuthenticated && profile && profile.subscriptionTier === "free" && user?.role !== "admin") {
    return <UpgradeRequired feature="Dashboard Executive" />;
  }

  // tRPC data (compat endpoints you added)
  const { data: kpiData } = trpc.dashboard.getKPIs.useQuery(undefined, { enabled: isAuthenticated });
  const { data: scoreTrend } = trpc.dashboard.getScoreTrend.useQuery(undefined, { enabled: isAuthenticated });
  const { data: recentFindings } = trpc.dashboard.getRecentFindings.useQuery(
    { limit: 6 },
    { enabled: isAuthenticated }
  );
  const { data: recentAudits } = trpc.audit.getRecentAudits.useQuery({ limit: 6 }, { enabled: isAuthenticated });
  const { data: processProgress } = trpc.dashboard.getProcessProgress.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FB]">
        <div className="flex items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Chargement du dashboard…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const safeKPIs = useMemo(() => {
    const scoreGlobal = Number((kpiData as any)?.scoreGlobal ?? 0);
    const progression = Number((kpiData as any)?.progression ?? 0);
    const conforme = Number((kpiData as any)?.conforme ?? 0);
    const nonConforme = Number((kpiData as any)?.nonConforme ?? 0);
    const nonConformitiesCount = Number((kpiData as any)?.nonConformitiesCount ?? 0);
    const answeredQuestions = Number((kpiData as any)?.answeredQuestions ?? 0);
    const totalQuestions = Number((kpiData as any)?.totalQuestions ?? 0);

    const totalAnswered = conforme + nonConforme;
    const okRate = totalAnswered > 0 ? (conforme / totalAnswered) * 100 : 0;

    return {
      scoreGlobal,
      progression,
      conforme,
      nonConforme,
      nonConformitiesCount,
      answeredQuestions,
      totalQuestions,
      totalAnswered,
      okRate,
    };
  }, [kpiData]);

  const normalizedProcessProgress = useMemo(() => {
    const list = Array.isArray(processProgress) ? processProgress : [];
    return list
      .map((p: any) => {
        const id = p?.id ?? p?.processId ?? p?.process_id ?? p?.key ?? `${p?.name ?? "process"}`;
        const name = p?.name ?? p?.processName ?? p?.label ?? `Process ${id}`;
        const score = Number(p?.score ?? p?.scoreGlobal ?? p?.conformity ?? 0);
        const progress = Number(p?.progression ?? p?.progress ?? p?.completion ?? 0);

        return { id, name, score, progress, raw: p };
      })
      .sort((a, b) => a.score - b.score);
  }, [processProgress]);

  const topWeakProcesses = normalizedProcessProgress.slice(0, 5);
  const topStrongProcesses = normalizedProcessProgress.slice(-5).reverse();

  const executiveStatus = useMemo(() => {
    // simple, conservative executive labeling
    if (safeKPIs.scoreGlobal >= 85 && safeKPIs.nonConformitiesCount <= 5) return "Conformité maîtrisée";
    if (safeKPIs.scoreGlobal >= 70) return "Conformité sous contrôle";
    return "Risque de non-conformité";
  }, [safeKPIs.scoreGlobal, safeKPIs.nonConformitiesCount]);

  const executiveStatusTone = useMemo(() => {
    if (safeKPIs.scoreGlobal >= 85 && safeKPIs.nonConformitiesCount <= 5) return "ok";
    if (safeKPIs.scoreGlobal >= 70) return "warn";
    return "crit";
  }, [safeKPIs.scoreGlobal, safeKPIs.nonConformitiesCount]);

  const statusBadge = useMemo(() => {
    if (executiveStatusTone === "ok") {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-medium">
          <CheckCircle2 className="h-4 w-4" />
          {executiveStatus}
        </span>
      );
    }
    if (executiveStatusTone === "warn") {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 text-orange-800 border border-orange-200 px-3 py-1 text-xs font-medium">
          <AlertTriangle className="h-4 w-4" />
          {executiveStatus}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 text-red-800 border border-red-200 px-3 py-1 text-xs font-medium">
        <XCircle className="h-4 w-4" />
        {executiveStatus}
      </span>
    );
  }, [executiveStatus, executiveStatusTone]);

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      {/* Premium top gradient */}
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#0B2A55] via-[#0B2A55] to-transparent pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-white/10 bg-transparent sticky top-0 z-50 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="h-9 w-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shadow-sm">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-white">MDR Compliance</div>
                  <div className="text-[11px] text-white/70">Executive Dashboard</div>
                </div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                  Dashboard
                </Button>
              </Link>
              <Link href="/dashboard-executive">
                <Button className="bg-white/12 text-white hover:bg-white/18 border border-white/15">
                  Executive
                </Button>
              </Link>
              <Link href="/audits">
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                  Audits
                </Button>
              </Link>
              <Link href="/reports">
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                  Rapports
                </Button>
              </Link>
              <Link href="/regulatory-watch">
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                  Veille
                </Button>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/profile">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/15">
                {user?.name || "Profil"}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative container py-8">
        {/* Executive Top */}
        <div className="mb-7">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Vue exécutive — Conformité & Risques</h1>
              <p className="text-white/75 mt-1">
                {profile?.economicRole
                  ? `Rôle : ${profile.economicRole.charAt(0).toUpperCase() + profile.economicRole.slice(1)}`
                  : "Configurez votre profil pour des analyses contextualisées"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {statusBadge}
              <Link href="/reports">
                <Button className="bg-white text-[#0B2A55] hover:bg-white/90 shadow">
                  Export & Rapports
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Premium KPI Strip */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card
            className="border-white/10 bg-white/95 shadow-lg shadow-black/5 rounded-2xl cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => {
              setKpiModalType("score");
              setKpiModalOpen(true);
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Score conformité global
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-[#0B2A55]">{safeKPIs.scoreGlobal.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">OK rate: {safeKPIs.okRate.toFixed(0)}%</div>
              </div>
              <div className="mt-3">
                <Progress value={safeKPIs.scoreGlobal} className="h-2" />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {safeKPIs.conforme} OK • {safeKPIs.nonConforme} NOK
              </div>
              <div className="mt-2 text-xs text-primary font-medium">→ Détails & distribution</div>
            </CardContent>
          </Card>

          <Card
            className="border-white/10 bg-white/95 shadow-lg shadow-black/5 rounded-2xl cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => {
              setKpiModalType("progress");
              setKpiModalOpen(true);
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Progression (couverture)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-[#0B2A55]">{safeKPIs.progression.toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">
                  {safeKPIs.answeredQuestions}/{safeKPIs.totalQuestions}
                </div>
              </div>
              <div className="mt-3">
                <Progress value={safeKPIs.progression} className="h-2" />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Questions répondues vs applicables</div>
              <div className="mt-2 text-xs text-primary font-medium">→ Zones non couvertes</div>
            </CardContent>
          </Card>

          <Card
            className="border-white/10 bg-white/95 shadow-lg shadow-black/5 rounded-2xl cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => {
              setKpiModalType("nonconformities");
              setKpiModalOpen(true);
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Non-conformités (NOK)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-red-700">{safeKPIs.nonConformitiesCount}</div>
                <div className="text-xs text-muted-foreground">Prioriser CAPA</div>
              </div>
              <div className="mt-3 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 p-3">
                <div className="text-xs font-semibold text-red-800">Signal inspection</div>
                <div className="text-xs text-red-700 mt-1">
                  Concentration NOK = risque de questionnement ON/ANSM si répétitif.
                </div>
              </div>
              <div className="mt-2 text-xs text-primary font-medium">→ Voir les dernières NOK</div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/95 shadow-lg shadow-black/5 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Insights (lite)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-semibold text-[#0B2A55]">Priorités suggérées</div>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-orange-500" />
                  Renforcer les processus avec score &lt; 70%.
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-600" />
                  Traiter les NOK récents avant génération rapport.
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Capitaliser sur les points forts (audit-ready).
                </li>
              </ul>
              <div className="mt-3">
                <Link href="/reports">
                  <Button variant="outline" className="w-full rounded-xl">
                    Générer un snapshot
                    <FileText className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main grid (PowerBI / Veeva vibe) */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Trend */}
          <Card className="lg:col-span-8 border-white/10 bg-white/95 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold text-[#0B2A55] flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Tendance du score de conformité
                  </CardTitle>
                  <CardDescription>Évolution récente (score agrégé)</CardDescription>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setKpiModalType("score");
                      setKpiModalOpen(true);
                    }}
                  >
                    Détails
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {Array.isArray(scoreTrend) && scoreTrend.length > 0 ? (
                <ScoreTrendChart data={scoreTrend as any} />
              ) : (
                <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
                  Pas assez de données pour afficher une tendance.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Process Focus */}
          <Card className="lg:col-span-4 border-white/10 bg-white/95 shadow-lg shadow-black/5 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#0B2A55] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Focus Processus
              </CardTitle>
              <CardDescription>Points faibles & points forts (clicables)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-white p-3">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Top 5 à risque</div>
                <div className="space-y-2">
                  {topWeakProcesses.length === 0 ? (
                    <div className="text-xs text-muted-foreground">Aucune donnée processus.</div>
                  ) : (
                    topWeakProcesses.map((p) => (
                      <button
                        key={p.id}
                        className="w-full text-left rounded-lg p-2 hover:bg-[#F6F8FB] transition-colors"
                        onClick={() => {
                          setSelectedProcess(p.raw);
                          setSelectedProcessScore({ score: p.score, progress: p.progress });
                          setProcessModalOpen(true);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-[#0B2A55]">{p.name}</span>
                          <span className="text-xs font-semibold text-red-700">{p.score.toFixed(0)}%</span>
                        </div>
                        <Progress value={p.score} className="h-1.5 mt-2" />
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border bg-white p-3">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Top 5 audit-ready</div>
                <div className="space-y-2">
                  {topStrongProcesses.length === 0 ? (
                    <div className="text-xs text-muted-foreground">Aucune donnée processus.</div>
                  ) : (
                    topStrongProcesses.map((p) => (
                      <button
                        key={p.id}
                        className="w-full text-left rounded-lg p-2 hover:bg-[#F6F8FB] transition-colors"
                        onClick={() => {
                          setSelectedProcess(p.raw);
                          setSelectedProcessScore({ score: p.score, progress: p.progress });
                          setProcessModalOpen(true);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-[#0B2A55]">{p.name}</span>
                          <span className="text-xs font-semibold text-emerald-700">{p.score.toFixed(0)}%</span>
                        </div>
                        <Progress value={p.score} className="h-1.5 mt-2" />
                      </button>
                    ))
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-2">
                <Link href="/audits">
                  <Button variant="outline" className="w-full rounded-xl">
                    Audits
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/mdr/audit">
                  <Button className="w-full rounded-xl">
                    Lancer MDR
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Audits */}
          <Card className="lg:col-span-6 border-white/10 bg-white/95 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#0B2A55]">Audits récents</CardTitle>
              <CardDescription>Historique pour pilotage (direction / qualité)</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {Array.isArray(recentAudits) && recentAudits.length > 0 ? (
                <RecentAuditsTable data={recentAudits as any} />
              ) : (
                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                  Aucun audit récent à afficher.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Findings */}
          <Card className="lg:col-span-6 border-white/10 bg-white/95 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#0B2A55]">Dernières non-conformités (NOK)</CardTitle>
              <CardDescription>Signal inspection — prioriser preuves et CAPA</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {Array.isArray(recentFindings) && recentFindings.length > 0 ? (
                <RecentFindingsTable data={recentFindings as any} />
              ) : (
                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                  Aucune non-conformité récente à afficher.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom CTA */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card className="border-white/10 bg-white/95 shadow-lg shadow-black/5 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-[#0B2A55]">Mode direction</CardTitle>
              <CardDescription>Vue synthèse — priorités & risques critiques</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="rounded-xl border bg-gradient-to-r from-[#0B2A55]/5 to-[#0B2A55]/0 p-3">
                <div className="text-xs font-semibold text-[#0B2A55]">Lecture recommandée</div>
                <div className="text-xs text-muted-foreground mt-1">
                  1) Score global • 2) NOK récents • 3) Processus &lt; 70% • 4) Export rapport
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="rounded-xl"
                  onClick={() => {
                    setKpiModalType("nonconformities");
                    setKpiModalOpen(true);
                  }}
                >
                  Voir NOK
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Link href="/reports">
                  <Button variant="outline" className="rounded-xl">
                    Générer rapport
                    <FileText className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/95 shadow-lg shadow-black/5 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-[#0B2A55]">Mode audit</CardTitle>
              <CardDescription>Aller vite vers les zones à risque</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="rounded-xl border bg-gradient-to-r from-orange-500/8 to-red-500/5 p-3">
                <div className="text-xs font-semibold text-[#0B2A55]">Suggestion</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Ouvrir les processus faibles puis vérifier cohérence preuves / réponses.
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/mdr/audit">
                  <Button className="rounded-xl">
                    Continuer audit
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/audits">
                  <Button variant="outline" className="rounded-xl">
                    Liste audits
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* KPI Detail Modal */}
      <KPIDetailModal open={kpiModalOpen} onOpenChange={setKpiModalOpen} type={kpiModalType} data={kpiData || {}} />

      {/* Process Detail Modal */}
      <ProcessDetailModal
        open={processModalOpen}
        onOpenChange={setProcessModalOpen}
        process={selectedProcess}
        score={selectedProcessScore}
      />
    </div>
  );
}
