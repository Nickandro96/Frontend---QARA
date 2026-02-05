/**
 * Audit Comparison Page
 * Compare multiple audits and show evolution over time
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Minus, ArrowLeft } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function AuditComparison() {
  const [, setLocation] = useLocation();
  const [selectedAuditIds, setSelectedAuditIds] = useState<number[]>([]);
  
  const { data: audits, isLoading } = trpc.audit.list.useQuery();

  const toggleAudit = (auditId: number) => {
    setSelectedAuditIds(prev =>
      prev.includes(auditId)
        ? prev.filter(id => id !== auditId)
        : [...prev, auditId]
    );
  };

  // Prepare chart data
  const chartData = audits
    ?.filter(audit => selectedAuditIds.includes(audit.id))
    .sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateA - dateB;
    })
    .map(audit => ({
      name: audit.name,
      date: audit.startDate ? new Date(audit.startDate).toLocaleDateString('fr-FR') : 'N/A',
      conformityRate: audit.conformityRate ? parseFloat(audit.conformityRate) : 0,
    })) || [];

  // Calculate trend
  const calculateTrend = () => {
    if (chartData.length < 2) return null;
    const first = chartData[0].conformityRate;
    const last = chartData[chartData.length - 1].conformityRate;
    const diff = last - first;
    return {
      value: Math.abs(diff).toFixed(1),
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
    };
  };

  const trend = calculateTrend();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/audit-history")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Comparaison d'Audits</h1>
            <p className="text-muted-foreground mt-1">
              Comparez l'évolution de la conformité entre plusieurs audits
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audit Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Sélectionner les audits</CardTitle>
            <CardDescription>
              Choisissez au moins 2 audits pour comparer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {audits && audits.length > 0 ? (
              audits.map(audit => (
                <div key={audit.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={`audit-${audit.id}`}
                    checked={selectedAuditIds.includes(audit.id)}
                    onCheckedChange={() => toggleAudit(audit.id)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`audit-${audit.id}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {audit.name}
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {audit.startDate
                        ? new Date(audit.startDate).toLocaleDateString('fr-FR')
                        : 'Date non définie'}
                    </p>
                    {audit.conformityRate && (
                      <Badge variant="outline" className="mt-2">
                        {parseFloat(audit.conformityRate).toFixed(1)}% conforme
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun audit disponible
              </p>
            )}
          </CardContent>
        </Card>

        {/* Comparison Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trend Card */}
          {selectedAuditIds.length >= 2 && trend && (
            <Card>
              <CardHeader>
                <CardTitle>Tendance Globale</CardTitle>
                <CardDescription>
                  Évolution entre le premier et le dernier audit sélectionné
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {trend.direction === 'up' && (
                    <>
                      <TrendingUp className="h-12 w-12 text-green-500" />
                      <div>
                        <p className="text-3xl font-bold text-green-500">+{trend.value}%</p>
                        <p className="text-sm text-muted-foreground">Amélioration de la conformité</p>
                      </div>
                    </>
                  )}
                  {trend.direction === 'down' && (
                    <>
                      <TrendingDown className="h-12 w-12 text-red-500" />
                      <div>
                        <p className="text-3xl font-bold text-red-500">-{trend.value}%</p>
                        <p className="text-sm text-muted-foreground">Baisse de la conformité</p>
                      </div>
                    </>
                  )}
                  {trend.direction === 'stable' && (
                    <>
                      <Minus className="h-12 w-12 text-gray-500" />
                      <div>
                        <p className="text-3xl font-bold text-gray-500">Stable</p>
                        <p className="text-sm text-muted-foreground">Pas de changement significatif</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chart */}
          {selectedAuditIds.length >= 2 ? (
            <Card>
              <CardHeader>
                <CardTitle>Évolution du Taux de Conformité</CardTitle>
                <CardDescription>
                  Comparaison chronologique des {selectedAuditIds.length} audits sélectionnés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Taux de conformité (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                              <p className="font-semibold">{payload[0].payload.name}</p>
                              <p className="text-sm text-muted-foreground">{payload[0].payload.date}</p>
                              <p className="text-lg font-bold text-primary mt-1">
                                {payload[0].value}% conforme
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="conformityRate"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 6 }}
                      activeDot={{ r: 8 }}
                      name="Taux de conformité"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground text-center">
                  Sélectionnez au moins 2 audits pour afficher la comparaison
                </p>
              </CardContent>
            </Card>
          )}

          {/* Comparison Table */}
          {selectedAuditIds.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Tableau Comparatif</CardTitle>
                <CardDescription>
                  Détails des audits sélectionnés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Audit</th>
                        <th className="text-left py-3 px-4 font-semibold">Date</th>
                        <th className="text-left py-3 px-4 font-semibold">Taux Conformité</th>
                        <th className="text-left py-3 px-4 font-semibold">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audits
                        ?.filter(audit => selectedAuditIds.includes(audit.id))
                        .map(audit => (
                          <tr key={audit.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 font-medium">{audit.name}</td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {audit.startDate
                                ? new Date(audit.startDate).toLocaleDateString('fr-FR')
                                : 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              {audit.conformityRate ? (
                                <Badge variant="outline">
                                  {parseFloat(audit.conformityRate).toFixed(1)}%
                                </Badge>
                              ) : (
                                <span className="text-sm text-muted-foreground">N/A</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  audit.status === 'completed'
                                    ? 'default'
                                    : audit.status === 'in_progress'
                                    ? 'secondary'
                                    : 'outline'
                                }
                              >
                                {audit.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
