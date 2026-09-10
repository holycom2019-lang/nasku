import {
  ActivityAction,
  type ActivityEntry,
  type FileEntry,
  type Folder,
  type FolderContents,
  ItemKind,
  Permission,
  type SearchResult,
  type Share,
  UserRole,
} from "@/backend";
import { ExternalBlob } from "@caffeineai/object-storage";
import type { Principal } from "@icp-sdk/core/principal";

export { ActivityAction, ExternalBlob, ItemKind, Permission, UserRole };
export type {
  ActivityEntry,
  FileEntry,
  Folder,
  FolderContents,
  Principal,
  SearchResult,
  Share,
};

/** Folder id used by the backend to represent the root directory. */
export const ROOT_FOLDER_ID = 0n;

/** Convert a backend nanosecond timestamp into a JavaScript Date. */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format a byte count into a human readable Indonesian size string. */
export function formatBytes(bytes: bigint): string {
  if (bytes < 1024n) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = Number(bytes);
  let unit = "B";
  for (const u of units) {
    value /= 1024;
    unit = u;
    if (value < 1024) break;
  }
  const digits = value >= 100 ? 0 : 1;
  return `${value.toFixed(digits)} ${unit}`;
}

/** Format a backend timestamp as a short Indonesian date. */
export function formatDate(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format a backend timestamp as an Indonesian date and time. */
export function formatDateTime(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Whether a mime type represents an image. */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/** Whether a mime type represents plain text that can be previewed inline. */
export function isText(mimeType: string): boolean {
  return (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/xml" ||
    mimeType === "application/javascript"
  );
}

/** Human readable Indonesian label for an activity action. */
export function activityActionLabel(action: ActivityAction): string {
  switch (action) {
    case ActivityAction.create:
      return "membuat";
    case ActivityAction.rename:
      return "mengganti nama";
    case ActivityAction.move:
      return "memindahkan";
    case ActivityAction.upload:
      return "mengunggah";
    case ActivityAction.delete_:
      return "menghapus";
    case ActivityAction.share:
      return "membagikan";
    case ActivityAction.revoke:
      return "mencabut akses";
    case ActivityAction.permissionChange:
      return "mengubah izin";
  }
}

/** Human readable Indonesian label for a share permission. */
export function permissionLabel(permission: Permission): string {
  return permission === Permission.edit ? "Bisa edit" : "Baca saja";
}

/** Trigger a browser download for a file entry using its original filename. */
export async function downloadFile(file: FileEntry): Promise<void> {
  const bytes = await file.blob.getBytes();
  const blob = new Blob([bytes]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
