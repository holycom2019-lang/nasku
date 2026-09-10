import {
  File,
  FileArchive,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Folder,
} from "lucide-react";

/**
 * Type-specific file icon based on mime type. Falls back to a generic file.
 */
export function FileIcon({
  mimeType,
  isFolder = false,
  className,
}: {
  mimeType?: string;
  isFolder?: boolean;
  className?: string;
}) {
  if (isFolder) return <Folder className={className} />;
  if (mimeType?.startsWith("image/"))
    return <FileImage className={className} />;
  if (mimeType?.startsWith("video/"))
    return <FileVideo className={className} />;
  if (mimeType?.startsWith("audio/"))
    return <FileAudio className={className} />;
  if (mimeType === "application/pdf") return <FileText className={className} />;
  if (mimeType?.includes("zip") || mimeType?.includes("compressed")) {
    return <FileArchive className={className} />;
  }
  if (mimeType?.startsWith("text/")) return <FileText className={className} />;
  return <File className={className} />;
}
