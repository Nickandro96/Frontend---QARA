import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, FileSpreadsheet, FileText, Languages, Loader2 } from "lucide-react";

type ReportFormat = "pdf" | "word" | "excel";
type ReportLanguage = "fr" | "en";

const FORMAT_OPTIONS: Array<{
  value: ReportFormat;
  label: string;
  description: string;
  icon: typeof FileText;
}> = [
  {
    value: "pdf",
    label: "PDF",
    description: "Document final, prêt à partager ou à archiver.",
    icon: FileText,
  },
  {
    value: "word",
    label: "Word",
    description: "Document modifiable pour compléter ou adapter le rapport.",
    icon: FileText,
  },
  {
    value: "excel",
    label: "Excel",
    description: "Tableaux de travail : synthèse, réponses, écarts, CAPA et preuves.",
    icon: FileSpreadsheet,
  },
];

export default function ReportGeneration() {
  const [location, navigate] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const auditIdParam = searchParams.get("auditId");
  const auditId = auditIdParam ? Number.parseInt(auditIdParam, 10) : null;

  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [language, setLanguage] = useState<ReportLanguage>("fr");

  const generateMutation = trpc.reports.generateV2.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Rapport généré",
        description: "Le fichier est prêt et a été ajouté à votre historique.",
      });
      window.open(data.fileUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => navigate("/reports/history"), 1000);
    },
    onError: (error) => {
      toast({
        title: "Impossible de générer le rapport",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!auditId || Number.isNaN(auditId)) {
      toast({
        title: "Audit requis",
        description: "Sélectionnez d'abord un audit.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate({ auditId, format, language });
  };

  const selectedFormat = FORMAT_OPTIONS.find((option) => option.value === format)!;
  const FormatIcon = selectedFormat.icon;

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Générer le rapport d'audit</h1>
        <p className="text-muted-foreground">
          Choisissez simplement le format du fichier et sa langue.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Format du rapport</CardTitle>
            <CardDescription>Le contenu et les résultats sont identiques dans les trois formats.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reportFormat">Format</Label>
              <Select value={format} onValueChange={(value) => setFormat(value as ReportFormat)}>
                <SelectTrigger id="reportFormat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 rounded-lg bg-muted p-4">
              <FormatIcon className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{selectedFormat.label}</p>
                <p className="text-sm text-muted-foreground">{selectedFormat.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Langue</CardTitle>
            <CardDescription>Les titres, libellés et explications du rapport seront traduits.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <Languages className="mb-2 h-5 w-5 text-primary" />
              <div className="w-full space-y-2">
                <Label htmlFor="reportLanguage">Langue du rapport</Label>
                <Select value={language} onValueChange={(value) => setLanguage(value as ReportLanguage)}>
                  <SelectTrigger id="reportLanguage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit sélectionné</CardTitle>
          </CardHeader>
          <CardContent>
            {auditId && !Number.isNaN(auditId) ? (
              <p>Audit n°{auditId}</p>
            ) : (
              <p className="text-destructive">Aucun audit sélectionné.</p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate("/audits")}>
            Annuler
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!auditId || Number.isNaN(auditId) || generateMutation.isPending}
            size="lg"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours…
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Générer le rapport
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
