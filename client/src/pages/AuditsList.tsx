import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Filter, Eye, FileText, Plus } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function AuditsList() {
  const { isAuthenticated, loading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: audits, isLoading } = trpc.audit.listAudits.useQuery(
    {
      status: statusFilter === "all" ? undefined : statusFilter,
      search: searchQuery || undefined,
    },
    { enabled: isAuthenticated }
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
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

  const filteredAudits = audits || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">← Dashboard</Button>
            </Link>
            <h1 className="text-xl font-bold">Mes Audits</h1>
          </div>
          <Link href="/audit">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvel Audit
            </Button>
          </Link>
        </div>
      </header>

      <div className="container py-8 space-y-6">
        {/* Filters Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Filtres et Recherche
            </CardTitle>
            <CardDescription>
              Trouvez rapidement vos audits avec les filtres ci-dessous
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Rechercher</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nom de l'audit, référence..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Statut</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="closed">Clôturé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 text-sm text-muted-foreground">
              {filteredAudits.length} audit(s) trouvé(s)
            </div>
          </CardContent>
        </Card>

        {/* Audits Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Liste des Audits
            </CardTitle>
            <CardDescription>
              Cliquez sur un audit pour voir les détails complets
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredAudits.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  Aucun audit trouvé
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery || statusFilter
                    ? "Essayez de modifier vos filtres de recherche"
                    : "Commencez par créer votre premier audit"}
                </p>
                <Link href="/audit">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Créer un audit
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom de l'audit</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead>Date de début</TableHead>
                      <TableHead>Date de fin</TableHead>
                      <TableHead>Conformité</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAudits.map((audit) => (
                      <TableRow key={audit.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{audit.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {getAuditTypeLabel(audit.auditType)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {audit.siteName || "Non spécifié"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {audit.startDate
                            ? new Date(audit.startDate).toLocaleDateString("fr-FR")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {audit.endDate
                            ? new Date(audit.endDate).toLocaleDateString("fr-FR")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {audit.conformityRate ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500"
                                  style={{
                                    width: `${parseFloat(audit.conformityRate)}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {parseFloat(audit.conformityRate).toFixed(0)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(audit.status)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/audit/${audit.id}`}>
                            <Button variant="ghost" size="sm" className="gap-2">
                              <Eye className="h-4 w-4" />
                              Voir
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {filteredAudits.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rapport Comparatif</CardTitle>
                <CardDescription>
                  Comparez l'évolution entre deux audits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/reports/comparative">
                  <Button variant="outline" className="w-full">
                    Comparer des audits
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Historique des Rapports</CardTitle>
                <CardDescription>
                  Accédez à vos rapports générés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/reports/history">
                  <Button variant="outline" className="w-full">
                    Voir l'historique
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
