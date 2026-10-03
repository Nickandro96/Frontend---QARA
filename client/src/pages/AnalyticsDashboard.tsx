import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { KPICard, KPI_DEFINITIONS } from "@/components/dashboard/KPICard";
import { FunnelNavigator, FunnelSteps, DrillLevel } from "@/components/dashboard/FunnelNavigator";
import { DashboardFilters, DashboardFiltersState } from "@/components/dashboard/DashboardFilters";
import {
  BarChart,
  LineChart,
  ParetoChart,
} from "@/components/dashboard/Charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Download,
  Lightbulb,
  Building2,
  Layers,
  FileCheck,
  Target,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Demo data for visualization
const demoSites = [
  { id: "1", name: "Paris - Siège", code: "PAR" },
  { id: "2", name: "Lyon - Production", code: "LYO" },
  { id: "3", name: "Bordeaux - R&D", code: "BDX" },
  { id: "4", name: "Munich - EU", code: "MUC" },
  { id: "5", name: "Boston - US", code: "BOS" },
];

const demoProcesses = [
  { id: "1", name: "Conception et Développement" },
  { id: "2", name: "Production" },
  { id: "3", name: "Achats et Fournisseurs" },
  { id: "4", name: "Gestion des Risques" },
  { id: "5", name: "Surveillance Post-Marché" },
  { id: "6", name: "Gestion Documentaire" },
  { id: "7", name: "CAPA" },
  { id: "8", name: "Validation" },
];

const demoReferentials = [
  { id: "1", name: "ISO 13485:2016" },
  { id: "2", name: "MDR 2017/745" },
  { id: "3", name: "21 CFR Part 820" },
  { id: "4", name: "ISO 14971:2019" },
];

const demoTrendData = [
  { label: "Jan", value: 82 },
  { label: "Fév", value: 84 },
  { label: "Mar", value: 83 },
  { label: "Avr", value: 86 },
  { label: "Mai", value: 85 },
  { label: "Jun", value: 87 },
  { label: "Jul", value: 86 },
  { label: "Aoû", value: 88 },
  { label: "Sep", value: 87 },
  { label: "Oct", value: 89 },
  { label: "Nov", value: 88 },
  { label: "Déc", value: 87.5 },
];

const demoSitePerformance = [
  { label: "Paris", value: 92 },
  { label: "Lyon", value: 88 },
  { label: "Bordeaux", value: 85 },
  { label: "Munich", value: 90 },
  { label: "Boston", value: 87 },
];

const demoProcessNCData = [
  {
    label: "Conception",
    segments: [
      { value: 1, color: "#ef4444", label: "NC Majeure" },
      { value: 3, color: "#f97316", label: "NC Mineure" },
      { value: 5, color: "#eab308", label: "Observation" },
    ],
  },
  {
    label: "Production",
    segments: [
      { value: 0, color: "#ef4444", label: "NC Majeure" },
      { value: 2, color: "#f97316", label: "NC Mineure" },
      { value: 4, color: "#eab308", label: "Observation" },
    ],
  },
  {
    label: "Achats",
    segments: [
      { value: 1, color: "#ef4444", label: "NC Majeure" },
      { value: 4, color: "#f97316", label: "NC Mineure" },
      { value: 6, color: "#eab308", label: "Observation" },
    ],
  },
  {
    label: "Risques",
    segments: [
      { value: 0, color: "#ef4444", label: "NC Majeure" },
      { value: 1, color: "#f97316", label: "NC Mineure" },
      { value: 3, color: "#eab308", label: "Observation" },
    ],
  },
  {
    label: "PMS",
    segments: [
      { value: 1, color: "#ef4444", label: "NC Majeure" },
      { value: 2, color: "#f97316", label: "NC Mineure" },
      { value: 6, color: "#eab308", label: "Observation" },
    ],
  },
];

const demoParetoData = [
  { label: "7.3.4", value: 8 },
  { label: "8.2.3", value: 6 },
  { label: "4.2.4", value: 5 },
  { label: "7.5.1", value: 4 },
  { label: "8.5.2", value: 4 },
  { label: "6.2.1", value: 3 },
  { label: "7.1.2", value: 3 },
  { label: "9.1.2", value: 2 },
  { label: "5.6.1", value: 2 },
  { label: "10.2", value: 1 },
];

const demoHeatmapData = [
  { row: "Paris", col: "Conception", value: 95 },
  { row: "Paris", col: "Production", value: 88 },
  { row: "Paris", col: "Achats", value: 92 },
  { row: "Paris", col: "Risques", value: 90 },
  { row: "Lyon", col: "Conception", value: 85 },
  { row: "Lyon", col: "Production", value: 92 },
  { row: "Lyon", col: "Achats", value: 78 },
  { row: "Lyon", col: "Risques", value: 88 },
  { row: "Bordeaux", col: "Conception", value: 90 },
  { row: "Bordeaux", col: "Production", value: 82 },
  { row: "Bordeaux", col: "Achats", value: 85 },
  { row: "Bordeaux", col: "Risques", value: 92 },
  { row: "Munich", col: "Conception", value: 88 },
  { row: "Munich", col: "Production", value: 90 },
  { row: "Munich", col: "Achats", value: 86 },
  { row: "Munich", col: "Risques", value: 94 },
  { row: "Boston", col: "Conception", value: 86 },
  { row: "Boston", col: "Production", value: 84 },
  { row: "Boston", col: "Achats", value: 88 },
  { row: "Boston", col: "Risques", value: 90 },
];

const demoInsights = [
  {
    type: "warning",
    title: "Processus Achats à risque",
    description: "Le processus Achats concentre 35% des NC sur les 3 derniers mois. Recommandation : audit ciblé.",
    priority: "high",
  },
  {
    type: "success",
    title: "Amélioration continue",
    description: "Le taux de conformité global a augmenté de 5% sur les 6 derniers mois.",
    priority: "info",
  },
  {
    type: "alert",
    title: "Actions en retard",
    description: "4 actions CAPA dépassent leur échéance. Impact potentiel sur la certification.",
    priority: "critical",
  },
  {
    type: "info",
    title: "Clause 7.3.4 récurrente",
    description: "La clause 7.3.4 (Revue de conception) apparaît dans 8 constats. Formation recommandée.",
    priority: "medium",
  },
];

export default function AnalyticsDashboard() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "fr" | "en";
  const { data: kpiData } = trpc.dashboard.getKPIs.useQuery();
  const { data: recentFindings } = trpc.dashboard.getRecentFindings.useQuery({ limit: 50 });
  const { data: analyticsData } = trpc.dashboard.getAnalytics.useQuery();

  const liveKPIs = useMemo(() => {
    const data = (kpiData ?? {}) as any;
    const types = data.findingsByType ?? {};
    const totalActions = Number(data.totalActions ?? 0);
    const closedActions = Number(data.actionsByStatus?.closed ?? 0);
    return {
      globalScore: Number(data.scoreGlobal ?? 0),
      conformityRate: Number(data.scoreGlobal ?? 0),
      ncMajor: Number(types.nc_major ?? 0),
      ncMinor: Number(types.nc_minor ?? 0),
      observations: Number(types.observation ?? 0),
      ofi: Number(types.ofi ?? 0),
      overdueActions: Number(data.overdueActions ?? 0),
      actionClosureRate: totalActions > 0 ? Math.round((closedActions / totalActions) * 1000) / 10 : 0,
      avgClosureDays: Number(data.averageClosureTime ?? 0),
      frameworkScores: data.frameworkScores ?? {},
    };
  }, [kpiData]);

  const liveFindings = useMemo(
    () =>
      (Array.isArray(recentFindings) ? recentFindings : []).map((finding: any) => ({
        id: finding.code ?? `FIND-${finding.id}`,
        type: finding.type ?? "observation",
        title: finding.title ?? "Constat",
        process: finding.processName || "Non renseigné",
        clause: finding.referentialName || "Non renseignée",
        status: finding.status || "open",
        daysOpen: finding.date
          ? Math.max(0, Math.floor((Date.now() - new Date(finding.date).getTime()) / 86400000))
          : 0,
        site: finding.siteName || "Non renseigné",
      })),
    [recentFindings]
  );

  const liveReferentialPerformance = useMemo(
    () => ((analyticsData as any)?.referentials ?? []).map((item: any) => ({ label: item.label, value: item.score })),
    [analyticsData]
  );

  const liveTimeline = useMemo(
    () => ((analyticsData as any)?.timeline ?? []).map((item: any) => ({ label: item.month, value: item.score })),
    [analyticsData]
  );
  const liveSites = useMemo(
    () => ((analyticsData as any)?.sites ?? []).map((item: any, index: number) => ({ id: String(index + 1), name: item.label, code: item.label, score: item.score, responses: item.responses })),
    [analyticsData]
  );
  const liveProcesses = useMemo(
    () => ((analyticsData as any)?.processes ?? []).map((item: any, index: number) => ({ id: String(index + 1), name: item.label, score: item.score, responses: item.responses })),
    [analyticsData]
  );
  const liveReferentials = useMemo(
    () => ((analyticsData as any)?.referentials ?? []).map((item: any, index: number) => ({ id: String(index + 1), name: item.label, score: item.score, responses: item.responses })),
    [analyticsData]
  );
  const liveClauses = useMemo(
    () => ((analyticsData as any)?.clauses ?? []).map((item: any) => ({ label: item.label, value: item.nonConforming, total: item.total })),
    [analyticsData]
  );

  const liveInsights = useMemo(() => {
    const insights: Array<{ title: string; description: string; priority: string }> = [];
    if (liveKPIs.overdueActions > 0) {
      insights.push({
        title: "Actions en retard",
        description: `${liveKPIs.overdueActions} action(s) CAPA dépassent leur échéance.`,
        priority: "critical",
      });
    }
    if (liveKPIs.ncMajor > 0) {
      insights.push({
        title: "Non-conformités majeures",
        description: `${liveKPIs.ncMajor} non-conformité(s) majeure(s) nécessitent une priorisation.`,
        priority: "high",
      });
    }
    if (liveKPIs.actionClosureRate > 0) {
      insights.push({
        title: "Clôture des actions",
        description: `Le taux de clôture mesuré est de ${liveKPIs.actionClosureRate} %.`,
        priority: liveKPIs.actionClosureRate >= 80 ? "info" : "medium",
      });
    }
    return insights;
  }, [liveKPIs]);

  // State
  const [filters, setFilters] = useState<DashboardFiltersState>({
    period: "12m",
    sites: [],
    processes: [],
    referentials: [],
    auditType: "all",
    auditStatus: "all",
    criticality: [],
    actionStatus: [],
    auditor: "",
    search: "",
  });

  const [drillLevels, setDrillLevels] = useState<DrillLevel[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeFunnelStep, setActiveFunnelStep] = useState(0);

  // Drill-down handlers
  const handleDrillDown = (level: DrillLevel) => {
    setDrillLevels((prev) => [...prev, level]);
  };

  const handleLevelClick = (level: DrillLevel) => {
    const index = drillLevels.findIndex((l) => l.id === level.id);
    if (index >= 0) {
      setDrillLevels(drillLevels.slice(0, index + 1));
    }
  };

  const handleRemoveLevel = (levelId: string) => {
    const index = drillLevels.findIndex((l) => l.id === levelId);
    if (index >= 0) {
      setDrillLevels(drillLevels.slice(0, index));
    }
  };

  const handleReset = () => {
    setDrillLevels([]);
  };

  const handleBack = () => {
    setDrillLevels((prev) => prev.slice(0, -1));
  };

  const handleStepClick = (step: number) => {
    const tabByStep = [
      "overview",
      "sites",
      "processes",
      "referentials",
      "clauses",
      "requirements",
      "findings",
      "actions",
    ];
    setActiveFunnelStep(step);
    setActiveTab(tabByStep[step] ?? "overview");
    setDrillLevels([]);
    window.setTimeout(() => {
      document.getElementById("analytics-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  // Export handlers
  const handleExportCSV = () => {
    // TODO: Implement CSV export
    console.log("Export CSV");
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log("Export PDF");
  };

  const handleExportPackDG = () => {
    // TODO: Implement Pack DG export
    console.log("Export Pack DG");
  };

  return (
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Analytique</h1>
            <p className="text-muted-foreground">
              Vue consolidée des performances qualité et conformité
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button variant="default" size="sm" onClick={handleExportPackDG}>
              <FileCheck className="h-4 w-4 mr-1" />
              Pack DG
            </Button>
          </div>
        </div>

        {/* Funnel Navigator */}
        <FunnelSteps currentLevel={activeFunnelStep} onStepClick={handleStepClick} />

        {/* Breadcrumb navigation */}
        {drillLevels.length > 0 && (
          <FunnelNavigator
            levels={drillLevels}
            onLevelClick={handleLevelClick}
            onRemoveLevel={handleRemoveLevel}
            onReset={handleReset}
            onBack={handleBack}
          />
        )}

        {/* Filters */}
        <DashboardFilters
          filters={filters}
          onFiltersChange={setFilters}
          sites={liveSites}
          processes={liveProcesses}
          referentials={liveReferentials}
        />

        {/* KPI Cards - Zone 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <KPICard
            title="Score Global"
            value={liveKPIs.globalScore}
            unit="%"
            icon={<Target className="h-4 w-4" />}
            definition={KPI_DEFINITIONS.globalScore[lang]}
            color="success"
            onClick={() =>
              handleDrillDown({
                id: "score",
                type: "organization",
                label: "Score",
                value: "global",
                displayValue: "Score Global",
              })
            }
          />
          <KPICard
            title="Taux de Conformité"
            value={liveKPIs.conformityRate}
            unit="%"
            icon={<CheckCircle2 className="h-4 w-4" />}
            definition={KPI_DEFINITIONS.conformityRate[lang]}
            color="success"
          />
          <KPICard
            title="NC Majeures"
            value={liveKPIs.ncMajor}
            icon={<AlertTriangle className="h-4 w-4" />}
            definition={KPI_DEFINITIONS.ncMajor[lang]}
            color="danger"
          />
          <KPICard
            title="NC Mineures"
            value={liveKPIs.ncMinor}
            icon={<AlertTriangle className="h-4 w-4" />}
            definition={KPI_DEFINITIONS.ncMinor[lang]}
            color="warning"
          />
          <KPICard
            title="Actions en Retard"
            value={liveKPIs.overdueActions}
            icon={<Clock className="h-4 w-4" />}
            definition={KPI_DEFINITIONS.overdueActions[lang]}
            color={liveKPIs.overdueActions > 0 ? "danger" : "success"}
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            title="Observations"
            value={liveKPIs.observations}
            icon={<Activity className="h-4 w-4" />}
            definition={KPI_DEFINITIONS.observations[lang]}
            size="sm"
          />
          <KPICard
            title="OFI"
            value={liveKPIs.ofi}
            icon={<Lightbulb className="h-4 w-4" />}
            definition={KPI_DEFINITIONS.ofi[lang]}
            size="sm"
          />
          <KPICard
            title="Taux Clôture Actions"
            value={liveKPIs.actionClosureRate}
            unit="%"
            icon={<CheckCircle2 className="h-4 w-4" />}
            definition={KPI_DEFINITIONS.actionClosureRate[lang]}
            size="sm"
            color={liveKPIs.actionClosureRate >= 80 ? "success" : "warning"}
          />
          <KPICard
            title="Délai Moyen Clôture"
            value={liveKPIs.avgClosureDays}
            unit="jours"
            icon={<Clock className="h-4 w-4" />}
            definition={KPI_DEFINITIONS.avgClosureDays[lang]}
            size="sm"
          />
        </div>

        {/* Insights automatiques */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Insights Automatiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {liveInsights.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun insight calculable avec les données actuelles.</p>
              )}
              {liveInsights.map((insight, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border-l-4",
                    insight.priority === "critical" && "bg-red-50 border-red-500 dark:bg-red-950",
                    insight.priority === "high" && "bg-orange-50 border-orange-500 dark:bg-orange-950",
                    insight.priority === "medium" && "bg-amber-50 border-amber-500 dark:bg-amber-950",
                    insight.priority === "info" && "bg-green-50 border-green-500 dark:bg-green-950"
                  )}
                >
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {insight.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs
          id="analytics-detail"
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            const stepByTab: Record<string, number> = {
              overview: 0,
              sites: 1,
              processes: 2,
              findings: 6,
            };
            setActiveFunnelStep(stepByTab[value] ?? 0);
          }}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="sites">Par Site</TabsTrigger>
            <TabsTrigger value="processes">Par Processus</TabsTrigger>
            <TabsTrigger value="findings">Constats</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {liveTimeline.length > 0 && (
              <LineChart data={liveTimeline} title="Évolution réelle du score par mois" color="#3b82f6" />
            )}
            {liveReferentialPerformance.length > 0 ? (
              <BarChart
                data={liveReferentialPerformance}
                title="Performance réelle par référentiel"
                horizontal
              />
            ) : (
              <Card><CardContent className="py-8 text-sm text-muted-foreground">Aucun score par référentiel n’est encore disponible.</CardContent></Card>
            )}
            <Card>
              <CardHeader><CardTitle className="text-lg">Analyses temporelles et multidimensionnelles</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {liveTimeline.length > 0
                  ? "Les courbes et ventilations ci-dessus sont calculées à partir des audits et réponses enregistrés."
                  : "L’historique mensuel sera affiché dès que des audits datés avec réponses seront disponibles."}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sites" className="space-y-6 mt-6">
            {liveSites.length === 0 && (
              <Card><CardContent className="py-8 text-sm text-muted-foreground">Aucun audit n’est encore rattaché à un site.</CardContent></Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveSites.map((site) => (
                <Card
                  key={site.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() =>
                    handleDrillDown({
                      id: `site-${site.id}`,
                      type: "site",
                      label: "Site",
                      value: site.id,
                      displayValue: site.name,
                    })
                  }
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {site.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Score</span>
                        <p className="font-bold text-lg text-green-600">
                          {site.score}%
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Réponses analysées</span>
                        <p className="font-bold text-lg">
                          {site.responses}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="processes" className="space-y-6 mt-6">
            {liveProcesses.length === 0 && (
              <Card><CardContent className="py-8 text-sm text-muted-foreground">Aucune réponse n’est encore rattachée à un processus.</CardContent></Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {liveProcesses.map((process) => (
                <Card
                  key={process.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() =>
                    handleDrillDown({
                      id: `process-${process.id}`,
                      type: "process",
                      label: "Processus",
                      value: process.id,
                      displayValue: process.name,
                    })
                  }
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      {process.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={
                          "secondary"
                        }
                      >
                        {process.responses} réponses
                      </Badge>
                      <span className="text-sm font-medium">
                        {process.score}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="referentials" className="space-y-6 mt-6">
            {liveReferentials.length === 0 && (
              <Card><CardContent className="py-8 text-sm text-muted-foreground">Aucune réponse exploitable par référentiel.</CardContent></Card>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {liveReferentials.map((referential) => (
                <Card key={referential.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{referential.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {Number(referential.score).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Conformité du référentiel</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="clauses" className="space-y-6 mt-6">
            {liveClauses.length > 0 ? (
              <ParetoChart data={liveClauses} title="Non-conformités réelles par clause" />
            ) : (
              <Card><CardContent className="py-8 text-sm text-muted-foreground">Aucune clause non conforme n’est disponible.</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="requirements" className="space-y-6 mt-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Exigences à surveiller</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {liveClauses.slice(0, 6).map((item, index) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg border p-3">
                    <span>Exigence {item.label}</span>
                    <Badge variant={index < 2 ? "destructive" : "secondary"}>{item.value} constats</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="findings" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Constats Ouverts</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Titre</TableHead>
                      <TableHead>Processus</TableHead>
                      <TableHead>Clause</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Jours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liveFindings.map((finding) => (
                      <TableRow
                        key={finding.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          handleDrillDown({
                            id: `finding-${finding.id}`,
                            type: "finding",
                            label: "Constat",
                            value: finding.id,
                            displayValue: finding.id,
                          })
                        }
                      >
                        <TableCell className="font-mono text-sm">
                          {finding.id}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              finding.type === "nc_major"
                                ? "destructive"
                                : finding.type === "nc_minor"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {finding.type === "nc_major"
                              ? "NC Maj"
                              : finding.type === "nc_minor"
                              ? "NC Min"
                              : "Obs"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {finding.title}
                        </TableCell>
                        <TableCell>{finding.process}</TableCell>
                        <TableCell className="font-mono">
                          {finding.clause}
                        </TableCell>
                        <TableCell>{finding.site}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              finding.status === "open"
                                ? "destructive"
                                : finding.status === "in_progress"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {finding.status === "open"
                              ? "Ouvert"
                              : finding.status === "in_progress"
                              ? "En cours"
                              : "Fermé"}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={cn(
                            "font-medium",
                            finding.daysOpen > 20 && "text-red-600"
                          )}
                        >
                          {finding.daysOpen}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6 mt-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Actions correctives</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Origine</TableHead><TableHead>Statut</TableHead><TableHead>Échéance</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {liveFindings.map((finding, index) => (
                      <TableRow key={finding.id}>
                        <TableCell>Action corrective {index + 1}</TableCell>
                        <TableCell>{finding.id}</TableCell>
                        <TableCell><Badge variant={finding.status === "closed" ? "secondary" : "default"}>{finding.status === "closed" ? "Clôturée" : "En cours"}</Badge></TableCell>
                        <TableCell>{finding.daysOpen > 20 ? "En retard" : "Dans les délais"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
