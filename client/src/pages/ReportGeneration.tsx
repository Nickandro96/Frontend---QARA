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

const FORMAT_LABELS: Record<OutputFormat, string> = { pdf: "PDF", docx: "Word", xlsx: "Excel" };
const API_FORMATS: Record<OutputFormat, "pdf" | "word" | "excel"> = {
  pdf: "pdf",
  docx: "word",
  xlsx: "excel",
};

export default function ReportGeneration() {
  const [location, navigate] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const auditIdParam = searchParams.get("auditId");
  const initialAuditId = auditIdParam ? parseInt(auditIdParam) : null;
  const [auditId, setAuditId] = useState<number | null>(initialAuditId);

  const [outputFormat, setOutputFormat] = useState<OutputFormat>("pdf");
  const [reportLanguage, setReportLanguage] = useState<ReportLanguage>("fr");
  const auditsQuery = trpc.audit.list.useQuery();

  const downloadMutation = trpc.reports.download.useMutation({
    onSuccess: ({ url }) => window.open(url, "_blank", "noopener,noreferrer"),
    onError: (error) => toast.error(`T\u00e9l\u00e9chargement impossible : ${error.message}`),
  });

  const generateMutation = trpc.reports.generateV2.useMutation({
    onSuccess: (data) => {
      toast.success("Rapport g\u00e9n\u00e9r\u00e9 avec succ\u00e8s", {
        description: "Le rapport a \u00e9t\u00e9 g\u00e9n\u00e9r\u00e9 et est disponible au t\u00e9l\u00e9chargement.",
      });
      downloadMutation.mutate({ reportId: data.reportId });
    },
    onError: (error) => {
      toast.error("Erreur de g\u00e9n\u00e9ration", { description: error.message });
    },
  });

  const handleGenerate = () => {
    if (!auditId) {
      toast.error("Audit requis", {
        description: "Veuillez s\u00e9lectionner un audit avant de g\u00e9n\u00e9rer un rapport.",
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
        <h1 className="text-3xl font-bold mb-2">{"G\u00e9n\u00e9ration de rapport d'audit"}</h1>
        <p className="text-muted-foreground">
          {"G\u00e9n\u00e9rez un rapport professionnel \u00e0 partir de vos donn\u00e9es d'audit (FDA/MDR/ISO 13485/ISO 9001)."}
        </p>
      </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Audit</CardTitle>
            <CardDescription>{"S\u00e9lectionnez l'audit pour lequel g\u00e9n\u00e9rer le rapport."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={auditId?.toString() ?? ""}
              onValueChange={(value) => setAuditId(Number(value))}
              disabled={auditsQuery.isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={auditsQuery.isLoading ? "Chargement des audits..." : "S\u00e9lectionner un audit"} />
              </SelectTrigger>
              <SelectContent>
                {(auditsQuery.data ?? []).map((audit) => (
                  <SelectItem key={audit.id} value={audit.id.toString()}>
                    {audit.name || `Audit #${audit.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Format et langue</CardTitle>
            <CardDescription>{"S\u00e9lectionnez le format de sortie et la langue du rapport complet."}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="outputFormat">Format</Label>
              <Select value={outputFormat} onValueChange={(value: OutputFormat) => setOutputFormat(value)}>
                <SelectTrigger id="outputFormat"><SelectValue placeholder={"S\u00e9lectionner un format"} /></SelectTrigger>
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
                <SelectTrigger id="reportLanguage"><SelectValue placeholder={"S\u00e9lectionner une langue"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">{"Fran\u00e7ais"}</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        {auditId && (
          <Card>
            <CardHeader><CardTitle>{"Audit s\u00e9lectionn\u00e9"}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Audit #{auditId}</span>
              </div>
            </CardContent>
          </Card>
        )}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate("/audits")}>Annuler</Button>
          <Button onClick={handleGenerate} disabled={!auditId || generateMutation.isPending || downloadMutation.isPending} size="lg">
            {generateMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{"G\u00e9n\u00e9ration en cours..."}</>
            ) : (
              <><Download className="mr-2 h-4 w-4" />{"G\u00e9n\u00e9rer le rapport "}{FORMAT_LABELS[outputFormat]}</>
            )}
          </Button>
        </div>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Format de sortie : {FORMAT_LABELS[outputFormat]}</p>
                <p className="text-blue-700">
                  {"Le rapport sera automatiquement t\u00e9l\u00e9charg\u00e9 et sauvegard\u00e9 dans votre historique. "}
                  {"Vous pourrez le consulter \u00e0 tout moment depuis la page Historique des rapports."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
