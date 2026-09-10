import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Home } from "@/pages/Home";
import type { FolderContents } from "@/types";
import { ExternalBlob } from "@caffeineai/object-storage";
import { Principal } from "@icp-sdk/core/principal";

const listFolderContentsMock = vi.fn();
const getActivityMock = vi.fn();

const mockActor = {
  listFolderContents: listFolderContentsMock,
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

function renderHome(contents: FolderContents, activity: unknown[]) {
  listFolderContentsMock.mockResolvedValue(contents);
  getActivityMock.mockResolvedValue(activity);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Home />
    </QueryClientProvider>,
  );
}

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows storage stats for folders and files", async () => {
    const contents: FolderContents = {
      folders: [
        {
          id: 1n,
          owner,
          name: "Proyek",
          createdAt: 1_700_000_000_000_000_000n,
          updatedAt: 1_700_000_000_000_000_000n,
          parentId: undefined,
        },
      ],
      files: [
        {
          id: 2n,
          owner,
          name: "a.txt",
          size: 2048n,
          mimeType: "text/plain",
          createdAt: 1_700_000_000_000_000_000n,
          updatedAt: 1_700_000_000_000_000_000n,
          folderId: 0n,
          blob: ExternalBlob.fromBytes(
            new Uint8Array([1]),
            "text/plain",
            "a.txt",
          ),
        },
      ],
    };
    renderHome(contents, []);

    expect(await screen.findByText("1")).toBeInTheDocument(); // folder count
    expect(screen.getByText("2.0 KB")).toBeInTheDocument(); // total size
  });

  it("shows an empty activity message when there is no activity", async () => {
    renderHome({ folders: [], files: [] }, []);
    expect(await screen.findByText(/belum ada aktivitas/i)).toBeInTheDocument();
  });
});
