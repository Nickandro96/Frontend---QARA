import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ImpactPanel } from "./ImpactPanel";
import { ActionsChecklist } from "./ActionsChecklist";
import { EvidenceList } from "./EvidenceList";
import type { WatchUpdate } from "./types";

export function UpdateDetailsDrawer(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  update: WatchUpdate | null;
}) {
  const u = props.update;

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="space-y-2">
          <SheetTitle className="text-base leading-snug">{u?.title ?? "Détails"}</SheetTitle>
          {u?.aiAnalyzed ? <span className="w-fit rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700">Analysé par IA</span> : null}
          {u ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{u.sourceName}</span>
              <span>•</span>
              <a className="underline" href={u.sourceUrl} target="_blank" rel="noreferrer">
                Ouvrir la source
              </a>
            </div>
          ) : null}
        </SheetHeader>

        {u ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border bg-card p-4 text-sm whitespace-pre-wrap">{u.summaryFr || u.summaryLong}</div>
            {u.aiAnalyzed ? (
              <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs text-violet-950">
                <strong>Résumé généré par analyse IA.</strong> Document officiel publié le {u.publishedAt ? new Date(u.publishedAt).toLocaleDateString("fr-FR") : "date non renseignée"} par {u.sourceName}. Cette analyse ne remplace pas la lecture du document original.{" "}
                <a className="font-medium underline" href={u.sourceUrl} target="_blank" rel="noreferrer">Consulter le document original ↗</a>
              </div>
            ) : null}
            <div className="rounded-lg border bg-card p-4 text-sm">
              <div className="font-medium">Provenance</div>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                <dt>Source officielle</dt><dd><a className="underline" href={u.sourceUrl} target="_blank" rel="noreferrer">{u.sourceName}</a></dd>
                <dt>Identifiant officiel</dt><dd>{u.officialId ?? "Non renseigné"}</dd>
                <dt>Date officielle</dt><dd>{u.publishedAt ? new Date(u.publishedAt).toLocaleDateString("fr-FR") : "Non disponible"}</dd>
                <dt>Collecte QARA</dt><dd>{u.retrievedAt ? new Date(u.retrievedAt).toLocaleString("fr-FR") : "Non disponible"}</dd>
                <dt>Langue source</dt><dd>{u.languageSource ?? "Non renseignée"}</dd>
                <dt>Licence commerciale</dt><dd>{u.licenceVerified ? "Confirmée" : "Non vérifiée"}</dd>
              </dl>
            </div>
            {u.aiAnalyzed ? <div className="rounded-lg border bg-card p-4 text-xs"><div className="font-medium">Analyse IA</div><div>Modèle : {u.aiModelVersion ?? "Non renseigné"}</div><div>Date : {u.aiAnalysisDate ? new Date(u.aiAnalysisDate).toLocaleString("fr-FR") : "Non renseignée"}</div></div> : null}
            <div className="rounded-lg border bg-card p-4 text-xs"><div className="font-medium">Impact réglementaire</div><div className="mt-2 flex flex-wrap gap-1">{[...(u.referentialsImpacted??[]),...(u.marketsImpacted??[]),...(u.rolesImpacted??[])].map((v)=><span key={v} className="rounded bg-muted px-2 py-1">{v}</span>)}</div>{u.dueDate ? <div className="mt-2">Échéance : {new Date(u.dueDate).toLocaleDateString("fr-FR")}</div> : null}</div>
            <ImpactPanel update={u} />
            {u.keyChanges?.length ? <div className="rounded-lg border bg-card p-4"><div className="text-sm font-medium">Changements clés</div><ul className="mt-2 list-disc pl-5 text-sm">{u.keyChanges.map((change)=><li key={change}>{change}</li>)}</ul></div> : null}
            {u.actionRequired ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm"><div className="font-medium text-red-800">Action requise</div><p className="mt-1">{u.actionRequired}</p><Button className="mt-3" asChild><a href={`/improvement/capa?watchItemId=${u.id}`}>Créer une CAPA depuis cette alerte</a></Button></div> : null}

            <Separator />

            <ActionsChecklist actions={u.recommendedActions ?? []} />
            <EvidenceList evidence={u.expectedEvidence ?? []} />

            {u.risks?.length ? (
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm font-medium">Risques en cas de non-conformité</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {u.risks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => props.onOpenChange(false)}>
                Fermer
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 text-sm text-muted-foreground">Sélectionnez une update.</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
