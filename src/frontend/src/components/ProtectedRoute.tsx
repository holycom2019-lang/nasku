import { LoginScreen } from "@/components/LoginScreen";
import { useAuth } from "@/hooks/useAuth";
import type { ReactNode } from "react";

/**
 * Wraps authenticated application routes. Shows the login screen for
 * unauthenticated users and a loading state while the session restores.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div
        className="flex min-h-svh items-center justify-center bg-background"
        data-ocid="loading_state"
      >
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm">Memuat sesi Anda...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
