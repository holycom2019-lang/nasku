import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";

function getCrumbs(pathname: string): string[] {
  if (pathname === "/") return ["Beranda"];
  if (pathname.startsWith("/files")) return ["File Saya"];
  if (pathname.startsWith("/sharing")) return ["Berbagi"];
  if (pathname.startsWith("/activity")) return ["Riwayat Aktivitas"];
  if (pathname.startsWith("/search")) return ["Pencarian"];
  return ["Nasku"];
}

export function AppHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const crumbs = getCrumbs(pathname);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    if (q) {
      navigate({ to: "/search", search: { q } });
    }
  };

  return (
    <header className="bg-card border-b shadow-subtle sticky top-0 z-20 flex h-16 items-center gap-4 px-6">
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, index) => (
            <BreadcrumbItem key={crumb}>
              {index === crumbs.length - 1 ? (
                <BreadcrumbPage>{crumb}</BreadcrumbPage>
              ) : (
                <>
                  <span className="text-muted-foreground">{crumb}</span>
                  <BreadcrumbSeparator />
                </>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <form onSubmit={handleSearch} className="ml-auto flex items-center gap-2">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Cari file atau folder..."
            className="w-56 pl-9 sm:w-64"
            data-ocid="search_input"
          />
        </div>
        <Button type="submit" variant="secondary" data-ocid="search_button">
          Cari
        </Button>
      </form>
    </header>
  );
}
