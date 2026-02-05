/**
 * FDA Audit Page
 * Displays FDA questions filtered by user's role(s)
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle2, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const COMPLIANCE_OPTIONS = [
  { value: "compliant", label: "Compliant", color: "bg-green-100 text-green-800" },
  { value: "non_compliant", label: "Non-Compliant", color: "bg-red-100 text-red-800" },
  { value: "partial", label: "Partial Compliance", color: "bg-yellow-100 text-yellow-800" },
  { value: "not_applicable", label: "Not Applicable", color: "bg-gray-100 text-gray-800" },
];

export default function FDAAudit() {
  const [, setLocation] = useLocation();
  const [selectedFramework, setSelectedFramework] = useState<string>("");
  const [responses, setResponses] = useState<Record<number, {
    complianceStatus: string;
    evidence: string;
    comments: string;
  }>>({});
  const [auditId, setAuditId] = useState<number | null>(null);
  
  // Auto-create audit on mount if none exists
  const createAudit = trpc.audit.create.useMutation({
    onSuccess: (data) => {
      setAuditId(data.auditId);
    },
  });
  
  // Get frameworks list
  const { data: frameworks } = trpc.fda.getFrameworks.useQuery();
  
  // Get user's qualification
  const { data: qualification, isLoading: loadingQualification } = trpc.fda.getQualification.useQuery({});
  
  // Get questions for selected framework
  const { data: questionsData, isLoading: loadingQuestions, error: questionsError } = trpc.fda.getQuestions.useQuery(
    { frameworkCode: selectedFramework },
    { enabled: !!selectedFramework }
  );
  
  // Create audit when framework is selected
  useEffect(() => {
    if (!auditId && selectedFramework && qualification) {
      createAudit.mutate({
        auditType: "internal",
        name: `Audit FDA ${selectedFramework} - ${new Date().toLocaleDateString("fr-FR")}`,
        referentialIds: [4], // FDA referentialId (assuming 4, adjust if needed)
      });
    }
  }, [selectedFramework, auditId, qualification]);
  
  const saveResponseMutation = trpc.fda.saveResponse.useMutation({
    onSuccess: () => {
      alert("Audit responses saved successfully!");
    },
    onError: (error) => {
      alert(`Error saving responses: ${error.message}`);
    },
  });
  
  const handleResponseChange = (questionId: number, field: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }));
  };
  
  const handleSaveResponses = async () => {
    if (!selectedFramework) {
      alert("Please select a framework first");
      return;
    }
    
    if (!auditId) {
      alert("Audit not created yet. Please wait...");
      return;
    }
    
    // Save each response
    for (const [questionIdStr, response] of Object.entries(responses)) {
      const questionId = parseInt(questionIdStr);
      if (response.complianceStatus) {
        await saveResponseMutation.mutateAsync({
          auditId,
          questionId,
          responseValue: response.complianceStatus as any,
          responseComment: response.comments || undefined,
        });
      }
    }
  };
  
  // Show loading while creating audit or loading data
  if (loadingQualification || loadingQuestions || createAudit.isPending || (selectedFramework && !auditId)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {createAudit.isPending || (selectedFramework && !auditId) 
              ? "Creating audit..."
              : "Loading..."}
          </p>
        </div>
      </div>
    );
  }
  
  if (!qualification) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must complete the FDA qualification first before starting an audit.
          </AlertDescription>
        </Alert>
        <Button onClick={() => setLocation("/fda/qualification")} className="mt-4">
          Go to Qualification
        </Button>
      </div>
    );
  }
  
  const userRoles = qualification.computedRoles || [];
  
  if (userRoles.length === 0) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No FDA roles identified. Please update your qualification.
          </AlertDescription>
        </Alert>
        <Button onClick={() => setLocation("/fda/qualification")} className="mt-4">
          Update Qualification
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">FDA Audit</h1>
          <p className="text-muted-foreground mt-2">
            Conduct FDA compliance audit based on your role(s) and selected framework
          </p>
        </div>
        
        {/* User Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Your FDA Role(s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {userRoles.map(role => (
                <Badge key={role} variant="secondary">{role}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Framework Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select FDA Framework</CardTitle>
            <CardDescription>
              Choose the FDA regulatory framework for your audit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedFramework} onValueChange={setSelectedFramework}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a framework..." />
              </SelectTrigger>
              <SelectContent>
                {frameworks?.map(fw => (
                  <SelectItem key={fw.code} value={fw.code}>
                    {fw.name} - {fw.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        {/* Questions Error */}
        {questionsError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {questionsError.message}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Questions Loading */}
        {loadingQuestions && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {/* Questions Summary */}
        {questionsData && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Audit Questions</CardTitle>
              <CardDescription className="text-blue-700">
                Showing {questionsData.applicableQuestions} out of {questionsData.totalQuestions} questions 
                (filtered by your role: {userRoles.join(", ")})
              </CardDescription>
            </CardHeader>
          </Card>
        )}
        
        {/* Questions List */}
        {questionsData?.questions && questionsData.questions.length > 0 && (
          <div className="space-y-6">
            {questionsData.questions.map((question, index) => (
              <Card key={question.id} className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">Q{index + 1}</Badge>
                        <Badge variant="secondary">{question.process}</Badge>
                        {question.criticality && (
                          <Badge className={
                            question.criticality === 'critical' ? 'bg-red-100 text-red-800' :
                            question.criticality === 'high' ? 'bg-orange-100 text-orange-800' :
                            question.criticality === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {question.criticality}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{question.questionShort}</CardTitle>
                      <CardDescription className="mt-2">
                        {question.questionDetailed}
                      </CardDescription>
                    </div>
                  </div>
                  
                  {/* FDA Reference */}
                  {question.fdaReference && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>Reference: {question.fdaReference}</span>
                    </div>
                  )}
                  
                  {/* Applicability Justification */}
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {question.applicabilityType === 'ALL' 
                        ? '✅ Applicable to: ALL roles' 
                        : `✅ Applicable to: ${userRoles.join(', ')}`}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Expected Evidence */}
                  {question.expectedEvidence && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Expected Evidence:</p>
                      <p className="text-sm text-muted-foreground">{question.expectedEvidence}</p>
                    </div>
                  )}
                  
                  {/* FDA Risk if Non-Compliant */}
                  {question.riskFda && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-900 mb-1">⚠️ Risk if Non-Compliant:</p>
                          <p className="text-sm text-red-700">{question.riskFda}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Compliance Status */}
                  <div className="space-y-2">
                    <Label>Compliance Status *</Label>
                    <RadioGroup
                      value={responses[question.id]?.complianceStatus || ""}
                      onValueChange={(value) => handleResponseChange(question.id, "complianceStatus", value)}
                    >
                      <div className="grid grid-cols-2 gap-3">
                        {COMPLIANCE_OPTIONS.map(option => (
                          <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                            <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                            <Label htmlFor={`${question.id}-${option.value}`} className="flex-1 cursor-pointer">
                              <Badge className={option.color}>{option.label}</Badge>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* Evidence */}
                  <div className="space-y-2">
                    <Label htmlFor={`evidence-${question.id}`}>Evidence / Documentation</Label>
                    <Textarea
                      id={`evidence-${question.id}`}
                      placeholder="List documents, records, or evidence supporting your response..."
                      value={responses[question.id]?.evidence || ""}
                      onChange={(e) => handleResponseChange(question.id, "evidence", e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  {/* Comments */}
                  <div className="space-y-2">
                    <Label htmlFor={`comments-${question.id}`}>Comments / Observations</Label>
                    <Textarea
                      id={`comments-${question.id}`}
                      placeholder="Add any additional comments, observations, or action items..."
                      value={responses[question.id]?.comments || ""}
                      onChange={(e) => handleResponseChange(question.id, "comments", e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  {/* Risk Information */}
                  {question.riskIfNonCompliant && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm font-medium text-red-900 mb-1">Risk if Non-Compliant:</p>
                      <p className="text-sm text-red-700">{question.riskIfNonCompliant}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setLocation("/dashboard")}>
                Cancel
              </Button>
              <Button onClick={handleSaveResponses} size="lg">
                Save Audit Responses
              </Button>
            </div>
          </div>
        )}
        
        {/* No Questions */}
        {questionsData && questionsData.questions.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No questions found for this framework and your role(s). Please select a different framework.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
