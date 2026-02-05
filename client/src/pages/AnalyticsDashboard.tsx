import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import { KPICard, KPI_DEFINITIONS } from "@/components/dashboard/KPICard";
import { FunnelNavigator, FunnelSteps, DrillLevel } from "@/components/dashboard/FunnelNavigator";
import { DashboardFilters, DashboardFiltersState } from "@/components/dashboard/DashboardFilters";
import {
  BarChart,
  StackedBarChart,
  LineChart,
  Heatmap,
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
const demoKPIs = {
  globalScore: 87.5,
  globalScoreTrend: 3.2,
  conformityRate: 92.3,
  conformityRateTrend: 1.8,
  ncMajor: 3,
  ncMajorTrend: -2,
  ncMinor: 12,
  ncMinorTrend: -5,
  observations: 24,
  ofi: 18,
  actionClosureRate: 78,
  avgClosureDays: 23,
  overdueActions: 4,
  riskScore: 32,
};

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

const demoFindings = [
  {
    id: "F-2026-001",
    type: "nc_major",
    title: "Absence de revue de conception documentée",
    process: "Conception",
    clause: "7.3.4",
    status: "open",
    daysOpen: 15,
    site: "Paris",
  },
  {
    id: "F-2026-002",
    type: "nc_minor",
    title: "Enregistrements de formation incomplets",
    process: "Production",
    clause: "6.2.2",
    status: "in_progress",
    daysOpen: 8,
    site: "Lyon",
  },
  {
    id: "F-2026-003",
    type: "nc_major",
    title: "Évaluation des fournisseurs non mise à jour",
    process: "Achats",
    clause: "7.4.1",
    status: "open",
    daysOpen: 22,
    site: "Bordeaux",
  },
  {
    id: "F-2026-004",
    type: "nc_minor",
    title: "Procédure de rappel non testée",
    process: "PMS",
    clause: "8.2.3",
    status: "closed",
    daysOpen: 0,
    site: "Munich",
  },
  {
    id: "F-2026-005",
    type: "observation",
    title: "Opportunité d'amélioration du processus CAPA",
    process: "CAPA",
    clause: "8.5.2",
    status: "open",
    daysOpen: 5,
    site: "Boston",
  },
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
    if (step < drillLevels.length) {
      setDrillLevels(drillLevels.slice(0, step));
    }
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
    <DashboardLayout>
      <div className="space-y-6 p-6">
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
        <FunnelSteps currentLevel={drillLevels.length} onStepClick={handleStepClick} />

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
          sites={demoSites}
          processes={demoProcesses}
          referentials={demoReferentials}
        />

        {/* KPI Cards - Zone 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <KPICard
            title="Score Global"
            value={demoKPIs.globalScore}
            unit="%"
            icon={<Target className="h-4 w-4" />}
            definition={KPI_DEFINITIONS.globalScore[lang]}
            trend={{
              value: demoKPIs.globalScoreTrend,
              direction: "up",
              label: "vs période précédente",
            }}
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
            value={demoKPIs.conformityRate}
            unit="%"
            icon={<CheckCircle2 className="h-4 w-4" />}
            definition={KPI_DEFINITIONS.conformityRate[lang]}
            trend={{
              value: demoKPIs.conformityRateTrend,
              direction: "up",
              label: "vs période précédente",
            }}
            color="success"
          />
          <KPICard
            title="NC Majeures"
            value={demoKPIs.ncMajor}
            icon={<AlertTriangle className="h-4 w-4" />}
            definition={KPI_DEFINITIONS.ncMajor[lang]}
            trend={{
              value: Math.abs(demoKPIs.ncMajorTrend),
              direction: demoKPIs.ncMajorTrend < 0 ? "down" : "up",
              label: "vs période précédente",
            }}
            color="danger"
          />
          <KPICard
            title="NC Mineures"
            value={demoKPIs.ncMinor}
            icon={<AlertTriangle className="h-4 w-4" />}
            definition={KPI_DEFINITIONS.ncMinor[lang]}
            trend={{
              value: Math.abs(demoKPIs.ncMinorTrend),
              direction: demoKPIs.ncMinorTrend < 0 ? "down" : "up",
            }}
            color="warning"
          />
          <KPICard
            title="Actions en Retard"
            value={demoKPIs.overdueActions}
            icon={<Clock className="h-4 w-4" />}
            definition={KPI_DEFINITIONS.overdueActions[lang]}
            color={demoKPIs.overdueActions > 0 ? "danger" : "success"}
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            title="Observations"
            value={demoKPIs.observations}
            icon={<Activity className="h-4 w-4" />}
            definition={KPI_DEFINITIONS.observations[lang]}
            size="sm"
          />
          <KPICard
            title="OFI"
            value={demoKPIs.ofi}
            icon={<Lightbulb className="h-4 w-4" />}
            definition={KPI_DEFINITIONS.ofi[lang]}
            size="sm"
          />
          <KPICard
            title="Taux Clôture Actions"
            value={demoKPIs.actionClosureRate}
            unit="%"
            icon={<CheckCircle2 className="h-4 w-4" />}
            definition={KPI_DEFINITIONS.actionClosureRate[lang]}
            size="sm"
            color={demoKPIs.actionClosureRate >= 80 ? "success" : "warning"}
          />
          <KPICard
            title="Délai Moyen Clôture"
            value={demoKPIs.avgClosureDays}
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
              {demoInsights.map((insight, index) => (
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="sites">Par Site</TabsTrigger>
            <TabsTrigger value="processes">Par Processus</TabsTrigger>
            <TabsTrigger value="findings">Constats</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LineChart
                data={demoTrendData}
                title="Évolution du Score Global (12 mois)"
                color="#3b82f6"
              />
              <BarChart
                data={demoSitePerformance}
                title="Performance par Site"
                horizontal
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StackedBarChart
                data={demoProcessNCData}
                title="Répartition des Constats par Processus"
              />
              <ParetoChart
                data={demoParetoData}
                title="Pareto des Clauses Non-Conformes"
              />
            </div>

            {/* Heatmap */}
            <Heatmap
              data={demoHeatmapData}
              rows={["Paris", "Lyon", "Bordeaux", "Munich", "Boston"]}
              cols={["Conception", "Production", "Achats", "Risques"]}
              title="Matrice Site × Processus (Taux de Conformité)"
            />
          </TabsContent>

          <TabsContent value="sites" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {demoSites.map((site) => (
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
                          {85 + Math.floor(Math.random() * 10)}%
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">NC Ouvertes</span>
                        <p className="font-bold text-lg">
                          {Math.floor(Math.random() * 5)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="processes" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {demoProcesses.map((process) => (
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
                          Math.random() > 0.3 ? "default" : "destructive"
                        }
                      >
                        {Math.floor(Math.random() * 5)} NC
                      </Badge>
                      <span className="text-sm font-medium">
                        {80 + Math.floor(Math.random() * 15)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                    {demoFindings.map((finding) => (
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
