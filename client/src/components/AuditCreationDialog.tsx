import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AuditCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditType: "internal" | "external" | "supplier" | "certification" | "surveillance" | "blanc";
  referentialIds: number[];
  onAuditCreated: (auditId: number) => void;
}

export function AuditCreationDialog({
  open,
  onOpenChange,
  auditType,
  referentialIds,
  onAuditCreated,
}: AuditCreationDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    siteName: "",
    clientName: "",
    auditorName: "",
    auditorEmail: "",
    startDate: "",
    notes: "",
  });

  const createAudit = trpc.audit.create.useMutation({
    onSuccess: (data) => {
      toast.success("Audit créé avec succès");
      onAuditCreated(data.auditId);
      onOpenChange(false);
      // Reset form
      setFormData({
        name: "",
        siteName: "",
        clientName: "",
        auditorName: "",
        auditorEmail: "",
        startDate: "",
        notes: "",
      });
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Le nom de l'audit est requis");
      return;
    }

    createAudit.mutate({
      auditType,
      name: formData.name,
      referentialIds,
      auditorName: formData.auditorName || undefined,
      auditorEmail: formData.auditorEmail || undefined,
      startDate: formData.startDate || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un nouvel audit</DialogTitle>
          <DialogDescription>
            Remplissez les informations pour créer un nouvel audit. Les champs marqués d'un * sont obligatoires.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom de l'audit */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom de l'audit <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Audit ISO 9001 - Site Paris"
              required
            />
          </div>

          {/* Site */}
          <div className="space-y-2">
            <Label htmlFor="siteName">Site / Localisation</Label>
            <Input
              id="siteName"
              value={formData.siteName}
              onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
              placeholder="Ex: Site de production Paris"
            />
          </div>

          {/* Client */}
          <div className="space-y-2">
            <Label htmlFor="clientName">Client / Organisation</Label>
            <Input
              id="clientName"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="Ex: Acme Medical Devices"
            />
          </div>

          {/* Auditeur */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="auditorName">Nom de l'auditeur</Label>
              <Input
                id="auditorName"
                value={formData.auditorName}
                onChange={(e) => setFormData({ ...formData, auditorName: e.target.value })}
                placeholder="Ex: Jean Dupont"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auditorEmail">Email de l'auditeur</Label>
              <Input
                id="auditorEmail"
                type="email"
                value={formData.auditorEmail}
                onChange={(e) => setFormData({ ...formData, auditorEmail: e.target.value })}
                placeholder="Ex: jean.dupont@example.com"
              />
            </div>
          </div>

          {/* Date de début */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Date de début</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Objectifs</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Objectifs de l'audit, périmètre, remarques..."
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createAudit.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={createAudit.isPending}>
              {createAudit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer l'audit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
