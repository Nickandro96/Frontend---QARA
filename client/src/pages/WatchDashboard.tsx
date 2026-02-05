import { UpgradeRequired } from "@/components/UpgradeRequired";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Shield, Loader2, BarChart3, TrendingUp, Globe, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function WatchDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });

  // Block FREE users
  if (isAuthenticated && profile && profile.subscriptionTier === 'free' && user?.role !== 'admin') {
    return <UpgradeRequired feature="Tableau de bord de veille" />;
  }

  const { data: stats, isLoading: statsLoading } = trpc.regulatory.getStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  // Calculate percentages
  const impactPercentages = stats ? {
    high: Math.round((stats.byImpact.high / stats.total) * 100),
    medium: Math.round((stats.byImpact.medium / stats.total) * 100),
    low: Math.round((stats.byImpact.low / stats.total) * 100),
  } : { high: 0, medium: 0, low: 0 };

  const regionPercentages = stats ? {
    EU: Math.round((stats.byRegion.EU / stats.total) * 100),
    US: Math.round((stats.byRegion.US / stats.total) * 100),
  } : { EU: 0, US: 0 };

  // Get sorted months for timeline
  const monthsData = stats?.byMonth ? Object.entries(stats.byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6) // Last 6 months
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <Shield className="h-6 w-6 text-primary" />
                <span className="font-bold">MDR Compliance</span>
              </div>
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/audit">
                <Button variant="ghost">Audit</Button>
              </Link>
              <Link href="/reports">
                <Button variant="ghost">Rapports</Button>
              </Link>
              <Link href="/regulatory-watch">
                <Button variant="ghost">Veille</Button>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="outline">{user?.name || "Profil"}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Tableau de bord de veille</h1>
        </div>

        {statsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total des mises à jour</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">Toutes régions confondues</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Impact élevé</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{stats.byImpact.high}</div>
                  <p className="text-xs text-muted-foreground mt-1">{impactPercentages.high}% du total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Europe (MDR/IVDR)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats.byRegion.EU}</div>
                  <p className="text-xs text-muted-foreground mt-1">{regionPercentages.EU}% du total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">États-Unis (FDA)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{stats.byRegion.US}</div>
                  <p className="text-xs text-muted-foreground mt-1">{regionPercentages.US}% du total</p>
                </CardContent>
              </Card>
            </div>

            {/* Impact Level Distribution */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <CardTitle>Distribution par niveau d'impact</CardTitle>
                </div>
                <CardDescription>Répartition des mises à jour selon leur criticité</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* High Impact */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Impact élevé</span>
                      <span className="text-sm text-muted-foreground">{stats.byImpact.high} ({impactPercentages.high}%)</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 transition-all duration-500"
                        style={{ width: `${impactPercentages.high}%` }}
                      />
                    </div>
                  </div>

                  {/* Medium Impact */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Impact moyen</span>
                      <span className="text-sm text-muted-foreground">{stats.byImpact.medium} ({impactPercentages.medium}%)</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${impactPercentages.medium}%` }}
                      />
                    </div>
                  </div>

                  {/* Low Impact */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Impact faible</span>
                      <span className="text-sm text-muted-foreground">{stats.byImpact.low} ({impactPercentages.low}%)</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${impactPercentages.low}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <CardTitle>Évolution temporelle</CardTitle>
                </div>
                <CardDescription>Nombre de mises à jour par mois (6 derniers mois)</CardDescription>
              </CardHeader>
              <CardContent>
                {monthsData.length > 0 ? (
                  <div className="space-y-3">
                    {monthsData.map(([month, count]) => {
                      const maxCount = Math.max(...monthsData.map(([, c]) => c));
                      const percentage = (count / maxCount) * 100;
                      const monthLabel = new Date(month + '-01').toLocaleDateString('fr-FR', { 
                        month: 'long', 
                        year: 'numeric' 
                      });

                      return (
                        <div key={month}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium capitalize">{monthLabel}</span>
                            <span className="text-sm text-muted-foreground">{count} mise{count > 1 ? 's' : ''} à jour</span>
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucune donnée temporelle disponible
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  <CardTitle>Distribution par statut</CardTitle>
                </div>
                <CardDescription>Répartition des mises à jour selon leur statut réglementaire</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-3xl font-bold text-green-700">{stats.byStatus.acte}</div>
                    <p className="text-sm text-green-600 mt-1">Acté</p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-3xl font-bold text-amber-700">{stats.byStatus.en_consultation}</div>
                    <p className="text-sm text-amber-600 mt-1">En consultation</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-3xl font-bold text-blue-700">{stats.byStatus.a_venir}</div>
                    <p className="text-sm text-blue-600 mt-1">À venir</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Accéder à la veille complète</h3>
                    <p className="text-sm text-muted-foreground">
                      Consultez toutes les mises à jour réglementaires avec filtres avancés
                    </p>
                  </div>
                  <Link href="/regulatory-watch">
                    <Button>
                      Voir la veille
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Aucune statistique disponible pour le moment
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
