import { createActor } from "@/backend";
import type { UserRole } from "@/types";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

/**
 * Combined authentication + authorization hook.
 * Wraps `useInternetIdentity` and exposes the caller's backend role.
 */
export function useAuth() {
  const {
    identity,
    login,
    clear,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    isLoginError,
    loginError,
  } = useInternetIdentity();

  const { actor, isFetching } = useActor(createActor);

  const roleQuery = useQuery({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });

  return {
    identity,
    login,
    clear,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    isLoginError,
    loginError,
    role: (roleQuery.data as UserRole | undefined) ?? null,
    isRoleLoading: roleQuery.isLoading,
  };
}
