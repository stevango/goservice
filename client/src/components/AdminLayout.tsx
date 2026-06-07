import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Building2, LayoutDashboard, Store, Star, Users, Bell, LogOut, ChevronLeft, Headphones, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/atendimento", label: "Atendimento", icon: Headphones },
  { href: "/admin/oficinas", label: "Prestadores", icon: Store },
  { href: "/admin/importar", label: "Importar", icon: Download },
  { href: "/admin/avaliacoes", label: "Avaliações", icon: Star },
  { href: "/admin/b2b", label: "Clientes B2B", icon: Users },
  { href: "/admin/notificacoes", label: "Notificações", icon: Bell },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [location] = useLocation();
  const { data: naoLidas } = trpc.notificacoes.contarNaoLidas.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl("/admin");
    return null;
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-4">Você não tem permissão para acessar esta área.</p>
          <Button asChild variant="outline"><Link href="/">Voltar ao Início</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/50 bg-card flex flex-col fixed h-full">
        <div className="p-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm">GO SERVICE</span>
              <p className="text-[10px] text-muted-foreground -mt-0.5">Painel da Rede</p>
            </div>
          </Link>
        </div>

        <Separator />

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <span className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  {item.href === "/admin/notificacoes" && naoLidas && naoLidas > 0 && (
                    <Badge className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-destructive">
                      {naoLidas}
                    </Badge>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">{user?.name?.[0] || "A"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.name || "Admin"}</p>
              <p className="text-[10px] text-muted-foreground">Administrador</p>
            </div>
            <button onClick={() => logout()} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-w-0">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
