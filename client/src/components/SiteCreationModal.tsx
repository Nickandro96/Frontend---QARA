/**
 * SiteCreationModal Component
 * Modal for creating a new site within the audit wizard
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface SiteCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSiteCreated?: (siteId: number) => void;
}

export function SiteCreationModal({ isOpen, onClose, onSiteCreated }: SiteCreationModalProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createSite = trpc.sites.create.useMutation({
    onSuccess: (data: any) => {
      toast.success("✅ Site créé avec succès");
      if (onSiteCreated && data?.id) {
        onSiteCreated(data.id);
      }
      handleClose();
    },
    onError: (error) => {
      const errorMessage = error.message || "Erreur lors de la création du site";
      setError(errorMessage);
      toast.error("❌ " + errorMessage);
    }
  });

  const handleClose = () => {
    setName("");
    setAddress("");
    setCity("");
    setState("");
    setZipCode("");
    setCountry("");
    setPhone("");
    setEmail("");
    setNotes("");
    setError(null);
    onClose();
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Le nom du site est obligatoire");
      return;
    }

    setError(null);
    createSite.mutate({
      name: name.trim(),
      addressLine1: address.trim() || undefined,
      city: city.trim() || undefined,
      postalCode: zipCode.trim() || undefined,
      country: country.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un nouveau site</DialogTitle>
          <DialogDescription>Ajoutez les informations de votre site</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="site-name">Nom du site *</Label>
            <Input
              id="site-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Siège social, Usine A, Entrepôt"
              disabled={createSite.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="site-address">Adresse</Label>
            <Input
              id="site-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Adresse"
              disabled={createSite.isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site-city">Ville</Label>
              <Input
                id="site-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ville"
                disabled={createSite.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-zipcode">Code postal</Label>
              <Input
                id="site-zipcode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Code postal"
                disabled={createSite.isPending}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site-state">État/Région</Label>
              <Input
                id="site-state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="État/Région"
                disabled={createSite.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-country">Pays</Label>
              <Input
                id="site-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Pays"
                disabled={createSite.isPending}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site-phone">Téléphone</Label>
              <Input
                id="site-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Téléphone"
                disabled={createSite.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-email">Email</Label>
              <Input
                id="site-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                disabled={createSite.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="site-notes">Notes</Label>
            <Textarea
              id="site-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes additionnelles"
              className="min-h-16"
              disabled={createSite.isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={createSite.isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createSite.isPending || !name.trim()}
          >
            {createSite.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              "Créer le site"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
