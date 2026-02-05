import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Shield, Loader2, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function Profile() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { data: profile, refetch } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  const updateProfile = trpc.profile.update.useMutation();

  const [economicRole, setEconomicRole] = useState<string>("");
  const [companyName, setCompanyName] = useState("");

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <Shield className="h-6 w-6 text-primary" />
                <span className="font-bold">MDR Compliance</span>
              </div>
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/audit">
                <Button variant="ghost">Audit</Button>
              </Link>
              <Link href="/reports">
                <Button variant="ghost">Rapports</Button>
              </Link>
              <Link href="/regulatory-watch">
                <Button variant="ghost">Veille</Button>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="outline">{user?.name || "Profil"}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-2xl">
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
