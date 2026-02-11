import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";
import "./lib/i18n"; // Initialize i18n

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  // TRPCClientError peut ne pas matcher en "instanceof" dans certains bundles,
  // donc on sécurise en plus via un check sur "message".
  const msg =
    error instanceof TRPCClientError
      ? error.message
      : typeof (error as any)?.message === "string"
        ? (error as any).message
        : "";

  if (typeof window === "undefined") return;

  const isUnauthorized = msg === UNAUTHED_ERR_MSG;
  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

// Use environment variable for API URL, fallback to relative path for development
const apiUrl = import.meta.env.VITE_API_URL || "";

// IMPORTANT: IE n'a pas globalThis et parfois pas fetch.
// On utilise fetch natif si dispo, sinon on renvoie une erreur explicite.
const safeFetch: typeof fetch = (input, init) => {
  if (typeof fetch !== "function") {
    return Promise.reject(
      new Error(
        "Fetch API not available in this browser. Please use a modern browser (Edge/Chrome)."
      )
    ) as any;
  }

  return fetch(input, {
    ...(init ?? {}),
    credentials: "include",
  });
};

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${apiUrl}/api/trpc`,
      transformer: superjson,
      fetch: safeFetch,
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);

// Force rebuild Thu Feb  5 15:12:48 EST 2026
