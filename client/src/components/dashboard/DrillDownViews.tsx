import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Layers,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Calendar,
  User,
  Target,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KPICard } from "./KPICard";
import { BarChart, LineChart, StackedBarChart } from "./Charts";

// Types
export interface SiteData {
  id: string;
  name: string;
  code: string;
  score: number;
  scoreTrend: number;
  ncMajor: number;
  ncMinor: number;
  observations: number;
  openActions: number;
  lastAuditDate: string;
  nextAuditDate: string;
  processes: ProcessData[];
}

export interface ProcessData {
  id: string;
  name: string;
  score: number;
  scoreTrend: number;
  ncMajor: number;
  ncMinor: number;
  observations: number;
  clauses: ClauseData[];
}

export interface ClauseData {
  id: string;
  code: string;
  title: string;
  referential: string;
  status: "conforme" | "nc_major" | "nc_minor" | "observation" | "na";
  findings: FindingData[];
}

export interface FindingData {
  id: string;
  code: string;
  type: "nc_major" | "nc_minor" | "observation" | "ofi";
  title: string;
  description: string;
  clause: string;
  process: string;
  site: string;
  auditor: string;
  auditDate: string;
  status: "open" | "in_progress" | "closed" | "verified";
  dueDate: string;
  daysOpen: number;
  rootCause?: string;
  correctiveAction?: string;
  evidence?: string[];
}

// Demo data
const demoSiteData: SiteData = {
  id: "1",
  name: "Paris - Siège",
  code: "PAR",
  score: 92,
  scoreTrend: 3.2,
  ncMajor: 1,
  ncMinor: 4,
  observations: 8,
  openActions: 3,
  lastAuditDate: "2025-11-15",
  nextAuditDate: "2026-05-15",
  processes: [
    {
      id: "1",
      name: "Conception et Développement",
      score: 88,
      scoreTrend: 2.1,
      ncMajor: 1,
      ncMinor: 2,
      observations: 3,
      clauses: [],
    },
    {
      id: "2",
      name: "Production",
      score: 95,
      scoreTrend: 1.5,
      ncMajor: 0,
      ncMinor: 1,
      observations: 2,
      clauses: [],
    },
    {
      id: "3",
      name: "Achats et Fournisseurs",
      score: 85,
      scoreTrend: -1.2,
      ncMajor: 0,
      ncMinor: 1,
      observations: 3,
      clauses: [],
    },
  ],
};

const demoProcessData: ProcessData = {
  id: "1",
  name: "Conception et Développement",
  score: 88,
  scoreTrend: 2.1,
  ncMajor: 1,
  ncMinor: 2,
  observations: 3,
  clauses: [
    {
      id: "1",
      code: "7.3.1",
      title: "Planification de la conception et du développement",
      referential: "ISO 13485:2016",
      status: "conforme",
      findings: [],
    },
    {
      id: "2",
      code: "7.3.2",
      title: "Éléments d'entrée de la conception et du développement",
      referential: "ISO 13485:2016",
      status: "conforme",
      findings: [],
    },
    {
      id: "3",
      code: "7.3.3",
      title: "Éléments de sortie de la conception et du développement",
      referential: "ISO 13485:2016",
      status: "nc_minor",
      findings: [],
    },
    {
      id: "4",
      code: "7.3.4",
      title: "Revue de la conception et du développement",
      referential: "ISO 13485:2016",
      status: "nc_major",
      findings: [],
    },
    {
      id: "5",
      code: "7.3.5",
      title: "Vérification de la conception et du développement",
      referential: "ISO 13485:2016",
      status: "observation",
      findings: [],
    },
  ],
};

const demoFindingData: FindingData = {
  id: "F-2026-001",
  code: "F-2026-001",
  type: "nc_major",
  title: "Absence de revue de conception documentée",
  description:
    "Lors de l'audit du processus de conception, il a été constaté que les revues de conception pour le projet XYZ-2025 n'ont pas été documentées conformément à la procédure PRO-DES-004. Les enregistrements des décisions prises lors des revues de conception ne sont pas disponibles.",
  clause: "7.3.4",
  process: "Conception et Développement",
  site: "Paris - Siège",
  auditor: "Jean Dupont",
  auditDate: "2025-11-15",
  status: "in_progress",
  dueDate: "2026-02-15",
  daysOpen: 74,
  rootCause:
    "Manque de formation du personnel sur les exigences de documentation des revues de conception. La procédure PRO-DES-004 n'était pas suffisamment claire sur les enregistrements requis.",
  correctiveAction:
    "1. Formation de l'équipe de conception sur les exigences de documentation (terminée le 15/12/2025)\n2. Mise à jour de la procédure PRO-DES-004 avec des exemples de formulaires (en cours)\n3. Revue rétrospective des projets en cours pour documenter les revues manquantes (planifiée)",
  evidence: ["FOR-DES-012 - Formulaire de revue de conception", "PRO-DES-004 v2.0 - Procédure mise à jour"],
};

// Site Drill-Down View
interface SiteDrillDownProps {
  site: SiteData;
  onProcessClick: (process: ProcessData) => void;
  onBack: () => void;
}

export function SiteDrillDown({ site, onProcessClick, onBack }: SiteDrillDownProps) {
  const processPerformance = site.processes.map((p) => ({
    label: p.name.split(" ")[0],
    value: p.score,
  }));

  const processNCData = site.processes.map((p) => ({
    label: p.name.split(" ")[0],
    segments: [
      { value: p.ncMajor, color: "#ef4444", label: "NC Majeure" },
      { value: p.ncMinor, color: "#f97316", label: "NC Mineure" },
      { value: p.observations, color: "#eab308", label: "Observation" },
    ],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">{site.name}</h2>
            <Badge variant="outline">{site.code}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Dernier audit : {new Date(site.lastAuditDate).toLocaleDateString("fr-FR")} |
            Prochain audit : {new Date(site.nextAuditDate).toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard
          title="Score Site"
          value={site.score}
          unit="%"
          icon={<Target className="h-4 w-4" />}
          trend={{
            value: site.scoreTrend,
            direction: site.scoreTrend >= 0 ? "up" : "down",
          }}
          color="success"
        />
        <KPICard
          title="NC Majeures"
          value={site.ncMajor}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="danger"
        />
        <KPICard
          title="NC Mineures"
          value={site.ncMinor}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="warning"
        />
        <KPICard
          title="Observations"
          value={site.observations}
          icon={<FileText className="h-4 w-4" />}
        />
        <KPICard
          title="Actions Ouvertes"
          value={site.openActions}
          icon={<Clock className="h-4 w-4" />}
          color={site.openActions > 0 ? "warning" : "success"}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          data={processPerformance}
          title="Score par Processus"
          horizontal
        />
        <StackedBarChart
          data={processNCData}
          title="Constats par Processus"
        />
      </div>

      {/* Process List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Processus du Site
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Processus</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Tendance</TableHead>
                <TableHead className="text-center">NC Maj</TableHead>
                <TableHead className="text-center">NC Min</TableHead>
                <TableHead className="text-center">Obs</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {site.processes.map((process) => (
                <TableRow
                  key={process.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onProcessClick(process)}
                >
                  <TableCell className="font-medium">{process.name}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={process.score >= 90 ? "default" : process.score >= 80 ? "secondary" : "destructive"}
                    >
                      {process.score}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        "flex items-center justify-center gap-1",
                        process.scoreTrend >= 0 ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {process.scoreTrend >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {Math.abs(process.scoreTrend)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {process.ncMajor > 0 ? (
                      <Badge variant="destructive">{process.ncMajor}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {process.ncMinor > 0 ? (
                      <Badge variant="default">{process.ncMinor}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {process.observations > 0 ? (
                      <Badge variant="secondary">{process.observations}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Process Drill-Down View
interface ProcessDrillDownProps {
  process: ProcessData;
  siteName: string;
  onClauseClick: (clause: ClauseData) => void;
  onBack: () => void;
}

export function ProcessDrillDown({ process, siteName, onClauseClick, onBack }: ProcessDrillDownProps) {
  const getStatusBadge = (status: ClauseData["status"]) => {
    switch (status) {
      case "conforme":
        return <Badge className="bg-green-500">Conforme</Badge>;
      case "nc_major":
        return <Badge variant="destructive">NC Majeure</Badge>;
      case "nc_minor":
        return <Badge className="bg-orange-500">NC Mineure</Badge>;
      case "observation":
        return <Badge className="bg-yellow-500">Observation</Badge>;
      case "na":
        return <Badge variant="secondary">N/A</Badge>;
    }
  };

  const conformeCount = process.clauses.filter((c) => c.status === "conforme").length;
  const totalClauses = process.clauses.length;
  const conformityRate = totalClauses > 0 ? Math.round((conformeCount / totalClauses) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">{process.name}</h2>
          </div>
          <p className="text-sm text-muted-foreground">Site : {siteName}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard
          title="Score Processus"
          value={process.score}
          unit="%"
          icon={<Target className="h-4 w-4" />}
          trend={{
            value: process.scoreTrend,
            direction: process.scoreTrend >= 0 ? "up" : "down",
          }}
          color="success"
        />
        <KPICard
          title="Taux Conformité"
          value={conformityRate}
          unit="%"
          icon={<CheckCircle2 className="h-4 w-4" />}
          color={conformityRate >= 90 ? "success" : conformityRate >= 80 ? "warning" : "danger"}
        />
        <KPICard
          title="NC Majeures"
          value={process.ncMajor}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="danger"
        />
        <KPICard
          title="NC Mineures"
          value={process.ncMinor}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="warning"
        />
        <KPICard
          title="Observations"
          value={process.observations}
          icon={<FileText className="h-4 w-4" />}
        />
      </div>

      {/* Conformity Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Progression de la Conformité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Clauses conformes</span>
              <span className="font-medium">
                {conformeCount} / {totalClauses}
              </span>
            </div>
            <Progress value={conformityRate} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Clauses List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Exigences du Processus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clause</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Référentiel</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {process.clauses.map((clause) => (
                <TableRow
                  key={clause.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onClauseClick(clause)}
                >
                  <TableCell className="font-mono font-medium">{clause.code}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{clause.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{clause.referential}</Badge>
                  </TableCell>
                  <TableCell className="text-center">{getStatusBadge(clause.status)}</TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Finding Detail View
interface FindingDetailProps {
  finding: FindingData;
  onBack: () => void;
}

export function FindingDetail({ finding, onBack }: FindingDetailProps) {
  const getTypeBadge = (type: FindingData["type"]) => {
    switch (type) {
      case "nc_major":
        return <Badge variant="destructive">NC Majeure</Badge>;
      case "nc_minor":
        return <Badge className="bg-orange-500">NC Mineure</Badge>;
      case "observation":
        return <Badge className="bg-yellow-500">Observation</Badge>;
      case "ofi":
        return <Badge className="bg-blue-500">OFI</Badge>;
    }
  };

  const getStatusBadge = (status: FindingData["status"]) => {
    switch (status) {
      case "open":
        return <Badge variant="destructive">Ouvert</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500">En cours</Badge>;
      case "closed":
        return <Badge className="bg-green-500">Fermé</Badge>;
      case "verified":
        return <Badge className="bg-green-700">Vérifié</Badge>;
    }
  };

  const isOverdue = finding.status !== "closed" && finding.status !== "verified" && finding.daysOpen > 60;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">{finding.code}</h2>
            {getTypeBadge(finding.type)}
            {getStatusBadge(finding.status)}
            {isOverdue && (
              <Badge variant="destructive" className="animate-pulse">
                En retard
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{finding.title}</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              Clause
            </div>
            <p className="font-mono font-bold mt-1">{finding.clause}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Layers className="h-4 w-4" />
              Processus
            </div>
            <p className="font-medium mt-1 truncate">{finding.process}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Site
            </div>
            <p className="font-medium mt-1 truncate">{finding.site}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Jours ouverts
            </div>
            <p className={cn("font-bold mt-1", isOverdue && "text-red-600")}>
              {finding.daysOpen} jours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date d'audit</p>
              <p className="font-medium">
                {new Date(finding.auditDate).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Échéance</p>
              <p className={cn("font-medium", isOverdue && "text-red-600")}>
                {new Date(finding.dueDate).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Auditeur</p>
              <p className="font-medium flex items-center gap-1">
                <User className="h-4 w-4" />
                {finding.auditor}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Description du Constat</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{finding.description}</p>
        </CardContent>
      </Card>

      {/* Root Cause */}
      {finding.rootCause && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Analyse des Causes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{finding.rootCause}</p>
          </CardContent>
        </Card>
      )}

      {/* Corrective Action */}
      {finding.correctiveAction && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Actions Correctives</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{finding.correctiveAction}</p>
          </CardContent>
        </Card>
      )}

      {/* Evidence */}
      {finding.evidence && finding.evidence.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Preuves / Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {finding.evidence.map((doc, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {doc}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Export demo data for testing
export { demoSiteData, demoProcessData, demoFindingData };
