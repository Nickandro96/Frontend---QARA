import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Download, Loader2, CheckCircle2 } from "lucide-react";

type OutputFormat = "pdf" | "docx" | "xlsx";
type ReportLanguage = "fr" | "en";

const FORMAT_LABELS: Record<OutputFormat, string> = {
  pdf: "PDF",
  docx: "Word",
  xlsx: "Excel",
};

const API_FORMATS: Record<OutputFormat, "pdf" | "word" | "excel"> = {
  pdf: "pdf",
  docx: "word",
  xlsx: "excel",
};

export default function ReportGeneration() {
  const [location, navigate] = useLocation();


  // Get auditId from URL query params
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const auditIdParam = searchParams.get("auditId");
  const auditId = auditIdParam ? parseInt(auditIdParam) : null;

  const [outputFormat, setOutputFormat] = useState<OutputFormat>("pdf");
  const [reportLanguage, setReportLanguage] = useState<ReportLanguage>("fr");

  const generateMutation = trpc.reports.generateV2.useMutation({
    onSuccess: (data) => {
      toast({
        title: "? Rapport g�n�r� avec succ�s",
        description: `Le rapport a �t� g�n�r� et est disponible au t�l�chargement.`,
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
        title: "? Erreur de g�n�ration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!auditId) {
      toast({
        title: "?? Audit requis",
        description: "Veuillez s�lectionner un audit avant de g�n�rer un rapport.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      auditId,
      format: API_FORMATS[outputFormat],
      language: reportLanguage,
    });
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">G�n�ration de Rapport d'Audit</h1>
        <p className="text-muted-foreground">
          G�n�rez un rapport professionnel � partir de vos donn�es d'audit (FDA/MDR/ISO 13485/ISO 9001).
        </p>
      </div>

      <div className="grid gap-6">
        {/* Output settings */}
        <Card>
          <CardHeader>
            <CardTitle>Format et langue</CardTitle>
            <CardDescription>
              S�lectionnez le format de sortie et la langue du rapport complet.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="outputFormat">Format</Label>
              <Select value={outputFormat} onValueChange={(value: OutputFormat) => setOutputFormat(value)}>
                <SelectTrigger id="outputFormat">
                  <SelectValue placeholder="S�lectionner un format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                  <SelectItem value="docx">Word (.docx)</SelectItem>
                  <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportLanguage">Langue</Label>
              <Select value={reportLanguage} onValueChange={(value: ReportLanguage) => setReportLanguage(value)}>
                <SelectTrigger id="reportLanguage">
                  <SelectValue placeholder="S�lectionner une langue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Fran�ais</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Audit Info */}
        {auditId && (
          <Card>
            <CardHeader>
              <CardTitle>Audit S�lectionn�</CardTitle>
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
                G�n�ration en cours...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                G�n�rer le rapport {FORMAT_LABELS[outputFormat]}
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
                <p className="font-medium mb-1">?? Format de sortie : {FORMAT_LABELS[outputFormat]}</p>
                <p className="text-blue-700">
                  Le rapport sera automatiquement t�l�charg� et sauvegard� dans votre historique. 
                  Vous pourrez le consulter � tout moment depuis la page "Historique des Rapports".
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

