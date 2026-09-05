import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Download, Loader2, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { parseReportAuditId } from "@/lib/reportRouting";

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
  const initialAuditId = parseReportAuditId(auditIdParam);
  const [auditId, setAuditId] = useState<number | null>(initialAuditId);

  const [outputFormat, setOutputFormat] = useState<OutputFormat>("pdf");
  const [reportLanguage, setReportLanguage] = useState<ReportLanguage>("fr");
  const [conclusion, setConclusion] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [distributionList, setDistributionList] = useState("");
  const [allowIncomplete, setAllowIncomplete] = useState(false);
  const auditsQuery = trpc.audit.list.useQuery();
  const preparationQuery = trpc.reports.prepare.useQuery(
    { auditId: auditId ?? 0, language: reportLanguage },
    { enabled: Boolean(auditId) }
  );

  useEffect(() => {
    if (!preparationQuery.data) return;
    setConclusion(preparationQuery.data.defaultConclusion);
    setNextSteps(preparationQuery.data.defaultNextSteps);
    setAllowIncomplete(false);
  }, [preparationQuery.data]);

  const aiMutation = trpc.reports.suggestConclusion.useMutation({
    onSuccess: ({ suggestion }) => {
      setConclusion(suggestion);
      toast.success("Proposition IA ajout\u00e9e", { description: "Relisez et validez le texte avant g\u00e9n\u00e9ration." });
    },
    onError: (error) => toast.error("Aide IA indisponible", { description: error.message }),
  });

  const downloadMutation = trpc.reports.download.useMutation({
    onSuccess: ({ url }) => window.location.assign(url),
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
      conclusion,
      nextSteps,
      distributionList: distributionList || undefined,
      allowIncomplete,
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
            <CardHeader>
              <CardTitle>{"Contr\u00f4le de compl\u00e9tude"}</CardTitle>
              <CardDescription>{"QARA v\u00e9rifie les donn\u00e9es indispensables avant de produire le rapport."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Audit #{auditId} {"\u2014"} {preparationQuery.data?.answeredQuestions ?? 0}/{preparationQuery.data?.totalQuestions ?? 0} {"questions renseign\u00e9es"}</span>
              </div>
              {preparationQuery.isLoading && <p className="text-sm text-muted-foreground">Analyse en cours...</p>}
              {preparationQuery.data?.blocking.map((item) => (
                <p key={item} className="flex gap-2 text-sm text-red-700"><AlertTriangle className="h-4 w-4" />{item}</p>
              ))}
              {Boolean(preparationQuery.data?.missingCritical.length) && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-medium">Champs indispensables encore manquants :</p>
                  <p>{preparationQuery.data?.missingCritical.join(", ")}</p>
                  <label className="mt-3 flex items-center gap-2">
                    <input type="checkbox" checked={allowIncomplete} onChange={(e) => setAllowIncomplete(e.target.checked)} />
                    {"G\u00e9n\u00e9rer malgr\u00e9 tout un brouillon incomplet"}
                  </label>
                </div>
              )}
              {Boolean(preparationQuery.data?.warnings.length) && (
                <p className="text-sm text-amber-800">{"Points \u00e0 compl\u00e9ter : "}{preparationQuery.data?.warnings.join(" ; ")}</p>
              )}
            </CardContent>
          </Card>
        )}

        {auditId && preparationQuery.data && preparationQuery.data.blocking.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Conclusion et validation humaine</CardTitle>
              <CardDescription>{"La conclusion est pr\u00e9remplie, reste enti\u00e8rement modifiable et doit \u00eatre valid\u00e9e par l'auditeur."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="conclusion">Conclusion</Label>
                  <Button type="button" variant="outline" size="sm" disabled={aiMutation.isPending} onClick={() => aiMutation.mutate({ auditId, language: reportLanguage })}>
                    {aiMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Proposer avec l'IA
                  </Button>
                </div>
                <textarea id="conclusion" className="min-h-40 w-full rounded-md border bg-background p-3 text-sm" value={conclusion} onChange={(e) => setConclusion(e.target.value)} />
                <p className="text-xs text-muted-foreground">{"L'IA est une aide \u00e0 la r\u00e9daction : elle ne remplace ni les preuves ni la validation de l'auditeur."}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextSteps">{"Prochaines \u00e9ch\u00e9ances"}</Label>
                <textarea id="nextSteps" className="min-h-24 w-full rounded-md border bg-background p-3 text-sm" value={nextSteps} onChange={(e) => setNextSteps(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="distributionList">Liste de diffusion</Label>
                <input id="distributionList" className="h-10 w-full rounded-md border bg-background px-3 text-sm" placeholder="Ex. Direction, Responsable Qualit\u00e9, auditeur principal" value={distributionList} onChange={(e) => setDistributionList(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        )}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate("/audits")}>Annuler</Button>
          <Button onClick={handleGenerate} disabled={!auditId || preparationQuery.isLoading || Boolean(preparationQuery.data?.blocking.length) || (Boolean(preparationQuery.data?.missingCritical.length) && !allowIncomplete) || conclusion.trim().length < 20 || generateMutation.isPending || downloadMutation.isPending} size="lg">
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
