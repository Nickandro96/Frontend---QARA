import { UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";
import "./lib/i18n";

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
  const msg =
    error instanceof TRPCClientError
      ? error.message
      : typeof (error as any)?.message === "string"
        ? (error as any).message
        : "";

  if (typeof window === "undefined") return;
  if (msg !== UNAUTHED_ERR_MSG) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    redirectToLoginIfUnauthorized(event.query.state.error);
    console.error("[API Query Error]", event.query.state.error);
  }
});

queryClient.getMutationCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    redirectToLoginIfUnauthorized(event.mutation.state.error);
    console.error("[API Mutation Error]", event.mutation.state.error);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
