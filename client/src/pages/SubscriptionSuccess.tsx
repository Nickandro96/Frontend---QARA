import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function SubscriptionSuccess() {
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { data: subscription, isLoading } = trpc.subscription.getSubscription.useQuery(undefined, {
    enabled: !!sessionId,
  });

  useEffect(() => {
    // Extract session_id from URL query params
    const params = new URLSearchParams(window.location.search);
    const id = params.get("session_id");
    if (id) {
      setSessionId(id);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-600">Vérification de votre paiement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center pb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-600 mb-2">
            Paiement réussi !
          </CardTitle>
          <CardDescription className="text-lg">
            Votre abonnement a été activé avec succès
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {subscription && (
            <div className="bg-slate-50 rounded-lg p-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Plan souscrit :</span>
                <span className="font-semibold text-lg">{subscription.subscriptionTier?.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Statut :</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {subscription.subscriptionStatus === "active" ? "Actif" : subscription.subscriptionStatus}
                </span>
              </div>
              {subscription.subscriptionStartDate && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Date de début :</span>
                  <span className="font-medium">
                    {new Date(subscription.subscriptionStartDate).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3 pt-4">
            <h3 className="font-semibold text-lg">Prochaines étapes :</h3>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Accédez à toutes les fonctionnalités de votre plan</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Consultez votre tableau de bord pour commencer vos audits</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Gérez votre abonnement depuis la page "Mon abonnement"</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button
              onClick={() => setLocation("/dashboard")}
              className="flex-1"
              size="lg"
            >
              Accéder au Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              onClick={() => setLocation("/subscription")}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              Voir mon abonnement
            </Button>
          </div>

          <p className="text-center text-sm text-slate-500 pt-4">
            Un email de confirmation vous a été envoyé avec les détails de votre abonnement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
