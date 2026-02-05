/**
 * FDA Role Qualification Page
 * 9 boolean questions to determine user's FDA role(s)
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";

const FDA_QUESTIONS = [
  {
    id: "brandOnLabel",
    label: "Your company name appears on the device label",
    description: "You are the brand owner / specification developer",
  },
  {
    id: "designsOrSpecifiesDevice",
    label: "You design or specify the device",
    description: "You establish the device specifications and design controls",
  },
  {
    id: "manufacturesOrReworks",
    label: "You manufacture or rework devices",
    description: "You perform manufacturing operations (assembly, sterilization, packaging, etc.)",
  },
  {
    id: "manufacturesForThirdParty",
    label: "You manufacture devices for another company",
    description: "You are a contract manufacturer (CMO) producing for a third party",
  },
  {
    id: "firstImportIntoUS",
    label: "You are the first importer of devices into the United States",
    description: "You import devices from foreign manufacturers for US distribution",
  },
  {
    id: "distributesWithoutModification",
    label: "You distribute devices without modification",
    description: "You are a distributor who does not modify, repackage, or relabel devices",
  },
  {
    id: "relabelingOrRepackaging",
    label: "You relabel or repackage devices",
    description: "You modify the labeling or packaging of finished devices",
  },
  {
    id: "servicing",
    label: "You service or repair medical devices",
    description: "You perform maintenance, repair, or servicing activities",
  },
  {
    id: "softwareAsMedicalDevice",
    label: "You develop Software as a Medical Device (SaMD)",
    description: "You develop standalone software intended for medical purposes",
  },
];

const ROLE_DESCRIPTIONS = {
  FDA_LM: {
    name: "Legal Manufacturer / Specification Developer",
    description: "Entity whose name appears on the device label",
    color: "bg-blue-100 text-blue-800",
  },
  FDA_CMO: {
    name: "Contract Manufacturer",
    description: "Entity that manufactures for another company",
    color: "bg-green-100 text-green-800",
  },
  FDA_IMP: {
    name: "Initial Importer",
    description: "Entity that imports devices into the US",
    color: "bg-purple-100 text-purple-800",
  },
  FDA_DIST: {
    name: "Distributor",
    description: "Entity that distributes without modifying",
    color: "bg-orange-100 text-orange-800",
  },
};

export default function FDAQualification() {
  const [, setLocation] = useLocation();
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [computedRoles, setComputedRoles] = useState<string[]>([]);
  
  // Load existing qualification
  const { data: existingQualification, isLoading: loadingQualification } = trpc.fda.getQualification.useQuery({});
  
  // Save qualification mutation
  const saveQualification = trpc.fda.saveQualification.useMutation({
    onSuccess: (data) => {
      setComputedRoles(data.computedRoles);
    },
  });
  
  // Initialize answers from existing qualification
  useEffect(() => {
    if (existingQualification) {
      setAnswers({
        brandOnLabel: existingQualification.brandOnLabel || false,
        designsOrSpecifiesDevice: existingQualification.designsOrSpecifiesDevice || false,
        manufacturesOrReworks: existingQualification.manufacturesOrReworks || false,
        manufacturesForThirdParty: existingQualification.manufacturesForThirdParty || false,
        firstImportIntoUS: existingQualification.firstImportIntoUS || false,
        distributesWithoutModification: existingQualification.distributesWithoutModification || false,
        relabelingOrRepackaging: existingQualification.relabelingOrRepackaging || false,
        servicing: existingQualification.servicing || false,
        softwareAsMedicalDevice: existingQualification.softwareAsMedicalDevice || false,
      });
      setComputedRoles(existingQualification.computedRoles || []);
    }
  }, [existingQualification]);
  
  const handleCheckboxChange = (questionId: string, checked: boolean) => {
    setAnswers(prev => ({ ...prev, [questionId]: checked }));
  };
  
  const handleSubmit = async () => {
    await saveQualification.mutateAsync({
      brandOnLabel: answers.brandOnLabel || false,
      designsOrSpecifiesDevice: answers.designsOrSpecifiesDevice || false,
      manufacturesOrReworks: answers.manufacturesOrReworks || false,
      manufacturesForThirdParty: answers.manufacturesForThirdParty || false,
      firstImportIntoUS: answers.firstImportIntoUS || false,
      distributesWithoutModification: answers.distributesWithoutModification || false,
      relabelingOrRepackaging: answers.relabelingOrRepackaging || false,
      servicing: answers.servicing || false,
      softwareAsMedicalDevice: answers.softwareAsMedicalDevice || false,
    });
  };
  
  const handleContinueToAudit = () => {
    setLocation("/fda/audit");
  };
  
  if (loadingQualification) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">FDA Role Qualification</h1>
          <p className="text-muted-foreground mt-2">
            Answer the following questions to determine your FDA regulatory role(s) and applicable requirements.
          </p>
        </div>
        
        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Your answers will determine which FDA requirements apply to your organization. 
            You may have multiple roles (e.g., both Legal Manufacturer and Contract Manufacturer).
          </AlertDescription>
        </Alert>
        
        {/* Questions */}
        <Card>
          <CardHeader>
            <CardTitle>Qualification Questions</CardTitle>
            <CardDescription>
              Check all statements that apply to your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {FDA_QUESTIONS.map((question, index) => (
              <div key={question.id} className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                <Checkbox
                  id={question.id}
                  checked={answers[question.id] || false}
                  onCheckedChange={(checked) => handleCheckboxChange(question.id, checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor={question.id}
                    className="text-base font-medium cursor-pointer"
                  >
                    {index + 1}. {question.label}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {question.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Computed Roles */}
        {computedRoles.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <CardTitle className="text-green-900">Your FDA Role(s)</CardTitle>
              </div>
              <CardDescription className="text-green-700">
                Based on your answers, the following FDA roles apply to your organization:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {computedRoles.map(roleCode => {
                  const role = ROLE_DESCRIPTIONS[roleCode as keyof typeof ROLE_DESCRIPTIONS];
                  if (!role) return null;
                  
                  return (
                    <div key={roleCode} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                      <Badge className={role.color}>{roleCode}</Badge>
                      <div>
                        <p className="font-medium">{role.name}</p>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* No Roles Warning */}
        {saveQualification.isSuccess && computedRoles.length === 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No FDA roles were identified based on your answers. Please review your responses to ensure accuracy.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Actions */}
        <div className="flex gap-4">
          <Button
            onClick={handleSubmit}
            disabled={saveQualification.isPending}
            size="lg"
          >
            {saveQualification.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existingQualification ? "Update Qualification" : "Save Qualification"}
          </Button>
          
          {computedRoles.length > 0 && (
            <Button
              onClick={handleContinueToAudit}
              variant="outline"
              size="lg"
            >
              Continue to FDA Audit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
