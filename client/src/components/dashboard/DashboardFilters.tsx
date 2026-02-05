import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Filter,
  X,
  Calendar as CalendarIcon,
  Search,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

export interface DashboardFiltersState {
  period: string;
  startDate?: Date;
  endDate?: Date;
  sites: string[];
  processes: string[];
  referentials: string[];
  auditType: string;
  auditStatus: string;
  criticality: string[];
  actionStatus: string[];
  auditor: string;
  search: string;
}

interface DashboardFiltersProps {
  filters: DashboardFiltersState;
  onFiltersChange: (filters: DashboardFiltersState) => void;
  sites?: { id: string; name: string }[];
  processes?: { id: string; name: string }[];
  referentials?: { id: string; name: string }[];
  auditors?: { id: string; name: string }[];
  className?: string;
}

const periodOptions = [
  { value: "7d", label: "7 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
  { value: "90d", label: "90 derniers jours" },
  { value: "12m", label: "12 derniers mois" },
  { value: "ytd", label: "Année en cours" },
  { value: "custom", label: "Personnalisé" },
];

const auditTypeOptions = [
  { value: "all", label: "Tous les types" },
  { value: "internal", label: "Interne" },
  { value: "external", label: "Externe" },
  { value: "supplier", label: "Fournisseur" },
  { value: "certification", label: "Certification" },
  { value: "surveillance", label: "Surveillance" },
  { value: "blanc", label: "Audit blanc" },
];

const auditStatusOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "draft", label: "Brouillon" },
  { value: "in_progress", label: "En cours" },
  { value: "completed", label: "Terminé" },
  { value: "closed", label: "Clôturé" },
];

const criticalityOptions = [
  { value: "critical", label: "Critique", color: "bg-red-500" },
  { value: "high", label: "Haute", color: "bg-orange-500" },
  { value: "medium", label: "Moyenne", color: "bg-yellow-500" },
  { value: "low", label: "Basse", color: "bg-green-500" },
];

const actionStatusOptions = [
  { value: "open", label: "Ouvert" },
  { value: "in_progress", label: "En cours" },
  { value: "completed", label: "Terminé" },
  { value: "verified", label: "Vérifié" },
  { value: "overdue", label: "En retard" },
];

export function DashboardFilters({
  filters,
  onFiltersChange,
  sites = [],
  processes = [],
  referentials = [],
  auditors = [],
  className,
}: DashboardFiltersProps) {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const [showCustomDate, setShowCustomDate] = useState(filters.period === "custom");

  // Parse URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const urlFilters: Partial<DashboardFiltersState> = {};

    if (params.get("period")) urlFilters.period = params.get("period")!;
    if (params.get("sites")) urlFilters.sites = params.get("sites")!.split(",");
    if (params.get("processes")) urlFilters.processes = params.get("processes")!.split(",");
    if (params.get("referentials")) urlFilters.referentials = params.get("referentials")!.split(",");
    if (params.get("auditType")) urlFilters.auditType = params.get("auditType")!;
    if (params.get("auditStatus")) urlFilters.auditStatus = params.get("auditStatus")!;
    if (params.get("criticality")) urlFilters.criticality = params.get("criticality")!.split(",");
    if (params.get("actionStatus")) urlFilters.actionStatus = params.get("actionStatus")!.split(",");
    if (params.get("search")) urlFilters.search = params.get("search")!;

    if (Object.keys(urlFilters).length > 0) {
      onFiltersChange({ ...filters, ...urlFilters });
    }
  }, []);

  // Update URL when filters change
  const updateFilters = (newFilters: Partial<DashboardFiltersState>) => {
    const updated = { ...filters, ...newFilters };
    onFiltersChange(updated);

    // Build URL params
    const params = new URLSearchParams();
    if (updated.period !== "30d") params.set("period", updated.period);
    if (updated.sites.length > 0) params.set("sites", updated.sites.join(","));
    if (updated.processes.length > 0) params.set("processes", updated.processes.join(","));
    if (updated.referentials.length > 0) params.set("referentials", updated.referentials.join(","));
    if (updated.auditType !== "all") params.set("auditType", updated.auditType);
    if (updated.auditStatus !== "all") params.set("auditStatus", updated.auditStatus);
    if (updated.criticality.length > 0) params.set("criticality", updated.criticality.join(","));
    if (updated.actionStatus.length > 0) params.set("actionStatus", updated.actionStatus.join(","));
    if (updated.search) params.set("search", updated.search);

    const queryString = params.toString();
    setLocation(queryString ? `?${queryString}` : "", { replace: true });
  };

  const handlePeriodChange = (value: string) => {
    setShowCustomDate(value === "custom");
    
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    const now = new Date();

    switch (value) {
      case "7d":
        startDate = subDays(now, 7);
        endDate = now;
        break;
      case "30d":
        startDate = subDays(now, 30);
        endDate = now;
        break;
      case "90d":
        startDate = subDays(now, 90);
        endDate = now;
        break;
      case "12m":
        startDate = subMonths(now, 12);
        endDate = now;
        break;
      case "ytd":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
    }

    updateFilters({ period: value, startDate, endDate });
  };

  const handleMultiSelect = (
    field: "sites" | "processes" | "referentials" | "criticality" | "actionStatus",
    value: string,
    checked: boolean
  ) => {
    const current = filters[field];
    const updated = checked
      ? [...current, value]
      : current.filter((v) => v !== value);
    updateFilters({ [field]: updated });
  };

  const handleSelectAll = (
    field: "sites" | "processes" | "referentials",
    options: { id: string }[]
  ) => {
    const allIds = options.map((o) => o.id);
    const isAllSelected = allIds.every((id) => filters[field].includes(id));
    updateFilters({ [field]: isAllSelected ? [] : allIds });
  };

  const clearFilters = () => {
    const defaultFilters: DashboardFiltersState = {
      period: "30d",
      sites: [],
      processes: [],
      referentials: [],
      auditType: "all",
      auditStatus: "all",
      criticality: [],
      actionStatus: [],
      auditor: "",
      search: "",
    };
    onFiltersChange(defaultFilters);
    setLocation("", { replace: true });
    setShowCustomDate(false);
  };

  const activeFiltersCount = [
    filters.sites.length > 0,
    filters.processes.length > 0,
    filters.referentials.length > 0,
    filters.auditType !== "all",
    filters.auditStatus !== "all",
    filters.criticality.length > 0,
    filters.actionStatus.length > 0,
    filters.search.length > 0,
  ].filter(Boolean).length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main filter bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg">
        {/* Period selector */}
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <Select value={filters.period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom date range */}
        {showCustomDate && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                {filters.startDate && filters.endDate
                  ? `${format(filters.startDate, "dd/MM/yyyy")} - ${format(filters.endDate, "dd/MM/yyyy")}`
                  : "Sélectionner les dates"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{
                  from: filters.startDate,
                  to: filters.endDate,
                }}
                onSelect={(range) => {
                  updateFilters({
                    startDate: range?.from,
                    endDate: range?.to,
                  });
                }}
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        )}

        {/* Sites multi-select */}
        {sites.length > 0 && (
          <MultiSelectFilter
            label="Sites"
            options={sites}
            selected={filters.sites}
            onSelect={(id, checked) => handleMultiSelect("sites", id, checked)}
            onSelectAll={() => handleSelectAll("sites", sites)}
          />
        )}

        {/* Processes multi-select */}
        {processes.length > 0 && (
          <MultiSelectFilter
            label="Processus"
            options={processes}
            selected={filters.processes}
            onSelect={(id, checked) => handleMultiSelect("processes", id, checked)}
            onSelectAll={() => handleSelectAll("processes", processes)}
          />
        )}

        {/* Referentials multi-select */}
        {referentials.length > 0 && (
          <MultiSelectFilter
            label="Référentiels"
            options={referentials}
            selected={filters.referentials}
            onSelect={(id, checked) => handleMultiSelect("referentials", id, checked)}
            onSelectAll={() => handleSelectAll("referentials", referentials)}
          />
        )}

        {/* Audit type */}
        <Select
          value={filters.auditType}
          onValueChange={(value) => updateFilters({ auditType: value })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type audit" />
          </SelectTrigger>
          <SelectContent>
            {auditTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Audit status */}
        <Select
          value={filters.auditStatus}
          onValueChange={(value) => updateFilters({ auditStatus: value })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Statut audit" />
          </SelectTrigger>
          <SelectContent>
            {auditStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Clear filters */}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Effacer ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Active filters badges */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.sites.map((siteId) => {
            const site = sites.find((s) => s.id === siteId);
            return (
              <Badge key={siteId} variant="secondary" className="gap-1">
                Site: {site?.name || siteId}
                <button
                  onClick={() => handleMultiSelect("sites", siteId, false)}
                  className="hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          {filters.processes.map((processId) => {
            const process = processes.find((p) => p.id === processId);
            return (
              <Badge key={processId} variant="secondary" className="gap-1">
                Processus: {process?.name || processId}
                <button
                  onClick={() => handleMultiSelect("processes", processId, false)}
                  className="hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          {filters.referentials.map((refId) => {
            const ref = referentials.find((r) => r.id === refId);
            return (
              <Badge key={refId} variant="secondary" className="gap-1">
                Référentiel: {ref?.name || refId}
                <button
                  onClick={() => handleMultiSelect("referentials", refId, false)}
                  className="hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Multi-select dropdown component
interface MultiSelectFilterProps {
  label: string;
  options: { id: string; name: string }[];
  selected: string[];
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: () => void;
}

function MultiSelectFilter({
  label,
  options,
  selected,
  onSelect,
  onSelectAll,
}: MultiSelectFilterProps) {
  const isAllSelected = options.every((o) => selected.includes(o.id));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Filter className="h-4 w-4" />
          {label}
          {selected.length > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0">
              {selected.length}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Checkbox
              id="select-all"
              checked={isAllSelected}
              onCheckedChange={onSelectAll}
            />
            <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              Tout sélectionner
            </Label>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {options.map((option) => (
              <div key={option.id} className="flex items-center gap-2">
                <Checkbox
                  id={option.id}
                  checked={selected.includes(option.id)}
                  onCheckedChange={(checked) => onSelect(option.id, !!checked)}
                />
                <Label
                  htmlFor={option.id}
                  className="text-sm cursor-pointer truncate"
                >
                  {option.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default DashboardFilters;
