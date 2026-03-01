import { useEffect } from "react";
import { Link } from "wouter";
import { Loader2, Newspaper, Shield, BarChart3 } from "lucide-react";

import { UpgradeRequired } from "@/components/UpgradeRequired";
import { AlertPreferencesDialog } from "@/components/AlertPreferencesDialog";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

import { WatchDashboard as WatchDashboardPro } from "@/components/watch/WatchDashboard";

/**
 * Page Veille Réglementaire
 *
 * Cette page garde le layout historique (Header + Nav + CTA),
 * mais délègue toute la logique "Watch Engine" + UX premium à WatchDashboardPro :
 * - Cache instant (DB)
 * - Stale detection + refresh async non bloquant
 * - KPI + feed + filtres + recherche + détails drawer
 * - Enrichissement impact/risques/actions/preuves
 * - Profil entreprise + plan 30/60/90 + checklist audit readiness
 */
export default function RegulatoryWatch() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Page title (no react-helmet dependency)
  useEffect(() => {
    document.title = "Veille Réglementaire — MDR Compliance";
  }, []);

  // Redirect unauthenticated users without doing side-effects during render
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // While redirecting, render nothing
  if (!isAuthenticated) {
    return null;
  }

  // Block FREE users (admin bypass)
  if (profile?.subscriptionTier === "free" && user?.role !== "admin") {
    return <UpgradeRequired feature="Veille Réglementaire" />;
  }

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
              Suivez les changements MDR, MDCG, normes harmonisées (JOUE) et référentiels qualité (ISO) avec une analyse
              d&apos;impact et des actions recommandées.
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

        {/* ✅ Nouveau module premium (cache + refresh async + UX complète) */}
        <WatchDashboardPro />
      </main>
    </div>
  );
}
