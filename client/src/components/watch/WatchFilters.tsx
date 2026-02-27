import * as React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type WatchFiltersValue = {
  search: string;
  type: "ALL" | "REGULATION" | "GUIDANCE" | "STANDARD" | "QUALITY";
  impact: "ALL" | "Low" | "Medium" | "High" | "Critical";
  status: "ALL" | "NEW" | "UPDATED" | "REPEALED" | "CORRIGENDUM";
};

export function WatchFilters(props: {
  value: WatchFiltersValue;
  onChange: (v: WatchFiltersValue) => void;
  onReset: () => void;
}) {
  const v = props.value;

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="md:col-span-2">
          <Input
            placeholder="Rechercher (titre, résumé, tags)"
            value={v.search}
            onChange={(e) => props.onChange({ ...v, search: e.target.value })}
          />
        </div>

        <Select value={v.type} onValueChange={(type) => props.onChange({ ...v, type: type as any })}>
          <SelectTrigger>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous types</SelectItem>
            <SelectItem value="REGULATION">Règlement / actes UE</SelectItem>
            <SelectItem value="GUIDANCE">Guidance (MDCG)</SelectItem>
            <SelectItem value="STANDARD">Normes harmonisées</SelectItem>
            <SelectItem value="QUALITY">Qualité (ISO/IAF)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={v.impact} onValueChange={(impact) => props.onChange({ ...v, impact: impact as any })}>
          <SelectTrigger>
            <SelectValue placeholder="Impact" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous impacts</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Select value={v.status} onValueChange={(status) => props.onChange({ ...v, status: status as any })}>
          <SelectTrigger className="md:w-[260px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous statuts</SelectItem>
            <SelectItem value="NEW">Nouveau</SelectItem>
            <SelectItem value="UPDATED">Mis à jour</SelectItem>
            <SelectItem value="CORRIGENDUM">Corrigendum</SelectItem>
            <SelectItem value="REPEALED">Abrogé</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="secondary" onClick={props.onReset}>
          Réinitialiser
        </Button>
      </div>
    </div>
  );
}
