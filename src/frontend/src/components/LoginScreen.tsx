import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { HardDrive } from "lucide-react";

export function LoginScreen() {
  const { login, isInitializing, isLoggingIn } = useAuth();
  const disabled = isInitializing || isLoggingIn;

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3">
          <div className="gradient-primary flex size-12 items-center justify-center rounded-xl">
            <HardDrive className="size-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Nasku</h1>
            <p className="text-sm text-muted-foreground">
              Manajemen file cloud Anda
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">
            Masuk untuk melanjutkan
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gunakan Internet Identity untuk mengelola file dan folder pribadi
            Anda dengan aman.
          </p>
          <Button
            onClick={() => login()}
            disabled={disabled}
            className="mt-6 w-full"
            data-ocid="login_button"
          >
            {isLoggingIn ? "Memproses..." : "Masuk dengan Internet Identity"}
          </Button>
        </div>
      </div>
    </div>
  );
}
