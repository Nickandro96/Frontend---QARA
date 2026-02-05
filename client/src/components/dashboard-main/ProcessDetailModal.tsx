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
import { CheckCircle2, XCircle, Clock, ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "wouter";

interface ProcessDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  process: {
    id: number;
    name: string;
    description?: string;
  } | null;
  score?: {
    score: number;
    conforme: number;
    nok: number;
    answered: number;
    total: number;
    progress: number;
  };
}

export function ProcessDetailModal({ open, onOpenChange, process, score }: ProcessDetailModalProps) {
  if (!process) return null;

  // Données d'exemple pour les questions par clause
  const clauseData = [
    { clause: "4.1 - Exigences générales", conforme: 8, nok: 2, total: 10, score: 80 },
    { clause: "4.2 - Documentation", conforme: 12, nok: 1, total: 13, score: 92 },
    { clause: "4.3 - Gestion des enregistrements", conforme: 6, nok: 3, total: 9, score: 67 },
    { clause: "5.1 - Responsabilité de la direction", conforme: 10, nok: 0, total: 10, score: 100 },
    { clause: "5.2 - Orientation client", conforme: 4, nok: 1, total: 5, score: 80 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📋 {process.name}</DialogTitle>
          <DialogDescription>
            Analyse détaillée de la conformité pour ce processus métier
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Score principal */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Score Global</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {score?.score.toFixed(0) || "0"}%
                </div>
                <Progress value={score?.score || 0} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Progression</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {score?.progress.toFixed(0) || "0"}%
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {score?.answered || 0}/{score?.total || 0} questions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Non-conformités</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {score?.nok || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Actions requises
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Répartition des réponses */}
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
                    <span className="font-semibold">{score?.conforme || 0}</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {score?.total ? ((score?.conforme || 0) / score.total * 100).toFixed(0) : 0}%
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Non-conforme</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{score?.nok || 0}</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      {score?.total ? ((score?.nok || 0) / score.total * 100).toFixed(0) : 0}%
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
                      {(score?.total || 0) - (score?.answered || 0)}
                    </span>
                    <Badge variant="outline" className="bg-gray-50 text-gray-700">
                      {score?.total ? (((score?.total || 0) - (score?.answered || 0)) / score.total * 100).toFixed(0) : 0}%
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Détail par clause */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Conformité par Clause</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clause</TableHead>
                    <TableHead className="text-center">Conforme</TableHead>
                    <TableHead className="text-center">NC</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clauseData.map((clause, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{clause.clause}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {clause.conforme}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          {clause.nok}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{clause.total}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={clause.score} className="h-2 w-20" />
                          <span className="text-sm font-semibold">{clause.score}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Tendance */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm text-blue-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Tendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-800">
                Le score de ce processus a augmenté de <strong>+5.2%</strong> au cours des 30 derniers jours.
                Continuez sur cette lancée pour atteindre 100% de conformité.
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Link href={`/audit?processId=${process.id}`} className="flex-1">
              <Button className="w-full">
                Continuer l'audit de ce processus
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
