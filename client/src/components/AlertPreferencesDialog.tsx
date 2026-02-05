import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AlertPreferencesDialog() {
  const [open, setOpen] = useState(false);
  
  const { data: preferences, isLoading } = trpc.regulatory.getAlertPreferences.useQuery(undefined, {
    enabled: open,
  });

  const updateMutation = trpc.regulatory.updateAlertPreferences.useMutation({
    onSuccess: () => {
      toast.success("Préférences enregistrées", {
        description: "Vos préférences d'alertes ont été mises à jour avec succès.",
      });
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Erreur", {
        description: error.message || "Impossible de sauvegarder les préférences.",
      });
    },
  });

  // Form state
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [minImpactLevel, setMinImpactLevel] = useState<'high' | 'medium' | 'low'>('medium');
  const [regionsEU, setRegionsEU] = useState(true);
  const [regionsUS, setRegionsUS] = useState(true);

  // Load preferences when dialog opens
  useEffect(() => {
    if (preferences) {
      setEmailEnabled(preferences.emailEnabled);
      setMinImpactLevel(preferences.minImpactLevel as 'high' | 'medium' | 'low');
      
      try {
        const regions = JSON.parse(preferences.regions);
        setRegionsEU(regions.includes('EU'));
        setRegionsUS(regions.includes('US'));
      } catch (e) {
        // Default values
        setRegionsEU(true);
        setRegionsUS(true);
      }
    }
  }, [preferences]);

  const handleSave = () => {
    const regions: ('EU' | 'US')[] = [];
    if (regionsEU) regions.push('EU');
    if (regionsUS) regions.push('US');

    if (regions.length === 0) {
      toast.error("Veuillez sélectionner au moins une région.");
      return;
    }

    updateMutation.mutate({
      emailEnabled,
      minImpactLevel,
      regions,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Bell className="h-4 w-4 mr-2" />
          Alertes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Préférences d'alertes</DialogTitle>
          <DialogDescription>
            Configurez vos notifications pour les mises à jour réglementaires critiques
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Email enabled */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-enabled">Alertes par email</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des notifications par email
                </p>
              </div>
              <Switch
                id="email-enabled"
                checked={emailEnabled}
                onCheckedChange={setEmailEnabled}
              />
            </div>

            {/* Min impact level */}
            <div className="space-y-2">
              <Label htmlFor="min-impact">Niveau d'impact minimum</Label>
              <Select 
                value={minImpactLevel} 
                onValueChange={(value: any) => setMinImpactLevel(value)}
              >
                <SelectTrigger id="min-impact">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Impact élevé uniquement</SelectItem>
                  <SelectItem value="medium">Impact moyen et élevé</SelectItem>
                  <SelectItem value="low">Tous les niveaux d'impact</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Vous serez alerté uniquement pour les mises à jour de ce niveau ou supérieur
              </p>
            </div>

            {/* Regions */}
            <div className="space-y-3">
              <Label>Régions surveillées</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="region-eu"
                    checked={regionsEU}
                    onCheckedChange={(checked) => setRegionsEU(checked as boolean)}
                  />
                  <label
                    htmlFor="region-eu"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    🇪🇺 Europe (MDR, IVDR, ISO)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="region-us"
                    checked={regionsUS}
                    onCheckedChange={(checked) => setRegionsUS(checked as boolean)}
                  />
                  <label
                    htmlFor="region-us"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    🇺🇸 États-Unis (FDA, QMSR, 510(k))
                  </label>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Note :</strong> Les alertes sont envoyées automatiquement lorsqu'une nouvelle mise à jour 
                réglementaire correspondant à vos critères est publiée.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
