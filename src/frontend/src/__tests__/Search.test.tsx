import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Search } from "@/pages/Search";
import type { SearchResult } from "@/types";
import { ExternalBlob } from "@caffeineai/object-storage";
import { Principal } from "@icp-sdk/core/principal";

const { searchFilesMock, useSearchMock } = vi.hoisted(() => ({
  searchFilesMock: vi.fn(),
  useSearchMock: vi.fn(() => ({ q: "laporan" })),
}));

const mockActor = {
  searchFiles: searchFilesMock,
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

vi.mock("@tanstack/react-router", () => ({
  useSearch: useSearchMock,
}));

const owner = Principal.fromText("aaaaa-aa");

function renderSearch(result: SearchResult) {
  searchFilesMock.mockResolvedValue(result);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Search />
    </QueryClientProvider>,
  );
}

describe("Search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSearchMock.mockReturnValue({ q: "laporan" });
  });

  it("shows a prompt when there is no query", () => {
    useSearchMock.mockReturnValue({ q: "" });
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <Search />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/ketik kata kunci/i)).toBeInTheDocument();
  });

  it("shows matching folders and files", async () => {
    const result: SearchResult = {
      folders: [
        {
          id: 1n,
          owner,
          name: "Laporan Tahunan",
          createdAt: 1_700_000_000_000_000_000n,
          updatedAt: 1_700_000_000_000_000_000n,
          parentId: undefined,
        },
      ],
      files: [
        {
          id: 2n,
          owner,
          name: "laporan-2024.pdf",
          size: 1024n,
          mimeType: "application/pdf",
          createdAt: 1_700_000_000_000_000_000n,
          updatedAt: 1_700_000_000_000_000_000n,
          folderId: 0n,
          blob: ExternalBlob.fromBytes(
            new Uint8Array([1]),
            "application/pdf",
            "laporan-2024.pdf",
          ),
        },
      ],
    };
    renderSearch(result);

    expect(await screen.findByText("Laporan Tahunan")).toBeInTheDocument();
    expect(screen.getByText("laporan-2024.pdf")).toBeInTheDocument();
    expect(screen.getByText("1.0 KB")).toBeInTheDocument();
  });

  it("shows an empty result message when nothing matches", async () => {
    renderSearch({ folders: [], files: [] });
    expect(
      await screen.findByText(/tidak ada file atau folder yang cocok/i),
    ).toBeInTheDocument();
  });
});
