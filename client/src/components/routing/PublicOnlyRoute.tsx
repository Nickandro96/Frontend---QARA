import { useAuth } from "@/_core/hooks/useAuth";
import { ReactNode } from "react";
import { Redirect } from "wouter";

type PublicOnlyRouteProps = {
  children: ReactNode;
};

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  if (!loading && isAuthenticated) return <Redirect to="/dashboard" />;

  return <>{children}</>;
}
