import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { Check, X, Rocket, Building2, Crown, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const PRICING_TIERS = [
  {
    tier: "PRO",
    name: "PRO",
    subtitle: "Solo / Startup MedTech",
    price: 99,
    priceMonthly: "99€",
    priceYearly: "990€",
    period: "/mois",
    description: "Autonomie réglementaire essentielle",
    icon: Rocket,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    popular: false,
    targetAudience: "Consultants indépendants, startups, TPE, 1er dispositif médical",
    users: "1 utilisateur",
    sites: "1 site / 1 organisation",
    features: {
      audits: [
        { text: "Audit de conformité UE (ISO 9001, ISO 13485, MDR)", included: true },
        { text: "Audit FDA (QMSR, Part 820, Registration & Listing)", included: true },
        { text: "⚠️ Limite : 1 audit actif à la fois", warning: true },
      ],
      classification: [
        { text: "Classification DM (Annexe VIII – UE)", included: true },
        { text: "Classification FDA (Class I/II/III + pathway)", included: true },
        { text: "Pas de sauvegarde multi-scénarios", included: false },
      ],
      ia: [
        { text: "IA contextuelle STANDARD (explication des exigences)", included: true },
        { text: "IA stratégique avancée", included: false },
      ],
      documents: [
        { text: "Documents obligatoires (ISO / MDR / FDA)", included: true },
        { text: "⚠️ Accès en lecture + modèles standards uniquement", warning: true },
      ],
      veille: [
        { text: "Veille UE + FDA (mode standard)", included: true },
        { text: "Alertes personnalisées temps réel", included: false },
      ],
      dashboard: [
        { text: "Dashboard individuel", included: true },
        { text: "Exports PDF / Excel", included: true },
        { text: "Comparaison multi-projets", included: false },
      ],
      blocked: [
        "Multi-utilisateurs",
        "Multi-sites",
        "Mode cabinet / clients multiples",
        "FDA Submission Tracker complet",
        "IA réglementaire illimitée",
        "Compliance sprints",
        "Badges \"Audit Ready\"",
        "Veille FDA étendue",
      ],
    },
    cta: "Commencer avec PRO",
  },
  {
    tier: "EXPERT",
    name: "EXPERT",
    subtitle: "PME / Responsable QARA",
    price: 199,
    priceMonthly: "199€",
    priceYearly: "1 990€",
    period: "/mois",
    description: "Plan cœur avec IA illimitée",
    icon: Building2,
    iconColor: "text-primary",
    bgColor: "bg-primary/5",
    borderColor: "border-primary",
    popular: true,
    targetAudience: "Responsables Qualité & Affaires Réglementaires, PME industrielles, MedTech structurées",
    users: "Jusqu'à 5 utilisateurs",
    sites: "Jusqu'à 2 sites",
    roles: "Rôles configurables (Admin, Utilisateur)",
    features: {
      audits: [
        { text: "Tous les audits UE & FDA", included: true },
        { text: "Audits multi-processus", included: true },
        { text: "Audits simultanés illimités", included: true },
      ],
      classification: [
        { text: "Classification DM UE & FDA complète", included: true },
        { text: "Wizard FDA New Product (510k / De Novo / PMA)", included: true },
        { text: "Justification automatique + rapports", included: true },
      ],
      ia: [
        { text: "✨ IA réglementaire ILLIMITÉE", included: true, highlight: true },
        { text: "Aide par question", included: true },
        { text: "Propositions de plans d'actions", included: true },
        { text: "Suggestions d'amélioration", included: true },
        { text: "Analyse de cohérence documentaire", included: true },
      ],
      documents: [
        { text: "Bibliothèque documentaire complète", included: true },
        { text: "Modèles avancés", included: true },
        { text: "Suivi du statut documentaire", included: true },
        { text: "Liens Documents ↔ Questions d'audit", included: true },
      ],
      veille: [
        { text: "Veille MDR / ISO / FDA étendue", included: true },
        { text: "Alertes réglementaires en temps réel", included: true },
        { text: "Analyse d'impact par référentiel", included: true },
      ],
      dashboard: [
        { text: "Tableaux de bord globaux", included: true },
        { text: "Scoring par référentiel / processus", included: true },
        { text: "Génération automatique de plans d'actions", included: true },
        { text: "Compliance sprints (objectifs, jalons)", included: true },
        { text: "Exports PDF / Excel avancés", included: true },
        { text: "Rapports prêts audit ON / FDA inspection", included: true },
      ],
      blocked: [
        "Mode cabinet multi-clients",
        "Gestion avancée des permissions",
        "White-label",
        "Support prioritaire",
        "API / intégrations",
      ],
    },
    cta: "Choisir EXPERT",
  },
  {
    tier: "ENTREPRISE",
    name: "ENTREPRISE",
    subtitle: "Cabinet / Groupe",
    price: 390,
    priceMonthly: "390€",
    priceYearly: "3 900€",
    period: "/mois",
    description: "Solution complète pour cabinets et groupes",
    icon: Crown,
    iconColor: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-300",
    popular: false,
    targetAudience: "Cabinets de conseil, groupes industriels, multi-sites, organismes notifiés",
    users: "Utilisateurs illimités",
    sites: "Sites illimités",
    roles: "Gestion avancée des permissions et rôles",
    features: {
      all: [
        { text: "✅ Tout le plan EXPERT, plus :", included: true },
      ],
      cabinet: [
        { text: "Mode cabinet multi-clients", included: true },
        { text: "Gestion de portefeuille clients", included: true },
        { text: "Facturation par client", included: true },
        { text: "Isolation des données par client", included: true },
      ],
      advanced: [
        { text: "White-label (logo, couleurs, domaine personnalisé)", included: true },
        { text: "API REST complète", included: true },
        { text: "Intégrations personnalisées", included: true },
        { text: "SSO / SAML", included: true },
      ],
      support: [
        { text: "Support prioritaire (< 2h)", included: true },
        { text: "Account manager dédié", included: true },
        { text: "Formation personnalisée", included: true },
        { text: "Onboarding sur mesure", included: true },
      ],
      compliance: [
        { text: "Audit multi-sites simultanés", included: true },
        { text: "Consolidation groupe", included: true },
        { text: "Rapports consolidés", included: true },
        { text: "Badges \"Audit Ready\" certifiables", included: true },
      ],
    },
    cta: "Choisir ENTREPRISE",
  },
];

export default function Pricing() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const createCheckoutMutation = trpc.stripe.createCheckoutSession.useMutation();
  // Le paiement en ligne est piloté côté serveur par des variables
  // d'environnement Stripe. Tant qu'il n'est pas activé, on affiche un état
  // « Bientôt disponible » plutôt qu'un bouton qui échoue en silence
  // (rapport QA 2026-09-02, CRIT-2).
  const { data: stripeConfig } = trpc.stripe.getConfig.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const billingEnabled = stripeConfig?.enabled ?? false;

  const handleSubscribe = async (tier: string, interval: "month" | "year") => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    if (!billingEnabled) {
      toast.info("Le paiement en ligne arrive bientôt. Contactez-nous pour souscrire dès maintenant.");
      window.location.href = "/contact";
      return;
    }

    try {
      const { checkoutUrl } = await createCheckoutMutation.mutateAsync({ tier, interval });
      toast.success("Redirection vers le paiement...");
      window.location.href = checkoutUrl;
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création de la session de paiement");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-16 text-center">
        <Badge className="mb-4" variant="outline">
          {t('pricing.badge')}
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {t('pricing.title')}
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
          {t('pricing.subtitle')}
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              billingCycle === "monthly"
                ? "bg-primary text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t('pricing.monthly')}
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              billingCycle === "yearly"
                ? "bg-primary text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t('pricing.yearly')}
            <Badge className="ml-2" variant="secondary">
              -17%
            </Badge>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {PRICING_TIERS.map((plan) => {
            const Icon = plan.icon;
            const displayPrice = billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;
            const interval = billingCycle === "monthly" ? "month" : "year";

            return (
              <Card
                key={plan.tier}
                className={`relative ${plan.popular ? `border-2 ${plan.borderColor} shadow-xl scale-105` : "border"}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-white px-4 py-1">
                      ⭐ RECOMMANDÉ
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <div className={`w-16 h-16 rounded-2xl ${plan.bgColor} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`h-8 w-8 ${plan.iconColor}`} />
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <p className="text-sm text-slate-600 font-medium">{plan.subtitle}</p>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>

                  <div className="mt-6">
                    <div className="text-4xl font-bold">
                      {displayPrice}
                      <span className="text-lg font-normal text-slate-600">{plan.period}</span>
                    </div>
                    {billingCycle === "yearly" && (
                      <p className="text-sm text-slate-500 mt-1">
                        Soit {Math.round(plan.price * 0.83)}€/mois
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={() => handleSubscribe(plan.tier, interval)}
                    className={`w-full mt-6 ${plan.popular ? "bg-primary hover:bg-primary/90" : ""}`}
                    size="lg"
                    variant={billingEnabled ? "default" : "outline"}
                    disabled={createCheckoutMutation.isPending}
                  >
                    {createCheckoutMutation.isPending
                      ? "Chargement..."
                      : billingEnabled
                        ? plan.cta
                        : "Bientôt disponible — nous contacter"}
                  </Button>

                  <p className="text-xs text-slate-500 mt-4">{plan.targetAudience}</p>
                </CardHeader>

                <Separator />

                <CardContent className="pt-6">
                  {/* Users & Sites */}
                  <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm font-semibold text-slate-700 mb-1">👤 {plan.users}</p>
                    <p className="text-sm font-semibold text-slate-700 mb-1">🏢 {plan.sites}</p>
                    {plan.roles && <p className="text-sm text-slate-600">{plan.roles}</p>}
                  </div>

                  {/* Features */}
                  <div className="space-y-6">
                    {Object.entries(plan.features).map(([category, items]) => (
                      <div key={category}>
                        <h4 className="font-semibold text-sm uppercase text-slate-500 mb-3">
                          {category === "audits" && "Audits & Conformité"}
                          {category === "classification" && "Classification"}
                          {category === "ia" && "IA Réglementaire"}
                          {category === "documents" && "Documents"}
                          {category === "veille" && "Veille Réglementaire"}
                          {category === "dashboard" && "Dashboard & Reporting"}
                          {category === "all" && "Inclus"}
                          {category === "cabinet" && "Mode Cabinet"}
                          {category === "advanced" && "Fonctionnalités Avancées"}
                          {category === "support" && "Support & Formation"}
                          {category === "compliance" && "Compliance Groupe"}
                          {category === "blocked" && "❌ Non inclus"}
                        </h4>
                        <ul className="space-y-2">
                          {Array.isArray(items) && items.map((feature: any, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              {typeof feature === "string" ? (
                                <>
                                  <X className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                  <span className="text-slate-500">{feature}</span>
                                </>
                              ) : feature.included ? (
                                <>
                                  <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${feature.highlight ? 'text-primary' : 'text-green-600'}`} />
                                  <span className={feature.highlight ? 'font-semibold text-primary' : feature.warning ? 'text-slate-600' : ''}>
                                    {feature.text}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <X className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                  <span className="text-slate-500">{feature.text}</span>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* FAQ / Contact */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Des questions sur nos plans ?</h2>
        <p className="text-slate-600 mb-6">
          Notre équipe est là pour vous aider à choisir le plan adapté à vos besoins.
        </p>
        <Button variant="outline" size="lg">
          Contactez-nous
        </Button>
      </div>
    </div>
  );
}
