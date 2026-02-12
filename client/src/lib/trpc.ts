import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../../backend-QARA-new/server/routers";

export const trpc = createTRPCReact<AppRouter>();

function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (!envUrl) return "http://localhost:3001";
  return envUrl.replace(/\/$/, "");
}

function headersToObject(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return headers as Record<string, string>;
}

export const trpcClient = trpc.createClient({
  transformer: superjson,
  links: [
    httpLink({
      url: `${getApiBaseUrl()}/trpc`,
      fetch(url, options) {
        const baseHeaders = headersToObject(options?.headers);

        return fetch(url, {
          ...options,
          credentials: "include",
          headers: {
            ...baseHeaders,
            "x-trpc-source": "web",
          },
        });
      },
    }),
  ],
});
