/**
 * Audit History Page
 * Lists all audits created by the user with filters and actions
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, Download, Trash2, Play, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
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

const STATUS_CONFIG = {
  draft: { label: "Brouillon", icon: Clock, color: "bg-gray-100 text-gray-800" },
  in_progress: { label: "En cours", icon: Play, color: "bg-blue-100 text-blue-800" },
  completed: { label: "Terminé", icon: CheckCircle2, color: "bg-green-100 text-green-800" },
  closed: { label: "Clôturé", icon: AlertCircle, color: "bg-purple-100 text-purple-800" },
};

export default function AuditHistory() {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteAuditId, setDeleteAuditId] = useState<number | null>(null);

  const { data: audits, isLoading, refetch } = trpc.audit.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter as any,
  });

  const deleteAudit = trpc.audit.delete.useMutation({
    onSuccess: () => {
      toast.success("Audit supprimé");
      refetch();
      setDeleteAuditId(null);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleResumeAudit = (audit: any) => {
    // Determine audit type and navigate to appropriate page
    const referentialIds = audit.referentialIds ? JSON.parse(audit.referentialIds) : [];
    
    if (referentialIds.includes(2)) {
      // ISO 9001
      setLocation(`/iso/audit?auditId=${audit.id}`);
    } else if (referentialIds.includes(3)) {
      // ISO 13485
      setLocation(`/iso/audit?auditId=${audit.id}`);
    } else if (referentialIds.includes(1)) {
      // MDR
      setLocation(`/mdr/audit?auditId=${audit.id}`);
    } else {
      toast.error("Type d'audit non reconnu");
    }
  };

  const handleViewResults = (auditId: number) => {
    setLocation(`/audit/${auditId}/results`);
  };

  const handleDownloadReport = async (auditId: number) => {
    toast.info("Génération du rapport en cours...");
    // TODO: Implement PDF generation
    setTimeout(() => {
      toast.success("Rapport téléchargé");
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredAudits = audits || [];

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Historique des Audits</h1>
          <p className="text-muted-foreground mt-2">
            Consultez et gérez tous vos audits de conformité
          </p>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="completed">Terminé</SelectItem>
            <SelectItem value="closed">Clôturé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredAudits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun audit trouvé</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Commencez un nouvel audit ISO, MDR ou FDA pour le voir apparaître ici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAudits.map((audit) => {
            const StatusIcon = STATUS_CONFIG[audit.status as keyof typeof STATUS_CONFIG].icon;
            const statusConfig = STATUS_CONFIG[audit.status as keyof typeof STATUS_CONFIG];

            return (
              <Card key={audit.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{audit.name}</CardTitle>
                      <CardDescription className="mt-2 space-y-1">
                        {audit.auditorName && (
                          <div>Auditeur : {audit.auditorName}</div>
                        )}
                        {audit.startDate && (
                          <div>
                            Créé le {new Date(audit.createdAt).toLocaleDateString("fr-FR")}
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    <Badge className={statusConfig.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {audit.conformityRate && (
                        <div>
                          Conformité : <span className="font-semibold text-foreground">{audit.conformityRate}%</span>
                        </div>
                      )}
                      {audit.score && (
                        <div>
                          Score : <span className="font-semibold text-foreground">{audit.score}/100</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {audit.status === "completed" || audit.status === "closed" ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewResults(audit.id)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Voir les résultats
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReport(audit.id)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger PDF
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleResumeAudit(audit)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Reprendre
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteAuditId(audit.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={deleteAuditId !== null} onOpenChange={() => setDeleteAuditId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet audit ? Cette action est irréversible et supprimera toutes les réponses associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAuditId && deleteAudit.mutate({ auditId: deleteAuditId })}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
