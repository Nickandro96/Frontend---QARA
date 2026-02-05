import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface ScoreTrendData {
  month: string;
  score: number;
}

export function ScoreTrendChart({ data: propData }: { data?: ScoreTrendData[] }) {
  // Données d'exemple pour les 6 derniers mois (fallback)
  const defaultData = [
    { month: "Juil", score: 65 },
    { month: "Août", score: 68 },
    { month: "Sept", score: 72 },
    { month: "Oct", score: 75 },
    { month: "Nov", score: 80 },
    { month: "Déc", score: 87 },
  ];
  
  // Format month from YYYY-MM to short name
  const formatMonth = (monthStr: string) => {
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
    const [, month] = monthStr.split("-");
    return months[parseInt(month) - 1] || monthStr;
  };
  
  const data = propData
    ? propData.map(d => ({ month: formatMonth(d.month), score: d.score }))
    : defaultData;

  const maxScore = 100;
  const minScore = 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Évolution du Score de Conformité</CardTitle>
            <CardDescription>Progression sur les 6 derniers mois</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm font-medium">+22% depuis juillet</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 relative">
          {/* Grille horizontale */}
          <div className="absolute inset-0 flex flex-col justify-between text-xs text-muted-foreground">
            <div className="flex items-center">
              <span className="w-8">{maxScore}%</span>
              <div className="flex-1 border-t border-dashed border-gray-200 ml-2" />
            </div>
            <div className="flex items-center">
              <span className="w-8">75%</span>
              <div className="flex-1 border-t border-dashed border-gray-200 ml-2" />
            </div>
            <div className="flex items-center">
              <span className="w-8">50%</span>
              <div className="flex-1 border-t border-dashed border-gray-200 ml-2" />
            </div>
            <div className="flex items-center">
              <span className="w-8">25%</span>
              <div className="flex-1 border-t border-dashed border-gray-200 ml-2" />
            </div>
            <div className="flex items-center">
              <span className="w-8">{minScore}%</span>
              <div className="flex-1 border-t border-dashed border-gray-200 ml-2" />
            </div>
          </div>

          {/* Graphique */}
          <svg className="absolute inset-0 w-full h-full" style={{ paddingLeft: "2.5rem" }}>
            {/* Ligne de tendance */}
            <polyline
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              points={data
                .map((point, index) => {
                  const x = (index / (data.length - 1)) * 100;
                  const y = 100 - (point.score / maxScore) * 100;
                  return `${x}%,${y}%`;
                })
                .join(" ")}
            />

            {/* Points */}
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - (point.score / maxScore) * 100;
              return (
                <g key={index}>
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="5"
                    fill="hsl(var(--primary))"
                    className="cursor-pointer hover:r-7 transition-all"
                  />
                  <text
                    x={`${x}%`}
                    y={`${y}%`}
                    dy="-12"
                    textAnchor="middle"
                    className="text-xs font-semibold fill-primary"
                  >
                    {point.score}%
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Labels des mois */}
          <div className="absolute bottom-0 left-10 right-0 flex justify-between text-xs text-muted-foreground">
            {data.map((point, index) => (
              <span key={index}>{point.month}</span>
            ))}
          </div>
        </div>

        {/* Légende */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-900">
            <strong>📈 Excellente progression !</strong> Votre score a augmenté de 22 points en 6 mois.
            Continuez à répondre aux questions et à corriger les non-conformités pour atteindre 100%.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
