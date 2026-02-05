import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface KPIDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "score" | "progress" | "nonconformities";
  data: {
    score?: number;
    conforme?: number;
    total?: number;
    progress?: number;
    answered?: number;
    nok?: number;
  };
}

export function KPIDetailModal({ open, onOpenChange, type, data }: KPIDetailModalProps) {
  const renderScoreDetail = () => (
    <>
      <DialogHeader>
        <DialogTitle>📊 Score de Conformité Global</DialogTitle>
        <DialogDescription>
          Analyse détaillée de votre niveau de conformité réglementaire
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 mt-6">
        {/* Score principal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Score Actuel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="text-5xl font-bold text-primary">
                {data.score?.toFixed(1) || "0"}%
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-medium">+2.3% vs mois dernier</span>
              </div>
            </div>
            <Progress value={data.score || 0} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              {data.conforme || 0} questions conformes sur {data.total || 0} au total
            </p>
          </CardContent>
        </Card>

        {/* Répartition par statut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Répartition des Réponses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Conforme</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{data.conforme || 0}</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {data.total ? ((data.conforme || 0) / data.total * 100).toFixed(0) : 0}%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Non-conforme</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{data.nok || 0}</span>
                  <Badge variant="outline" className="bg-red-50 text-red-700">
                    {data.total ? ((data.nok || 0) / data.total * 100).toFixed(0) : 0}%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">Non répondues</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {(data.total || 0) - (data.answered || 0)}
                  </span>
                  <Badge variant="outline" className="bg-gray-50 text-gray-700">
                    {data.total ? (((data.total || 0) - (data.answered || 0)) / data.total * 100).toFixed(0) : 0}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommandations */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm text-blue-900">💡 Recommandations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Priorisez les {data.nok || 0} non-conformités pour améliorer votre score</li>
              <li>• Complétez les {(data.total || 0) - (data.answered || 0)} questions restantes</li>
              <li>• Consultez la veille réglementaire pour rester à jour</li>
            </ul>
          </CardContent>
        </Card>

        <Link href="/audit">
          <Button className="w-full">
            Accéder à l'audit complet
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </>
  );

  const renderProgressDetail = () => (
    <>
      <DialogHeader>
        <DialogTitle>📈 Progression de l'Audit</DialogTitle>
        <DialogDescription>
          Suivi détaillé de votre avancement dans le questionnaire d'audit
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 mt-6">
        {/* Progression principale */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avancement Global</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="text-5xl font-bold">
                {data.progress?.toFixed(0) || "0"}%
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold">{data.answered || 0}</div>
                <div className="text-sm text-muted-foreground">sur {data.total || 0} questions</div>
              </div>
            </div>
            <Progress value={data.progress || 0} className="h-3" />
          </CardContent>
        </Card>

        {/* Statistiques détaillées */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Statistiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Questions répondues</p>
                <p className="text-2xl font-bold">{data.answered || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Questions restantes</p>
                <p className="text-2xl font-bold">{(data.total || 0) - (data.answered || 0)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Temps estimé restant</p>
                <p className="text-2xl font-bold">
                  {Math.ceil(((data.total || 0) - (data.answered || 0)) * 2 / 60)}h
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Taux de complétion</p>
                <p className="text-2xl font-bold text-green-600">{data.progress?.toFixed(0) || "0"}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Objectif */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-sm text-green-900">🎯 Objectif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-800">
              Complétez {Math.min(20, (data.total || 0) - (data.answered || 0))} questions supplémentaires 
              cette semaine pour atteindre {Math.min(100, (data.progress || 0) + 10).toFixed(0)}% de progression.
            </p>
          </CardContent>
        </Card>

        <Link href="/audit">
          <Button className="w-full">
            Continuer l'audit
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </>
  );

  const renderNonconformitiesDetail = () => (
    <>
      <DialogHeader>
        <DialogTitle>⚠️ Non-conformités Détectées</DialogTitle>
        <DialogDescription>
          Liste des écarts identifiés nécessitant des actions correctives
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 mt-6">
        {/* Résumé */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Résumé des Non-conformités</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-red-600 mb-4">
              {data.nok || 0}
            </div>
            <p className="text-sm text-muted-foreground">
              Actions correctives requises pour atteindre la conformité
            </p>
          </CardContent>
        </Card>

        {/* Tableau des NC (exemple) */}
        {(data.nok || 0) > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Principales Non-conformités</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Processus</TableHead>
                    <TableHead>Clause</TableHead>
                    <TableHead>Criticité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Gestion des risques</TableCell>
                    <TableCell>ISO 14971 - 4.3</TableCell>
                    <TableCell>
                      <Badge variant="destructive">Majeure</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Conception</TableCell>
                    <TableCell>MDR Annexe I - 17.1</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700">Mineure</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">PMS</TableCell>
                    <TableCell>MDR Art. 83</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700">Mineure</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Recommandations */}
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-sm text-amber-900">🔧 Actions Recommandées</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-amber-800">
              <li>• Créez un plan d'actions correctives pour chaque NC</li>
              <li>• Priorisez les NC majeures qui bloquent la certification</li>
              <li>• Documentez les preuves de mise en conformité</li>
            </ul>
          </CardContent>
        </Card>

        <Link href="/audit">
          <Button className="w-full" variant="destructive">
            Voir tous les écarts
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {type === "score" && renderScoreDetail()}
        {type === "progress" && renderProgressDetail()}
        {type === "nonconformities" && renderNonconformitiesDetail()}
      </DialogContent>
    </Dialog>
  );
}
