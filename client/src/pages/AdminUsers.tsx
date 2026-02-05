import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Users, 
  Shield, 
  CreditCard, 
  RefreshCw,
  UserCheck,
  UserCog
} from "lucide-react";

export default function AdminUsers() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();

  const { data: users, isLoading, refetch } = trpc.system.listUsers.useQuery(undefined, {
    enabled: currentUser?.role === "admin"
  });
  
  const updateRoleMutation = trpc.system.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("Rôle mis à jour");
      refetch();
    }
  });

  const updateProfileMutation = trpc.system.updateUserProfile.useMutation({
    onSuccess: () => {
      toast.success("Abonnement mis à jour");
      refetch();
    }
  });

  if (currentUser && currentUser.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Accès refusé</CardTitle>
              <CardDescription>
                Cette page est réservée aux administrateurs.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
            <p className="text-muted-foreground">
              Gérez les rôles et les niveaux d'abonnement de vos utilisateurs.
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs ({users?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle Système</TableHead>
                  <TableHead>Abonnement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{u.name}</span>
                        <span className="text-xs text-muted-foreground">{u.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={u.role}
                        onValueChange={(val) => updateRoleMutation.mutate({ userId: u.id, role: val as any })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Utilisateur</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={u.profile?.subscriptionTier || "free"}
                        onValueChange={(val) => updateProfileMutation.mutate({ userId: u.id, subscriptionTier: val as any })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Gratuit</SelectItem>
                          <SelectItem value="pro">PRO</SelectItem>
                          <SelectItem value="expert">EXPERT</SelectItem>
                          <SelectItem value="entreprise">ENTREPRISE</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.profile?.subscriptionStatus === "active" ? "default" : "secondary"}>
                        {u.profile?.subscriptionStatus || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString() : "Jamais"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
