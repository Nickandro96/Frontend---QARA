import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle2, ChevronRight, ClipboardCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LABELS: Record<string, { title: string; description: string }> = {
  MDR: { title: "MDR 2017/745", description: "Dispositifs médicaux — Union européenne" },
  IVDR: { title: "IVDR 2017/746", description: "Dispositifs médicaux de diagnostic in vitro" },
  FDA_QMSR: { title: "FDA QMSR", description: "Système qualité — marché américain" },
  MDSAP: { title: "MDSAP", description: "Programme unique d'audit des dispositifs médicaux" },
  ISO13485: { title: "ISO 13485", description: "Système qualité des dispositifs médicaux" },
  ISO14971: { title: "ISO 14971", description: "Gestion des risques des dispositifs médicaux" },
  ISO9001: { title: "ISO 9001", description: "Système de management de la qualité" },
};

function normalizeCode(value: unknown) {
  return String(value ?? "").trim().toUpperCase().replace(/[\s-]+/g, "");
}

export default function AuditWizard() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [referentialId, setReferentialId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [processMode, setProcessMode] = useState<"all" | "select">("all");
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);

  const { data: referentials, isLoading: loadingReferentials } = trpc.referentials.list.useQuery();
  const { data: processPayload, isLoading: loadingProcesses } = trpc.mdr.getProcesses.useQuery();
  const { data: sitePayload, isLoading: loadingSites } = trpc.mdr.getSites.useQuery();
  const createAudit = trpc.audit.create.useMutation();

  const availableReferentials = useMemo(() => {
    const rows = Array.isArray(referentials) ? referentials : [];
    return rows
      .filter((item: any) => LABELS[normalizeCode(item.code)])
      .sort((a: any, b: any) => LABELS[normalizeCode(a.code)].title.localeCompare(LABELS[normalizeCode(b.code)].title));
  }, [referentials]);

  const processes = useMemo(() => {
    const rows = (processPayload as any)?.processes ?? processPayload;
    return Array.isArray(rows) ? rows : [];
  }, [processPayload]);

  const sites = useMemo(() => {
    const rows = (sitePayload as any)?.sites ?? sitePayload;
    return Array.isArray(rows) ? rows : [];
  }, [sitePayload]);

  const selectedReferential: any = availableReferentials.find((item: any) => Number(item.id) === referentialId);
  const selectedCode = normalizeCode(selectedReferential?.code);

  useEffect(() => {
    if (!availableReferentials.length || referentialId) return;
    const requested = normalizeCode(new URLSearchParams(window.location.search).get("referential"));
    const match = availableReferentials.find((item: any) => normalizeCode(item.code) === requested);
    if (match) setReferentialId(Number(match.id));
  }, [availableReferentials, referentialId]);

  useEffect(() => {
    if (!selectedReferential) return;
    setName(`Audit ${LABELS[selectedCode]?.title ?? selectedReferential.name} - ${new Date().toLocaleDateString("fr-FR")}`);
  }, [selectedReferential, selectedCode]);

  const startAudit = async () => {
    if (!referentialId || !name.trim()) return;
    try {
      const processIds = processMode === "all"
        ? processes.map((process: any) => String(process.id)).filter(Boolean)
        : selectedProcesses;
      const result = await createAudit.mutateAsync({
        auditType: "internal",
        name: name.trim(),
        referentialIds: [referentialId],
        siteId: siteId ? Number(siteId) : undefined,
        startDate: startDate || undefined,
        processIds,
      });
      const auditId = Number(result?.auditId);
      if (!Number.isFinite(auditId) || auditId <= 0) throw new Error("Identifiant d'audit invalide");
      toast.success("Audit créé", { description: "Ouverture du questionnaire…" });
      window.location.assign(`/audit/${auditId}/questionnaire`);
    } catch (error: any) {
      toast.error("Impossible de démarrer l'audit", { description: error?.message ?? "Erreur inconnue" });
    }
  };

  if (loadingReferentials || loadingProcesses || loadingSites) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Nouvel audit · Étape {step + 1} sur 2</p>
        <h1 className="text-3xl font-bold tracking-tight">{step === 0 ? "Choisir le référentiel" : "Configurer l'audit"}</h1>
        <p className="mt-2 text-muted-foreground">Le questionnaire sera limité au référentiel et aux processus sélectionnés.</p>
      </div>

      {step === 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {availableReferentials.map((item: any) => {
            const code = normalizeCode(item.code);
            const meta = LABELS[code];
            const active = referentialId === Number(item.id);
            return (
              <button key={item.id} type="button" onClick={() => setReferentialId(Number(item.id))} className="text-left" aria-pressed={active}>
                <Card className={active ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"}>
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary"><ClipboardCheck className="h-5 w-5" /></div>
                    <div><CardTitle className="text-lg">{meta.title}</CardTitle><CardDescription className="mt-1">{meta.description}</CardDescription></div>
                  </CardHeader>
                  <CardContent className="text-sm font-medium text-primary">{active ? "Référentiel sélectionné" : "Sélectionner"}</CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader><CardTitle>{LABELS[selectedCode]?.title}</CardTitle><CardDescription>Renseignez les paramètres utiles avant de lancer le questionnaire.</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2"><Label htmlFor="audit-name">Nom de l'audit *</Label><Input id="audit-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Site</Label><Select value={siteId} onValueChange={setSiteId}><SelectTrigger><SelectValue placeholder="Sélectionner un site (facultatif)" /></SelectTrigger><SelectContent>{sites.map((site: any) => <SelectItem key={site.id} value={String(site.id)}>{site.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="start-date">Date de début</Label><Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Processus</Label><Select value={processMode} onValueChange={(value) => setProcessMode(value as "all" | "select")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous les processus applicables</SelectItem><SelectItem value="select">Sélection manuelle</SelectItem></SelectContent></Select></div>
            {processMode === "select" && <div className="grid gap-2 md:grid-cols-2">{processes.map((process: any) => { const id = String(process.id); const checked = selectedProcesses.includes(id); return <label key={id} className="flex cursor-pointer items-center gap-2 rounded-lg border p-3"><input type="checkbox" checked={checked} onChange={() => setSelectedProcesses((current) => checked ? current.filter((value) => value !== id) : [...current, id])} /><span>{process.name}</span></label>; })}</div>}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between border-t pt-6">
        <Button variant="outline" onClick={() => step === 0 ? setLocation("/audits") : setStep(0)}><ArrowLeft className="mr-2 h-4 w-4" />Retour</Button>
        {step === 0 ? <Button disabled={!referentialId} onClick={() => setStep(1)}>Continuer<ChevronRight className="ml-2 h-4 w-4" /></Button> : <Button disabled={!name.trim() || createAudit.isPending || (processMode === "select" && selectedProcesses.length === 0)} onClick={startAudit}>{createAudit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Démarrer le questionnaire</Button>}
      </div>
    </div>
  );
}
