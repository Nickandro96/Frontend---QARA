import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ChevronRight, ClipboardCheck, Factory, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ReferentialChoice = {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: typeof ClipboardCheck;
};

const REFERENTIALS: ReferentialChoice[] = [
  {
    id: "MDR",
    title: "MDR 2017/745",
    description: "Audit de conformité des dispositifs médicaux pour le marché européen.",
    route: "/mdr/audit",
    icon: ShieldCheck,
  },
  {
    id: "ISO9001",
    title: "ISO 9001",
    description: "Audit du système de management de la qualité.",
    route: "/iso/audit?standard=9001",
    icon: ClipboardCheck,
  },
  {
    id: "ISO13485",
    title: "ISO 13485",
    description: "Audit du système qualité applicable aux dispositifs médicaux.",
    route: "/iso/audit?standard=13485",
    icon: ClipboardCheck,
  },
  {
    id: "FDA_QMSR",
    title: "FDA QMSR",
    description: "Audit de conformité qualité pour le marché américain.",
    route: "/fda/audit",
    icon: Factory,
  },
];

export default function AuditWizard() {
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState<string | null>(null);
  const choice = REFERENTIALS.find((item) => item.id === selected);

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Nouvel audit · Étape 1</p>
        <h1 className="text-3xl font-bold tracking-tight">Choisir le référentiel</h1>
        <p className="mt-2 text-muted-foreground">
          Le parcours et les questions seront adaptés au référentiel sélectionné.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {REFERENTIALS.map((item) => {
          const Icon = item.icon;
          const active = selected === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item.id)}
              className="text-left"
              aria-pressed={active}
            >
              <Card className={active ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"}>
                <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription className="mt-1">{item.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="text-sm font-medium text-primary">
                  {active ? "Référentiel sélectionné" : "Sélectionner"}
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t pt-6">
        <Button variant="outline" onClick={() => setLocation("/audits")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux audits
        </Button>
        <Button disabled={!choice} onClick={() => choice && setLocation(choice.route)}>
          Continuer
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
