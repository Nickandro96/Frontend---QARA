import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FdaDocuments() {
  const { data } = trpc.fda.getDocuments.useQuery();
  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div><h1 className="text-3xl font-bold">FDA Documents</h1><p className="text-muted-foreground mt-2">Templates prêts à adapter pour votre système documentaire.</p></div>
      <div className="grid lg:grid-cols-2 gap-4">{(data?.documents || []).map((doc: any) => <Card key={doc.slug}><CardHeader><CardTitle>{doc.title}</CardTitle></CardHeader><CardContent><div className="text-sm text-muted-foreground mb-3">{doc.category}</div><pre className="whitespace-pre-wrap text-sm">{doc.content}</pre></CardContent></Card>)}</div>
    </div>
  );
}
