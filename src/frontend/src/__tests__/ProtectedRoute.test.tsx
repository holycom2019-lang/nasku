import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginScreen } from "@/components/LoginScreen";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const { loginMock, useInternetIdentityMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  useInternetIdentityMock: vi.fn(),
}));

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: null, isFetching: false }),
  useInternetIdentity: useInternetIdentityMock,
}));

function renderWithQuery(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

function authState(overrides: Record<string, unknown> = {}) {
  useInternetIdentityMock.mockReturnValue({
    identity: undefined,
    login: loginMock,
    clear: vi.fn(),
    isAuthenticated: false,
    isInitializing: false,
    isLoggingIn: false,
    isLoginError: false,
    loginError: undefined,
    ...overrides,
  });
}

describe("ProtectedRoute login flow", () => {
  beforeEach(() => {
    loginMock.mockClear();
    useInternetIdentityMock.mockReset();
    authState();
  });

  it("shows the login screen for unauthenticated users", () => {
    renderWithQuery(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
    );
    expect(
      screen.getByRole("heading", { name: /masuk untuk melanjutkan/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    authState({ isAuthenticated: true });
    renderWithQuery(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
    );
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("shows a loading state while the session restores", () => {
    authState({ isInitializing: true });
    renderWithQuery(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
    );
    expect(screen.getByText("Memuat sesi Anda...")).toBeInTheDocument();
  });

  it("calls login when the login button is clicked", async () => {
    const user = userEvent.setup();
    renderWithQuery(<LoginScreen />);
    await user.click(
      screen.getByRole("button", { name: /masuk dengan internet identity/i }),
    );
    expect(loginMock).toHaveBeenCalled();
  });
});
