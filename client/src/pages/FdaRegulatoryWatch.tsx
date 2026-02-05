import { UpgradeRequired } from "@/components/UpgradeRequired";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, Loader2, AlertTriangle, Info, CheckCircle, ExternalLink, Search, Filter, Calendar, Flag } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function FdaRegulatoryWatch() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });

  // Block FREE users
  if (isAuthenticated && profile && profile.subscriptionTier === 'free' && user?.role !== 'admin') {
    return <UpgradeRequired feature="Veille Réglementaire FDA" />;
  }
  const [, setLocation] = useLocation();

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedImpactLevel, setSelectedImpactLevel] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: updates, isLoading } = trpc.fdaRegulatoryWatch.list.useQuery({
    category: selectedCategory,
    impactLevel: selectedImpactLevel,
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

  const getImpactColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getImpactIcon = (level: string) => {
    switch (level) {
      case "high":
        return <AlertTriangle className="w-4 h-4" />;
      case "medium":
        return <Info className="w-4 h-4" />;
      case "low":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getImpactLabel = (level: string) => {
    switch (level) {
      case "high":
        return "Impact élevé";
      case "medium":
        return "Impact modéré";
      case "low":
        return "Impact faible";
      default:
        return level;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      qmsr: "QMSR",
      part_820: "21 CFR Part 820",
      part_807: "21 CFR Part 807 (Registration & Listing)",
      "510k": "510(k)",
      de_novo: "De Novo",
      pma: "PMA",
      postmarket: "Postmarket",
      labeling_udi: "Labeling & UDI",
      guidance: "Guidance FDA",
    };
    return labels[category] || category;
  };

  const isRelevantForUser = (update: any) => {
    if (!profile?.economicRole) return true;
    
    try {
      const affectedRoles = JSON.parse(update.affectedRoles || "[]");
      return affectedRoles.includes(profile.economicRole);
    } catch {
      return true;
    }
  };

  const filteredUpdates = updates?.filter((update) => {
    const matchesSearch = !searchQuery || 
      update.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

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
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              <Flag className="h-4 w-4" />
              <span>Veille Réglementaire FDA</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline">{user?.name || "Profil"}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Recherche</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Catégorie</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    <SelectItem value="qmsr">QMSR</SelectItem>
                    <SelectItem value="part_820">21 CFR Part 820</SelectItem>
                    <SelectItem value="part_807">Registration & Listing</SelectItem>
                    <SelectItem value="510k">510(k)</SelectItem>
                    <SelectItem value="de_novo">De Novo</SelectItem>
                    <SelectItem value="pma">PMA</SelectItem>
                    <SelectItem value="postmarket">Postmarket</SelectItem>
                    <SelectItem value="labeling_udi">Labeling & UDI</SelectItem>
                    <SelectItem value="guidance">Guidance FDA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Niveau d'impact</label>
                <Select value={selectedImpactLevel} onValueChange={setSelectedImpactLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les niveaux" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les niveaux</SelectItem>
                    <SelectItem value="high">Impact élevé</SelectItem>
                    <SelectItem value="medium">Impact modéré</SelectItem>
                    <SelectItem value="low">Impact faible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(selectedCategory || selectedImpactLevel || searchQuery) && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(undefined);
                    setSelectedImpactLevel(undefined);
                    setSearchQuery("");
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Updates List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredUpdates && filteredUpdates.length > 0 ? (
          <div className="space-y-4">
            {filteredUpdates.map((update) => {
              const isRelevant = isRelevantForUser(update);
              
              return (
                <Card key={update.id} className={isRelevant ? "border-l-4 border-l-blue-500" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {getCategoryLabel(update.category)}
                          </Badge>
                          <Badge className={`${getImpactColor(update.impactLevel)} text-xs`}>
                            {getImpactIcon(update.impactLevel)}
                            <span className="ml-1">{getImpactLabel(update.impactLevel)}</span>
                          </Badge>
                          {isRelevant && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs">
                              Pertinent pour votre rôle
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{update.title}</CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(update.publishedAt).toLocaleDateString("fr-FR")}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none mb-4">
                      <p className="whitespace-pre-line">{update.content}</p>
                    </div>

                    {update.sourceUrl && (
                      <div className="flex items-center justify-between pt-4 border-t">
                        <a
                          href={update.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Consulter la source FDA
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Aucune mise à jour réglementaire trouvée avec les filtres sélectionnés.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
