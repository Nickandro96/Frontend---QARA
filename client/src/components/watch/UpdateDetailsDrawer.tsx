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
            <div className="rounded-lg border bg-card p-4 text-sm whitespace-pre-wrap">{u.summaryLong}</div>
            <ImpactPanel update={u} />

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
