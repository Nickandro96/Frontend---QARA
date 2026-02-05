import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Plus, Loader2 } from "lucide-react";
import { AuditCreationDialog } from "./AuditCreationDialog";

interface AuditSelectorProps {
  auditType: "internal" | "external" | "supplier" | "certification" | "surveillance" | "blanc";
  referentialIds: number[];
  selectedAuditId: number | null;
  onAuditSelect: (auditId: number) => void;
}

export function AuditSelector({
  auditType,
  referentialIds,
  selectedAuditId,
  onAuditSelect,
}: AuditSelectorProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: audits, isLoading, refetch } = trpc.audit.list.useQuery({
    status: undefined,
    referentialId: referentialIds[0],
  });

  const handleAuditCreated = (auditId: number) => {
    refetch();
    onAuditSelect(auditId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Chargement des audits...</span>
      </div>
    );
  }

  const filteredAudits = audits?.filter(audit => {
    if (!audit.referentialIds) return false;
    const ids = JSON.parse(audit.referentialIds);
    return referentialIds.some(id => ids.includes(id));
  }) || [];

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <Select
          value={selectedAuditId?.toString() || ""}
          onValueChange={(value) => onAuditSelect(parseInt(value))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionnez un audit existant ou créez-en un nouveau" />
          </SelectTrigger>
          <SelectContent>
            {filteredAudits.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Aucun audit trouvé. Créez-en un nouveau.
              </div>
            ) : (
              filteredAudits.map((audit) => (
                <SelectItem key={audit.id} value={audit.id.toString()}>
                  <div className="flex flex-col">
                    <span className="font-medium">{audit.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {audit.status === "draft" && "Brouillon"}
                      {audit.status === "in_progress" && "En cours"}
                      {audit.status === "completed" && "Terminé"}
                      {audit.status === "closed" && "Clôturé"}
                      {" • "}
                      {new Date(audit.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={() => setShowCreateDialog(true)}
        variant="outline"
        size="icon"
        title="Créer un nouvel audit"
      >
        <Plus className="h-4 w-4" />
      </Button>

      <AuditCreationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        auditType={auditType}
        referentialIds={referentialIds}
        onAuditCreated={handleAuditCreated}
      />
    </div>
  );
}
