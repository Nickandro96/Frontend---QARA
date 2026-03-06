import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FdaReports() {
  const [, setLocation] = useLocation();
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const auditId = Number(search?.get("auditId") || 0);
  const { data } = trpc.fda.getReports.useQuery({ auditId }, { enabled: auditId > 0 });
  return <div className="container py-8">{!auditId ? <Card><CardContent className="pt-6">Sélectionnez un audit FDA depuis le dashboard.</CardContent></Card> : <Card><CardHeader><CardTitle>FDA Report Snapshot</CardTitle></CardHeader><CardContent><pre className="whitespace-pre-wrap text-sm">{JSON.stringify(data, null, 2)}</pre></CardContent></Card>}</div>;
}
