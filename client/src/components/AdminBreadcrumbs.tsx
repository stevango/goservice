import { useLocation, Link } from "wouter";
import { ChevronRight, Search } from "lucide-react";
import { adminLocalizar } from "@/lib/adminNav";

const ATALHO_K = navigator.platform.toUpperCase().includes("MAC")
  ? "⌘"
  : "Ctrl";

// Breadcrumbs derivados do adminNav. Mostra "Seção › Item" quando a rota
// atual está no menu; senão renderiza só o atalho de busca à direita.
export default function AdminBreadcrumbs() {
  const [location] = useLocation();
  const aqui = adminLocalizar(location);

  return (
    <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
      <nav aria-label="Você está em" className="flex items-center gap-1.5">
        <Link href="/admin" className="hover:text-foreground transition-colors">
          Admin
        </Link>
        {aqui && (
          <>
            <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
            <span>{aqui.section.titulo}</span>
            <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
            <span className="font-medium text-foreground">
              {aqui.item.label}
            </span>
          </>
        )}
      </nav>
      <span className="hidden sm:inline-flex items-center gap-1 rounded-md border bg-muted/40 px-1.5 py-0.5 text-[10px]">
        <Search className="w-3 h-3" />
        Busca: <kbd className="font-mono">{ATALHO_K}</kbd>
        <kbd className="font-mono">K</kbd>
      </span>
    </div>
  );
}
