import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { buildLoginUrl } from "@/lib/session";
import { hasActiveReferential } from "@/lib/onboarding";
import { ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
import { AuthLoadingScreen } from "./AuthLoadingScreen";

type ProtectedRouteProps = {
  children: ReactNode;
  forceOnboarding?: boolean;
};

export function ProtectedRoute({ children, forceOnboarding = true }: ProtectedRouteProps) {
  const [location] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  const profileQuery = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (loading || (isAuthenticated && profileQuery.isLoading)) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect to={buildLoginUrl(location)} />;
  }

  if (forceOnboarding && location !== "/onboarding" && !hasActiveReferential(profileQuery.data)) {
    return <Redirect to="/onboarding" />;
  }

  return <>{children}</>;
}
