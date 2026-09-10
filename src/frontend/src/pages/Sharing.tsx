import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRevokeShare, useShares } from "@/hooks/useQueries";
import { formatDateTime, permissionLabel } from "@/types";
import { Share2, Trash2 } from "lucide-react";

export function Sharing() {
  const { data: shares, isLoading } = useShares();
  const revokeShare = useRevokeShare();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Berbagi</h1>
        <p className="text-sm text-muted-foreground">
          Kelola item yang Anda bagikan kepada pengguna lain.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Item yang Dibagikan</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, i) => `skeleton-${i}`).map(
                (id) => (
                  <Skeleton key={id} className="h-12 w-full" />
                ),
              )}
            </div>
          ) : !shares || shares.length === 0 ? (
            <p
              className="py-10 text-center text-sm text-muted-foreground"
              data-ocid="empty_state"
            >
              Belum ada item yang dibagikan. Bagikan folder atau file dari
              halaman File Saya.
            </p>
          ) : (
            <ul className="divide-y">
              {shares.map((share) => (
                <li
                  key={share.id.toString()}
                  className="flex items-center gap-3 py-3"
                  data-ocid={`share.item.${share.id.toString()}`}
                >
                  <div className="bg-accent flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <Share2 className="size-4 text-accent-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {share.itemKind === "folder" ? "Folder" : "File"} #
                      {share.itemId.toString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Dibagikan kepada {share.sharedWith.toString()} ·{" "}
                      {formatDateTime(share.createdAt)}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {permissionLabel(share.permission)}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Cabut akses"
                    onClick={() => revokeShare.mutate(share.id)}
                    disabled={revokeShare.isPending}
                    data-ocid={`share.revoke_button.${share.id.toString()}`}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
