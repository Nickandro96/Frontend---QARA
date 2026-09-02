import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle2, Download, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

function RegulatoryProfileCard() {
  const { data: orgsData, refetch: refetchOrgs } = trpc.organizations.list.useQuery();
  const organizations = orgsData?.organizations ?? [];
  const org = organizations[0] as any | undefined;

  const createOrg = trpc.organizations.create.useMutation();
  const updateOrg = trpc.organizations.update.useMutation();
  const { data: certsData, refetch: refetchCerts } = trpc.organizations.certificates.list.useQuery(
    { organisationId: org?.id },
    { enabled: !!org?.id }
  );
  const upsertCert = trpc.organizations.certificates.upsert.useMutation();
  const deleteCert = trpc.organizations.certificates.delete.useMutation();

  const [newOrgName, setNewOrgName] = useState("");
  const [srn, setSrn] = useState("");
  const [prrcName, setPrrcName] = useState("");
  const [prrcQualification, setPrrcQualification] = useState("");
  const [notifiedBodyName, setNotifiedBodyName] = useState("");
  const [notifiedBodyNumber, setNotifiedBodyNumber] = useState("");

  const [newCertReferential, setNewCertReferential] = useState("");
  const [newCertNumber, setNewCertNumber] = useState("");

  useEffect(() => {
    if (!org) return;
    setSrn(org.srn || "");
    setPrrcName(org.prrcName || "");
    setPrrcQualification(org.prrcQualification || "");
    setNotifiedBodyName(org.notifiedBodyName || "");
    setNotifiedBodyNumber(org.notifiedBodyNumber || "");
  }, [org]);

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    try {
      await createOrg.mutateAsync({ name: newOrgName.trim() });
      await refetchOrgs();
      toast.success("Organisation créée");
    } catch {
      toast.error("Erreur lors de la création de l'organisation");
    }
  };

  const handleSaveRegulatory = async () => {
    if (!org) return;
    try {
      await updateOrg.mutateAsync({
        id: org.id,
        srn: srn || undefined,
        prrcName: prrcName || undefined,
        prrcQualification: prrcQualification || undefined,
        notifiedBodyName: notifiedBodyName || undefined,
        notifiedBodyNumber: notifiedBodyNumber || undefined,
      });
      await refetchOrgs();
      toast.success("Profil réglementaire mis à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour du profil réglementaire");
    }
  };

  const handleAddCert = async () => {
    if (!org || !newCertNumber.trim()) return;
    try {
      await upsertCert.mutateAsync({
        organisationId: org.id,
        referentialCode: newCertReferential || undefined,
        certificateNumber: newCertNumber.trim(),
      });
      setNewCertReferential("");
      setNewCertNumber("");
      await refetchCerts();
      toast.success("Certificat ajouté");
    } catch {
      toast.error("Erreur lors de l'ajout du certificat");
    }
  };

  const handleDeleteCert = async (id: number) => {
    if (!org) return;
    try {
      await deleteCert.mutateAsync({ id, organisationId: org.id });
      await refetchCerts();
    } catch {
      toast.error("Erreur lors de la suppression du certificat");
    }
  };

  if (!org) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profil réglementaire</CardTitle>
          <CardDescription>
            Identité réglementaire de votre organisation (SRN, PRRC, organisme notifié, certificats) —
            alimente le rapport d'audit. Créez d'abord votre organisation.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="Nom de l'organisation"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
          />
          <Button onClick={handleCreateOrg} disabled={!newOrgName.trim() || createOrg.isPending}>
            Créer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Profil réglementaire</CardTitle>
        <CardDescription>
          {org.name} — facultatif, "Non renseigné" dans le rapport si absent. Alimente la page de garde
          et la section 2 (profil réglementaire) du rapport d'audit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="srn">SRN (Single Registration Number, MDR/IVDR Art. 31)</Label>
          <Input id="srn" className="mt-1" value={srn} onChange={(e) => setSrn(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="prrcName">PRRC — nom (Art. 15 MDR)</Label>
            <Input id="prrcName" className="mt-1" value={prrcName} onChange={(e) => setPrrcName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="prrcQualification">PRRC — qualification</Label>
            <Input
              id="prrcQualification"
              className="mt-1"
              value={prrcQualification}
              onChange={(e) => setPrrcQualification(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="notifiedBodyName">Organisme notifié — nom</Label>
            <Input
              id="notifiedBodyName"
              className="mt-1"
              value={notifiedBodyName}
              onChange={(e) => setNotifiedBodyName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="notifiedBodyNumber">Organisme notifié — numéro</Label>
            <Input
              id="notifiedBodyNumber"
              className="mt-1"
              value={notifiedBodyNumber}
              onChange={(e) => setNotifiedBodyNumber(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleSaveRegulatory} disabled={updateOrg.isPending}>
          {updateOrg.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Enregistrer
        </Button>

        <div className="pt-4 border-t">
          <Label className="mb-2 block">Certificats en cours</Label>
          {(certsData?.certificates ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground mb-2">Aucun certificat renseigné.</p>
          )}
          <div className="space-y-2 mb-3">
            {(certsData?.certificates ?? []).map((cert: any) => (
              <div key={cert.id} className="flex items-center justify-between text-sm border rounded p-2">
                <span>
                  {cert.referentialCode || "Référentiel non renseigné"} — {cert.certificateNumber}
                </span>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteCert(cert.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Référentiel (ex. ISO 13485)"
              value={newCertReferential}
              onChange={(e) => setNewCertReferential(e.target.value)}
            />
            <Input
              placeholder="Numéro de certificat"
              value={newCertNumber}
              onChange={(e) => setNewCertNumber(e.target.value)}
            />
            <Button variant="outline" onClick={handleAddCert} disabled={!newCertNumber.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Profile() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { data: profile, refetch } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  const updateProfile = trpc.profile.update.useMutation();
  const exportData = trpc.users.exportMyData.useQuery(undefined, { enabled: false });
  const deleteAccount = trpc.users.deleteMyAccount.useMutation();

  const [economicRole, setEconomicRole] = useState<string>("");
  const [companyName, setCompanyName] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    if (profile) {
      setEconomicRole(profile.economicRole || "");
      setCompanyName(profile.companyName || "");
    }
  }, [profile]);

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

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        economicRole: economicRole as any,
        companyName: companyName || undefined,
      });
      await refetch();
      toast.success("Profil mis à jour avec succès");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du profil");
    }
  };

  const handleExport = async () => {
    try {
      const result = await exportData.refetch();
      if (!result.data) throw new Error("Export vide");
      const url = URL.createObjectURL(new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `qara-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Export de vos données téléchargé");
    } catch { toast.error("Impossible de générer l'export"); }
  };

  // Confirmation via modale applicative (AlertDialog) — le window.prompt()
  // natif n'était pas stylé et levait une exception non catchée dans les
  // environnements où prompt() est indisponible (rapport QA 2026-09-02, IMP-7).
  const handleConfirmDelete = async () => {
    if (deleteConfirmText.trim() !== "SUPPRIMER") return;
    try {
      await deleteAccount.mutateAsync({ confirmation: "SUPPRIMER" });
      toast.success("Votre compte a été anonymisé");
      setDeleteDialogOpen(false);
      window.location.assign("/");
    } catch { toast.error("La suppression du compte a échoué"); }
  };

  return (
    <div>
      <main className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Mon Profil</h1>

        {/* User Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informations Utilisateur</CardTitle>
            <CardDescription>Informations de votre compte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nom</Label>
              <Input value={user?.name || ""} disabled className="mt-1" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="mt-1" />
            </div>
          </CardContent>
        </Card>

        {/* Economic Role Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Rôle Économique</CardTitle>
            <CardDescription>
              Sélectionnez votre rôle pour accéder aux questions d'audit adaptées
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="economicRole">Rôle économique *</Label>
              <Select value={economicRole} onValueChange={setEconomicRole}>
                <SelectTrigger id="economicRole" className="mt-1">
                  <SelectValue placeholder="Sélectionnez votre rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fabricant">Fabricant</SelectItem>
                  <SelectItem value="importateur">Importateur</SelectItem>
                  <SelectItem value="distributeur">Distributeur</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-2">
                {economicRole === "fabricant" && "Vous concevez, fabriquez ou remettez à neuf des dispositifs médicaux"}
                {economicRole === "importateur" && "Vous mettez sur le marché UE des dispositifs d'un fabricant hors UE"}
                {economicRole === "distributeur" && "Vous mettez à disposition des dispositifs déjà sur le marché UE"}
              </p>
            </div>

            <div>
              <Label htmlFor="companyName">Nom de l'entreprise (optionnel)</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Votre entreprise"
                className="mt-1"
              />
            </div>

            <Button 
              onClick={handleSave} 
              disabled={!economicRole || updateProfile.isPending}
              className="w-full"
            >
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <RegulatoryProfileCard />

        {/* Subscription Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Abonnement</CardTitle>
            <CardDescription>Votre plan actuel et ses fonctionnalités</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-lg">
                  Plan {profile?.subscriptionTier?.toUpperCase() || "FREE"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {profile?.subscriptionTier === "free" && "Accès limité aux fonctionnalités de base"}
                  {profile?.subscriptionTier === "pro" && "Accès complet aux audits et rapports"}
                  {profile?.subscriptionTier === "expert" && "IA contextuelle + exports avancés"}
                  {profile?.subscriptionTier === "entreprise" && "Solution complète avec support prioritaire"}
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full" disabled>
              Gérer l'abonnement (Prochainement)
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Mes données et confidentialité</CardTitle>
            <CardDescription>Exercez vos droits à la portabilité et à l'effacement.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" onClick={handleExport} disabled={exportData.isFetching} className="w-full">
              {exportData.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Télécharger mes données
            </Button>
            <Button
              variant="destructive"
              onClick={() => { setDeleteConfirmText(""); setDeleteDialogOpen(true); }}
              disabled={deleteAccount.isPending}
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Supprimer mon compte
            </Button>
            <p className="text-xs text-muted-foreground">La suppression anonymise vos données personnelles. Les audits nécessaires à la traçabilité réglementaire sont conservés.</p>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action anonymise définitivement vos données personnelles. Les audits
                    nécessaires à la traçabilité réglementaire sont conservés. Pour confirmer,
                    saisissez <strong>SUPPRIMER</strong> ci-dessous.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="SUPPRIMER"
                  autoFocus
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => { e.preventDefault(); void handleConfirmDelete(); }}
                    disabled={deleteConfirmText.trim() !== "SUPPRIMER" || deleteAccount.isPending}
                  >
                    {deleteAccount.isPending ? "Suppression…" : "Supprimer définitivement"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card>
          <CardHeader>
            <CardTitle>Déconnexion</CardTitle>
            <CardDescription>Se déconnecter de votre compte</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => logout()} className="w-full">
              Se déconnecter
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
