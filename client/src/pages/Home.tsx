import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, TrendingUp, ClipboardCheck, Bell, BarChart3, ArrowRight, Sparkles, PieChart, Rocket, Crown, User, LogOut, CreditCard } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });

  // Modules bloqués pour FREE (sauf admin)
  const blockedForFree = [
    "/fda-audit",
    "/fda-classification",
    "/fda-regulatory-watch",
    "/fda-dashboard",
    "/fda-submission-tracker",
    "/classification",
    "/dashboard",
    "/regulatory-watch",
    "/documents",
    "/reports"
  ];

  const isModuleBlocked = (link: string) => {
    if (!isAuthenticated) return false;
    if (user?.role === 'admin') return false;
    if (profile?.subscriptionTier !== 'free') return false;
    return blockedForFree.includes(link);
  };

  const modules = [
    {
      icon: ClipboardCheck,
      titleKey: "home.modules.mdrAudit.title",
      descriptionKey: "home.modules.mdrAudit.description",
      featuresKey: "home.modules.mdrAudit.features",
      link: "/mdr/audit",
      color: "bg-blue-500"
    },
    {
      icon: Shield,
      titleKey: "home.modules.iso9001Audit.title",
      descriptionKey: "home.modules.iso9001Audit.description",
      featuresKey: "home.modules.iso9001Audit.features",
      link: "/iso/audit?standard=9001",
      color: "bg-blue-600"
    },
    {
      icon: Shield,
      titleKey: "home.modules.iso13485Audit.title",
      descriptionKey: "home.modules.iso13485Audit.description",
      featuresKey: "home.modules.iso13485Audit.features",
      link: "/iso/audit?standard=13485",
      color: "bg-blue-700"
    },
    {
      icon: Shield,
      titleKey: "home.modules.fdaAudit.title",
      descriptionKey: "home.modules.fdaAudit.description",
      featuresKey: "home.modules.fdaAudit.features",
      link: "/fda-audit",
      color: "bg-blue-600"
    },
    {
      icon: Sparkles,
      titleKey: "home.modules.fdaClassification.title",
      descriptionKey: "home.modules.fdaClassification.description",
      featuresKey: "home.modules.fdaClassification.features",
      link: "/fda-classification",
      color: "bg-purple-600"
    },
    {
      icon: Bell,
      titleKey: "home.modules.fdaWatch.title",
      descriptionKey: "home.modules.fdaWatch.description",
      featuresKey: "home.modules.fdaWatch.features",
      link: "/fda-regulatory-watch",
      color: "bg-orange-600"
    },
    {
      icon: PieChart,
      titleKey: "home.modules.fdaDashboard.title",
      descriptionKey: "home.modules.fdaDashboard.description",
      featuresKey: "home.modules.fdaDashboard.features",
      link: "/fda-dashboard",
      color: "bg-indigo-600"
    },
    {
      icon: Rocket,
      titleKey: "home.modules.fdaSubmission.title",
      descriptionKey: "home.modules.fdaSubmission.description",
      featuresKey: "home.modules.fdaSubmission.features",
      link: "/fda-submission-tracker",
      color: "bg-rose-600"
    },
    {
      icon: Shield,
      titleKey: "home.modules.euClassification.title",
      descriptionKey: "home.modules.euClassification.description",
      featuresKey: "home.modules.euClassification.features",
      link: "/classification",
      color: "bg-purple-500"
    },
    {
      icon: BarChart3,
      titleKey: "home.modules.dashboard.title",
      descriptionKey: "home.modules.dashboard.description",
      featuresKey: "home.modules.dashboard.features",
      link: "/dashboard",
      color: "bg-green-500"
    },
    {
      icon: Bell,
      titleKey: "home.modules.regulatoryWatch.title",
      descriptionKey: "home.modules.regulatoryWatch.description",
      featuresKey: "home.modules.regulatoryWatch.features",
      link: "/regulatory-watch",
      color: "bg-orange-500"
    },
    {
      icon: FileText,
      titleKey: "home.modules.documents.title",
      descriptionKey: "home.modules.documents.description",
      featuresKey: "home.modules.documents.features",
      link: "/documents",
      color: "bg-teal-500"
    },
    {
      icon: BarChart3,
      titleKey: "home.modules.reports.title",
      descriptionKey: "home.modules.reports.description",
      featuresKey: "home.modules.reports.features",
      link: "/reports",
      color: "bg-indigo-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">MDR Compliance Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/pricing">
              <Button variant="ghost">{t('common.pricing')}</Button>
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">{t('common.dashboard')}</Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {user?.name?.substring(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline">{user?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-sm">
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {profile?.subscriptionTier?.toUpperCase() || 'FREE'}
                        </span>
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                        <User className="h-4 w-4" />
                        {t('common.profile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/subscription" className="flex items-center gap-2 cursor-pointer">
                        <CreditCard className="h-4 w-4" />
                        {t('common.subscription')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="flex items-center gap-2 cursor-pointer text-red-600"
                      onClick={() => {
                        window.location.href = '/api/oauth/logout';
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      {t('common.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/login">
                <Button>{t('common.login')}</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t('home.title')}
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            {t('home.subtitle')}
          </p>
          {!isAuthenticated && (
            <Link href="/login">
              <Button size="lg">
                {t('home.cta')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        {/* Modules Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {modules.map((module) => {
            const Icon = module.icon;
            const blocked = isModuleBlocked(module.link);
            const features = t(module.featuresKey, { returnObjects: true }) as string[];
            
            const card = (
              <Card className={`h-full transition-all ${blocked ? 'opacity-75 border-2 border-yellow-300' : 'hover:shadow-lg cursor-pointer group border-2 hover:border-primary'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg ${module.color} flex items-center justify-center ${!blocked && 'group-hover:scale-110'} transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    {blocked && (
                      <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                        <Crown className="h-3 w-3" />
                        PRO
                      </div>
                    )}
                  </div>
                  <CardTitle className={!blocked ? 'group-hover:text-primary transition-colors' : ''}>
                    {t(module.titleKey)}
                  </CardTitle>
                  <CardDescription className="min-h-[60px]">
                    {t(module.descriptionKey)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {Array.isArray(features) && features.map((feature) => (
                      <li key={feature} className="text-sm text-slate-600 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {blocked ? (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                      <p className="text-sm font-medium text-yellow-800">🔒 {t('pricing.upgrade')}</p>
                      <Link href="/pricing">
                        <Button variant="link" size="sm" className="text-yellow-700 hover:text-yellow-900">
                          {t('home.ctaSecondary')}
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Button variant="ghost" className="w-full mt-4 group-hover:bg-primary group-hover:text-white transition-colors">
                      {t('common.access')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
            
            return blocked ? (
              <div key={module.titleKey}>{card}</div>
            ) : (
              <Link key={module.titleKey} href={module.link}>{card}</Link>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">100% MDR Compliant</h3>
            <p className="text-sm text-slate-600">
              {t('footer.description')}
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">AI-Powered</h3>
            <p className="text-sm text-slate-600">
              {t('home.subtitle')}
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Professional Exports</h3>
            <p className="text-sm text-slate-600">
              {t('home.modules.reports.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm py-8">
        <div className="container text-center text-sm text-slate-600">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <p className="mt-2">MDR 2017/745 • ISO 13485 • ISO 9001 • FDA QMSR</p>
        </div>
      </footer>
    </div>
  );
}
