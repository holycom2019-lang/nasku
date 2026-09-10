import { StorageGauge } from "@/components/StorageGauge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActivity, useFolderContents } from "@/hooks/useQueries";
import {
  ROOT_FOLDER_ID,
  activityActionLabel,
  formatBytes,
  formatDateTime,
} from "@/types";
import { FileText, FolderOpen, HardDrive } from "lucide-react";

const TOTAL_STORAGE = 4n * 1024n * 1024n * 1024n * 1024n; // 4 TB

export function Home() {
  const { data: contents, isLoading } = useFolderContents(ROOT_FOLDER_ID);
  const { data: activity } = useActivity(10n);

  const folders = contents?.folders ?? [];
  const files = contents?.files ?? [];
  const used = files.reduce((acc, file) => acc + file.size, 0n);

  const stats = [
    {
      label: "Folder",
      value: isLoading ? "—" : String(folders.length),
      icon: FolderOpen,
    },
    {
      label: "File",
      value: isLoading ? "—" : String(files.length),
      icon: FileText,
    },
    {
      label: "Total Ukuran",
      value: isLoading ? "—" : formatBytes(used),
      icon: HardDrive,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Beranda</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan penyimpanan dan aktivitas terbaru Anda.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="bg-accent flex size-10 items-center justify-center rounded-lg">
                <stat.icon className="size-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="font-mono text-xl font-semibold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Penggunaan Penyimpanan</CardTitle>
        </CardHeader>
        <CardContent>
          <StorageGauge used={used} total={TOTAL_STORAGE} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktivitas Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {!activity || activity.length === 0 ? (
            <p
              className="py-8 text-center text-sm text-muted-foreground"
              data-ocid="empty_state"
            >
              Belum ada aktivitas. Mulai dengan mengunggah file atau membuat
              folder.
            </p>
          ) : (
            <ul className="divide-y">
              {activity.map((entry) => (
                <li
                  key={entry.id.toString()}
                  className="flex items-center gap-3 py-3"
                >
                  <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full">
                    <FolderOpen className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      <span className="font-medium">{entry.itemName}</span>{" "}
                      <span className="text-muted-foreground">
                        {activityActionLabel(entry.action)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(entry.atNs)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
