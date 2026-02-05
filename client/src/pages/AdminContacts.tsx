import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { 
  Mail, 
  MailOpen, 
  Reply, 
  Archive, 
  MoreHorizontal,
  Eye,
  Building2,
  Calendar,
  User,
  MessageSquare,
  RefreshCw,
  Inbox
} from "lucide-react";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  company: string | null;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  createdAt: Date;
  userId: number | null;
}

export default function AdminContacts() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: messages, isLoading, refetch } = trpc.contact.list.useQuery({});
  
  const updateStatusMutation = trpc.contact.updateStatus.useMutation({
    onSuccess: () => {
      toast.success(t('admin.contacts.statusUpdated', 'Statut mis à jour'));
      refetch();
    },
    onError: () => {
      toast.error(t('admin.contacts.statusError', 'Erreur lors de la mise à jour'));
    },
  });

  // Redirect non-admin users
  if (user && user.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>{t('admin.accessDenied', 'Accès refusé')}</CardTitle>
              <CardDescription>
                {t('admin.accessDeniedDesc', 'Cette page est réservée aux administrateurs.')}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      new: { label: t('admin.contacts.status.new', 'Nouveau'), variant: "default" },
      read: { label: t('admin.contacts.status.read', 'Lu'), variant: "secondary" },
      replied: { label: t('admin.contacts.status.replied', 'Répondu'), variant: "outline" },
      archived: { label: t('admin.contacts.status.archived', 'Archivé'), variant: "destructive" },
    };
    const config = statusConfig[status] || statusConfig.new;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSubjectLabel = (subject: string) => {
    const subjectLabels: Record<string, string> = {
      demo: t('contact.subjects.demo', 'Demande de démonstration'),
      pricing: t('contact.subjects.pricing', 'Questions sur les tarifs'),
      support: t('contact.subjects.technical', 'Support technique'),
      partnership: t('contact.subjects.partnership', 'Partenariat'),
      other: t('contact.subjects.other', 'Autre'),
    };
    return subjectLabels[subject] || subject;
  };

  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsDialogOpen(true);
    
    // Mark as read if new
    if (message.status === "new") {
      updateStatusMutation.mutate({ id: message.id, status: "read" });
    }
  };

  const handleUpdateStatus = (id: number, status: "new" | "read" | "replied" | "archived") => {
    updateStatusMutation.mutate({ id, status });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const newMessagesCount = messages?.filter(m => m.status === "new").length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('admin.contacts.title', 'Messages de contact')}
            </h1>
            <p className="text-muted-foreground">
              {t('admin.contacts.subtitle', 'Gérez les demandes reçues via le formulaire de contact')}
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.refresh', 'Actualiser')}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('admin.contacts.totalMessages', 'Total messages')}
              </CardTitle>
              <Inbox className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{messages?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('admin.contacts.newMessages', 'Nouveaux')}
              </CardTitle>
              <Mail className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{newMessagesCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('admin.contacts.readMessages', 'Lus')}
              </CardTitle>
              <MailOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {messages?.filter(m => m.status === "read").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('admin.contacts.repliedMessages', 'Répondus')}
              </CardTitle>
              <Reply className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {messages?.filter(m => m.status === "replied").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.contacts.messagesList', 'Liste des messages')}</CardTitle>
            <CardDescription>
              {t('admin.contacts.messagesListDesc', 'Cliquez sur un message pour voir les détails')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages && messages.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.contacts.columns.status', 'Statut')}</TableHead>
                    <TableHead>{t('admin.contacts.columns.name', 'Nom')}</TableHead>
                    <TableHead>{t('admin.contacts.columns.email', 'Email')}</TableHead>
                    <TableHead>{t('admin.contacts.columns.company', 'Entreprise')}</TableHead>
                    <TableHead>{t('admin.contacts.columns.subject', 'Sujet')}</TableHead>
                    <TableHead>{t('admin.contacts.columns.date', 'Date')}</TableHead>
                    <TableHead className="text-right">{t('admin.contacts.columns.actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((message) => (
                    <TableRow 
                      key={message.id} 
                      className={message.status === "new" ? "bg-blue-50/50" : ""}
                    >
                      <TableCell>{getStatusBadge(message.status)}</TableCell>
                      <TableCell className="font-medium">{message.name}</TableCell>
                      <TableCell>
                        <a href={`mailto:${message.email}`} className="text-primary hover:underline">
                          {message.email}
                        </a>
                      </TableCell>
                      <TableCell>{message.company || "-"}</TableCell>
                      <TableCell>{getSubjectLabel(message.subject)}</TableCell>
                      <TableCell>{formatDate(message.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewMessage(message as ContactMessage)}>
                              <Eye className="h-4 w-4 mr-2" />
                              {t('admin.contacts.actions.view', 'Voir le message')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(message.id, "read")}>
                              <MailOpen className="h-4 w-4 mr-2" />
                              {t('admin.contacts.actions.markRead', 'Marquer comme lu')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(message.id, "replied")}>
                              <Reply className="h-4 w-4 mr-2" />
                              {t('admin.contacts.actions.markReplied', 'Marquer comme répondu')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(message.id, "archived")}>
                              <Archive className="h-4 w-4 mr-2" />
                              {t('admin.contacts.actions.archive', 'Archiver')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">
                  {t('admin.contacts.noMessages', 'Aucun message')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('admin.contacts.noMessagesDesc', 'Les messages de contact apparaîtront ici')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {t('admin.contacts.messageDetail', 'Détail du message')}
              </DialogTitle>
              <DialogDescription>
                {selectedMessage && formatDate(selectedMessage.createdAt)}
              </DialogDescription>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('contact.name', 'Nom')}</p>
                      <p className="font-medium">{selectedMessage.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('contact.email', 'Email')}</p>
                      <a href={`mailto:${selectedMessage.email}`} className="font-medium text-primary hover:underline">
                        {selectedMessage.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('contact.company', 'Entreprise')}</p>
                      <p className="font-medium">{selectedMessage.company || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('contact.subject', 'Sujet')}</p>
                      <p className="font-medium">{getSubjectLabel(selectedMessage.subject)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">{t('contact.message', 'Message')}</p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{t('admin.contacts.columns.status', 'Statut')}:</span>
                    {getStatusBadge(selectedMessage.status)}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedMessage.id, "replied")}
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      {t('admin.contacts.actions.markReplied', 'Marquer comme répondu')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedMessage.id, "archived")}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      {t('admin.contacts.actions.archive', 'Archiver')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
