import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { CompanyProfile } from "./types";
import { useUpsertCompanyProfile } from "@/api/watch";

const FAMILIES: CompanyProfile["deviceFamilies"] = ["active", "non_active", "implantable", "sterile", "software", "in_vitro"];
const MARKETS: CompanyProfile["markets"] = ["EU", "CH", "UK", "US"];

export function CompanyProfilePanel(props: { profile: CompanyProfile; onSaved?: (p: CompanyProfile) => void }) {
  const [draft, setDraft] = React.useState<CompanyProfile>(props.profile);
  const upsert = useUpsertCompanyProfile();

  React.useEffect(() => setDraft(props.profile), [props.profile]);

  const toggleFamily = (f: CompanyProfile["deviceFamilies"][number]) => {
    setDraft((s) => {
      const has = s.deviceFamilies.includes(f);
      return { ...s, deviceFamilies: has ? s.deviceFamilies.filter((x) => x !== f) : [...s.deviceFamilies, f] };
    });
  };

  const toggleMarket = (m: CompanyProfile["markets"][number]) => {
    setDraft((s) => {
      const has = s.markets.includes(m);
      return { ...s, markets: has ? s.markets.filter((x) => x !== m) : [...s.markets, m] };
    });
  };

  const save = async () => {
    await upsert.mutateAsync(draft);
    props.onSaved?.(draft);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Profil entreprise (premium)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">Rôle économique</div>
            <Select value={draft.economicRole} onValueChange={(v) => setDraft((s) => ({ ...s, economicRole: v as any }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fabricant">Fabricant</SelectItem>
                <SelectItem value="importateur">Importateur</SelectItem>
                <SelectItem value="distributeur">Distributeur</SelectItem>
                <SelectItem value="sous_traitant">Sous-traitant</SelectItem>
                <SelectItem value="ar">AR (Authorized Rep)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">Classe DM</div>
            <Select value={draft.deviceClass} onValueChange={(v) => setDraft((s) => ({ ...s, deviceClass: v as any }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="I">I</SelectItem>
                <SelectItem value="IIa">IIa</SelectItem>
                <SelectItem value="IIb">IIb</SelectItem>
                <SelectItem value="III">III</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">Familles DM</div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {FAMILIES.map((f) => (
              <label key={f} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                <Checkbox checked={draft.deviceFamilies.includes(f)} onCheckedChange={() => toggleFamily(f)} />
                <span className="capitalize">{f.replace(/_/g, " ")}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">Marchés</div>
          <div className="flex flex-wrap gap-2">
            {MARKETS.map((m) => (
              <label key={m} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <Checkbox checked={draft.markets.includes(m)} onCheckedChange={() => toggleMarket(m)} />
                <span>{m}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {upsert.isPending ? <Badge variant="secondary">Enregistrement…</Badge> : <Badge variant="outline">Sauvegardé côté serveur</Badge>}
          </div>
          <Button onClick={save} disabled={upsert.isPending}>
            Sauvegarder
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
