import { UpgradeRequired } from "@/components/UpgradeRequired";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Shield, FileText, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { KPIDetailModal } from "@/components/dashboard-main/KPIDetailModal";
import { ProcessDetailModal } from "@/components/dashboard-main/ProcessDetailModal";
import { ScoreTrendChart } from "@/components/dashboard-main/ScoreTrendChart";
import { RecentFindingsTable } from "@/components/dashboard-main/RecentFindingsTable";
import { RecentAuditsTable } from "@/components/dashboard-main/RecentAuditsTable";
import { useState } from "react";

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"score" | "progress" | "nonconformities">("score");
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<any>(null);
  const [selectedProcessScore, setSelectedProcessScore] = useState<any>(null);

  // Block FREE users
  if (isAuthenticated && profile && profile.subscriptionTier === 'free' && user?.role !== 'admin') {
    return <UpgradeRequired feature="Dashboard" />;
  }
  const { data: processes } = trpc.processes.list.useQuery();
  const { data: badges } = trpc.badges.list.useQuery(undefined, { enabled: isAuthenticated });
  
  // Dashboard data from tRPC
  const { data: kpiData } = trpc.dashboard.getKPIs.useQuery(undefined, { enabled: isAuthenticated });
  const { data: processProgress } = trpc.dashboard.getProcessProgress.useQuery(undefined, { enabled: isAuthenticated });
  const { data: scoreTrend } = trpc.dashboard.getScoreTrend.useQuery(undefined, { enabled: isAuthenticated });
  const { data: recentFindings } = trpc.dashboard.getRecentFindings.useQuery({ limit: 4 }, { enabled: isAuthenticated });
  const { data: recentAudits } = trpc.audit.getRecentAudits.useQuery({ limit: 5 }, { enabled: isAuthenticated });

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

  const badgeIcons: Record<string, string> = {
    first_audit: "🎯",
    audit_ready: "✅",
    pms_maitrisee: "📊",
    gspr_completes: "🏆",
    conformity_champion: "👑",
    evidence_master: "📁",
    sprint_achiever: "⚡"
  };

  const badgeNames: Record<string, string> = {
    first_audit: "Premier Audit",
    audit_ready: "Audit Ready",
    pms_maitrisee: "PMS Maîtrisée",
    gspr_completes: "GSPR Complètes",
    conformity_champion: "Champion de Conformité",
    evidence_master: "Maître des Preuves",
    sprint_achiever: "Sprint Achiever"
  };

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
                <Button variant="ghost" className="font-medium">Dashboard</Button>
              </Link>
              <Link href="/audit">
                <Button variant="ghost">Audit</Button>
              </Link>
              <Link href="/reports">
                <Button variant="ghost">Rapports</Button>
              </Link>
              <Link href="/regulatory-watch">
                <Button variant="ghost">Veille</Button>
              </Link>
              <Link href="/classification">
                <Button variant="ghost">Classification</Button>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Bienvenue, {user?.name || "Utilisateur"}
          </h1>
          <p className="text-muted-foreground">
            {profile?.economicRole 
              ? `Rôle économique : ${profile.economicRole.charAt(0).toUpperCase() + profile.economicRole.slice(1)}`
              : "Configurez votre profil pour commencer"}
          </p>
        </div>

        {/* Profile Setup Alert */}
        {!profile?.economicRole && (
          <Card className="mb-8 border-amber-300 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-900">Configuration du profil requise</CardTitle>
              <CardDescription className="text-amber-700">
                Veuillez configurer votre rôle économique pour accéder aux questions d'audit personnalisées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/profile">
                <Button>Configurer mon profil</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Score Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              setModalType("score");
              setModalOpen(true);
            }}
          >
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Score de Conformité Global
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary mb-2">
                {kpiData?.scoreGlobal.toFixed(1) || "0"}%
              </div>
              <Progress value={kpiData?.scoreGlobal || 0} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {kpiData?.conforme || 0} conforme sur {(kpiData?.conforme || 0) + (kpiData?.nonConforme || 0)} questions
              </p>
              <p className="text-xs text-primary mt-2 font-medium">
                → Cliquez pour voir les détails
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              setModalType("progress");
              setModalOpen(true);
            }}
          >
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Progression de l'Audit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">
                {kpiData?.progression.toFixed(0) || "0"}%
              </div>
              <Progress value={kpiData?.progression || 0} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {kpiData?.answeredQuestions || 0} / {kpiData?.totalQuestions || 0} questions répondues
              </p>
              <p className="text-xs text-primary mt-2 font-medium">
                → Cliquez pour voir les détails
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              setModalType("nonconformities");
              setModalOpen(true);
            }}
          >
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Non-conformités
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-600 mb-2">
                {kpiData?.nonConformitiesCount || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Actions correctives requises
              </p>
              <p className="text-xs text-primary mt-2 font-medium">
                → Cliquez pour voir les détails
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Role Comparison Section */}
        {profile?.economicRole && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Comparaison par Rôle Économique</CardTitle>
              <CardDescription>
                Progression de conformité selon les différents rôles MDR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Fabricant</span>
                    <span className="text-sm text-muted-foreground">
                      {profile.economicRole === "fabricant" ? "(Votre rôle)" : ""}
                    </span>
                  </div>
                  <Progress value={75} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-1">
                    1188 questions applicables • 75% de conformité
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Importateur</span>
                    <span className="text-sm text-muted-foreground">
                      {profile.economicRole === "importateur" ? "(Votre rôle)" : ""}
                    </span>
                  </div>
                  <Progress value={82} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-1">
                    606 questions applicables • 82% de conformité
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Distributeur</span>
                    <span className="text-sm text-muted-foreground">
                      {profile.economicRole === "distributeur" ? "(Votre rôle)" : ""}
                    </span>
                  </div>
                  <Progress value={88} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-1">
                    607 questions applicables • 88% de conformité
                  </p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>💡 Conseil :</strong> Les distributeurs ont généralement moins d'exigences
                  que les fabricants, mais doivent s'assurer que les fabricants respectent leurs obligations.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Badges Section */}
        {badges && badges.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Vos Badges</CardTitle>
              <CardDescription>Récompenses obtenues pour votre progression</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {badges.map((badge) => (
                  <div key={badge.id} className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full badge-earned flex items-center justify-center text-3xl">
                      {badgeIcons[badge.badgeType] || "🏅"}
                    </div>
                    <span className="text-sm font-medium text-center">
                      {badgeNames[badge.badgeType] || badge.badgeType}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Score Trend Chart */}
        {scoreTrend && scoreTrend.length > 0 && <ScoreTrendChart data={scoreTrend} />}

        {/* Recent Audits Table */}
        {recentAudits && recentAudits.length > 0 && <RecentAuditsTable data={recentAudits} />}

        {/* Recent Findings Table */}
        {recentFindings && recentFindings.length > 0 && <RecentFindingsTable data={recentFindings} />}

        {/* Processes Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Progression par Processus</CardTitle>
            <CardDescription>Suivez votre conformité pour chaque processus métier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processProgress?.slice(0, 6).map((proc) => (
                <div 
                  key={proc.id}
                  className="space-y-2 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                  onClick={() => {
                    setSelectedProcess(proc);
                    setSelectedProcessScore({ score: proc.score, progress: proc.progression });
                    setProcessModalOpen(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{proc.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {proc.score.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={proc.score} className="h-2" />
                  <p className="text-xs text-primary font-medium">
                    → Cliquez pour voir les détails
                  </p>
                </div>
              ))}
            </div>
            <Link href="/audit">
              <Button variant="outline" className="w-full mt-4">
                Voir tous les processus
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Continuer l'Audit</CardTitle>
              <CardDescription>
                Reprenez là où vous vous êtes arrêté
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/audit">
                <Button className="w-full">Accéder à l'audit</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Rapports & Exports</CardTitle>
              <CardDescription>
                Générez vos rapports de conformité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/reports">
                <Button variant="outline" className="w-full">Voir les rapports</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* KPI Detail Modal */}
      <KPIDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        type={modalType}
        data={kpiData || {}}
      />

      {/* Process Detail Modal */}
      <ProcessDetailModal
        open={processModalOpen}
        onOpenChange={setProcessModalOpen}
        process={selectedProcess}
        score={selectedProcessScore}
      />
    </div>
  );
}

// ProcessProgress component removed - now using processProgress data directly
