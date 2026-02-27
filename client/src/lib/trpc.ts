import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import superjson from "superjson";

// NOTE: This import must be type-only.
// If Vercel build fails due to monorepo path resolution,
// move AppRouter type into a shared package (recommended).
// NOTE: Frontend and backend are provided as separate projects.
// In production monorepo you can re-point this import to the backend AppRouter.
// To keep this frontend buildable in standalone mode, we keep a local type.
import type { AppRouter } from "@/server-types";

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
