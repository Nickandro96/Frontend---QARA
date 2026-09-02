import { Card } from "@/components/ui/card";

export type BenchmarkData={available:boolean;cohortSize:number;minimumCohortSize:number;userNcRate:number|null;cohortMedianNcRate:number|null;percentile:number|null;message:string};
export function BenchmarkPanel({data}:{data:BenchmarkData|undefined}){
 if(!data)return <Card className="p-6"><p className="text-sm text-muted-foreground">Chargement du benchmark anonymisé…</p></Card>;
 if(!data.available)return <Card className="p-6"><p className="font-medium">Cohorte encore insuffisante</p><p className="mt-2 text-sm text-muted-foreground">{data.message}</p><p className="mt-3 text-xs">{data.cohortSize}/{data.minimumCohortSize} organisations éligibles. Aucun résultat individuel n'est exposé.</p></Card>;
 const favorable=(data.userNcRate??0)<=(data.cohortMedianNcRate??0);
 return <Card className="p-6"><div className="grid gap-4 sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Votre taux de NC</p><p className="mt-1 text-2xl font-bold">{data.userNcRate}%</p></div><div><p className="text-xs text-muted-foreground">Médiane de la cohorte</p><p className="mt-1 text-2xl font-bold">{data.cohortMedianNcRate}%</p></div><div><p className="text-xs text-muted-foreground">Position percentile</p><p className="mt-1 text-2xl font-bold">P{data.percentile}</p></div></div><p className={`mt-5 rounded-lg p-3 text-sm ${favorable?"bg-emerald-50 text-emerald-800":"bg-amber-50 text-amber-900"}`}>{favorable?"Votre taux de NC est inférieur ou égal à la médiane de la cohorte.":"Votre taux de NC est supérieur à la médiane : priorisez les processus les plus défaillants."}</p><p className="mt-3 text-xs text-muted-foreground">{data.message} Cohorte : {data.cohortSize} organisations.</p></Card>;
}
