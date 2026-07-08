import { useAuth } from "@/_core/hooks/useAuth";
import { ReactNode } from "react";
import { Redirect } from "wouter";
import { AuthLoadingScreen } from "./AuthLoadingScreen";

type PublicOnlyRouteProps = {
  children: ReactNode;
};

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <AuthLoadingScreen />;
  if (isAuthenticated) return <Redirect to="/dashboard" />;

  return <>{children}</>;
}
