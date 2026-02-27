import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WatchUpdate } from "./types";

export function ImpactPanel(props: { update: WatchUpdate }) {
  const u = props.update;
  const p = u.personalizedImpact;

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Impact & périmètre</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{u.type}</Badge>
            <Badge variant="outline">{u.status}</Badge>
            <Badge>{u.impactLevel}</Badge>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground">Domaines impactés</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {u.impactedDomains?.length ? (
                u.impactedDomains.map((d) => (
                  <Badge key={d} variant="secondary">
                    {d}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground">Rôles impactés</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {u.impactedRoles?.length ? (
                u.impactedRoles.map((r) => (
                  <Badge key={r} variant="secondary">
                    {r}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {p ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Impact personnalisé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Niveau d’impact</span>
              <Badge>{p.impactLevel}</Badge>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {p.reasons.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
