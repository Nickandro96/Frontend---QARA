import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck } from "lucide-react";
import { exportQualificationPdf } from "@/lib/fdaExports";

export default function FDAQualification() {
  const { data, isLoading } = trpc.fda.getQualificationQuestions.useQuery();
  const { data: existing } = trpc.fda.getQualification.useQuery();
  const save = trpc.fda.saveQualification.useMutation();
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const questions = data?.questions || [];
  const steps = useMemo(() => Array.from(new Set(questions.map((q: any) => q.step))).sort((a, b) => a - b), [questions]);
  const [step, setStep] = useState(steps[0] || 1);
  const currentQuestions = questions.filter((q: any) => q.step === step);
  const progress = steps.length ? Math.round((steps.indexOf(step) + 1) / steps.length * 100) : 0;

  const result = save.data || existing?.resultJson;

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">FDA Qualification</h1>
        <p className="text-muted-foreground mt-2">Assistant guidé pour qualifier votre produit et vos obligations FDA US.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progression</CardTitle>
          <CardDescription>Étape {steps.indexOf(step) + 1} sur {steps.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Étape {step}</CardTitle>
          <CardDescription>Répondez de façon simple. Le moteur calcule un résultat explicable et exportable.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentQuestions.map((q: any) => (
            <div key={q.id} className="space-y-2">
              <Label className="font-medium">{q.label}</Label>
              {q.kind === "boolean" ? (
                <RadioGroup value={answers[q.id] === true ? "yes" : answers[q.id] === false ? "no" : ""} onValueChange={(value) => setAnswers((prev) => ({ ...prev, [q.id]: value === "yes" }))}>
                  <div className="flex items-center gap-2"><RadioGroupItem value="yes" id={`${q.id}-yes`} /><Label htmlFor={`${q.id}-yes`}>Oui</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="no" id={`${q.id}-no`} /><Label htmlFor={`${q.id}-no`}>Non</Label></div>
                </RadioGroup>
              ) : (
                <Textarea value={answers[q.id] || ""} onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))} rows={4} />
              )}
            </div>
          ))}
          <div className="flex justify-between">
            <Button variant="outline" disabled={step === steps[0]} onClick={() => setStep((prev) => steps[Math.max(0, steps.indexOf(prev) - 1)])}>Précédent</Button>
            {step === steps[steps.length - 1] ? (
              <Button onClick={() => save.mutate({ answers, sessionName: "FDA Qualification" })} disabled={save.isPending}>
                {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Calculer le résultat
              </Button>
            ) : (
              <Button onClick={() => setStep((prev) => steps[Math.min(steps.length - 1, steps.indexOf(prev) + 1)])}>Suivant</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Résultat FDA</CardTitle>
            <CardDescription>{result.rationale}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>{result.probableDeviceStatus ? "Medical device probable" : "Review needed"}</Badge>
              <Badge variant="secondary">Classe probable: {result.deviceClass}</Badge>
              <Badge variant="secondary">Pathway: {result.pathway}</Badge>
              <Badge variant="outline">Confiance: {result.confidence}%</Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {(result.obligations || []).map((item: any) => (
                <div key={item.code} className="rounded-lg border p-3">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-sm text-muted-foreground mt-1">{item.required ? "Requis / à planifier" : "À confirmer selon périmètre"}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button onClick={() => exportQualificationPdf(result)}>Exporter PDF</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
