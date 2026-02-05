import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterPanel, DashboardFilters } from "@/components/dashboard-v2/FilterPanel";
import { DrilldownModal } from "@/components/dashboard-v2/DrilldownModal";
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Target,
  FileText,
  Activity
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  FunnelChart,
  Funnel,
  LabelList
} from "recharts";

const COLORS = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#dc2626"
};

export default function DashboardV2() {
  const [filters, setFilters] = useState<DashboardFilters>({
    market: "all",
    economicRole: "all",
    auditStatus: "all",
    criticality: "all"
  });

  // Drill-down state
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownType, setDrilldownType] = useState<"findings" | "actions" | "audits">("findings");
  const [drilldownFilters, setDrilldownFilters] = useState<Record<string, any>>({});
  const [drilldownTitle, setDrilldownTitle] = useState("");
  const [drilldownDescription, setDrilldownDescription] = useState("");

  const openDrilldown = (
    type: "findings" | "actions" | "audits",
    filters: Record<string, any>,
    title: string,
    description?: string
  ) => {
    setDrilldownType(type);
    setDrilldownFilters(filters);
    setDrilldownTitle(title);
    setDrilldownDescription(description || "");
    setDrilldownOpen(true);
  };

  // Fetch data with filters
  const { data: summary, isLoading: loadingSummary } = trpc.dashboard.getSummary.useQuery(filters);
  const { data: funnel, isLoading: loadingFunnel } = trpc.dashboard.getFunnel.useQuery(filters);
  const { data: timeseries, isLoading: loadingTimeseries } = trpc.dashboard.getTimeseries.useQuery({
    filters,
    granularity: "month"
  });
  const { data: heatmap, isLoading: loadingHeatmap } = trpc.dashboard.getHeatmap.useQuery(filters);
  const { data: radar, isLoading: loadingRadar } = trpc.dashboard.getRadar.useQuery(filters);
  const { data: scoring, isLoading: loadingScoring } = trpc.dashboard.getScoring.useQuery(filters);
  const { data: suggestions, isLoading: loadingSuggestions } = trpc.dashboard.getSuggestions.useQuery(filters);

  const isLoading = loadingSummary || loadingFunnel || loadingTimeseries || loadingHeatmap || loadingRadar || loadingScoring || loadingSuggestions;

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement du dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard Conformité</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de vos audits, constats et actions correctives
        </p>
      </div>

      {/* Filtres */}
      <FilterPanel onFiltersChange={setFilters} initialFilters={filters} />

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => openDrilldown(
            "audits",
            {},
            "Liste des audits",
            `${summary?.totalAudits || 0} audits au total`
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audits</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalAudits || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.auditsByStatus.closed || 0} clôturés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conformité</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.globalConformityRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Score moyen : {summary?.averageAuditScore || 0}/100
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => openDrilldown(
            "findings",
            {},
            "Liste des non-conformités",
            `${summary?.totalFindings || 0} constats au total`
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-conformités</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalFindings || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.findingsByType.nc_major || 0} majeures, {summary?.findingsByType.nc_minor || 0} mineures
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => openDrilldown(
            "actions",
            {},
            "Liste des actions",
            `${summary?.totalActions || 0} actions au total`
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalActions || 0}</div>
            <p className="text-xs text-danger">
              {summary?.overdueActions || 0} en retard ({summary?.overduePercentage || 0}%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* KPIs secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps moyen de clôture</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.averageClosureTime || 0} jours</div>
            <p className="text-xs text-muted-foreground">Pour les actions complétées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funnel?.conversionRates.actionsToCompleted || 0}%</div>
            <p className="text-xs text-muted-foreground">Actions complétées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top processus à risque</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.topRiskyProcesses[0]?.processName.slice(0, 15) || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.topRiskyProcesses[0]?.ncCount || 0} NC ({summary?.topRiskyProcesses[0]?.criticalCount || 0} critiques)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Entonnoir de conformité</CardTitle>
            <CardDescription>
              Progression des audits jusqu'aux actions clôturées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnel?.stages || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Audits → Constats:</span>{" "}
                <span className="font-semibold">{funnel?.conversionRates.auditsToFindings || 0}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Constats → NC:</span>{" "}
                <span className="font-semibold">{funnel?.conversionRates.findingsToNC || 0}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">NC → Actions:</span>{" "}
                <span className="font-semibold">{funnel?.conversionRates.ncToActions || 0}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Actions → Clôturées:</span>{" "}
                <span className="font-semibold">{funnel?.conversionRates.actionsToCompleted || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - Répartition par criticité */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par criticité</CardTitle>
            <CardDescription>
              Distribution des constats par niveau de criticité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Critique", value: summary?.findingsByCriticality.critical || 0, color: COLORS.critical },
                    { name: "Élevée", value: summary?.findingsByCriticality.high || 0, color: COLORS.high },
                    { name: "Moyenne", value: summary?.findingsByCriticality.medium || 0, color: COLORS.medium },
                    { name: "Faible", value: summary?.findingsByCriticality.low || 0, color: COLORS.low }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: "Critique", value: summary?.findingsByCriticality.critical || 0, color: COLORS.critical },
                    { name: "Élevée", value: summary?.findingsByCriticality.high || 0, color: COLORS.high },
                    { name: "Moyenne", value: summary?.findingsByCriticality.medium || 0, color: COLORS.medium },
                    { name: "Faible", value: summary?.findingsByCriticality.low || 0, color: COLORS.low }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Évolution temporelle */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Évolution temporelle</CardTitle>
          <CardDescription>
            Évolution du score de conformité et des non-conformités sur les 12 derniers mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeseries?.timeseries || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="conformityRate" 
                stroke={COLORS.success} 
                name="Taux de conformité (%)" 
                strokeWidth={2}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="ncMajorCount" 
                stroke={COLORS.danger} 
                name="NC majeures" 
                strokeWidth={2}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="ncMinorCount" 
                stroke={COLORS.warning} 
                name="NC mineures" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Radar Chart - 7 dimensions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Analyse multi-dimensions</CardTitle>
          <CardDescription>
            Évaluation de la conformité sur 7 dimensions clés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radar?.dimensions || []}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar 
                name="Score" 
                dataKey="score" 
                stroke={COLORS.primary} 
                fill={COLORS.primary} 
                fillOpacity={0.6} 
              />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {radar?.dimensions.map((dim, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="text-muted-foreground">{dim.name}:</span>
                <span className="font-semibold">{dim.score}/100</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Heatmap - Processus vs Criticité */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Heatmap Processus vs Criticité</CardTitle>
          <CardDescription>
            Identification des processus les plus critiques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Processus</th>
                  <th className="text-center py-2 px-4">Critique</th>
                  <th className="text-center py-2 px-4">Élevée</th>
                  <th className="text-center py-2 px-4">Moyenne</th>
                  <th className="text-center py-2 px-4">Faible</th>
                  <th className="text-center py-2 px-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {heatmap?.heatmap.slice(0, 10).map((row, idx) => (
                  <tr 
                    key={idx} 
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => openDrilldown(
                      "findings",
                      { processId: row.processId },
                      `Constats du processus : ${row.processName}`,
                      `${row.total} constats identifiés`
                    )}
                  >
                    <td className="py-2 px-4">{row.processName}</td>
                    <td className="text-center py-2 px-4">
                      <span 
                        className="inline-block px-2 py-1 rounded text-white"
                        style={{ backgroundColor: row.critical > 0 ? COLORS.critical : "#e5e7eb" }}
                      >
                        {row.critical}
                      </span>
                    </td>
                    <td className="text-center py-2 px-4">
                      <span 
                        className="inline-block px-2 py-1 rounded text-white"
                        style={{ backgroundColor: row.high > 0 ? COLORS.high : "#e5e7eb" }}
                      >
                        {row.high}
                      </span>
                    </td>
                    <td className="text-center py-2 px-4">
                      <span 
                        className="inline-block px-2 py-1 rounded text-white"
                        style={{ backgroundColor: row.medium > 0 ? COLORS.medium : "#e5e7eb" }}
                      >
                        {row.medium}
                      </span>
                    </td>
                    <td className="text-center py-2 px-4">
                      <span 
                        className="inline-block px-2 py-1 rounded text-white"
                        style={{ backgroundColor: row.low > 0 ? COLORS.low : "#e5e7eb" }}
                      >
                        {row.low}
                      </span>
                    </td>
                    <td className="text-center py-2 px-4 font-semibold">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions d'actions */}
      <Card>
        <CardHeader>
          <CardTitle>Plan d'action recommandé</CardTitle>
          <CardDescription>
            Suggestions basées sur l'analyse des 3 processus les plus faibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {suggestions?.suggestions.map((suggestion, idx) => (
              <div 
                key={idx} 
                className="border rounded-lg p-4"
                style={{
                  borderLeftWidth: "4px",
                  borderLeftColor: 
                    suggestion.priority === "critical" ? COLORS.critical :
                    suggestion.priority === "high" ? COLORS.high :
                    COLORS.medium
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{suggestion.processName}</h4>
                    <p className="text-sm text-muted-foreground">{suggestion.issue}</p>
                  </div>
                  <span 
                    className="text-xs px-2 py-1 rounded text-white"
                    style={{
                      backgroundColor: 
                        suggestion.priority === "critical" ? COLORS.critical :
                        suggestion.priority === "high" ? COLORS.high :
                        COLORS.medium
                    }}
                  >
                    {suggestion.priority === "critical" ? "Critique" :
                     suggestion.priority === "high" ? "Élevée" : "Moyenne"}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {suggestion.recommendedActions.map((action, actionIdx) => (
                    <div key={actionIdx} className="bg-muted/50 rounded p-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{action.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                          <div className="flex gap-4 mt-2 text-xs">
                            <span>
                              <span className="text-muted-foreground">Type:</span> {action.actionType}
                            </span>
                            <span>
                              <span className="text-muted-foreground">Responsable:</span> {action.suggestedOwner}
                            </span>
                            <span>
                              <span className="text-muted-foreground">Délai:</span> {action.suggestedDeadline} jours
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  <strong>Justification:</strong> {suggestion.rationale}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Drill-down Modal */}
      <DrilldownModal
        isOpen={drilldownOpen}
        onClose={() => setDrilldownOpen(false)}
        type={drilldownType}
        filters={drilldownFilters}
        title={drilldownTitle}
        description={drilldownDescription}
      />
    </div>
  );
}
