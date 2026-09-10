import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Sharing } from "@/pages/Sharing";
import { ItemKind, Permission } from "@/types";
import type { Share } from "@/types";
import { Principal } from "@icp-sdk/core/principal";

const { listSharesMock, revokeShareMock } = vi.hoisted(() => ({
  listSharesMock: vi.fn(),
  revokeShareMock: vi.fn(),
}));

const mockActor = {
  listShares: listSharesMock,
  revokeShare: revokeShareMock,
};

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: mockActor, isFetching: false }),
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

function makeShare(overrides: Partial<Share> = {}): Share {
  return {
    id: 1n,
    itemKind: ItemKind.folder,
    itemId: 5n,
    sharedBy: Principal.fromText("aaaaa-aa"),
    sharedWith: Principal.fromText("2ibo7-dia"),
    permission: Permission.readOnly,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function renderSharing(shares: Share[]) {
  listSharesMock.mockResolvedValue(shares);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Sharing />
    </QueryClientProvider>,
  );
}

describe("Sharing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an empty state when nothing is shared", async () => {
    renderSharing([]);
    expect(
      await screen.findByText(/belum ada item yang dibagikan/i),
    ).toBeInTheDocument();
  });

  it("lists shared items with permission label", async () => {
    renderSharing([makeShare()]);
    expect(await screen.findByText(/folder #5/i)).toBeInTheDocument();
    expect(screen.getByText("Baca saja")).toBeInTheDocument();
  });

  it("revokes a share when the revoke button is clicked", async () => {
    const user = userEvent.setup();
    revokeShareMock.mockResolvedValue(true);
    renderSharing([makeShare()]);

    await screen.findByText(/folder #5/i);
    await user.click(screen.getByRole("button", { name: /cabut akses/i }));

    await waitFor(() => {
      expect(revokeShareMock).toHaveBeenCalledWith(1n);
    });
  });
});
