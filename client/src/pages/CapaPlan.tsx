import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { ArrowLeft, Loader2, RefreshCw, AlertCircle, ClipboardCheck } from "lucide-react";

const GRAVITE_LABEL: Record<string, string> = { majeur: "Majeure", mineur: "Mineure", observation: "Observation" };
const GRAVITE_BADGE: Record<string, string> = {
  majeur: "bg-red-100 text-red-800",
  mineur: "bg-orange-100 text-orange-800",
  observation: "bg-blue-100 text-blue-800",
};
const STATUT_LABEL: Record<string, string> = {
  ouverte: "Ouverte",
  en_cours: "En cours",
  a_verifier: "À vérifier",
  cloturee_efficace: "Clôturée (efficace)",
  cloturee_inefficace: "Clôturée (inefficace, réouverte)",
  cloturee_sans_suite: "Clôturée sans suite",
};
const STATUT_BADGE: Record<string, string> = {
  ouverte: "bg-gray-100 text-gray-800",
  en_cours: "bg-blue-100 text-blue-800",
  a_verifier: "bg-amber-100 text-amber-800",
  cloturee_efficace: "bg-green-100 text-green-800",
  cloturee_inefficace: "bg-red-100 text-red-800",
  cloturee_sans_suite: "bg-gray-100 text-gray-800",
};

// Transitions autorisées côté UI — miroir de capaEngine.ts (ALLOWED_TRANSITIONS).
// Le serveur revalide de toute façon ; ceci ne sert qu'à proposer les bons boutons.
const NEXT_STATUTS: Record<string, string[]> = {
  ouverte: ["en_cours", "cloturee_sans_suite"],
  en_cours: ["a_verifier", "cloturee_sans_suite"],
  a_verifier: ["cloturee_efficace", "cloturee_inefficace"],
  cloturee_efficace: [],
  cloturee_inefficace: ["en_cours"],
  cloturee_sans_suite: [],
};

function ActionCard({ action, auditId }: { action: any; auditId: number }) {
  const utils = trpc.useUtils();
  const [analyseCauseRacine, setAnalyseCauseRacine] = useState(action.analyseCauseRacine || "");
  const [actionRetenue, setActionRetenue] = useState(action.actionRetenue || "");
  const [responsible, setResponsible] = useState(action.responsible || "");
  const [dueDate, setDueDate] = useState(action.dueDate ? action.dueDate.slice(0, 10) : "");
  const [preuveRealisation, setPreuveRealisation] = useState(action.preuveRealisation || "");
  const [preuveEfficacite, setPreuveEfficacite] = useState(action.preuveEfficacite || "");
  const [rootCauseMethod, setRootCauseMethod] = useState(action.rootCauseMethod || "");
  const [mdsapGrade, setMdsapGrade] = useState(action.mdsapGrade != null ? String(action.mdsapGrade) : "");
  const [mdsapEscalation, setMdsapEscalation] = useState(action.mdsapEscalation || "");
  const isMdsap = action.referentialCode === "MDSAP";
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiContext, setAiContext] = useState<any>(null);
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [qualificationDecision, setQualificationDecision] = useState(action.qualificationDecision || "a_qualifier");
  const [qualificationJustification, setQualificationJustification] = useState(action.qualificationJustification || "");
  const [qualificationOwner, setQualificationOwner] = useState(action.qualificationOwner || "");
  const [impactPatient, setImpactPatient] = useState(action.impactPatient || "inconnu");
  const [impactReglementaire, setImpactReglementaire] = useState(action.impactReglementaire || "inconnu");
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const generateAI = trpc.capa.generateAnalysis.useMutation({
    onMutate: (variables) => {
      setAiError(null);
      console.log("[CAPA AI] clic Analyser avec l'IA", variables);
    },
    onSuccess: (data: any) => {
      console.log("[CAPA AI] réponse generateAnalysis", data);
      const analysis = data?.analysis;
      if (!analysis?.analyse5Pourquoi || !Array.isArray(analysis?.actionsCorrectivesProposees)) {
        const message = "La réponse reçue ne contient pas l'analyse CAPA attendue.";
        setAiError(message); toast.error(message); return;
      }
      setAiAnalysis(analysis);
      setAiContext(data.context);
      setAnalyseCauseRacine(analysis.analyse5Pourquoi.causeRacineIdentifiee || "");
      setRootCauseMethod("5_pourquoi");
      setActionRetenue(analysis.actionsCorrectivesProposees.map((item: any) => `${item.titre} — ${item.description}`).join("\n\n"));
      setSelectedActionIds(analysis.actionsCorrectivesProposees.map((item: any) => item.id));
      toast.success(`${analysis.actionsCorrectivesProposees.length} actions correctives proposées par l'IA`);
    },
    onError: (e) => {
      console.error("[CAPA AI] erreur generateAnalysis", e);
      setAiError(e.message);
      toast.error(`Analyse impossible : ${e.message}`);
    },
  });

  const handleGenerateAI = () => {
    const payload = { auditId, questionKey: action.questionKey };
    console.log("[CAPA AI] envoi capa.generateAnalysis", payload);
    generateAI.mutate(payload);
  };
  const saveAI = trpc.capa.saveAnalysis.useMutation({
    onSuccess: () => { toast.success("Plan CAPA validé et enregistré"); utils.capa.list.invalidate({ auditId }); },
    onError: (e) => toast.error(`Enregistrement impossible : ${e.message}`),
  });

  const updateMutation = trpc.capa.update.useMutation({
    onSuccess: () => {
      toast.success("Enregistré");
      utils.capa.list.invalidate({ auditId });
    },
    onError: (e) => toast.error(`Erreur : ${e.message}`),
  });

  const updateStatusMutation = trpc.capa.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Statut mis à jour");
      utils.capa.list.invalidate({ auditId });
    },
    onError: (e) => toast.error(`Erreur : ${e.message}`),
  });
  const qualifyMutation = trpc.capa.qualify.useMutation({
    onSuccess: () => { toast.success("Qualification de la NC enregistrée"); utils.capa.list.invalidate({ auditId }); utils.capa.dashboard.invalidate(); },
    onError: (e) => toast.error(`Qualification impossible : ${e.message}`),
  });
  const createTaskMutation = trpc.capa.createTask.useMutation({
    onSuccess: () => { setNewTaskTitle(""); toast.success("Action ajoutée au dossier CAPA"); utils.capa.list.invalidate({ auditId }); utils.capa.dashboard.invalidate(); },
    onError: (e) => toast.error(`Création impossible : ${e.message}`),
  });

  const handleSaveFields = () => {
    updateMutation.mutate({
      actionId: action.id,
      analyseCauseRacine: analyseCauseRacine || undefined,
      actionRetenue: actionRetenue || undefined,
      responsible: responsible || undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      preuveRealisation: preuveRealisation || undefined,
      rootCauseMethod: (rootCauseMethod || undefined) as any,
      mdsapGrade: mdsapGrade ? Number(mdsapGrade) : undefined,
      mdsapEscalation: mdsapEscalation || undefined,
    });
  };

  const handleTransition = (next: string) => {
    if (next === "cloturee_efficace" || next === "cloturee_inefficace") {
      if (!preuveEfficacite.trim()) {
        toast.error("La preuve d'efficacité est requise avant de clôturer.");
        return;
      }
      updateMutation.mutate({ actionId: action.id, preuveEfficacite });
      updateStatusMutation.mutate({
        actionId: action.id,
        statut: next,
        resultatEfficacite: next === "cloturee_efficace" ? "efficace" : "inefficace",
      });
      return;
    }
    if (next === "a_verifier" && !preuveRealisation.trim()) {
      toast.error("La preuve de réalisation est requise avant de passer en vérification.");
      return;
    }
    if (next === "en_cours" && action.gravite === "majeur" && !analyseCauseRacine.trim()) {
      toast.error("L'analyse de cause racine est obligatoire pour une gravité majeure.");
      return;
    }
    updateMutation.mutate({ actionId: action.id, preuveRealisation: preuveRealisation || undefined });
    updateStatusMutation.mutate({ actionId: action.id, statut: next });
  };

  const isOverdue = action.dueDate && new Date(action.dueDate) < new Date() &&
    !["cloturee_efficace", "cloturee_sans_suite"].includes(action.statut);

  return (
    <Card className={isOverdue ? "border-red-300" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Badge className={GRAVITE_BADGE[action.gravite] || "bg-gray-100"}>{GRAVITE_LABEL[action.gravite] || action.gravite}</Badge>
            <Badge variant="outline">{action.referentialCode}</Badge>
            {action.processName && <span className="text-sm text-muted-foreground">{action.processName}</span>}
            {isOverdue && <Badge className="bg-red-100 text-red-800">En retard</Badge>}
          </div>
          <Badge className={STATUT_BADGE[action.statut] || "bg-gray-100"}>{STATUT_LABEL[action.statut] || action.statut}</Badge>
        </div>
        <CardDescription className="mt-2">{action.ecartIdentifie}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4 space-y-3">
          <div><h3 className="font-semibold">Qualification et décision de traitement</h3><p className="text-xs text-muted-foreground">Décision qualité tracée avant l'ouverture ou la poursuite d'une CAPA.</p></div>
          <div className="grid gap-3 md:grid-cols-3">
            <div><label className="text-sm font-medium">Décision</label><Select value={qualificationDecision} onValueChange={setQualificationDecision}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="a_qualifier">À qualifier</SelectItem><SelectItem value="capa_requise">CAPA requise</SelectItem><SelectItem value="correction_simple">Correction simple</SelectItem><SelectItem value="surveillance">Surveillance</SelectItem><SelectItem value="acceptation_justifiee">Acceptation justifiée</SelectItem><SelectItem value="doublon">Doublon</SelectItem><SelectItem value="non_applicable_apres_revue">Non applicable après revue</SelectItem></SelectContent></Select></div>
            <div><label className="text-sm font-medium">Impact patient</label><Select value={impactPatient} onValueChange={setImpactPatient}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{["aucun","potentiel","avere","inconnu"].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium">Impact réglementaire</label><Select value={impactReglementaire} onValueChange={setImpactReglementaire}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{["aucun","potentiel","avere","inconnu"].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <Input value={qualificationOwner} onChange={(e)=>setQualificationOwner(e.target.value)} placeholder="Responsable de la qualification"/>
          <Textarea value={qualificationJustification} onChange={(e)=>setQualificationJustification(e.target.value)} placeholder={qualificationDecision==="capa_requise"?"Justification de la décision (recommandée)":"Justification obligatoire si aucune CAPA n'est ouverte"}/>
          <Button type="button" size="sm" disabled={qualificationDecision==="a_qualifier"||qualifyMutation.isPending} onClick={()=>qualifyMutation.mutate({actionId:action.id,decision:qualificationDecision as any,justification:qualificationJustification||undefined,owner:qualificationOwner||undefined,impactPatient:impactPatient as any,impactReglementaire:impactReglementaire as any})}>Valider la qualification</Button>
        </div>
        <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div><div className="font-semibold">Analyse CAPA assistée par IA</div><p className="text-xs text-muted-foreground">L'analyse reste une proposition : vérifiez et modifiez chaque élément avant enregistrement.</p></div>
            <Button type="button" size="sm" onClick={handleGenerateAI} disabled={generateAI.isPending}>
              {generateAI.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Analyser avec l'IA
            </Button>
          </div>
          {generateAI.isPending && <div className="mt-3 rounded border border-violet-200 bg-white p-3 text-sm"><Loader2 className="mr-2 inline h-4 w-4 animate-spin"/>Analyse 5 Pourquoi en cours…</div>}
          {aiError && <div role="alert" className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800"><strong>Analyse IA non générée.</strong> {aiError}</div>}
          {aiAnalysis && (
            <div className="mt-4 space-y-4">
              <div className="rounded bg-white p-3 text-xs"><strong>Question :</strong> {aiContext?.questionText}<br/><strong>Référence :</strong> {aiContext?.articleReference ?? "Non renseignée"}<br/><strong>Constat :</strong> {aiContext?.responseComment ?? "Non fourni"}<br/><strong>Preuves :</strong> {aiContext?.objectiveEvidence ?? "Non fournies"}</div>
              <div><label className="text-sm font-medium">Contexte de la situation</label><Textarea value={aiAnalysis.contexteSituation} onChange={(e)=>setAiAnalysis({...aiAnalysis,contexteSituation:e.target.value})}/></div>
              <div><label className="text-sm font-medium">Non-conformité identifiée</label><Textarea value={aiAnalysis.nonConformiteIdentifiee} onChange={(e)=>setAiAnalysis({...aiAnalysis,nonConformiteIdentifiee:e.target.value})}/></div>
              <div className="space-y-2"><div className="text-sm font-medium">Analyse 5 Pourquoi — chaque champ reste modifiable</div>{[1,2,3,4,5].map((n)=>{const key=`pourquoi${n}`; const p=aiAnalysis.analyse5Pourquoi[key]; const updatePourquoi=(field:"question"|"reponse",value:string)=>setAiAnalysis({...aiAnalysis,analyse5Pourquoi:{...aiAnalysis.analyse5Pourquoi,[key]:{...p,[field]:value}}}); return <div key={key} className="rounded border bg-white p-3" style={{ marginLeft: `${(n-1)*12}px` }}><label className="text-xs font-medium">Pourquoi {n} — question</label><Textarea className="mt-1" value={p.question} onChange={(e)=>updatePourquoi("question",e.target.value)}/><label className="mt-2 block text-xs font-medium">Réponse</label><Textarea className="mt-1" value={p.reponse} onChange={(e)=>updatePourquoi("reponse",e.target.value)}/></div>})}<div><label className="text-sm font-medium">Cause racine identifiée</label><Textarea value={aiAnalysis.analyse5Pourquoi.causeRacineIdentifiee} onChange={(e)=>setAiAnalysis({...aiAnalysis,analyse5Pourquoi:{...aiAnalysis.analyse5Pourquoi,causeRacineIdentifiee:e.target.value}})}/></div></div>
              <div><label className="text-sm font-medium">Correction immédiate</label><Textarea value={aiAnalysis.correctionImmediate} onChange={(e)=>setAiAnalysis({...aiAnalysis,correctionImmediate:e.target.value})}/></div>
              <div className="space-y-3"><div className="text-sm font-medium">Actions correctives proposées ({aiAnalysis.actionsCorrectivesProposees.length})</div>{aiAnalysis.actionsCorrectivesProposees.map((item:any)=><div key={item.id} className="rounded border bg-white p-3"><label className="flex gap-2"><Checkbox checked={selectedActionIds.includes(item.id)} onCheckedChange={(checked)=>setSelectedActionIds((ids)=>checked===true?[...new Set([...ids,item.id])]:ids.filter((id)=>id!==item.id))}/><span className="font-medium">{item.titre}</span></label><p className="mt-1 text-sm">{item.description}</p><div className="mt-2 flex flex-wrap gap-2 text-xs"><Badge>{item.priorite}</Badge><Badge variant="outline">{item.complexite}</Badge><span>{item.delaiSuggeree}</span><span>{item.exigenceReglementaire}</span></div><p className="mt-2 text-xs text-muted-foreground">Efficacité : {item.indicateurEfficacite}</p></div>)}</div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2"><div><label className="text-sm font-medium">Responsable</label><Input value={responsible} onChange={(e)=>setResponsible(e.target.value)} placeholder="Responsable de l'action"/></div><div><label className="text-sm font-medium">Date d'échéance</label><Input type="date" value={dueDate} onChange={(e)=>setDueDate(e.target.value)}/></div></div>
              <div className="flex items-center justify-between"><Badge variant="outline">Confiance : {aiAnalysis.niveauConfiance}</Badge><Button type="button" onClick={()=>saveAI.mutate({auditId,questionKey:action.questionKey,analysis:aiAnalysis,selectedActions:aiAnalysis.actionsCorrectivesProposees.filter((item:any)=>selectedActionIds.includes(item.id)),responsible:responsible||undefined,dueDate:dueDate?new Date(dueDate).toISOString():undefined})} disabled={saveAI.isPending||selectedActionIds.length===0}>Enregistrer le plan CAPA</Button></div>
            </div>
          )}
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Action initiale issue du corpus (hors IA)</label>
          <p className="mb-1 text-xs text-muted-foreground">Cette proposition déterministe est créée avec la fiche CAPA. Les actions réellement générées par l’IA apparaissent dans les cartes ci-dessus après analyse.</p>
          <p className="text-sm text-muted-foreground bg-muted/40 rounded p-2">{action.actionRecommandee}</p>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">
            Analyse de cause racine {action.gravite === "majeur" && <span className="text-red-600">*</span>}
          </label>
          <Textarea value={analyseCauseRacine} onChange={(e) => setAnalyseCauseRacine(e.target.value)} placeholder="Conclusion de l'analyse" />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Méthode de cause racine</label>
          <Select value={rootCauseMethod} onValueChange={setRootCauseMethod}>
            <SelectTrigger><SelectValue placeholder="Non renseigné" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="5_pourquoi">5 Pourquoi</SelectItem>
              <SelectItem value="ishikawa">Ishikawa (5M)</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isMdsap && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-l-2 border-amber-300 pl-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Gradation MDSAP (AU P0002, 1-5)</label>
              <Select value={mdsapGrade} onValueChange={setMdsapGrade}>
                <SelectTrigger><SelectValue placeholder="Non renseigné" /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((g) => (
                    <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Escalade MDSAP</label>
              <Input value={mdsapEscalation} onChange={(e) => setMdsapEscalation(e.target.value)} placeholder="Escalade applicable, si pertinente" />
            </div>
          </div>
        )}

        <div className="rounded-lg border p-4 space-y-3">
          <div><h3 className="font-semibold">Actions du dossier CAPA</h3><p className="text-xs text-muted-foreground">Chaque action possède son propre responsable, délai, statut et contrôle d'efficacité.</p></div>
          {(action.tasks||[]).map((task:any)=><div key={task.id} className="rounded border bg-slate-50 p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{task.title}</p><p className="text-xs text-muted-foreground">{task.responsible||"Responsable à attribuer"}{task.dueDate?` · ${new Date(task.dueDate).toLocaleDateString("fr-FR")}`:" · échéance à définir"}</p></div><Badge variant="outline">{task.status}</Badge></div></div>)}
          <div className="flex gap-2"><Input value={newTaskTitle} onChange={(e)=>setNewTaskTitle(e.target.value)} placeholder="Nouvelle action corrective ou préventive"/><Button type="button" disabled={newTaskTitle.trim().length<3||createTaskMutation.isPending} onClick={()=>createTaskMutation.mutate({capaId:action.id,title:newTaskTitle.trim(),priority:"moyenne"})}>Ajouter</Button></div>
          <details><summary className="cursor-pointer text-sm text-muted-foreground">Champ historique de synthèse</summary><Textarea className="mt-2" value={actionRetenue} onChange={(e) => setActionRetenue(e.target.value)} placeholder="Synthèse historique des actions" /></details>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Responsable</label>
            <Input value={responsible} onChange={(e) => setResponsible(e.target.value)} placeholder="Nom / fonction" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Échéance</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Preuve de réalisation</label>
          <Textarea value={preuveRealisation} onChange={(e) => setPreuveRealisation(e.target.value)} placeholder="Référence document / preuve que l'action a été réalisée" />
        </div>

        {action.statut === "a_verifier" && (
          <div>
            <label className="text-sm font-medium mb-1 block">Preuve d'efficacité (requise pour clôturer)</label>
            <Textarea value={preuveEfficacite} onChange={(e) => setPreuveEfficacite(e.target.value)} placeholder="Élément prouvant l'efficacité (ou l'inefficacité) de l'action" />
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap pt-2">
          <Button size="sm" variant="outline" onClick={handleSaveFields} disabled={updateMutation.isPending}>
            Enregistrer
          </Button>
          {(NEXT_STATUTS[action.statut] || []).map((next) => (
            <Button key={next} size="sm" onClick={() => handleTransition(next)} disabled={updateStatusMutation.isPending}>
              → {STATUT_LABEL[next]}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CapaPlan() {
  const { isAuthenticated, loading } = useAuth();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const auditId = params.id ? parseInt(params.id) : null;

  const { data: audit } = trpc.audit.getById.useQuery({ id: auditId! }, { enabled: isAuthenticated && !!auditId });
  const { data: actions, isLoading: actionsLoading } = trpc.capa.list.useQuery(
    { auditId: auditId! },
    { enabled: isAuthenticated && !!auditId }
  );
  const utils = trpc.useUtils();

  const generateMutation = trpc.capa.generateFromAudit.useMutation({
    onSuccess: (res) => {
      if (res.created > 0) {
        toast.success(`${res.created} action(s) générée(s) depuis les écarts de l'audit`);
      } else {
        toast.success(res.totalEcarts > 0 ? "Plan d'action déjà à jour" : "Aucun écart détecté pour le moment");
      }
      utils.capa.list.invalidate({ auditId: auditId! });
    },
    onError: (e) => toast.error(`Erreur : ${e.message}`),
  });

  if (loading || actionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const list = actions ?? [];
  const overdueCount = list.filter(
    (a: any) => a.dueDate && new Date(a.dueDate) < new Date() && !["cloturee_efficace", "cloturee_sans_suite"].includes(a.statut)
  ).length;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate(`/audits/${auditId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'audit
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Plan d'action CAPA</h1>
            <p className="text-muted-foreground">{audit?.name}</p>
          </div>
        </div>
        <Button onClick={() => generateMutation.mutate({ auditId: auditId! })} disabled={generateMutation.isPending} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Générer depuis les écarts
        </Button>
      </div>

      {list.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total des actions</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{list.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Clôturées</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-green-600">{list.filter((a: any) => a.statut === "cloturee_efficace").length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">En retard</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-red-600">{overdueCount}</div></CardContent>
          </Card>
        </div>
      )}

      {list.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <ClipboardCheck className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Aucune action pour le moment — cliquez sur "Générer depuis les écarts" pour créer le plan d'action à partir des non-conformités détectées sur cet audit.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {list.map((action: any) => (
            <ActionCard key={action.id} action={action} auditId={auditId!} />
          ))}
        </div>
      )}
    </div>
  );
}
