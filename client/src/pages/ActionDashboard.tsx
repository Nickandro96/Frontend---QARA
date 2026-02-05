import { useTranslation } from "react-i18next";
import { ProfessionalLayout } from "@/components/ProfessionalLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  ClipboardCheck,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  Bell,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ActionDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Données de démonstration - à remplacer par des données réelles via tRPC
  const currentStatus = {
    auditProgress: 72,
    criticalGaps: 3,
    lastUpdate: "il y a 2 jours",
    nextAction: "Compléter l'audit FDA",
  };

  const recommendedActions = [
    {
      id: 1,
      title: "Traiter 3 écarts critiques",
      description: "Non-conformités majeures identifiées lors du dernier audit",
      priority: "high",
      icon: AlertCircle,
      href: "/dashboard",
    },
    {
      id: 2,
      title: "Compléter l'audit FDA",
      description: "72% complété - 28 questions restantes",
      priority: "medium",
      icon: ClipboardCheck,
      href: "/audit",
    },
    {
      id: 3,
      title: "Consulter la veille réglementaire",
      description: "10 nouvelles mises à jour FDA disponibles",
      priority: "low",
      icon: Bell,
      href: "/veille",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: "audit",
      title: "Audit MDR complété",
      date: "il y a 3 jours",
      icon: CheckCircle2,
      iconColor: "text-success-500",
    },
    {
      id: 2,
      type: "classification",
      title: "Classification DM - Classe IIb confirmée",
      date: "il y a 5 jours",
      icon: FileText,
      iconColor: "text-info-500",
    },
    {
      id: 3,
      type: "veille",
      title: "Nouvelle guidance FDA consultée",
      date: "il y a 1 semaine",
      icon: Bell,
      iconColor: "text-warning-500",
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-critical-500 bg-critical-50";
      case "medium":
        return "border-l-4 border-warning-500 bg-warning-50";
      case "low":
        return "border-l-4 border-info-500 bg-info-50";
      default:
        return "";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <span className="px-2 py-0.5 text-xs font-semibold bg-critical-100 text-critical-700 rounded-full uppercase">
            Urgent
          </span>
        );
      case "medium":
        return (
          <span className="px-2 py-0.5 text-xs font-semibold bg-warning-100 text-warning-700 rounded-full uppercase">
            Important
          </span>
        );
      case "low":
        return (
          <span className="px-2 py-0.5 text-xs font-semibold bg-info-100 text-info-700 rounded-full uppercase">
            Info
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <ProfessionalLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            {t("home.welcome") || "Bienvenue"}, {user?.name || user?.email}
          </h1>
          <p className="text-text-secondary text-lg">
            {t("home.subtitle") || "Votre plateforme d'intelligence réglementaire"}
          </p>
        </div>

        {/* Bloc 1: Commencer ici */}
        <Card className="p-6 bg-gradient-to-br from-accent-primary to-accent-secondary text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-2">
                {t("home.getStarted.title") || "Commencer ici"}
              </h2>
              <p className="text-white/90 mb-4">
                {t("home.getStarted.description") ||
                  "Lancez votre premier audit de conformité réglementaire en quelques clics"}
              </p>
              <Link href="/audit">
                <Button
                  size="lg"
                  className="bg-white text-accent-primary hover:bg-white/90"
                >
                  {t("home.getStarted.cta") || "Lancer un audit"}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
            <ClipboardCheck className="w-24 h-24 text-white/20" />
          </div>
        </Card>

        {/* Bloc 2: Votre statut actuel */}
        <div>
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            {t("home.currentStatus.title") || "Votre statut actuel"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-info-500" />
                <span className="text-3xl font-bold text-text-primary">
                  {currentStatus.auditProgress}%
                </span>
              </div>
              <h3 className="font-semibold text-text-primary mb-1">
                {t("home.currentStatus.auditProgress") || "Audit FDA"}
              </h3>
              <p className="text-sm text-text-secondary">
                {t("home.currentStatus.auditProgressDesc") || "Progression de l'audit"}
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <AlertCircle className="w-8 h-8 text-critical-500" />
                <span className="text-3xl font-bold text-text-primary">
                  {currentStatus.criticalGaps}
                </span>
              </div>
              <h3 className="font-semibold text-text-primary mb-1">
                {t("home.currentStatus.criticalGaps") || "Écarts critiques"}
              </h3>
              <p className="text-sm text-text-secondary">
                {t("home.currentStatus.criticalGapsDesc") || "Non-conformités majeures"}
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-8 h-8 text-warning-500" />
                <span className="text-sm font-medium text-text-primary">
                  {currentStatus.lastUpdate}
                </span>
              </div>
              <h3 className="font-semibold text-text-primary mb-1">
                {t("home.currentStatus.lastUpdate") || "Dernière mise à jour"}
              </h3>
              <p className="text-sm text-text-secondary">
                {t("home.currentStatus.lastUpdateDesc") || "Veille réglementaire"}
              </p>
            </Card>
          </div>
        </div>

        {/* Bloc 3: Actions recommandées */}
        <div>
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            {t("home.recommendedActions.title") || "Actions recommandées"}
          </h2>
          <div className="space-y-4">
            {recommendedActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card
                  key={action.id}
                  className={`p-6 hover:shadow-md transition-shadow ${getPriorityColor(
                    action.priority
                  )}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        <Icon className="w-6 h-6 text-text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-text-primary">
                            {action.title}
                          </h3>
                          {getPriorityBadge(action.priority)}
                        </div>
                        <p className="text-sm text-text-secondary">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <Link href={action.href}>
                      <Button variant="ghost" size="sm">
                        {t("common.view") || "Voir"}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Bloc 4: Dernières activités */}
        <div>
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            {t("home.recentActivities.title") || "Dernières activités"}
          </h2>
          <Card className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className={`flex items-center gap-4 pb-4 ${
                      index < recentActivities.length - 1
                        ? "border-b border-border-light"
                        : ""
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg bg-background ${activity.iconColor}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-text-primary">
                        {activity.title}
                      </h4>
                      <p className="text-sm text-text-secondary">
                        {activity.date}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-border-light">
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  <BarChart3 className="mr-2 w-4 h-4" />
                  {t("home.viewFullDashboard") || "Voir le dashboard complet"}
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </ProfessionalLayout>
  );
}
