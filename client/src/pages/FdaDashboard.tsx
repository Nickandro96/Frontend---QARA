import { UpgradeRequired } from "@/components/UpgradeRequired";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, MinusCircle, AlertTriangle, TrendingUp } from "lucide-react";

export default function FdaDashboard() {
  const [selectedRole] = useState<"manufacturer_us" | "specification_developer" | "contract_manufacturer" | "initial_importer">("manufacturer_us");
  
  // Fetch FDA referentials
  const { data: referentials } = trpc.referentials.list.useQuery();
  const fdaReferentials = referentials?.filter(r => r.code.startsWith("FDA_")) || [];
  
  // Fetch questions for FDA
  const { data: questions } = trpc.questions.list.useQuery({
    referentialId: undefined,
    processId: undefined,
    economicRole: selectedRole
  });
  
  // Fetch global score for all FDA questions
  const { data: globalScore } = trpc.audit.getScore.useQuery({
    referentialId: undefined,
    processId: undefined
  });
  
  // Calculate scores by referential
  const scoresByReferential = fdaReferentials.map(ref => {
    // Use a separate query for each referential
    return {
      referential: ref,
      total: 0,
      answered: 0,
      conforme: 0,
      nok: 0,
      na: 0,
      conformityRate: 0,
      completionRate: 0
    };
  });
  
  // Use queries for each referential
  const refScores = fdaReferentials.map(ref => {
    const { data } = trpc.audit.getScore.useQuery({
      referentialId: ref.id,
      processId: undefined
    });
    return { referential: ref, score: data };
  });
  
  // Update scoresByReferential with actual data
  refScores.forEach(({ referential, score }, index) => {
    if (score) {
      scoresByReferential[index] = {
        referential,
        total: score.total,
        answered: score.answered,
        conforme: score.conforme,
        nok: score.nok,
        na: score.na,
        conformityRate: score.answered > 0 ? Math.round((score.conforme / score.answered) * 100) : 0,
        completionRate: score.total > 0 ? Math.round((score.answered / score.total) * 100) : 0
      };
    }
  });
  
  // Global FDA statistics
  const totalQuestions = globalScore?.total || 0;
  const totalAnswered = globalScore?.answered || 0;
  const totalConforme = globalScore?.conforme || 0;
  const totalNok = globalScore?.nok || 0;
  const totalNa = globalScore?.na || 0;
  
  const globalConformityRate = totalAnswered > 0 ? Math.round((totalConforme / totalAnswered) * 100) : 0;
  const globalCompletionRate = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;
  
  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard FDA</h1>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble de votre conformité FDA pour le marché américain
        </p>
      </div>
      
      {/* Global KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de conformité</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalConformityRate}%</div>
            <p className="text-xs text-muted-foreground">
              {totalConforme} / {totalAnswered} questions conformes
            </p>
            <Progress value={globalConformityRate} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progression audit</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {totalAnswered} / {totalQuestions} questions répondues
            </p>
            <Progress value={globalCompletionRate} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-conformités</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalNok}</div>
            <p className="text-xs text-muted-foreground">
              Points d'attention à traiter
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non applicables</CardTitle>
            <MinusCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNa}</div>
            <p className="text-xs text-muted-foreground">
              Questions non applicables
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Scores by referential */}
      <Card>
        <CardHeader>
          <CardTitle>Conformité par référentiel FDA</CardTitle>
          <CardDescription>
            Détail de votre progression pour chaque référentiel FDA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {scoresByReferential.map(score => (
            <div key={score.referential.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{score.referential.name}</h3>
                  <p className="text-sm text-muted-foreground">{score.referential.code}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={score.conformityRate >= 80 ? "default" : score.conformityRate >= 50 ? "secondary" : "destructive"}>
                    {score.conformityRate}% conforme
                  </Badge>
                  <Badge variant="outline">
                    {score.completionRate}% complété
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Progression</div>
                  <Progress value={score.completionRate} />
                  <p className="text-xs text-muted-foreground mt-1">
                    {score.answered} / {score.total} questions
                  </p>
                </div>
                
                <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">{score.conforme}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">{score.nok}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MinusCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{score.na}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {scoresByReferential.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun référentiel FDA trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommandations</CardTitle>
          <CardDescription>
            Actions prioritaires pour améliorer votre conformité FDA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {totalNok > 0 && (
            <div className="flex gap-3 p-4 border border-destructive/50 rounded-lg bg-destructive/5">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-destructive">Non-conformités à traiter</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Vous avez {totalNok} non-conformités identifiées. Priorisez leur résolution pour éviter des problèmes lors d'inspections FDA.
                </p>
              </div>
            </div>
          )}
          
          {globalCompletionRate < 50 && (
            <div className="flex gap-3 p-4 border border-blue-500/50 rounded-lg bg-blue-500/5">
              <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-600">Compléter l'audit</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Vous avez répondu à {globalCompletionRate}% des questions. Continuez l'audit pour obtenir une vue complète de votre conformité FDA.
                </p>
              </div>
            </div>
          )}
          
          {globalConformityRate >= 80 && globalCompletionRate >= 80 && (
            <div className="flex gap-3 p-4 border border-green-500/50 rounded-lg bg-green-500/5">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-600">Excellente conformité !</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Votre taux de conformité de {globalConformityRate}% est excellent. Maintenez ce niveau en effectuant des audits réguliers et en restant à jour sur les évolutions réglementaires FDA.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
