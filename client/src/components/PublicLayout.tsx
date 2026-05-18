import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { Building2, Menu, X, User, LogOut, Shield, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const navLinks = [
    { href: "/", label: "Início" },
    { href: "/buscar", label: "Buscar Oficinas" },
    { href: "/cadastro", label: "Credenciar Oficina" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">
              Rede Oficinas
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    <span className="max-w-[120px] truncate">{user.name || "Usuário"}</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {user.role === "admin" && (
                    <Link href="/admin">
                      <DropdownMenuItem className="cursor-pointer">
                        <Shield className="w-4 h-4 mr-2" />
                        Painel Admin
                      </DropdownMenuItem>
                    </Link>
                  )}
                  {user.role === "b2b" && (
                    <Link href="/b2b">
                      <DropdownMenuItem className="cursor-pointer">
                        <Building2 className="w-4 h-4 mr-2" />
                        Área B2B
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <Link href="/minha-oficina">
                    <DropdownMenuItem className="cursor-pointer">
                      <Building2 className="w-4 h-4 mr-2" />
                      Minha Oficina
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" asChild>
                <a href={getLoginUrl()}>Entrar</a>
              </Button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-white pb-4">
            <nav className="container flex flex-col gap-1 pt-3">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                  <span
                    className={`block px-4 py-2.5 rounded-lg text-sm font-medium ${
                      location === link.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
              {!isAuthenticated && (
                <a href={getLoginUrl()} className="px-4 py-2.5 text-sm font-medium text-primary">
                  Entrar
                </a>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg">Rede Oficinas Brasil</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                A maior rede de oficinas credenciadas do Brasil. Conectamos seguradoras, 
                associações e clientes às melhores oficinas do país com geolocalização inteligente.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Plataforma</h4>
              <div className="flex flex-col gap-2">
                <Link href="/buscar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Buscar Oficinas</Link>
                <Link href="/cadastro" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Credenciar Oficina</Link>
                <Link href="/b2b" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Área B2B</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Institucional</h4>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Sobre nós</span>
                <span className="text-sm text-muted-foreground">Termos de uso</span>
                <span className="text-sm text-muted-foreground">Privacidade</span>
              </div>
            </div>
          </div>
          <div className="border-t border-border/50 mt-8 pt-6">
            <p className="text-xs text-muted-foreground text-center">
              © {new Date().getFullYear()} Rede Oficinas Brasil. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
