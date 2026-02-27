import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WatchActionItem } from "./types";

export function ActionsChecklist(props: { actions: WatchActionItem[] }) {
  const [checked, setChecked] = React.useState<Record<string, boolean>>({});

  const toggle = (id: string) => setChecked((s) => ({ ...s, [id]: !s[id] }));

  if (!props.actions?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Actions recommandées</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Aucune action générée (domaines non détectés).</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Actions recommandées</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {props.actions.map((a) => (
          <div key={a.id} className="rounded-md border p-3">
            <div className="flex items-start gap-3">
              <Checkbox checked={!!checked[a.id]} onCheckedChange={() => toggle(a.id)} />
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-sm">{a.title}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Owner: {a.owner}</Badge>
                    <Badge variant="outline">D+{a.dueDays}</Badge>
                  </div>
                </div>

                {a.deliverables?.length ? (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-muted-foreground">Livrables</div>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                      {a.deliverables.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {a.expectedEvidence?.length ? (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-muted-foreground">Preuves attendues</div>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                      {a.expectedEvidence.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
