import { FileIcon } from "@/components/FileIcon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCreateFolder,
  useDeleteFile,
  useDeleteFolder,
  useFolderContents,
  useMoveFolder,
  useRenameFolder,
  useShareItem,
  useUploadFile,
} from "@/hooks/useQueries";
import {
  type FileEntry,
  type Folder,
  ItemKind,
  Permission,
  ROOT_FOLDER_ID,
  downloadFile,
  formatBytes,
  formatDate,
  formatDateTime,
  isImage,
  isText,
} from "@/types";
import { Principal } from "@icp-sdk/core/principal";
import {
  ChevronRight,
  Download,
  Eye,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";

type ShareTarget = { itemKind: ItemKind; itemId: bigint; name: string };

export function MyFiles() {
  const [path, setPath] = useState<Folder[]>([]);
  const currentFolderId =
    path.length > 0 ? path[path.length - 1].id : ROOT_FOLDER_ID;

  const { data, isLoading } = useFolderContents(currentFolderId);
  const createFolder = useCreateFolder();
  const renameFolder = useRenameFolder();
  const moveFolder = useMoveFolder();
  const deleteFolder = useDeleteFolder();
  const deleteFile = useDeleteFile();
  const uploadFile = useUploadFile();
  const shareItem = useShareItem();

  const [createOpen, setCreateOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [renameTarget, setRenameTarget] = useState<Folder | null>(null);
  const [renameName, setRenameName] = useState("");

  const [moveTarget, setMoveTarget] = useState<Folder | null>(null);
  const [moveDest, setMoveDest] = useState<string>("root");

  const [deleteTarget, setDeleteTarget] = useState<{
    kind: "folder" | "file";
    id: bigint;
    name: string;
  } | null>(null);

  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
  const [sharePrincipal, setSharePrincipal] = useState("");
  const [sharePermission, setSharePermission] = useState<Permission>(
    Permission.readOnly,
  );
  const [shareError, setShareError] = useState("");

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [previewTarget, setPreviewTarget] = useState<FileEntry | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState("");

  // Load preview content whenever a file is selected for preview.
  useEffect(() => {
    if (!previewTarget) {
      setPreviewUrl(null);
      setPreviewText(null);
      setPreviewError("");
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    const load = async () => {
      try {
        if (isImage(previewTarget.mimeType)) {
          const url = previewTarget.blob.getDirectURL();
          if (cancelled) return;
          setPreviewUrl(url);
        } else if (isText(previewTarget.mimeType)) {
          const bytes = await previewTarget.blob.getBytes();
          if (cancelled) return;
          const text = new TextDecoder().decode(bytes);
          setPreviewText(text);
        } else {
          if (cancelled) return;
          setPreviewError(
            "Tipe file ini tidak dapat dipratinjau. Gunakan tombol Unduh.",
          );
        }
      } catch {
        if (cancelled) return;
        setPreviewError(
          "Gagal memuat pratinjau. Gunakan tombol Unduh untuk membuka file.",
        );
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [previewTarget]);

  const folders = data?.folders ?? [];
  const files = data?.files ?? [];

  const navigateTo = (folder: Folder) => {
    setPath((current) => [...current, folder]);
  };

  const navigateToCrumb = (index: number) => {
    setPath((current) => current.slice(0, index));
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    createFolder.mutate(
      { name, parentId: currentFolderId },
      {
        onSuccess: () => {
          setNewFolderName("");
          setCreateOpen(false);
        },
      },
    );
  };

  const handleRename = () => {
    if (!renameTarget) return;
    const name = renameName.trim();
    if (!name) return;
    renameFolder.mutate(
      { folderId: renameTarget.id, newName: name },
      {
        onSuccess: () => {
          setRenameTarget(null);
          setRenameName("");
        },
      },
    );
  };

  const handleMove = () => {
    if (!moveTarget) return;
    const destId = moveDest === "root" ? null : BigInt(moveDest);
    moveFolder.mutate(
      { folderId: moveTarget.id, newParentId: destId },
      {
        onSuccess: () => {
          setMoveTarget(null);
          setMoveDest("root");
        },
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "folder") {
      deleteFolder.mutate(deleteTarget.id, {
        onSuccess: () => setDeleteTarget(null),
      });
    } else {
      deleteFile.mutate(deleteTarget.id, {
        onSuccess: () => setDeleteTarget(null),
      });
    }
  };

  const handleUpload = (file: File) => {
    setUploadProgress(0);
    uploadFile.mutate(
      { file, folderId: currentFolderId, onProgress: setUploadProgress },
      {
        onSettled: () => setUploadProgress(null),
      },
    );
  };

  const handleShare = () => {
    if (!shareTarget) return;
    setShareError("");
    let principal: Principal;
    try {
      principal = Principal.fromText(sharePrincipal.trim());
    } catch {
      setShareError(
        "Principal tidak valid. Periksa kembali alamat yang dimasukkan.",
      );
      return;
    }
    shareItem.mutate(
      {
        itemKind: shareTarget.itemKind,
        itemId: shareTarget.itemId,
        sharedWith: principal,
        permission: sharePermission,
      },
      {
        onSuccess: () => {
          setShareTarget(null);
          setSharePrincipal("");
          setSharePermission(Permission.readOnly);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">File Saya</h1>
          <nav className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <button
              type="button"
              className="hover:text-foreground"
              onClick={() => setPath([])}
              data-ocid="breadcrumb_root"
            >
              File Saya
            </button>
            {path.map((folder, index) => (
              <span
                key={folder.id.toString()}
                className="flex items-center gap-1"
              >
                <ChevronRight className="size-3.5" />
                <button
                  type="button"
                  className="hover:text-foreground"
                  onClick={() => navigateToCrumb(index + 1)}
                  data-ocid={`breadcrumb.${index + 1}`}
                >
                  {folder.name}
                </button>
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCreateOpen(true)}
            data-ocid="create_folder_button"
          >
            <FolderPlus className="size-4" />
            Folder Baru
          </Button>
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
              data-ocid="upload_input"
            />
            <Button type="button" asChild data-ocid="upload_button">
              <span>
                <Upload className="size-4" />
                Unggah
              </span>
            </Button>
          </label>
        </div>
      </div>

      {uploadProgress !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Mengunggah...</span>
            <span className="font-mono">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} data-ocid="upload_progress" />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map((id) => (
            <Skeleton key={id} className="h-12 w-full" />
          ))}
        </div>
      ) : folders.length === 0 && files.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 rounded-xl border bg-card py-16 text-center"
          data-ocid="empty_state"
        >
          <FolderPlus className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Folder ini masih kosong. Unggah file atau buat folder baru.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCreateOpen(true)}
            data-ocid="empty_create_button"
          >
            Buat Folder
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="text-right">Ukuran</TableHead>
                <TableHead>Diperbarui</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {folders.map((folder, index) => (
                <TableRow
                  key={folder.id.toString()}
                  data-ocid={`folder.row.${index + 1}`}
                >
                  <TableCell>
                    <button
                      type="button"
                      className="flex min-w-0 items-center gap-3 text-left"
                      onClick={() => navigateTo(folder)}
                      data-ocid={`folder.open.${index + 1}`}
                    >
                      <FileIcon
                        isFolder
                        className="size-5 shrink-0 text-primary"
                      />
                      <span className="truncate font-medium">
                        {folder.name}
                      </span>
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    Folder
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    —
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(folder.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Aksi untuk ${folder.name}`}
                          data-ocid={`folder.menu.${index + 1}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setRenameTarget(folder);
                            setRenameName(folder.name);
                          }}
                          data-ocid={`folder.rename.${index + 1}`}
                        >
                          <Pencil className="size-4" />
                          Ganti Nama
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setMoveTarget(folder);
                            setMoveDest("root");
                          }}
                          data-ocid={`folder.move.${index + 1}`}
                        >
                          <ChevronRight className="size-4" />
                          Pindahkan
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            setShareTarget({
                              itemKind: ItemKind.folder,
                              itemId: folder.id,
                              name: folder.name,
                            })
                          }
                          data-ocid={`folder.share.${index + 1}`}
                        >
                          <Share2 className="size-4" />
                          Bagikan
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() =>
                            setDeleteTarget({
                              kind: "folder",
                              id: folder.id,
                              name: folder.name,
                            })
                          }
                          data-ocid={`folder.delete.${index + 1}`}
                        >
                          <Trash2 className="size-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {files.map((file, index) => (
                <TableRow
                  key={file.id.toString()}
                  data-ocid={`file.row.${index + 1}`}
                >
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <FileIcon
                        mimeType={file.mimeType}
                        className="size-5 shrink-0 text-primary"
                      />
                      <span className="truncate font-medium">{file.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {file.mimeType || "File"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {formatBytes(file.size)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(file.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Aksi untuk ${file.name}`}
                          data-ocid={`file.menu.${index + 1}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setPreviewTarget(file)}
                          data-ocid={`file.preview.${index + 1}`}
                        >
                          <Eye className="size-4" />
                          Pratinjau
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => void downloadFile(file)}
                          data-ocid={`file.download.${index + 1}`}
                        >
                          <Download className="size-4" />
                          Unduh
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            setShareTarget({
                              itemKind: ItemKind.file,
                              itemId: file.id,
                              name: file.name,
                            })
                          }
                          data-ocid={`file.share.${index + 1}`}
                        >
                          <Share2 className="size-4" />
                          Bagikan
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() =>
                            setDeleteTarget({
                              kind: "file",
                              id: file.id,
                              name: file.name,
                            })
                          }
                          data-ocid={`file.delete.${index + 1}`}
                        >
                          <Trash2 className="size-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create folder */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Folder Baru</DialogTitle>
            <DialogDescription>
              Folder akan dibuat di lokasi saat ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-folder-name">Nama Folder</Label>
            <Input
              id="new-folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Contoh: Proyek 2024"
              data-ocid="create_folder_input"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
              data-ocid="cancel_button"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || createFolder.isPending}
              data-ocid="submit_button"
            >
              {createFolder.isPending ? "Membuat..." : "Buat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename folder */}
      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ganti Nama Folder</DialogTitle>
            <DialogDescription>
              Masukkan nama baru untuk folder ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-folder-input">Nama Folder</Label>
            <Input
              id="rename-folder-input"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              data-ocid="rename_input"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRenameTarget(null)}
              data-ocid="cancel_button"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleRename}
              disabled={!renameName.trim() || renameFolder.isPending}
              data-ocid="submit_button"
            >
              {renameFolder.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move folder */}
      <Dialog
        open={!!moveTarget}
        onOpenChange={(open) => !open && setMoveTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pindahkan Folder</DialogTitle>
            <DialogDescription>
              Pilih tujuan untuk "{moveTarget?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="move-dest">Tujuan</Label>
            <Select value={moveDest} onValueChange={setMoveDest}>
              <SelectTrigger id="move-dest" data-ocid="move_select">
                <SelectValue placeholder="Pilih tujuan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">File Saya (Root)</SelectItem>
                {folders
                  .filter((folder) => folder.id !== moveTarget?.id)
                  .map((folder) => (
                    <SelectItem
                      key={folder.id.toString()}
                      value={folder.id.toString()}
                    >
                      {folder.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMoveTarget(null)}
              data-ocid="cancel_button"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleMove}
              disabled={moveFolder.isPending}
              data-ocid="submit_button"
            >
              {moveFolder.isPending ? "Memindahkan..." : "Pindahkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Hapus {deleteTarget?.kind === "folder" ? "Folder" : "File"}
            </DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus "{deleteTarget?.name}"? Tindakan ini tidak
              dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              data-ocid="cancel_button"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteFolder.isPending || deleteFile.isPending}
              data-ocid="confirm_button"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share */}
      <Dialog
        open={!!shareTarget}
        onOpenChange={(open) => !open && setShareTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bagikan "{shareTarget?.name}"</DialogTitle>
            <DialogDescription>
              Masukkan principal pengguna dan pilih izin akses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="share-principal">Principal Pengguna</Label>
              <Input
                id="share-principal"
                value={sharePrincipal}
                onChange={(e) => setSharePrincipal(e.target.value)}
                placeholder="Masukkan principal pengguna"
                data-ocid="share_principal_input"
              />
              {shareError && (
                <p className="text-sm text-destructive" data-ocid="share_error">
                  {shareError}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-permission">Izin Akses</Label>
              <Select
                value={sharePermission}
                onValueChange={(v) => setSharePermission(v as Permission)}
              >
                <SelectTrigger
                  id="share-permission"
                  data-ocid="share_permission_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Permission.readOnly}>Baca saja</SelectItem>
                  <SelectItem value={Permission.edit}>Bisa edit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShareTarget(null)}
              data-ocid="cancel_button"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleShare}
              disabled={!sharePrincipal.trim() || shareItem.isPending}
              data-ocid="submit_button"
            >
              {shareItem.isPending ? "Membagikan..." : "Bagikan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview */}
      <Dialog
        open={!!previewTarget}
        onOpenChange={(open) => !open && setPreviewTarget(null)}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewTarget?.name}</DialogTitle>
            <DialogDescription>
              {previewTarget
                ? `${previewTarget.mimeType || "File"} · ${formatBytes(
                    previewTarget.size,
                  )} · ${formatDateTime(previewTarget.updatedAt)}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto rounded-lg border bg-muted/40">
            {previewError ? (
              <div
                className="flex flex-col items-center gap-3 px-6 py-16 text-center"
                data-ocid="preview_error"
              >
                <Eye className="size-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{previewError}</p>
              </div>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt={previewTarget?.name ?? "Pratinjau gambar"}
                className="mx-auto max-h-[65vh] w-auto object-contain"
                data-ocid="preview_image"
              />
            ) : previewText !== null ? (
              <pre
                className="max-h-[65vh] overflow-auto p-4 font-mono text-sm whitespace-pre-wrap break-words"
                data-ocid="preview_text"
              >
                {previewText}
              </pre>
            ) : (
              <div
                className="flex items-center justify-center px-6 py-16"
                data-ocid="preview_loading"
              >
                <p className="text-sm text-muted-foreground">
                  Memuat pratinjau...
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewTarget(null)}
              data-ocid="preview_close_button"
            >
              Tutup
            </Button>
            {previewTarget && (
              <Button
                type="button"
                onClick={() => void downloadFile(previewTarget)}
                data-ocid="preview_download_button"
              >
                <Download className="size-4" />
                Unduh
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
