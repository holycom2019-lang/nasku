import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MyFiles } from "@/pages/MyFiles";
import type { Folder, FolderContents } from "@/types";
import { ExternalBlob } from "@caffeineai/object-storage";
import { Principal } from "@icp-sdk/core/principal";

const owner = Principal.fromText("aaaaa-aa");

const {
  createFolderMock,
  uploadFileMock,
  listFolderContentsMock,
  shareItemMock,
  renameFolderMock,
  moveFolderMock,
  deleteFolderMock,
  deleteFileMock,
} = vi.hoisted(() => ({
  createFolderMock: vi.fn(),
  uploadFileMock: vi.fn(),
  listFolderContentsMock: vi.fn(),
  shareItemMock: vi.fn(),
  renameFolderMock: vi.fn(),
  moveFolderMock: vi.fn(),
  deleteFolderMock: vi.fn(),
  deleteFileMock: vi.fn(),
}));

const mockActor = {
  createFolder: createFolderMock,
  uploadFile: uploadFileMock,
  listFolderContents: listFolderContentsMock,
  shareItem: shareItemMock,
  renameFolder: renameFolderMock,
  moveFolder: moveFolderMock,
  deleteFolder: deleteFolderMock,
  deleteFile: deleteFileMock,
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

function makeFolder(overrides: Partial<Folder> = {}): Folder {
  return {
    id: 1n,
    owner,
    name: "Proyek",
    createdAt: 1_700_000_000_000_000_000n,
    updatedAt: 1_700_000_000_000_000_000n,
    parentId: undefined,
    ...overrides,
  };
}

function makeFileEntry(name = "catatan.txt") {
  return {
    id: 10n,
    owner,
    name,
    size: 5n,
    mimeType: "text/plain",
    createdAt: 1_700_000_000_000_000_000n,
    updatedAt: 1_700_000_000_000_000_000n,
    folderId: 0n,
    blob: ExternalBlob.fromBytes(
      new Uint8Array([104, 105]),
      "text/plain",
      name,
    ),
  };
}

function renderMyFiles(contents: FolderContents) {
  listFolderContentsMock.mockResolvedValue(contents);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MyFiles />
    </QueryClientProvider>,
  );
}

describe("MyFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists folders and files with type, size and date", async () => {
    const folder = makeFolder();
    const file = makeFileEntry();
    renderMyFiles({ folders: [folder], files: [file] });

    expect(await screen.findByText("Proyek")).toBeInTheDocument();
    expect(screen.getByText("catatan.txt")).toBeInTheDocument();
    expect(screen.getByText("text/plain")).toBeInTheDocument();
    expect(screen.getByText("5 B")).toBeInTheDocument();
  });

  it("shows an empty state when the folder has no contents", async () => {
    renderMyFiles({ folders: [], files: [] });
    expect(
      await screen.findByText(/folder ini masih kosong/i),
    ).toBeInTheDocument();
  });

  it("creates a folder through the dialog", async () => {
    const user = userEvent.setup();
    createFolderMock.mockResolvedValue(makeFolder({ name: "Baru" }));
    renderMyFiles({ folders: [], files: [] });

    await user.click(screen.getByRole("button", { name: /folder baru/i }));
    await user.type(screen.getByLabelText(/nama folder/i), "Baru");
    await user.click(screen.getByRole("button", { name: /^buat$/i }));

    await waitFor(() => {
      expect(createFolderMock).toHaveBeenCalledWith("Baru", 0n);
    });
  });

  it("uploads a file to the current folder", async () => {
    const user = userEvent.setup();
    uploadFileMock.mockResolvedValue(makeFileEntry("laporan.pdf"));
    renderMyFiles({ folders: [], files: [] });

    const input = screen.getByTestId("upload_input");
    const file = new File(["data"], "laporan.pdf", { type: "application/pdf" });
    await user.upload(input, file);

    await waitFor(() => {
      expect(uploadFileMock).toHaveBeenCalled();
      const [name, folderId] = uploadFileMock.mock.calls[0];
      expect(name).toBe("laporan.pdf");
      expect(folderId).toBe(0n);
    });
  });

  it("shows an error for an invalid share principal", async () => {
    const user = userEvent.setup();
    const folder = makeFolder();
    renderMyFiles({ folders: [folder], files: [] });

    await screen.findByText("Proyek");
    await user.click(
      screen.getByRole("button", { name: /aksi untuk proyek/i }),
    );
    await user.click(screen.getByRole("menuitem", { name: /bagikan/i }));

    await user.type(
      screen.getByLabelText(/principal pengguna/i),
      "not-a-principal",
    );
    await user.click(screen.getByRole("button", { name: /^bagikan$/i }));

    expect(
      await screen.findByText(/principal tidak valid/i),
    ).toBeInTheDocument();
    expect(shareItemMock).not.toHaveBeenCalled();
  });
});
