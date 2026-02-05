import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, ArrowLeft, HelpCircle } from "lucide-react";

export default function SubscriptionCancel() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center pb-8">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-12 w-12 text-orange-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-orange-600 mb-2">
            Paiement annulé
          </CardTitle>
          <CardDescription className="text-lg">
            Votre abonnement n'a pas été activé
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-slate-50 rounded-lg p-6 space-y-3">
            <p className="text-slate-700">
              Vous avez annulé le processus de paiement. Aucun montant n'a été débité de votre compte.
            </p>
            <p className="text-slate-600 text-sm">
              Si vous avez rencontré un problème ou si vous avez des questions, n'hésitez pas à nous contacter.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <h3 className="font-semibold text-lg">Que souhaitez-vous faire ?</h3>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <HelpCircle className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <span>Consulter à nouveau nos offres et choisir un plan</span>
              </li>
              <li className="flex items-start gap-2">
                <HelpCircle className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <span>Contacter notre équipe pour obtenir de l'aide</span>
              </li>
              <li className="flex items-start gap-2">
                <HelpCircle className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <span>Retourner à l'accueil pour explorer la plateforme</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button
              onClick={() => setLocation("/pricing")}
              className="flex-1"
              size="lg"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux tarifs
            </Button>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              Retour à l'accueil
            </Button>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-slate-600 mb-2">
              Besoin d'aide pour choisir votre plan ?
            </p>
            <Button
              onClick={() => setLocation("/contact")}
              variant="link"
              className="text-primary"
            >
              Contactez notre équipe
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
