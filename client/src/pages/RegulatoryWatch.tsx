import { UpgradeRequired } from "@/components/UpgradeRequired";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Shield, Loader2, Newspaper, AlertTriangle, Info, CheckCircle, Search, Filter, BarChart3 } from "lucide-react";
import { AlertPreferencesDialog } from "@/components/AlertPreferencesDialog";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect, useState } from "react";

export default function RegulatoryWatch() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });

  // Page title (no react-helmet dependency)
  useEffect(() => {
    document.title = "Veille Réglementaire — MDR Compliance";
  }, []);

  // Filters state
  const [region, setRegion] = useState<"all" | "EU" | "US">("all");
  const [impactLevel, setImpactLevel] = useState<"all" | "high" | "medium" | "low">("all");
  const [status, setStatus] = useState<"all" | "acte" | "a_venir" | "en_consultation">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Block FREE users
  if (isAuthenticated && profile && profile.subscriptionTier === "free" && user?.role !== "admin") {
    return <UpgradeRequired feature="Veille Réglementaire" />;
  }

  // Build query parameters
  const queryParams: any = { limit: 50 };
  if (region !== "all") queryParams.region = region;
  if (impactLevel !== "all") queryParams.impactLevel = impactLevel;
  if (status !== "all") queryParams.status = status;
  if (searchQuery.trim()) queryParams.search = searchQuery.trim();

  const { data: updates, isLoading: updatesLoading } = trpc.regulatory.list.useQuery(queryParams, {
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

  const impactIcons = {
    high: <AlertTriangle className="h-5 w-5 text-red-600" />,
    medium: <Info className="h-5 w-5 text-amber-600" />,
    low: <CheckCircle className="h-5 w-5 text-blue-600" />,
  };

  const impactColors = {
    high: "bg-red-100 text-red-800 border-red-300",
    medium: "bg-amber-100 text-amber-800 border-amber-300",
    low: "bg-blue-100 text-blue-800 border-blue-300",
  };

  const resetFilters = () => {
    setRegion("all");
    setImpactLevel("all");
    setStatus("all");
    setSearchQuery("");
  };

  const hasActiveFilters = region !== "all" || impactLevel !== "all" || status !== "all" || searchQuery.trim() !== "";

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
                <Button variant="ghost" className="font-medium">
                  Veille
                </Button>
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
          <Newspaper className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Veille Réglementaire</h1>
        </div>

        {/* Info Card */}
        <Card className="mb-8 border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Restez informé des évolutions réglementaires</CardTitle>
            <CardDescription className="text-blue-700">
              Suivez les changements MDR, ISO 13485 et ISO 9001 avec analyse d&apos;impact personnalisée
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Alert preferences and dashboard buttons */}
        <div className="flex justify-end gap-3 mb-4">
          <Link href="/watch-dashboard">
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Statistiques
            </Button>
          </Link>
          <AlertPreferencesDialog />
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <CardTitle className="text-lg">Filtres</CardTitle>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Réinitialiser
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="text-sm font-medium mb-2 block">Recherche</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Region */}
              <div>
                <label className="text-sm font-medium mb-2 block">Région</label>
                <Select value={region} onValueChange={(value: any) => setRegion(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les régions</SelectItem>
                    <SelectItem value="EU">🇪🇺 Europe (MDR/IVDR)</SelectItem>
                    <SelectItem value="US">🇺🇸 États-Unis (FDA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Impact Level */}
              <div>
                <label className="text-sm font-medium mb-2 block">Niveau d&apos;impact</label>
                <Select value={impactLevel} onValueChange={(value: any) => setImpactLevel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les niveaux</SelectItem>
                    <SelectItem value="high">Impact élevé</SelectItem>
                    <SelectItem value="medium">Impact moyen</SelectItem>
                    <SelectItem value="low">Impact faible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="lg:col-span-2">
                <label className="text-sm font-medium mb-2 block">Statut</label>
                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="acte">Acté</SelectItem>
                    <SelectItem value="en_consultation">En consultation</SelectItem>
                    <SelectItem value="a_venir">À venir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        {updates && (
          <div className="mb-4 text-sm text-muted-foreground">
            {updates.length} mise{updates.length > 1 ? "s" : ""} à jour trouvée{updates.length > 1 ? "s" : ""}
          </div>
        )}

        {/* Updates List */}
        {updatesLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : updates && updates.length > 0 ? (
          <div className="space-y-4">
            {updates.map((update) => (
              <Card key={update.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {impactIcons[update.impactLevel as keyof typeof impactIcons]}
                        <Badge className={impactColors[update.impactLevel as keyof typeof impactColors]}>
                          Impact{" "}
                          {update.impactLevel === "high"
                            ? "élevé"
                            : update.impactLevel === "medium"
                              ? "moyen"
                              : "faible"}
                        </Badge>
                        <Badge variant="outline">
                          {update.status === "acte" && "Acté"}
                          {update.status === "a_venir" && "À venir"}
                          {update.status === "en_consultation" && "En consultation"}
                        </Badge>
                      </div>
                      <CardTitle>{update.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {new Date(update.publishedAt).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{update.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Newspaper className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? "Aucune mise à jour ne correspond à vos critères de recherche"
                  : "Aucune mise à jour réglementaire disponible pour le moment"}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={resetFilters}>
                  Réinitialiser les filtres
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
