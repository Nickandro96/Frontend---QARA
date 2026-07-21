import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  ClipboardCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  Calendar,
  User,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function ActionDashboard() {
  const { user } = useAuth();
  const { data: myActions, isLoading } = trpc.actions.listMine.useQuery();

  const actions = myActions ?? [];
  const totalActions = actions.length;
  const completedActions = actions.filter((a: any) => a.status === "Completed").length;
  const overdueActions = actions.filter(
    (a: any) => a.status !== "Completed" && a.dueDate && new Date(a.dueDate) < new Date()
  ).length;

  const getStatusBadge = (action: any) => {
    const isOverdue = action.status !== "Completed" && action.dueDate && new Date(action.dueDate) < new Date();
    if (action.status === "Completed") return <Badge className="bg-green-100 text-green-800">Terminée</Badge>;
    if (isOverdue) return <Badge className="bg-red-100 text-red-800">En retard</Badge>;
    if (action.status === "InProgress") return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">Planifiée</Badge>;
  };

  return (
    <div>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Plan d'action, {user?.name || user?.email}
          </h1>
          <p className="text-text-secondary text-lg">
            Actions correctives et préventives issues de vos audits
          </p>
        </div>

        {isLoading ? (
          <Card className="p-8 text-center text-muted-foreground">Chargement…</Card>
        ) : totalActions === 0 ? (
          <Card className="p-8 text-center space-y-4">
            <ClipboardCheck className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              Aucune action pour le moment — les actions issues de vos audits apparaîtront ici.
            </p>
            <Link href="/audits">
              <Button className="gap-2">
                Voir mes audits
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <ClipboardCheck className="w-6 h-6 text-blue-500" />
                  <span className="text-3xl font-bold">{totalActions}</span>
                </div>
                <p className="text-sm text-muted-foreground">Total des actions</p>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <ClipboardCheck className="w-6 h-6 text-green-500" />
                  <span className="text-3xl font-bold">{completedActions}</span>
                </div>
                <p className="text-sm text-muted-foreground">Terminées</p>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  <span className="text-3xl font-bold">{overdueActions}</span>
                </div>
                <p className="text-sm text-muted-foreground">En retard</p>
              </Card>
            </div>

            <div className="space-y-3">
              {actions.map((action: any) => (
                <Card key={action.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(action)}
                        {action.dueDate && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(action.dueDate).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold mb-1">{action.title}</h4>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                      {action.responsible && (
                        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Responsable: {action.responsible}
                        </p>
                      )}
                      {action.auditName && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Issu de l'audit : {action.auditName}
                        </p>
                      )}
                    </div>
                    {action.auditId && (
                      <Link href={`/audits/${action.auditId}`}>
                        <Button variant="ghost" size="sm" className="gap-2">
                          Voir l'audit
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
