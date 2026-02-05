import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "wouter";

export interface FiltersState {
  period?: string;
  startDate?: Date;
  endDate?: Date;
  siteIds?: string[];
  processIds?: string[];
  referentialIds?: string[];
  auditType?: string;
  status?: string;
  search?: string;
}

/**
 * Hook to persist dashboard filters in URL query parameters
 * Enables shareable deep links with pre-applied filters
 */
export function useFiltersPersistence(defaultFilters: FiltersState = {}) {
  const [location] = useLocation();
  const navigate = useNavigate();
  const [filters, setFiltersState] = useState<FiltersState>(defaultFilters);
  const [isInitialized, setIsInitialized] = useState(false);

  // Parse filters from URL on mount
  useEffect(() => {
    if (isInitialized) return;

    const params = new URLSearchParams(window.location.search);
    const urlFilters: FiltersState = {};

    // Parse period
    const period = params.get("period");
    if (period) urlFilters.period = period;

    // Parse dates
    const startDate = params.get("startDate");
    if (startDate) urlFilters.startDate = new Date(startDate);

    const endDate = params.get("endDate");
    if (endDate) urlFilters.endDate = new Date(endDate);

    // Parse array filters
    const siteIds = params.get("siteIds");
    if (siteIds) urlFilters.siteIds = siteIds.split(",");

    const processIds = params.get("processIds");
    if (processIds) urlFilters.processIds = processIds.split(",");

    const referentialIds = params.get("referentialIds");
    if (referentialIds) urlFilters.referentialIds = referentialIds.split(",");

    // Parse string filters
    const auditType = params.get("auditType");
    if (auditType) urlFilters.auditType = auditType;

    const status = params.get("status");
    if (status) urlFilters.status = status;

    const search = params.get("search");
    if (search) urlFilters.search = search;

    // Merge URL filters with defaults
    setFiltersState({ ...defaultFilters, ...urlFilters });
    setIsInitialized(true);
  }, [isInitialized, defaultFilters]);

  // Update URL when filters change
  const setFilters = (newFilters: FiltersState | ((prev: FiltersState) => FiltersState)) => {
    const updatedFilters = typeof newFilters === "function" ? newFilters(filters) : newFilters;
    setFiltersState(updatedFilters);

    // Build query string
    const params = new URLSearchParams();

    if (updatedFilters.period) params.set("period", updatedFilters.period);
    if (updatedFilters.startDate) params.set("startDate", updatedFilters.startDate.toISOString().split("T")[0]);
    if (updatedFilters.endDate) params.set("endDate", updatedFilters.endDate.toISOString().split("T")[0]);
    if (updatedFilters.siteIds && updatedFilters.siteIds.length > 0) params.set("siteIds", updatedFilters.siteIds.join(","));
    if (updatedFilters.processIds && updatedFilters.processIds.length > 0) params.set("processIds", updatedFilters.processIds.join(","));
    if (updatedFilters.referentialIds && updatedFilters.referentialIds.length > 0) params.set("referentialIds", updatedFilters.referentialIds.join(","));
    if (updatedFilters.auditType) params.set("auditType", updatedFilters.auditType);
    if (updatedFilters.status) params.set("status", updatedFilters.status);
    if (updatedFilters.search) params.set("search", updatedFilters.search);

    // Update URL without page reload
    const newUrl = params.toString() ? `${location}?${params.toString()}` : location;
    window.history.pushState({}, "", newUrl);
  };

  // Reset filters to defaults
  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  // Get shareable URL
  const getShareableUrl = () => {
    return window.location.href;
  };

  return {
    filters,
    setFilters,
    resetFilters,
    getShareableUrl,
    isInitialized,
  };
}
