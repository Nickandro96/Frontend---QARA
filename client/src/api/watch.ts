import { trpc } from "@/lib/trpc";

export function useWatchUpdates(params: {
  limit?: number;
  offset?: number;
  type?: "REGULATION" | "GUIDANCE" | "STANDARD" | "QUALITY";
  impactLevel?: "Low" | "Medium" | "High" | "Critical";
  status?: "NEW" | "UPDATED" | "REPEALED" | "CORRIGENDUM";
  search?: string;
}) {
  return trpc.watch.updates.useQuery(
    {
      limit: params.limit ?? 50,
      offset: params.offset ?? 0,
      type: params.type,
      impactLevel: params.impactLevel,
      status: params.status,
      search: params.search,
      includeDetails: true,
    },
    {
      staleTime: 5_000,
      refetchOnWindowFocus: false,
    }
  );
}

export function useWatchRefreshMutation() {
  return trpc.watch.refresh.useMutation();
}

export function useCompanyProfile() {
  return trpc.watch.companyProfile.get.useQuery();
}

export function useUpsertCompanyProfile() {
  return trpc.watch.companyProfile.upsert.useMutation();
}
