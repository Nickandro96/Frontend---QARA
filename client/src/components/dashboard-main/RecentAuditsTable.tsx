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
import { FileText, ArrowRight, Eye } from "lucide-react";
import { Link } from "wouter";

interface RecentAudit {
  id: number;
  name: string;
  auditType: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  siteName: string | null;
  conformityRate: string | null;
}

export function RecentAuditsTable({ data }: { data?: RecentAudit[] }) {
  if (!data || data.length === 0) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      closed: "bg-purple-100 text-purple-800",
    };
    const labels = {
      draft: "Brouillon",
      in_progress: "En cours",
      completed: "Terminé",
      closed: "Clôturé",
    };
    return (
      <Badge className={styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getAuditTypeLabel = (type: string) => {
    const labels = {
      internal: "Interne",
      external: "Externe",
      supplier: "Fournisseur",
      certification: "Certification",
      surveillance: "Surveillance",
      blanc: "Blanc",
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Audits Récents
            </CardTitle>
            <CardDescription>
              Accédez rapidement aux détails de vos audits
            </CardDescription>
          </div>
          <Link href="/audits">
            <Button variant="outline" size="sm">
              Voir tous
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom de l'audit</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Conformité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((audit) => (
              <TableRow key={audit.id}>
                <TableCell className="font-medium">{audit.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {getAuditTypeLabel(audit.auditType)}
                </TableCell>
                <TableCell className="text-sm">
                  {audit.siteName || "Non spécifié"}
                </TableCell>
                <TableCell className="text-sm">
                  {audit.startDate ? new Date(audit.startDate).toLocaleDateString("fr-FR") : "-"}
                </TableCell>
                <TableCell>
                  {audit.conformityRate ? (
                    <span className="font-medium">
                      {parseFloat(audit.conformityRate).toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(audit.status)}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/audit/${audit.id}`}>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Voir détails
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
