import { useTranslation } from "react-i18next";
import { ModernSidebar } from "@/components/ModernSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import {
  Shield,
  Zap,
  FileText,
  ArrowRight,
  ClipboardCheck,
  Award,
} from "lucide-react";

export default function ModernHome() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Shield,
      iconBg: "bg-blue-500",
      title: "100% MDR Compliant",
      subtitle: "Regulatory compliance",
    },
    {
      icon: Zap,
      iconBg: "bg-purple-500",
      title: "AI-Powered",
      subtitle: "Smart recommendations",
    },
    {
      icon: FileText,
      iconBg: "bg-green-500",
      title: "Professional Exports",
      subtitle: "PDF, Excel, Pack DG",
    },
  ];

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
      icon: Award,
      titleKey: "home.modules.iso9001Audit.title",
      descriptionKey: "home.modules.iso9001Audit.description",
      featuresKey: "home.modules.iso9001Audit.features",
      link: "/iso/audit?standard=9001",
      color: "bg-blue-600"
    },
    {
      icon: Award,
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
      color: "bg-indigo-600"
    },
  ];

  return (
    <>
      <ModernSidebar />
      <div className="ml-64">
        {/* Hero Section */}
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-600 to-blue-700 flex items-center">
          <div className="container mx-auto px-8 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Hero Content */}
              <div className="text-white">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
                  Plateforme d'audit
                  <br />
                  de conformité
                  <br />
                  réglementaire MDR
                  <br />& ISO 13485
                </h1>
                <p className="text-xl text-blue-100 mb-8 leading-relaxed max-w-2xl">
                  Évaluez votre conformité de manière interactive et guidée.
                  Obtenez des recommandations personnalisées par IA pour
                  atteindre l'excellence réglementaire.
                </p>
                <Link href="/audit">
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6 h-auto font-semibold shadow-xl hover:shadow-2xl transition-all"
                  >
                    Commencer l'audit gratuit
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>

              {/* Feature Cards */}
              <div className="space-y-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={index}
                      className="bg-blue-800/40 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 hover:bg-blue-800/60 transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`${feature.iconBg} w-14 h-14 rounded-lg flex items-center justify-center shadow-lg`}
                        >
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white text-xl font-semibold mb-1">
                            {feature.title}
                          </h3>
                          <p className="text-blue-200 text-sm">
                            {feature.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modules Section */}
        <div className="bg-slate-50 py-16">
          <div className="container mx-auto px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Choisissez votre audit</h2>
              <p className="text-slate-600 text-lg">
                Sélectionnez le référentiel qui correspond à vos besoins
              </p>
            </div>

            {/* Modules Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {modules.map((module, index) => {
                const Icon = module.icon;
                const features = t(module.featuresKey, { returnObjects: true }) as string[];
                
                return (
                  <Link key={index} href={module.link}>
                    <Card className="h-full hover:shadow-lg cursor-pointer group border-2 hover:border-primary transition-all">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-lg ${module.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <CardTitle className="group-hover:text-primary transition-colors">
                          {t(module.titleKey)}
                        </CardTitle>
                        <CardDescription className="min-h-[60px]">
                          {t(module.descriptionKey)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {Array.isArray(features) && features.map((feature, idx) => (
                            <li key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button variant="ghost" className="w-full mt-4 group-hover:bg-primary group-hover:text-white transition-colors">
                          Accéder
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
