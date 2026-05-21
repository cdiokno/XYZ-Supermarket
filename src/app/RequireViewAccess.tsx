import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/app/providers/auth-provider";
import { canAccessView, type AppView } from "@/app/permissions";

export function RequireViewAccess({ view, children }: { view: AppView; children: ReactNode }) {
  const location = useLocation();
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!canAccessView(currentUser.role, view)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
