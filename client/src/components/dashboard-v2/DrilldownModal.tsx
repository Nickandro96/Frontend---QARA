import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

interface DrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "findings" | "actions" | "audits";
  filters: Record<string, any>;
  title: string;
  description?: string;
}

const CRITICALITY_COLORS = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

const STATUS_COLORS = {
  draft: "bg-gray-500",
  in_progress: "bg-blue-500",
  completed: "bg-green-500",
  closed: "bg-purple-500",
  pending: "bg-yellow-500",
  verified: "bg-emerald-500",
  cancelled: "bg-red-500",
};

export function DrilldownModal({
  isOpen,
  onClose,
  type,
  filters,
  title,
  description,
}: DrilldownModalProps) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data, isLoading } = trpc.dashboard.getDrilldown.useQuery(
    {
      type,
      filters,
      pagination: { page, pageSize },
      sort: { field: sortField, order: sortOrder },
    },
    { enabled: isOpen }
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : data && data.data.length > 0 ? (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("code")}
                        className="h-8 px-2"
                      >
                        Code
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("title")}
                        className="h-8 px-2"
                      >
                        Titre
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Processus</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("criticality")}
                        className="h-8 px-2"
                      >
                        Criticité
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("status")}
                        className="h-8 px-2"
                      >
                        Statut
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    {type === "actions" && (
                      <>
                        <TableHead>Responsable</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("dueDate")}
                            className="h-8 px-2"
                          >
                            Échéance
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                      </>
                    )}
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("date")}
                        className="h-8 px-2"
                      >
                        Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-sm">
                        {row.code || "-"}
                      </TableCell>
                      <TableCell className="font-medium">{row.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.processName || row.referentialName || "-"}
                      </TableCell>
                      <TableCell>
                        {row.criticality && (
                          <Badge
                            className={
                              CRITICALITY_COLORS[
                                row.criticality as keyof typeof CRITICALITY_COLORS
                              ] || "bg-gray-500"
                            }
                          >
                            {row.criticality}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            STATUS_COLORS[
                              row.status as keyof typeof STATUS_COLORS
                            ] || "bg-gray-500"
                          }
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                      {type === "actions" && (
                        <>
                          <TableCell className="text-sm">
                            {row.owner || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.dueDate
                              ? new Date(row.dueDate).toLocaleDateString("fr-FR")
                              : "-"}
                          </TableCell>
                        </>
                      )}
                      <TableCell className="text-sm text-muted-foreground">
                        {row.date
                          ? new Date(row.date).toLocaleDateString("fr-FR")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2">
              <div className="text-sm text-muted-foreground">
                Affichage {(page - 1) * pageSize + 1} à{" "}
                {Math.min(page * pageSize, data.total)} sur {data.total} résultats
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
                <div className="text-sm">
                  Page {page} sur {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Aucune donnée disponible
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
