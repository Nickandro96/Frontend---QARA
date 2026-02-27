import * as React from "react";
import type { WatchUpdate } from "./types";
import { UpdateCard } from "./UpdateCard";

function sortByImpactThenDate(items: WatchUpdate[]): WatchUpdate[] {
  const rank = (l: string) => (l === "Critical" ? 4 : l === "High" ? 3 : l === "Medium" ? 2 : 1);
  return [...items].sort((a, b) => {
    const r = rank(b.impactLevel) - rank(a.impactLevel);
    if (r !== 0) return r;
    const da = new Date(a.publishedAt as any).getTime();
    const db = new Date(b.publishedAt as any).getTime();
    return (isNaN(db) ? 0 : db) - (isNaN(da) ? 0 : da);
  });
}

export function WatchFeed(props: {
  items: WatchUpdate[];
  onOpenDetails: (u: WatchUpdate) => void;
}) {
  const sorted = React.useMemo(() => sortByImpactThenDate(props.items), [props.items]);

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
        Aucune mise à jour pour ces filtres.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {sorted.map((u) => (
        <UpdateCard key={u.id} update={u} onOpen={() => props.onOpenDetails(u)} />
      ))}
    </div>
  );
}
