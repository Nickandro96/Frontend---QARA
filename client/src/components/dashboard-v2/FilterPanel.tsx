import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface DashboardFilters {
  market?: "eu" | "us" | "all";
  referentialIds?: number[];
  economicRole?: "fabricant" | "importateur" | "distributeur" | "all";
  period?: {
    start: Date;
    end: Date;
  };
  siteId?: number;
  auditStatus?: "draft" | "in_progress" | "completed" | "closed" | "all";
  criticality?: "critical" | "high" | "medium" | "low" | "all";
}

interface FilterPanelProps {
  onFiltersChange: (filters: DashboardFilters) => void;
  initialFilters?: DashboardFilters;
}

export function FilterPanel({ onFiltersChange, initialFilters }: FilterPanelProps) {
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters || {
    market: "all",
    economicRole: "all",
    auditStatus: "all",
    criticality: "all"
  });

  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = <K extends keyof DashboardFilters>(
    key: K,
    value: DashboardFilters[K]
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters: DashboardFilters = {
      market: "all",
      economicRole: "all",
      auditStatus: "all",
      criticality: "all"
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters = 
    filters.market !== "all" ||
    filters.economicRole !== "all" ||
    filters.auditStatus !== "all" ||
    filters.criticality !== "all" ||
    filters.period ||
    filters.siteId;

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Filtres</h3>
          {hasActiveFilters && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              Actifs
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X className="h-4 w-4 mr-1" />
              Réinitialiser
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? "Masquer" : "Afficher"}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Marché */}
          <div>
            <label className="text-sm font-medium mb-2 block">Marché</label>
            <Select
              value={filters.market || "all"}
              onValueChange={(value) => updateFilter("market", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les marchés</SelectItem>
                <SelectItem value="eu">Union Européenne</SelectItem>
                <SelectItem value="us">États-Unis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rôle économique */}
          <div>
            <label className="text-sm font-medium mb-2 block">Rôle économique</label>
            <Select
              value={filters.economicRole || "all"}
              onValueChange={(value) => updateFilter("economicRole", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="fabricant">Fabricant</SelectItem>
                <SelectItem value="importateur">Importateur</SelectItem>
                <SelectItem value="distributeur">Distributeur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Statut audit */}
          <div>
            <label className="text-sm font-medium mb-2 block">Statut audit</label>
            <Select
              value={filters.auditStatus || "all"}
              onValueChange={(value) => updateFilter("auditStatus", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="closed">Clôturé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Criticité */}
          <div>
            <label className="text-sm font-medium mb-2 block">Criticité</label>
            <Select
              value={filters.criticality || "all"}
              onValueChange={(value) => updateFilter("criticality", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les criticités</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Période */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-2 block">Période</label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.period?.start ? (
                      format(filters.period.start, "dd MMM yyyy", { locale: fr })
                    ) : (
                      "Date début"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.period?.start}
                    onSelect={(date) => {
                      if (date) {
                        updateFilter("period", {
                          start: date,
                          end: filters.period?.end || new Date()
                        });
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.period?.end ? (
                      format(filters.period.end, "dd MMM yyyy", { locale: fr })
                    ) : (
                      "Date fin"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.period?.end}
                    onSelect={(date) => {
                      if (date) {
                        updateFilter("period", {
                          start: filters.period?.start || new Date(new Date().setMonth(new Date().getMonth() - 6)),
                          end: date
                        });
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
