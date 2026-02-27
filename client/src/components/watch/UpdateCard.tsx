import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WatchUpdate } from "./types";

function formatDate(d: string | Date): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return isNaN(dt.getTime()) ? "" : dt.toLocaleDateString();
}

function impactVariant(impact: WatchUpdate["impactLevel"]): "default" | "secondary" | "destructive" {
  if (impact === "Critical") return "destructive";
  if (impact === "High") return "default";
  return "secondary";
}

export function UpdateCard(props: { update: WatchUpdate; onOpen: () => void }) {
  const u = props.update;
  const personalized = u.personalizedImpact;

  return (
    <Card className="transition hover:shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={impactVariant(u.impactLevel)}>{u.impactLevel}</Badge>
            <Badge variant="outline">{u.type}</Badge>
            <Badge variant="outline">{u.status}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">{formatDate(u.publishedAt)}</div>
        </div>
        <CardTitle className="text-base leading-snug">{u.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{u.summaryShort}</p>

        {personalized ? (
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium">Impact pour votre profil</div>
              <Badge variant={impactVariant(personalized.impactLevel)}>{personalized.impactLevel}</Badge>
            </div>
            <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
              {personalized.reasons.join(" • ")}
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Source: <span className="font-medium">{u.sourceName}</span>
          </div>
          <Button size="sm" onClick={props.onOpen}>
            Détails
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
