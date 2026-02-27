import { useEffect } from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { trpc } from "@/lib/trpc";
import { WatchDashboard } from "@/components/watch/WatchDashboard";

export function RegulatoryWatch() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const userProfileQuery = trpc.user.getProfile.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      // Navigation handled by your route guard / router.
    }
  }, [isAuthenticated, authLoading]);

  if (authLoading || userProfileQuery.isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTitle>Accès requis</AlertTitle>
          <AlertDescription>Veuillez vous connecter pour accéder à la veille.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const profile = userProfileQuery.data?.profile;

  // Keep your existing paywall logic.
  if (profile && profile.subscriptionTier === "free") {
    return <UpgradeRequired />;
  }

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <Helmet>
        <title>Veille réglementaire | QARA</title>
      </Helmet>

      <WatchDashboard />
    </div>
  );
}

function UpgradeRequired() {
  return (
    <div className="container mx-auto max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Fonctionnalité Premium</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            La veille réglementaire avancée (MDR/MDCG/Normes harmonisées + impact/risques/actions) est réservée aux abonnés.
          </p>
          <Button asChild>
            <a href="/pricing">Voir les offres</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
