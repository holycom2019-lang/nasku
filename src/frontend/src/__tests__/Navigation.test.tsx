import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { FolderContents } from "@/types";

const { useFolderContentsMock } = vi.hoisted(() => ({
  useFolderContentsMock: vi.fn(),
}));

vi.mock("@/hooks/useQueries", () => ({
  useFolderContents: useFolderContentsMock,
}));

vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname: "/" }),
  Link: ({
    to,
    children,
  }: {
    to: string;
    children: React.ReactNode;
  }) => <a href={to}>{children}</a>,
}));

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: null, isFetching: false }),
  useInternetIdentity: () => ({
    identity: undefined,
    login: vi.fn(),
    clear: vi.fn(),
    isAuthenticated: true,
    isInitializing: false,
    isLoggingIn: false,
    isLoginError: false,
    loginError: undefined,
  }),
}));

function renderSidebar(contents: FolderContents) {
  useFolderContentsMock.mockReturnValue({ data: contents, isLoading: false });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    </QueryClientProvider>,
  );
}

describe("AppSidebar navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the Nasku brand and all primary navigation items", () => {
    renderSidebar({ folders: [], files: [] });
    expect(screen.getByText("Nasku")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /beranda/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: /file saya/i })).toHaveAttribute(
      "href",
      "/files",
    );
    expect(screen.getByRole("link", { name: /berbagi/i })).toHaveAttribute(
      "href",
      "/sharing",
    );
    expect(
      screen.getByRole("link", { name: /riwayat aktivitas/i }),
    ).toHaveAttribute("href", "/activity");
  });

  it("loads root folder contents to compute storage usage", () => {
    renderSidebar({ folders: [], files: [] });
    expect(useFolderContentsMock).toHaveBeenCalledWith(0n);
  });
});
