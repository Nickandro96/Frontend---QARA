import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Download, Trash2, Plus, Calendar, FileSpreadsheet, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default function ReportHistory() {
  const [, navigate] = useLocation();

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { data: reports, isLoading, refetch } = trpc.reports.list.useQuery({ limit: 50 });

  const deleteMutation = trpc.reports.delete.useMutation({
    onSuccess: () => {
      toast.success("✅ Rapport supprimé", { description: "Le rapport a été supprimé de l'historique." });
      refetch();
      setDeletingId(null);
    },
    onError: (error) => {
      toast.error("❌ Erreur de suppression", { description: error.message });
      setDeletingId(null);
    },
  });

  const downloadMutation = trpc.reports.download.useMutation({
    onSuccess: ({ url }) => {
      window.open(url, "_blank", "noopener,noreferrer");
      setDownloadingId(null);
    },
    onError: (error) => {
      toast.error(`Téléchargement impossible : ${error.message}`);
      setDownloadingId(null);
    },
  });

  const handleDelete = (reportId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce rapport ?")) {
      setDeletingId(reportId);
      deleteMutation.mutate({ reportId });
    }
  };

  const getReportFormatInfo = (format: string | null) => {
    switch (format) {
      case "pdf": return { label: "PDF", icon: FileText, color: "bg-red-100 text-red-800" };
      case "docx": return { label: "Word", icon: FileText, color: "bg-blue-100 text-blue-800" };
      case "xlsx": return { label: "Excel", icon: FileSpreadsheet, color: "bg-green-100 text-green-800" };
      default: return { label: "Rapport", icon: FileText, color: "bg-gray-100 text-gray-800" };
    }
  };

  const handleDownload = (reportId: number) => {
    setDownloadingId(reportId);
    downloadMutation.mutate({ reportId });
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Historique des Rapports</h1>
          <p className="text-muted-foreground">
            Consultez et téléchargez vos rapports d'audit générés.
          </p>
        </div>
        <Button onClick={() => navigate("/reports/generate")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Rapport
        </Button>
      </div>

      {!reports || reports.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun rapport généré</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par générer votre premier rapport d'audit.
              </p>
              <Button onClick={() => navigate("/reports/generate")}>
                <Plus className="mr-2 h-4 w-4" />
                Générer un Rapport
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => {
            const formatInfo = getReportFormatInfo(report.fileFormat);
            const FormatIcon = formatInfo.icon;

            return (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <FormatIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg mb-1">{report.reportTitle ?? `Rapport audit #${report.auditId}`}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          Généré {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: fr })}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={formatInfo.color}>{formatInfo.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Audit :</span> #{report.auditId}
                      </div>
                      <div>
                        <span className="font-medium">Version :</span> {report.reportVersion}
                      </div>
                      <div>
                        <span className="font-medium">Langue :</span> {report.language?.toUpperCase()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(report.id)}
                        disabled={downloadingId === report.id}
                      >
                        {downloadingId === report.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        Télécharger {formatInfo.label}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(report.id)}
                        disabled={deletingId === report.id}
                      >
                        {deletingId === report.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
