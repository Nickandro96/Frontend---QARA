import * as React from "react";
import type { WatchUpdate } from "./types";
import { UpdateCard } from "./UpdateCard";

export function WatchFeed(props: {
  items: WatchUpdate[];
  onOpenDetails: (u: WatchUpdate) => void;
}) {
  const sorted = props.items;

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
