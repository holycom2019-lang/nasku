import { FileIcon } from "@/components/FileIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchFiles } from "@/hooks/useQueries";
import { formatBytes, formatDate } from "@/types";
import { useSearch } from "@tanstack/react-router";
import { Search as SearchIcon } from "lucide-react";

export function Search() {
  const { q } = useSearch({ from: "/search" });
  const { data, isLoading } = useSearchFiles(q ?? "");

  const hasQuery = (q ?? "").trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Pencarian</h1>
        <p className="text-sm text-muted-foreground">
          {hasQuery
            ? `Hasil untuk "${q}"`
            : "Cari file dan folder di seluruh direktori Anda."}
        </p>
      </div>

      {!hasQuery ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <SearchIcon className="size-10 text-muted-foreground" />
            <p
              className="text-sm text-muted-foreground"
              data-ocid="empty_state"
            >
              Ketik kata kunci pada kolom pencarian di bagian atas untuk mulai
              mencari.
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="space-y-3 py-6">
            {Array.from({ length: 4 }, (_, i) => `skeleton-${i}`).map((id) => (
              <Skeleton key={id} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hasil Pencarian</CardTitle>
          </CardHeader>
          <CardContent>
            {!data || (data.folders.length === 0 && data.files.length === 0) ? (
              <p
                className="py-10 text-center text-sm text-muted-foreground"
                data-ocid="empty_state"
              >
                Tidak ada file atau folder yang cocok dengan "{q}".
              </p>
            ) : (
              <ul className="divide-y">
                {data.folders.map((folder) => (
                  <li
                    key={`folder-${folder.id.toString()}`}
                    className="flex items-center gap-3 py-3"
                  >
                    <FileIcon isFolder className="size-5 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {folder.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Folder · {formatDate(folder.updatedAt)}
                      </p>
                    </div>
                  </li>
                ))}
                {data.files.map((file) => (
                  <li
                    key={`file-${file.id.toString()}`}
                    className="flex items-center gap-3 py-3"
                  >
                    <FileIcon
                      mimeType={file.mimeType}
                      className="size-5 text-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        File · {formatBytes(file.size)} ·{" "}
                        {formatDate(file.updatedAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
