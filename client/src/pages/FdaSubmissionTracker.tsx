import { UpgradeRequired } from "@/components/UpgradeRequired";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, CheckCircle2, AlertCircle, FileText } from "lucide-react";

type SubmissionType = "510k" | "de_novo" | "pma" | "pma_supplement" | "ide";
type SubmissionStatus = "planning" | "preparation" | "submitted" | "under_review" | "additional_info_requested" | "approved" | "denied";

interface Submission {
  id: number;
  deviceName: string;
  submissionType: SubmissionType;
  submissionNumber?: string;
  fdaClassification?: "class_i" | "class_ii" | "class_iii";
  status: SubmissionStatus;
  submissionDate?: Date;
  targetSubmissionDate?: Date;
  fdaReviewDeadline?: Date;
  approvalDate?: Date;
  notes?: string;
}

const submissionTypeLabels: Record<SubmissionType, string> = {
  "510k": "510(k) Premarket Notification",
  "de_novo": "De Novo Classification",
  "pma": "Premarket Approval (PMA)",
  "pma_supplement": "PMA Supplement",
  "ide": "Investigational Device Exemption (IDE)"
};

const statusLabels: Record<SubmissionStatus, string> = {
  "planning": "Planification",
  "preparation": "Préparation",
  "submitted": "Soumis",
  "under_review": "En cours d'examen",
  "additional_info_requested": "Informations complémentaires demandées",
  "approved": "Approuvé",
  "denied": "Refusé"
};

const statusColors: Record<SubmissionStatus, string> = {
  "planning": "bg-slate-100 text-slate-700",
  "preparation": "bg-blue-100 text-blue-700",
  "submitted": "bg-purple-100 text-purple-700",
  "under_review": "bg-amber-100 text-amber-700",
  "additional_info_requested": "bg-orange-100 text-orange-700",
  "approved": "bg-green-100 text-green-700",
  "denied": "bg-red-100 text-red-700"
};

// FDA review times (average in days)
const reviewTimes: Record<SubmissionType, number> = {
  "510k": 90, // 3 months
  "de_novo": 150, // 5 months
  "pma": 180, // 6 months
  "pma_supplement": 90,
  "ide": 30
};

// Required documents by submission type
const requiredDocuments: Record<SubmissionType, string[]> = {
  "510k": [
    "Cover Letter",
    "510(k) Summary or Statement",
    "Indications for Use",
    "Substantial Equivalence Discussion",
    "Device Description",
    "Performance Data (Testing)",
    "Software Documentation (if applicable)",
    "Biocompatibility Data",
    "Sterilization Validation",
    "Labeling"
  ],
  "de_novo": [
    "Cover Letter",
    "Device Description",
    "Proposed Classification",
    "Risk Analysis (ISO 14971)",
    "Performance Data",
    "Clinical Data (if required)",
    "Proposed Special Controls",
    "Labeling",
    "Quality System Information"
  ],
  "pma": [
    "Cover Letter",
    "Table of Contents",
    "Summary",
    "Complete Device Description",
    "Reference to Performance Standards",
    "Non-clinical Laboratory Studies",
    "Clinical Investigations",
    "Justification for Single Investigator",
    "Bibliography",
    "Sample of Device",
    "Proposed Labeling",
    "Environmental Assessment",
    "Other (Financial Disclosure, etc.)"
  ],
  "pma_supplement": [
    "Cover Letter",
    "Description of Change",
    "Justification for Supplement Type",
    "Supporting Data",
    "Updated Labeling (if applicable)"
  ],
  "ide": [
    "Cover Letter",
    "Name and Address of Sponsor",
    "Report of Prior Investigations",
    "Investigational Plan",
    "Description of Device",
    "Monitoring Procedures",
    "Labeling",
    "Informed Consent Materials",
    "IRB Information",
    "Other Institutional Commitments"
  ]
};

export default function FdaSubmissionTracker() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [submissions] = useState<Submission[]>([]);
  
  // Mock data for demonstration
  const mockSubmissions: Submission[] = [
    {
      id: 1,
      deviceName: "CardioMonitor Pro",
      submissionType: "510k",
      submissionNumber: "K240123",
      fdaClassification: "class_ii",
      status: "under_review",
      submissionDate: new Date("2024-01-15"),
      targetSubmissionDate: new Date("2024-01-10"),
      fdaReviewDeadline: new Date("2024-04-15"),
      notes: "Predicate: K193456 - Similar ECG monitoring device"
    },
    {
      id: 2,
      deviceName: "AI Diagnostic Assistant",
      submissionType: "de_novo",
      fdaClassification: "class_ii",
      status: "preparation",
      targetSubmissionDate: new Date("2024-03-01"),
      notes: "Novel AI-based diagnostic tool, no predicate available"
    }
  ];
  
  const allSubmissions = [...mockSubmissions, ...submissions];
  
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(
    allSubmissions.length > 0 ? allSubmissions[0] : null
  );
  
  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FDA Submission Tracker</h1>
          <p className="text-muted-foreground mt-2">
            Suivez vos soumissions 510(k), De Novo, PMA et IDE auprès de la FDA
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle soumission
        </Button>
      </div>
      
      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle soumission FDA</CardTitle>
            <CardDescription>
              Créez un nouveau dossier de soumission pour suivre votre progression
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deviceName">Nom du dispositif</Label>
                <Input id="deviceName" placeholder="Ex: CardioMonitor Pro" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="submissionType">Type de soumission</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(submissionTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fdaClassification">Classification FDA</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class_i">Class I</SelectItem>
                    <SelectItem value="class_ii">Class II</SelectItem>
                    <SelectItem value="class_iii">Class III</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="targetDate">Date de soumission cible</Label>
                <Input id="targetDate" type="date" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Informations complémentaires, predicate device, etc." rows={3} />
            </div>
            
            <div className="flex gap-2">
              <Button>Créer la soumission</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Submissions List */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Submissions Timeline */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Soumissions actives</CardTitle>
              <CardDescription>{allSubmissions.length} soumissions en cours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {allSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedSubmission?.id === submission.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold text-sm">{submission.deviceName}</div>
                    <Badge className={statusColors[submission.status]} variant="secondary">
                      {statusLabels[submission.status]}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {submissionTypeLabels[submission.submissionType]}
                  </div>
                  {submission.submissionNumber && (
                    <div className="text-xs text-muted-foreground mt-1">
                      #{submission.submissionNumber}
                    </div>
                  )}
                </div>
              ))}
              
              {allSubmissions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune soumission en cours</p>
                  <p className="text-sm mt-2">Créez votre première soumission FDA</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right: Submission Details */}
        {selectedSubmission && (
          <div className="lg:col-span-2 space-y-4">
            {/* Status & Timeline */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedSubmission.deviceName}</CardTitle>
                    <CardDescription>
                      {submissionTypeLabels[selectedSubmission.submissionType]}
                      {selectedSubmission.submissionNumber && ` • ${selectedSubmission.submissionNumber}`}
                    </CardDescription>
                  </div>
                  <Badge className={statusColors[selectedSubmission.status]} variant="secondary">
                    {statusLabels[selectedSubmission.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Timeline */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Timeline</h3>
                  <div className="space-y-3">
                    {selectedSubmission.targetSubmissionDate && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">Date de soumission cible</div>
                          <div className="text-xs text-muted-foreground">
                            {selectedSubmission.targetSubmissionDate.toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {selectedSubmission.submissionDate && (
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">Soumis à la FDA</div>
                          <div className="text-xs text-muted-foreground">
                            {selectedSubmission.submissionDate.toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {selectedSubmission.fdaReviewDeadline && (
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">Deadline FDA (estimée)</div>
                          <div className="text-xs text-muted-foreground">
                            {selectedSubmission.fdaReviewDeadline.toLocaleDateString("fr-FR")}
                            {" • "}
                            {Math.ceil((selectedSubmission.fdaReviewDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} jours restants
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {selectedSubmission.approvalDate && (
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">Approuvé</div>
                          <div className="text-xs text-muted-foreground">
                            {selectedSubmission.approvalDate.toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Review Time Info */}
                {!selectedSubmission.approvalDate && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 text-sm">Délai d'examen FDA</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Le délai moyen d'examen pour une {submissionTypeLabels[selectedSubmission.submissionType]} est de{" "}
                          <strong>{reviewTimes[selectedSubmission.submissionType]} jours</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Notes */}
                {selectedSubmission.notes && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Notes</h3>
                    <p className="text-sm text-muted-foreground">{selectedSubmission.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Required Documents Checklist */}
            <Card>
              <CardHeader>
                <CardTitle>Documents requis</CardTitle>
                <CardDescription>
                  Checklist des documents nécessaires pour votre soumission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {requiredDocuments[selectedSubmission.submissionType].map((doc, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                      <input type="checkbox" className="h-4 w-4" />
                      <span className="text-sm">{doc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
