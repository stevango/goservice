import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Building2, LogOut, ChevronDown } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ADMIN_NAV, adminSecaoDaRota } from "@/lib/adminNav";

const STORAGE_KEY = "goservice.admin.openSections.v1";

function carregarSecoesAbertas(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [location] = useLocation();
  const { data: naoLidas } = trpc.notificacoes.contarNaoLidas.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const secaoAtiva = adminSecaoDaRota(location);
  const [abertas, setAbertas] = useState<Record<string, boolean>>(() => {
    const persistido = carregarSecoesAbertas();
    // Garante que a seção da rota atual começa expandida.
    if (secaoAtiva) persistido[secaoAtiva] = true;
    return persistido;
  });

  // Sempre que a rota mudar, mantém a seção dela aberta sem fechar as
  // outras que o usuário deixou abertas.
  useEffect(() => {
    if (!secaoAtiva) return;
    setAbertas(prev =>
      prev[secaoAtiva] ? prev : { ...prev, [secaoAtiva]: true }
    );
  }, [secaoAtiva]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(abertas));
    } catch {
      // Sem localStorage (ex.: modo privado) — segue sem persistir.
    }
  }, [abertas]);

  const alternar = useCallback((id: string) => {
    setAbertas(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

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
          <p className="text-muted-foreground mb-4">
            Você não tem permissão para acessar esta área.
          </p>
          <Button asChild variant="outline">
            <Link href="/">Voltar ao Início</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-border/50 bg-card flex flex-col fixed h-full">
        <div className="p-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm">GO SERVICE</span>
              <p className="text-[10px] text-muted-foreground -mt-0.5">
                Painel da Rede
              </p>
            </div>
          </Link>
        </div>

        <Separator />

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {ADMIN_NAV.map(section => {
            const aberto = abertas[section.id] ?? false;
            const ativa = secaoAtiva === section.id;
            const SectionIcon = section.icon;
            const todosEmBreve = section.itens.every(i => i.emBreve);
            return (
              <div key={section.id}>
                <button
                  type="button"
                  onClick={() => alternar(section.id)}
                  aria-expanded={aberto}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                    ativa
                      ? "text-foreground bg-muted/60"
                      : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  <SectionIcon className="w-3.5 h-3.5" />
                  <span className="flex-1 text-left">{section.titulo}</span>
                  {todosEmBreve && (
                    <span className="text-[9px] normal-case tracking-normal rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">
                      Em breve
                    </span>
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      aberto ? "" : "-rotate-90"
                    }`}
                  />
                </button>
                {aberto && (
                  <ul className="mt-1 mb-2 ml-2 pl-2 border-l border-border/50 space-y-0.5">
                    {section.itens.map(item => {
                      const isActive = location === item.href;
                      const ItemIcon = item.icon;
                      return (
                        <li key={item.href}>
                          <Link href={item.href}>
                            <span
                              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                                isActive
                                  ? "bg-primary text-white shadow-sm"
                                  : item.emBreve
                                    ? "text-muted-foreground/70 hover:text-foreground hover:bg-muted"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              }`}
                            >
                              <ItemIcon className="w-3.5 h-3.5 shrink-0" />
                              <span className="flex-1 truncate">
                                {item.label}
                              </span>
                              {item.href === "/admin/notificacoes" &&
                                naoLidas &&
                                naoLidas > 0 && (
                                  <Badge className="h-4 min-w-4 px-1 flex items-center justify-center text-[9px] bg-destructive">
                                    {naoLidas}
                                  </Badge>
                                )}
                              {item.emBreve &&
                                !section.itens.every(i => i.emBreve) && (
                                  <span
                                    className={`text-[9px] uppercase tracking-wide rounded-full px-1.5 py-0.5 ${
                                      isActive
                                        ? "bg-white/20 text-white"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    Em breve
                                  </span>
                                )}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">
                {user?.name?.[0] || "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {user?.name || "Admin"}
              </p>
              <p className="text-[10px] text-muted-foreground">Administrador</p>
            </div>
            <button
              onClick={() => logout()}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
              title="Sair"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-64 min-w-0">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
