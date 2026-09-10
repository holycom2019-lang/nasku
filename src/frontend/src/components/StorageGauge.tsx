import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/types";

/**
 * Storage usage gauge shown in the sidebar footer.
 */
export function StorageGauge({ used, total }: { used: bigint; total: bigint }) {
  const pct = total > 0n ? Math.min(100, Number((used * 100n) / total)) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Penggunaan Penyimpanan</span>
        <span className="font-mono text-foreground">{pct}%</span>
      </div>
      <Progress value={pct} data-ocid="storage_gauge" />
      <p className="font-mono text-xs text-muted-foreground">
        {formatBytes(used)} / {formatBytes(total)}
      </p>
    </div>
  );
}
