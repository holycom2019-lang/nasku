import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Activity } from "@/pages/Activity";
import { ActivityAction, ItemKind } from "@/types";
import type { ActivityEntry } from "@/types";
import { Principal } from "@icp-sdk/core/principal";

const { getActivityMock } = vi.hoisted(() => ({
  getActivityMock: vi.fn(),
}));

const mockActor = {
  getActivity: getActivityMock,
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

const owner = Principal.fromText("aaaaa-aa");

function makeActivity(overrides: Partial<ActivityEntry> = {}): ActivityEntry {
  return {
    id: 1n,
    itemId: 5n,
    action: ActivityAction.upload,
    owner,
    atNs: 1_700_000_000_000_000_000n,
    itemKind: ItemKind.file,
    itemName: "catatan.txt",
    ...overrides,
  };
}

function renderActivity(entries: ActivityEntry[]) {
  getActivityMock.mockResolvedValue(entries);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Activity />
    </QueryClientProvider>,
  );
}

describe("Activity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an empty state when there is no activity", async () => {
    renderActivity([]);
    expect(
      await screen.findByText(/belum ada aktivitas tercatat/i),
    ).toBeInTheDocument();
  });

  it("lists activity entries with the action label", async () => {
    renderActivity([makeActivity()]);
    expect(await screen.findByText("catatan.txt")).toBeInTheDocument();
    expect(screen.getByText("mengunggah")).toBeInTheDocument();
  });
});
