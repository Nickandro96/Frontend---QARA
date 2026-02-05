import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface RecentFinding {
  id: number;
  questionId: number;
  questionText: string;
  processName: string;
  referential: string;
  article: string;
  status: string;
  comment: string | null;
  createdAt: Date;
}

export function RecentFindingsTable({ data: propData }: { data?: RecentFinding[] }) {
  // Données d'exemple (fallback)
  const defaultFindingsData = [
    {
      id: 1,
      process: "Gestion des risques",
      clause: "ISO 14971 - 4.3",
      description: "Analyse des risques incomplète pour le dispositif X",
      severity: "Majeure",
      status: "open",
      dueDate: "2026-02-15",
    },
    {
      id: 2,
      process: "Conception & développement",
      clause: "MDR Annexe I - 17.1",
      description: "Documentation des tests de biocompatibilité manquante",
      severity: "Mineure",
      status: "in_progress",
      dueDate: "2026-02-20",
    },
    {
      id: 3,
      process: "PMS",
      clause: "MDR Art. 83",
      description: "Plan de surveillance post-commercialisation à mettre à jour",
      severity: "Mineure",
      status: "open",
      dueDate: "2026-03-01",
    },
    {
      id: 4,
      process: "QMS",
      clause: "ISO 13485 - 4.2.3",
      description: "Procédure de maîtrise des documents obsolète",
      severity: "Observation",
      status: "resolved",
      dueDate: "2026-01-25",
    },
  ];
  
  const findings = propData
    ? propData.map(f => ({
        id: f.id,
        process: f.processName,
        clause: `${f.referential} ${f.article}`,
        description: f.questionText.length > 60 ? f.questionText.substring(0, 60) + "..." : f.questionText,
        severity: "Mineure",
        status: "open",
        dueDate: new Date(f.createdAt).toLocaleDateString("fr-FR"),
      }))
    : defaultFindingsData;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Majeure":
        return <Badge variant="destructive">Majeure</Badge>;
      case "Mineure":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">Mineure</Badge>;
      case "Observation":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Observation</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "resolved":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "Ouverte";
      case "in_progress":
        return "En cours";
      case "resolved":
        return "Résolue";
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dernières Non-conformités & Actions</CardTitle>
        <CardDescription>
          Suivi des écarts identifiés et des actions correctives en cours
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Processus</TableHead>
              <TableHead>Clause</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Criticité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Échéance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {findings.map((finding) => (
              <TableRow key={finding.id}>
                <TableCell className="font-medium">{finding.process}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {finding.clause}
                </TableCell>
                <TableCell className="max-w-xs">{finding.description}</TableCell>
                <TableCell>{getSeverityBadge(finding.severity)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(finding.status)}
                    <span className="text-sm">{getStatusLabel(finding.status)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{finding.dueDate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4">
          <Link href="/audit">
            <Button variant="outline" className="w-full">
              Voir toutes les actions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
