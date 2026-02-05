import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, CheckCircle2, Sparkles, ArrowRight, Zap } from "lucide-react";
import { Link } from "wouter";

interface UpgradeRequiredProps {
  feature: string;
}

export function UpgradeRequired({ feature }: UpgradeRequiredProps) {
  const plans = [
    {
      name: "Starter",
      price: "49€",
      period: "/mois",
      description: "Pour les petites structures",
      features: [
        "Audits MDR & ISO 13485 illimités",
        "Sauvegarde automatique",
        "Exports PDF & Excel",
        "Dashboard de conformité",
        "Classification MDR",
      ],
      highlighted: false,
    },
    {
      name: "Professional",
      price: "99€",
      period: "/mois",
      description: "Pour les fabricants confirmés",
      features: [
        "Tout Starter +",
        "Audits FDA (QMSR, 510(k))",
        "Veille réglementaire EU & US",
        "IA contextuelle avancée",
        "Support prioritaire",
      ],
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Sur mesure",
      period: "",
      description: "Pour les grandes organisations",
      features: [
        "Tout Professional +",
        "Multi-sites & multi-utilisateurs",
        "API & intégrations",
        "Formation équipes",
        "Account manager dédié",
      ],
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold">MDR Compliance</span>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" size="sm">
              Voir les tarifs
            </Button>
          </Link>
        </div>
      </header>

      <main className="container py-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full mb-6">
            <Lock className="h-4 w-4" />
            <span className="text-sm font-medium">Fonctionnalité Premium</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Débloquez {feature}
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            Accédez à l'ensemble des fonctionnalités professionnelles pour piloter votre conformité réglementaire en toute sérénité.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Audits illimités</span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Exports professionnels</span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">IA contextuelle</span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Veille réglementaire</span>
            </div>
          </div>

          <Link href="/pricing">
            <Button size="lg" className="gap-2 shadow-lg">
              <Sparkles className="h-5 w-5" />
              Choisir mon plan
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Plans Comparison */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.highlighted ? 'border-primary shadow-xl scale-105' : 'border-gray-200'}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1">
                    <Zap className="h-3 w-3 mr-1" />
                    Le plus populaire
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link href="/pricing">
                  <Button 
                    className="w-full" 
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    {plan.name === "Enterprise" ? "Nous contacter" : "Choisir ce plan"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center max-w-2xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-4">
            Prêt à transformer votre conformité réglementaire ?
          </h2>
          <p className="mb-6 opacity-90">
            Rejoignez les fabricants qui pilotent leur conformité MDR, ISO 13485 et FDA avec efficacité.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <Button size="lg" variant="secondary" className="gap-2">
                <Sparkles className="h-5 w-5" />
                Voir les tarifs
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
