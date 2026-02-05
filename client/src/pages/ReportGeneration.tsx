import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { FileText, Download, Loader2, CheckCircle2, FileBarChart, FileSpreadsheet, ClipboardList, FolderArchive } from "lucide-react";

export default function ReportGeneration() {
  const [location, navigate] = useLocation();


  // Get auditId from URL query params
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const auditIdParam = searchParams.get("auditId");
  const auditId = auditIdParam ? parseInt(auditIdParam) : null;

  const [reportType, setReportType] = useState<"complete" | "executive" | "comparative" | "action_plan" | "evidence_index">("complete");
  const [includeGraphs, setIncludeGraphs] = useState(true);
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [includeActionPlan, setIncludeActionPlan] = useState(true);

  const generateMutation = trpc.reports.generate.useMutation({
    onSuccess: (data) => {
      toast({
        title: "✅ Rapport généré avec succès",
        description: `Le rapport a été généré et est disponible au téléchargement.`,
      });

      // Download the file
      window.open(data.fileUrl, "_blank");

      // Navigate to reports history
      setTimeout(() => {
        navigate("/reports/history");
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: "❌ Erreur de génération",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!auditId) {
      toast({
        title: "⚠️ Audit requis",
        description: "Veuillez sélectionner un audit avant de générer un rapport.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      auditId,
      reportType,
      includeGraphs,
      includeEvidence,
      includeActionPlan,
    });
  };

  const reportTypeOptions = [
    {
      value: "complete",
      label: "Rapport Complet",
      description: "Rapport d'audit complet avec toutes les sections (11 sections)",
      icon: FileText,
    },
    {
      value: "executive",
      label: "Synthèse Direction",
      description: "Rapport synthétique pour la direction (KPIs + constats prioritaires)",
      icon: FileBarChart,
    },
    {
      value: "action_plan",
      label: "Plan d'Action",
      description: "Plan d'action priorisé par criticité",
      icon: ClipboardList,
    },
    {
      value: "evidence_index",
      label: "Index des Preuves",
      description: "Liste complète des preuves avec liens cliquables",
      icon: FolderArchive,
    },
    {
      value: "comparative",
      label: "Rapport Comparatif",
      description: "Comparaison avec audits précédents (évolution temporelle)",
      icon: FileSpreadsheet,
    },
  ];

  const selectedOption = reportTypeOptions.find((opt) => opt.value === reportType);

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Génération de Rapport d'Audit</h1>
        <p className="text-muted-foreground">
          Générez un rapport professionnel à partir de vos données d'audit (FDA/MDR/ISO 13485/ISO 9001).
        </p>
      </div>

      <div className="grid gap-6">
        {/* Report Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Type de Rapport</CardTitle>
            <CardDescription>
              Sélectionnez le type de rapport à générer selon vos besoins.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Type</Label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger id="reportType">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedOption && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <selectedOption.icon className="h-5 w-5 mt-0.5 text-primary" />
                  <div>
                    <h4 className="font-medium mb-1">{selectedOption.label}</h4>
                    <p className="text-sm text-muted-foreground">{selectedOption.description}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Options */}
        {reportType === "complete" && (
          <Card>
            <CardHeader>
              <CardTitle>Options Avancées</CardTitle>
              <CardDescription>
                Personnalisez le contenu du rapport complet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeGraphs"
                  checked={includeGraphs}
                  onCheckedChange={(checked) => setIncludeGraphs(checked as boolean)}
                />
                <Label htmlFor="includeGraphs" className="cursor-pointer">
                  Inclure les graphiques et tableaux (radar, histogrammes, heatmap)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeEvidence"
                  checked={includeEvidence}
                  onCheckedChange={(checked) => setIncludeEvidence(checked as boolean)}
                />
                <Label htmlFor="includeEvidence" className="cursor-pointer">
                  Inclure l'index des preuves avec liens cliquables
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeActionPlan"
                  checked={includeActionPlan}
                  onCheckedChange={(checked) => setIncludeActionPlan(checked as boolean)}
                />
                <Label htmlFor="includeActionPlan" className="cursor-pointer">
                  Inclure le plan d'action priorisé
                </Label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audit Info */}
        {auditId && (
          <Card>
            <CardHeader>
              <CardTitle>Audit Sélectionné</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Audit #{auditId}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generate Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate("/audits")}>
            Annuler
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!auditId || generateMutation.isPending}
            size="lg"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Générer le Rapport
              </>
            )}
          </Button>
        </div>

        {/* Info Box */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">📄 Format de sortie : PDF</p>
                <p className="text-blue-700">
                  Le rapport sera automatiquement téléchargé et sauvegardé dans votre historique. 
                  Vous pourrez le consulter à tout moment depuis la page "Historique des Rapports".
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
