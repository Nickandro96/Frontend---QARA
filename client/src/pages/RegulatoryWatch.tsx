import { useEffect } from "react";

import { LockedFeature } from "@/components/LockedFeature";
import { hasCapability } from "@/lib/plans";
import { AlertPreferencesDialog } from "@/components/AlertPreferencesDialog";
import { Loader2, Newspaper } from "lucide-react";
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
    document.title = "Veille Réglementaire — QARA";
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

  if (!hasCapability("canUseVeille", profile, user)) {
    return <LockedFeature feature="Veille reglementaire" />;
  }

  // Le shell applicatif (AuthenticatedLayout : sidebar + en-tête QARA) est
  // fourni par ProtectedPage dans App.tsx. Cette page ne rend donc que son
  // contenu — elle rendait auparavant un second <header> complet avec un
  // ancien logo « MDR Compliance » et une nav dupliquée (rapport QA
  // 2026-09-02, IMP-3). Le bouton « Statistiques » pointait vers
  // /watch-dashboard, qui redirige vers /veille : cliquer ne faisait rien
  // (IMP-2). Les KPIs sont déjà affichés par WatchDashboardPro ci-dessous.
  return (
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

      {/* Préférences d'alertes */}
      <div className="flex justify-end gap-3 mb-4">
        <AlertPreferencesDialog />
      </div>

      {/* Module premium (cache + refresh async + UX complète) */}
      <WatchDashboardPro />
    </main>
  );
}
