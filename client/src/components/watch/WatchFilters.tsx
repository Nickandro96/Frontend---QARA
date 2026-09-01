import * as React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type WatchFiltersValue = {
  search: string;
  type: "ALL" | "REGULATION" | "GUIDANCE" | "STANDARD" | "QUALITY";
  impact: "ALL" | "Low" | "Medium" | "High" | "Critical";
  status: "ALL" | "NEW" | "UPDATED" | "REPEALED" | "CORRIGENDUM";
  market: string; role: string; sourceId: string; readStatus: "all"|"read"|"unread"; sortBy: "date"|"criticality"|"relevance";
  analysisStatus: "all"|"analyzed"|"pending"; actionRequiredOnly: boolean;
};

export function WatchFilters(props: {
  value: WatchFiltersValue;
  onChange: (v: WatchFiltersValue) => void;
  onReset: () => void;
  sources?: {id:string;name:string}[];
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
        <Button variant={v.actionRequiredOnly ? "default" : "outline"} onClick={() => props.onChange({ ...v, actionRequiredOnly: !v.actionRequiredOnly })}>Action requise</Button>
        <Select value={v.analysisStatus} onValueChange={(analysisStatus)=>props.onChange({...v,analysisStatus:analysisStatus as any})}><SelectTrigger><SelectValue placeholder="Analyse IA"/></SelectTrigger><SelectContent><SelectItem value="all">Toutes analyses</SelectItem><SelectItem value="pending">À analyser</SelectItem><SelectItem value="analyzed">Analysées</SelectItem></SelectContent></Select>
        <Select value={v.market} onValueChange={(market)=>props.onChange({...v,market})}><SelectTrigger><SelectValue placeholder="Marché"/></SelectTrigger><SelectContent>{[["ALL","Tous marchés"],["EU","UE"],["USA","USA"],["UK","UK"],["CA","Canada"],["AU","Australie"],["BR","Brésil"],["JP","Japon"],["CH","Suisse"]].map(([x,l])=><SelectItem key={x} value={x}>{l}</SelectItem>)}</SelectContent></Select>
        <Select value={v.role} onValueChange={(role)=>props.onChange({...v,role})}><SelectTrigger><SelectValue placeholder="Rôle"/></SelectTrigger><SelectContent>{[["ALL","Tous rôles"],["fabricant","Fabricant"],["importateur","Importateur"],["distributeur","Distributeur"],["mandataire","Mandataire"]].map(([x,l])=><SelectItem key={x} value={x}>{l}</SelectItem>)}</SelectContent></Select>
        <Select value={v.sourceId} onValueChange={(sourceId)=>props.onChange({...v,sourceId})}><SelectTrigger><SelectValue placeholder="Source"/></SelectTrigger><SelectContent><SelectItem value="ALL">Toutes sources</SelectItem>{props.sources?.map(s=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
        <Select value={v.readStatus} onValueChange={(readStatus)=>props.onChange({...v,readStatus:readStatus as any})}><SelectTrigger><SelectValue placeholder="Lecture"/></SelectTrigger><SelectContent><SelectItem value="all">Tous</SelectItem><SelectItem value="unread">Non lus</SelectItem><SelectItem value="read">Lus</SelectItem></SelectContent></Select>
        <Select value={v.sortBy} onValueChange={(sortBy)=>props.onChange({...v,sortBy:sortBy as any})}><SelectTrigger><SelectValue placeholder="Tri"/></SelectTrigger><SelectContent><SelectItem value="date">Plus récent</SelectItem><SelectItem value="criticality">Criticité</SelectItem><SelectItem value="relevance">Pertinence</SelectItem></SelectContent></Select>
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
