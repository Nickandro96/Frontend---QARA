import { trpc } from "@/lib/trpc";

export function useWatchUpdates(params: {
  limit?: number;
  offset?: number;
  type?: "REGULATION" | "GUIDANCE" | "STANDARD" | "QUALITY";
  impactLevel?: "Low" | "Medium" | "High" | "Critical";
  status?: "NEW" | "UPDATED" | "REPEALED" | "CORRIGENDUM";
  search?: string;
  marketsImpacted?: string[]; rolesImpacted?: string[]; sourceIds?: string[]; readStatus?: "all"|"read"|"unread"; sortBy?: "date"|"criticality"|"relevance"; showAll?: boolean;
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
      marketsImpacted: params.marketsImpacted, rolesImpacted: params.rolesImpacted, sourceIds: params.sourceIds, readStatus: params.readStatus, sortBy: params.sortBy, showAll: params.showAll,
    },
    {
      staleTime: 5_000,
      refetchOnWindowFocus: false,
    }
  );
}

export function useWatchSources(){return trpc.watch.getSources.useQuery();}
export function useUnreadCount(){return trpc.watch.getUnreadCount.useQuery();}
export function useMarkAsRead(){return trpc.watch.markAsRead.useMutation();}

export function useWatchRefreshMutation() {
  return trpc.watch.refresh.useMutation();
}

export function useCompanyProfile() {
  return trpc.watch.companyProfile.get.useQuery();
}

export function useUpsertCompanyProfile() {
  return trpc.watch.companyProfile.upsert.useMutation();
}
export function useWatchExport(){return trpc.watch.exportPdf.useMutation();}
export function useWatchExports(){return trpc.watch.listExports.useQuery();}
export function useWatchNotifications(){return trpc.watch.getNotifications.useQuery(undefined,{refetchInterval:60000});}
export function useMarkNotificationRead(){return trpc.watch.markNotificationRead.useMutation();}
export function useWatchWebhooks(){return trpc.watch.listWebhooks.useQuery(undefined,{retry:false});}
export function useCreateWatchWebhook(){return trpc.watch.createWebhook.useMutation();}
export function useDeleteWatchWebhook(){return trpc.watch.deleteWebhook.useMutation();}
export function useTestWatchWebhook(){return trpc.watch.testWebhook.useMutation();}
