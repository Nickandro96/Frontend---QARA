import { UpgradeRequired } from "@/components/UpgradeRequired";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FileText, CheckCircle2, AlertCircle, XCircle, Download, Sparkles, ArrowLeft, Loader2, List, Lightbulb } from "lucide-react";
import { useLocation } from "wouter";

export default function Documents() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Filters
  const [selectedReferential, setSelectedReferential] = useState<number | undefined>();
  const [selectedProcess, setSelectedProcess] = useState<number | undefined>();
  const [selectedRole, setSelectedRole] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  
  // Selected document for detail view
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [showAI, setShowAI] = useState(false);
  
  // Fetch data
  const { data: referentials } = trpc.referentials.list.useQuery();
  const { data: processes } = trpc.processes.list.useQuery();
  const { data: documents } = trpc.documents.getAll.useQuery({
    referentialId: selectedReferential,
    processId: selectedProcess,
    role: selectedRole,
    status: selectedStatus,
  });
  const { data: stats } = trpc.documents.getStats.useQuery({ role: selectedRole });
  const { data: selectedDocument } = trpc.documents.getById.useQuery(
    { documentId: selectedDocumentId! },
    { enabled: selectedDocumentId !== null }
  );
  const { data: documentStatus } = trpc.documents.getUserStatus.useQuery(
    { documentId: selectedDocumentId! },
    { enabled: selectedDocumentId !== null }
  );
  
  const updateStatusMutation = trpc.documents.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Statut mis à jour avec succès !");
      trpc.useUtils().documents.getAll.invalidate();
      trpc.useUtils().documents.getStats.invalidate();
      trpc.useUtils().documents.getUserStatus.invalidate();
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });
  
  const handleStatusChange = (status: "manquant" | "a_mettre_a_jour" | "conforme") => {
    if (!selectedDocumentId) return;
    
    updateStatusMutation.mutate({
      documentId: selectedDocumentId,
      status,
    });
  };
  
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "conforme":
        return "bg-green-100 text-green-800 border-green-300";
      case "a_mettre_a_jour":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "manquant":
      default:
        return "bg-red-100 text-red-800 border-red-300";
    }
  };
  
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "conforme":
        return <CheckCircle2 className="w-4 h-4" />;
      case "a_mettre_a_jour":
        return <AlertCircle className="w-4 h-4" />;
      case "manquant":
      default:
        return <XCircle className="w-4 h-4" />;
    }
  };
  
  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "conforme":
        return "Conforme";
      case "a_mettre_a_jour":
        return "À mettre à jour";
      case "manquant":
      default:
        return "Manquant";
    }
  };
  
  const getReferentialName = (id: number) => {
    return referentials?.find((r: any) => r.id === id)?.name || "";
  };
  
  const getProcessName = (id?: number | null) => {
    if (!id) return "Tous processus";
    return processes?.find((p: any) => p.id === id)?.name || "";
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Documents Obligatoires</h1>
          <p className="text-slate-600 mt-2">
            Bibliothèque de conformité documentaire MDR & ISO
          </p>
        </div>
      </div>
      
      {/* Stats Bar */}
      {stats && (
        <div className="bg-white border-b">
          <div className="container mx-auto py-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Conformes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">{stats.conforme}</div>
                </CardContent>
              </Card>
              
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700">À mettre à jour</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-700">{stats.a_mettre_a_jour}</div>
                </CardContent>
              </Card>
              
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-700">Manquants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-700">{stats.manquant}</div>
                </CardContent>
              </Card>
              
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">Conformité</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700">{stats.percentage}%</div>
                  <Progress value={stats.percentage} className="mt-2" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
            <CardDescription>Filtrez les documents par référentiel, processus, rôle et statut</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Référentiel</label>
                <Select
                  value={selectedReferential?.toString() || "all"}
                  onValueChange={(value) => setSelectedReferential(value === "all" ? undefined : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les référentiels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les référentiels</SelectItem>
                    {referentials?.map((ref: any) => (
                      <SelectItem key={ref.id} value={ref.id.toString()}>
                        {ref.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Processus</label>
                <Select
                  value={selectedProcess?.toString() || "all"}
                  onValueChange={(value) => setSelectedProcess(value === "all" ? undefined : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les processus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les processus</SelectItem>
                    {processes?.map((proc: any) => (
                      <SelectItem key={proc.id} value={proc.id.toString()}>
                        {proc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Rôle</label>
                <Select
                  value={selectedRole || "all"}
                  onValueChange={(value) => setSelectedRole(value === "all" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les rôles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    <SelectItem value="fabricant">Fabricant</SelectItem>
                    <SelectItem value="importateur">Importateur</SelectItem>
                    <SelectItem value="distributeur">Distributeur</SelectItem>
                    <SelectItem value="tous">Tous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Statut</label>
                <Select
                  value={selectedStatus || "all"}
                  onValueChange={(value) => setSelectedStatus(value === "all" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="conforme">Conforme</SelectItem>
                    <SelectItem value="a_mettre_a_jour">À mettre à jour</SelectItem>
                    <SelectItem value="manquant">Manquant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Documents Grid */}
      <div className="container mx-auto pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents?.map((doc) => {
            const status = documentStatus?.status || "manquant";
            
            return (
              <Card
                key={doc.id}
                className={`cursor-pointer hover:shadow-lg transition-shadow ${getStatusColor(status)}`}
                onClick={() => setSelectedDocumentId(doc.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FileText className="w-8 h-8 text-slate-600" />
                    <Badge variant="outline" className={getStatusColor(status)}>
                      {getStatusIcon(status)}
                      <span className="ml-1">{getStatusLabel(status)}</span>
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-4">{doc.documentName}</CardTitle>
                  <CardDescription>
                    {getReferentialName(doc.referentialId)} - {doc.reference}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Processus:</span>
                      <span className="font-medium">{getProcessName(doc.processId)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Rôle:</span>
                      <span className="font-medium capitalize">{doc.role}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Statut:</span>
                      <Badge variant="outline" className="text-xs">
                        {doc.status === "obligatoire" && "Obligatoire"}
                        {doc.status === "conditionnel" && "Conditionnel"}
                        {doc.status === "attendu" && "Attendu"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {documents?.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Aucun document trouvé avec ces filtres</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Document Detail Dialog */}
      <Dialog open={selectedDocumentId !== null} onOpenChange={(open) => !open && setSelectedDocumentId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedDocument && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedDocument.documentName}</DialogTitle>
                <DialogDescription>
                  {getReferentialName(selectedDocument.referentialId)} - {selectedDocument.reference}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Status Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Statut du document</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant={documentStatus?.status === "manquant" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusChange("manquant")}
                        disabled={updateStatusMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Manquant
                      </Button>
                      <Button
                        variant={documentStatus?.status === "a_mettre_a_jour" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusChange("a_mettre_a_jour")}
                        disabled={updateStatusMutation.isPending}
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        À mettre à jour
                      </Button>
                      <Button
                        variant={documentStatus?.status === "conforme" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusChange("conforme")}
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Conforme
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Document Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Objectif du document</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700">{selectedDocument.objective}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contenu minimum attendu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 whitespace-pre-line">{selectedDocument.minimumContent}</p>
                  </CardContent>
                </Card>
                
                {selectedDocument.auditorExpectations && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Attentes de l'auditeur</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-700">{selectedDocument.auditorExpectations}</p>
                    </CardContent>
                  </Card>
                )}
                
                {selectedDocument.commonErrors && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Erreurs fréquentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-700">{selectedDocument.commonErrors}</p>
                    </CardContent>
                  </Card>
                )}
                
                {/* AI Assistant */}
                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      Assistant IA Documentaire
                    </CardTitle>
                    <CardDescription>
                      Obtenez de l'aide pour créer et valider ce document
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button 
                        variant={showAI ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setShowAI(!showAI)}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {showAI ? "Masquer l'IA" : "Activer l'IA"}
                      </Button>
                    </div>
                    
                    {showAI && selectedDocumentId && (
                      <DocumentAIPanel documentId={selectedDocumentId} />
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Composant IA Panel
function DocumentAIPanel({ documentId }: { documentId: number }) {
  const { data: aiResponse, isLoading } = trpc.documents.explainDocument.useQuery({ documentId });
  const { data: coherenceCheck } = trpc.documents.checkCoherence.useQuery({ documentId });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        <span className="ml-2 text-slate-600">Génération de l'analyse IA...</span>
      </div>
    );
  }
  
  if (!aiResponse) return null;
  
  return (
    <div className="mt-4 space-y-4">
      {/* Explication */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Explication détaillée
        </h4>
        <div className="text-sm text-slate-700 whitespace-pre-line">
          {aiResponse.explanation}
        </div>
      </div>
      
      {/* Structure idéale */}
      {aiResponse.idealStructure && (
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <List className="w-4 h-4" />
            Structure idéale
          </h4>
          <div className="text-sm text-slate-700 whitespace-pre-line">
            {aiResponse.idealStructure}
          </div>
        </div>
      )}
      
      {/* Modèle personnalisé */}
      {aiResponse.template && (
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Modèle personnalisé
          </h4>
          <div className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded font-mono">
            {aiResponse.template}
          </div>
          <Button size="sm" className="mt-2" onClick={() => {
            const blob = new Blob([aiResponse.template], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `modele_document_${documentId}.md`;
            a.click();
          }}>
            <Download className="w-4 h-4 mr-2" />
            Télécharger le modèle
          </Button>
        </div>
      )}
      
      {/* Vérification de cohérence */}
      {coherenceCheck && (
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Vérification de cohérence
          </h4>
          <div className="text-sm text-slate-700 whitespace-pre-line">
            {coherenceCheck}
          </div>
        </div>
      )}
      
      {/* Recommandations */}
      {aiResponse.recommendations && aiResponse.recommendations.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Recommandations
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
            {aiResponse.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


