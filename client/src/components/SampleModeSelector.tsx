import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export type SampleMode = "rapid" | "standard" | "in_depth" | "complete";

const MODES: Array<{ value: SampleMode; label: string; detail: string }> = [
  { value: "rapid", label: "Rapide", detail: "13 à 15 questions · environ 22% couvert" },
  { value: "standard", label: "Standard", detail: "30 questions · environ 46% couvert" },
  { value: "in_depth", label: "Approfondi", detail: "50 questions · environ 77% couvert" },
  { value: "complete", label: "Complet", detail: "Toutes les questions · 100% couvert" },
];

export function SampleModeSelector({ value, onChange }: { value: SampleMode; onChange: (value: SampleMode) => void }) {
  return <div className="space-y-2"><Label>Mode d'audit *</Label><div className="grid gap-2 sm:grid-cols-2">{MODES.map((mode) => <Card key={mode.value} role="button" tabIndex={0} aria-pressed={value === mode.value} className={value === mode.value ? "cursor-pointer border-primary ring-1 ring-primary" : "cursor-pointer"} onClick={() => onChange(mode.value)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onChange(mode.value); }}><CardContent className="p-3"><div className="font-medium">{mode.label}</div><div className="text-xs text-muted-foreground">{mode.detail}</div></CardContent></Card>)}</div></div>;
}
