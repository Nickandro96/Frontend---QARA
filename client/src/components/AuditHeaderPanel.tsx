/**
 * Audit Header Panel
 * Displays and allows editing of audit metadata (site, client, auditor, dates, notes)
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface AuditHeaderData {
  siteId?: number | null;
  clientOrganization?: string | null;
  auditorName?: string | null;
  auditorEmail?: string | null;
  startDate?: string | null;
  notes?: string | null;
}

interface AuditHeaderPanelProps {
  auditId: number | null;
  initialData?: AuditHeaderData;
  onSave: (data: AuditHeaderData) => Promise<void>;
}

export default function AuditHeaderPanel({ auditId, initialData, onSave }: AuditHeaderPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<AuditHeaderData>({
    siteLocation: initialData?.siteLocation || "",
    clientOrganization: initialData?.clientOrganization || "",
    auditorName: initialData?.auditorName || "",
    auditorEmail: initialData?.auditorEmail || "",
    startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : "",
    notes: initialData?.notes || "",
  });

  const handleSave = async () => {
    if (!auditId) {
      toast.error("Erreur", { description: "Audit non créé" });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      toast.success("✅ Informations sauvegardées");
    } catch (error) {
      toast.error("❌ Erreur de sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Informations de l'audit</CardTitle>
            <CardDescription>
              {isExpanded ? "Cliquez pour réduire" : "Cliquez pour remplir les détails de l'audit"}
            </CardDescription>
          </div>
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Site / Localisation */}
            <div className="space-y-2">
              <Label htmlFor="siteLocation">Site / Localisation</Label>
              <Input
                id="siteLocation"
                type="text"
                placeholder="Ex: Site de production Paris"
                value={formData.siteLocation || ""}
                onChange={(e) => setFormData({ ...formData, siteLocation: e.target.value })}
              />
            </div>

            {/* Client / Organisation */}
            <div className="space-y-2">
              <Label htmlFor="clientOrg">Client / Organisation</Label>
              <Input
                id="clientOrg"
                type="text"
                placeholder="Ex: ACME Medical Devices"
                value={formData.clientOrganization || ""}
                onChange={(e) => setFormData({ ...formData, clientOrganization: e.target.value })}
              />
            </div>

            {/* Nom de l'auditeur */}
            <div className="space-y-2">
              <Label htmlFor="auditorName">Nom de l'auditeur</Label>
              <Input
                id="auditorName"
                type="text"
                placeholder="Ex: Jean Dupont"
                value={formData.auditorName || ""}
                onChange={(e) => setFormData({ ...formData, auditorName: e.target.value })}
              />
            </div>

            {/* Email de l'auditeur */}
            <div className="space-y-2">
              <Label htmlFor="auditorEmail">Email de l'auditeur</Label>
              <Input
                id="auditorEmail"
                type="email"
                placeholder="Ex: jean.dupont@example.com"
                value={formData.auditorEmail || ""}
                onChange={(e) => setFormData({ ...formData, auditorEmail: e.target.value })}
              />
            </div>

            {/* Date de début */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate || ""}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
          </div>

          {/* Notes / Objectifs */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Objectifs de l'audit</Label>
            <Textarea
              id="notes"
              placeholder="Décrivez les objectifs, le périmètre, ou toute information pertinente..."
              rows={4}
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Bouton Sauvegarder */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving || !auditId}>
              {isSaving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
