import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivity } from "@/hooks/useQueries";
import { activityActionLabel, formatDateTime } from "@/types";
import { Activity as ActivityIcon } from "lucide-react";

export function Activity() {
  const { data: activity, isLoading } = useActivity(50n);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Riwayat Aktivitas</h1>
        <p className="text-sm text-muted-foreground">
          Unggahan, penghapusan, dan perubahan izin terbaru.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktivitas Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }, (_, i) => `skeleton-${i}`).map(
                (id) => (
                  <Skeleton key={id} className="h-12 w-full" />
                ),
              )}
            </div>
          ) : !activity || activity.length === 0 ? (
            <p
              className="py-10 text-center text-sm text-muted-foreground"
              data-ocid="empty_state"
            >
              Belum ada aktivitas tercatat.
            </p>
          ) : (
            <ul className="divide-y">
              {activity.map((entry) => (
                <li
                  key={entry.id.toString()}
                  className="flex items-center gap-3 py-3"
                  data-ocid={`activity.item.${entry.id.toString()}`}
                >
                  <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full">
                    <ActivityIcon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      <span className="font-medium">{entry.itemName}</span>{" "}
                      <span className="text-muted-foreground">
                        {activityActionLabel(entry.action)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.itemKind === "folder" ? "Folder" : "File"} ·{" "}
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
