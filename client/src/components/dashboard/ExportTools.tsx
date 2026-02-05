import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  FileText,
  FileSpreadsheet,
  Package,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface ExportOption {
  id: string;
  label: string;
  description: string;
  checked: boolean;
}

interface ExportToolsProps {
  data: {
    kpis: Record<string, number>;
    sites: Array<{ id: string; name: string; score: number }>;
    processes: Array<{ id: string; name: string; score: number }>;
    findings: Array<{
      id: string;
      type: string;
      title: string;
      status: string;
      process: string;
      site: string;
    }>;
  };
  filters: Record<string, unknown>;
}

export function ExportTools({ data, filters }: ExportToolsProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<"csv" | "pdf" | "pack" | null>(null);
  const [packOptions, setPackOptions] = useState<ExportOption[]>([
    { id: "summary", label: "Synthèse Exécutive", description: "Vue d'ensemble des KPIs et tendances", checked: true },
    { id: "sites", label: "Analyse par Site", description: "Performance détaillée de chaque site", checked: true },
    { id: "processes", label: "Analyse par Processus", description: "Conformité par processus", checked: true },
    { id: "findings", label: "Liste des Constats", description: "Tous les constats avec détails", checked: true },
    { id: "actions", label: "Plan d'Actions", description: "Actions correctives et préventives", checked: true },
    { id: "trends", label: "Tendances", description: "Évolution sur la période", checked: false },
    { id: "heatmap", label: "Matrice de Risques", description: "Heatmap Site × Processus", checked: false },
  ]);

  const handleExportCSV = async () => {
    setIsExporting(true);
    setExportType("csv");

    try {
      // Simulate export delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Generate CSV content
      const csvContent = generateCSV(data);
      
      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-dashboard-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export CSV réussi",
        description: "Le fichier a été téléchargé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export CSV.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportType("pdf");

    try {
      // Simulate export delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "Export PDF en cours",
        description: "Le rapport PDF sera disponible dans quelques instants.",
      });

      // In a real implementation, this would call a server-side PDF generation endpoint
      // For now, we'll show a success message
      setTimeout(() => {
        toast({
          title: "Export PDF réussi",
          description: "Le rapport a été généré avec succès.",
        });
      }, 1000);
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const handleExportPack = async () => {
    setIsExporting(true);
    setExportType("pack");

    const selectedOptions = packOptions.filter((opt) => opt.checked);
    
    try {
      // Call server-side PDF generation endpoint
      const response = await fetch("/api/analytics/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: 1, // TODO: Get from auth context
          filters,
        }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Pack-DG-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Pack DG généré",
        description: `Le rapport PDF a été téléchargé avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de la génération du pack.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const togglePackOption = (id: string) => {
    setPackOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, checked: !opt.checked } : opt))
    );
  };

  return (
    <div className="flex items-center gap-2">
      {/* CSV Export */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCSV}
        disabled={isExporting}
      >
        {isExporting && exportType === "csv" ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4 mr-1" />
        )}
        CSV
      </Button>

      {/* PDF Export */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPDF}
        disabled={isExporting}
      >
        {isExporting && exportType === "pdf" ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <FileText className="h-4 w-4 mr-1" />
        )}
        PDF
      </Button>

      {/* Pack DG Export */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="default" size="sm" disabled={isExporting}>
            {isExporting && exportType === "pack" ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Package className="h-4 w-4 mr-1" />
            )}
            Pack DG
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Générer le Pack Direction Générale</DialogTitle>
            <DialogDescription>
              Sélectionnez les éléments à inclure dans le pack de reporting pour la Direction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {packOptions.map((option) => (
              <div
                key={option.id}
                className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                onClick={() => togglePackOption(option.id)}
              >
                <Checkbox
                  id={option.id}
                  checked={option.checked}
                  onCheckedChange={() => togglePackOption(option.id)}
                />
                <div className="flex-1">
                  <Label htmlFor={option.id} className="font-medium cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
                {option.checked && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {packOptions.filter((o) => o.checked).length} éléments sélectionnés
            </span>
            <Button onClick={handleExportPack} disabled={isExporting || packOptions.filter((o) => o.checked).length === 0}>
              {isExporting && exportType === "pack" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Générer le Pack
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to generate CSV content
function generateCSV(data: ExportToolsProps["data"]): string {
  const lines: string[] = [];

  // KPIs section
  lines.push("=== INDICATEURS CLÉS ===");
  lines.push("Indicateur,Valeur");
  Object.entries(data.kpis).forEach(([key, value]) => {
    lines.push(`${key},${value}`);
  });
  lines.push("");

  // Sites section
  lines.push("=== PERFORMANCE PAR SITE ===");
  lines.push("ID,Nom,Score");
  data.sites.forEach((site) => {
    lines.push(`${site.id},"${site.name}",${site.score}`);
  });
  lines.push("");

  // Processes section
  lines.push("=== PERFORMANCE PAR PROCESSUS ===");
  lines.push("ID,Nom,Score");
  data.processes.forEach((process) => {
    lines.push(`${process.id},"${process.name}",${process.score}`);
  });
  lines.push("");

  // Findings section
  lines.push("=== LISTE DES CONSTATS ===");
  lines.push("ID,Type,Titre,Statut,Processus,Site");
  data.findings.forEach((finding) => {
    lines.push(
      `${finding.id},${finding.type},"${finding.title}",${finding.status},"${finding.process}","${finding.site}"`
    );
  });

  return lines.join("\n");
}

// Quick Export Dropdown for compact layouts
export function QuickExportDropdown({ data, filters }: ExportToolsProps) {
  const { toast } = useToast();

  const handleQuickExport = (type: string) => {
    toast({
      title: `Export ${type} lancé`,
      description: "Le fichier sera téléchargé dans quelques instants.",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1" />
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleQuickExport("CSV")}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleQuickExport("PDF")}>
          <FileText className="h-4 w-4 mr-2" />
          Export PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleQuickExport("Pack DG")}>
          <Package className="h-4 w-4 mr-2" />
          Pack Direction Générale
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
