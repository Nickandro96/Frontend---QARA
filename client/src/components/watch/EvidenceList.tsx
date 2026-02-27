import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function EvidenceList(props: { evidence: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Preuves attendues (audit)</CardTitle>
      </CardHeader>
      <CardContent>
        {props.evidence?.length ? (
          <div className="flex flex-wrap gap-2">
            {props.evidence.map((e, i) => (
              <Badge key={i} variant="secondary">
                {e}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">—</div>
        )}
      </CardContent>
    </Card>
  );
}
