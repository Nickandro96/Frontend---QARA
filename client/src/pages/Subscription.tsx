import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { ArrowLeft, CreditCard, Calendar, Check, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Subscription() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data: subscription, isLoading: subLoading } = trpc.stripe.getSubscription.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const createPortalMutation = trpc.stripe.createPortalSession.useMutation();

  const handleManageSubscription = async () => {
    try {
      const result = await createPortalMutation.mutateAsync();
      window.open(result.portalUrl, "_blank");
      toast.success("Redirection vers le portail de gestion...");
    } catch (error: any) {
      if (error.message.includes("No active subscription")) {
        toast.error("Vous devez d'abord souscrire à un abonnement");
      } else {
        toast.error(error.message || "Erreur lors de l'ouverture du portail");
      }
    }
  };

  if (authLoading || subLoading) {
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

  const tierNames: Record<string, string> = {
    solo: "Solo / Startup MedTech",
    pme: "PME / Responsable QARA",
    entreprise: "Entreprise / Cabinet",
  };

  const tierPrices: Record<string, string> = {
    solo: "99€/mois",
    pme: "199€/mois",
    entreprise: "À partir de 390€/mois",
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    active: { label: "Actif", color: "text-green-600 bg-green-50" },
    trialing: { label: "Période d'essai", color: "text-blue-600 bg-blue-50" },
    canceled: { label: "Annulé", color: "text-red-600 bg-red-50" },
    past_due: { label: "Paiement en retard", color: "text-orange-600 bg-orange-50" },
  };

  const currentTier = subscription?.tier?.toLowerCase() || "solo";
  const currentStatus = subscription?.status || "active";
  const statusInfo = statusLabels[currentStatus] || statusLabels.active;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => (window.location.href = "/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏥</span>
              <span className="font-bold text-xl">MDR Compliance Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline">{user?.name || "Profil"}</Button>
          </div>
        </div>
      </header>

      <main className="container py-16 max-w-4xl">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestion de l'abonnement</h1>
          <p className="text-muted-foreground">
            Gérez votre abonnement, consultez votre historique de paiements et modifiez vos informations de facturation.
          </p>
        </div>

        {/* Current Subscription Card */}
        <Card className="p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">
                  {tierNames[currentTier] || "Solo / Startup MedTech"}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}
                >
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-muted-foreground">
                {tierPrices[currentTier] || "99€/mois"}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-muted-foreground" />
          </div>

          {/* Subscription Details */}
          <div className="space-y-4 mb-6">
            {subscription?.stripeCustomerId && (
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                <span>Paiement configuré</span>
              </div>
            )}
            {subscription?.stripeSubscriptionId && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Abonnement actif{" "}
                  {currentStatus === "active" ? "depuis" : "jusqu'au"}{" "}
                  {new Date().toLocaleDateString("fr-FR")}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            {subscription?.stripeCustomerId ? (
              <Button
                onClick={handleManageSubscription}
                disabled={createPortalMutation.isPending}
                className="gap-2"
              >
                {createPortalMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4" />
                    Gérer mon abonnement
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={() => (window.location.href = "/pricing")}>
                Souscrire à un abonnement
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/pricing")}
            >
              Voir tous les plans
            </Button>
          </div>
        </Card>

        {/* Features Included */}
        <Card className="p-8 mb-6">
          <h3 className="text-xl font-bold mb-4">Fonctionnalités incluses</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {currentTier === "solo" && (
              <>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">1 utilisateur, 1 site</p>
                    <p className="text-sm text-muted-foreground">
                      Parfait pour les consultants indépendants
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Tous les référentiels</p>
                    <p className="text-sm text-muted-foreground">
                      MDR, ISO 13485, ISO 9001, FDA complet
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Audits illimités</p>
                    <p className="text-sm text-muted-foreground">
                      Classification MDR et FDA incluse
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">IA réglementaire</p>
                    <p className="text-sm text-muted-foreground">
                      Mode standard avec quota raisonnable
                    </p>
                  </div>
                </div>
              </>
            )}

            {currentTier === "pme" && (
              <>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">3 utilisateurs, 2 sites</p>
                    <p className="text-sm text-muted-foreground">
                      Gestion des rôles incluse
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">IA illimitée</p>
                    <p className="text-sm text-muted-foreground">
                      Plans d'actions automatiques
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Tableaux de bord</p>
                    <p className="text-sm text-muted-foreground">
                      Suivi de conformité dans le temps
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Compliance sprints</p>
                    <p className="text-sm text-muted-foreground">
                      Objectifs et jalons de progression
                    </p>
                  </div>
                </div>
              </>
            )}

            {currentTier === "entreprise" && (
              <>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Utilisateurs configurables</p>
                    <p className="text-sm text-muted-foreground">
                      À partir de 3 utilisateurs
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Mode cabinet multi-clients</p>
                    <p className="text-sm text-muted-foreground">
                      Gestion avancée des permissions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Support prioritaire</p>
                    <p className="text-sm text-muted-foreground">
                      Accès anticipé aux nouvelles fonctionnalités
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Personnalisation complète</p>
                    <p className="text-sm text-muted-foreground">
                      Logo, référentiels, processus internes
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Help Section */}
        <Card className="p-8 bg-muted/50">
          <h3 className="text-xl font-bold mb-4">Besoin d'aide ?</h3>
          <p className="text-muted-foreground mb-4">
            Notre équipe est là pour vous accompagner dans votre parcours de conformité réglementaire.
          </p>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => window.open("https://help.manus.im", "_blank")}
            >
              Contacter le support
            </Button>
            <Button
              variant="ghost"
              onClick={() => (window.location.href = "/pricing")}
            >
              Comparer les plans
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
