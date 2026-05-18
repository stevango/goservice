import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Building2, MapPin, Star, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function MinhaOficina() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: oficina, isLoading } = trpc.oficinas.minha.useQuery(undefined, { enabled: isAuthenticated });

  if (loading || isLoading) {
    return (
      <PublicLayout>
        <div className="container py-16">
          <div className="h-48 rounded-xl bg-muted animate-pulse" />
        </div>
      </PublicLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <PublicLayout>
        <div className="container py-16 max-w-lg mx-auto text-center">
          <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-3">Minha Oficina</h1>
          <p className="text-muted-foreground mb-6">Faça login para acessar o painel da sua oficina.</p>
          <Button asChild size="lg" className="rounded-xl">
            <a href={getLoginUrl("/minha-oficina")}>Entrar</a>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  if (!oficina) {
    return (
      <PublicLayout>
        <div className="container py-16 max-w-lg mx-auto text-center">
          <Building2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-3">Nenhuma oficina cadastrada</h1>
          <p className="text-muted-foreground mb-6">Você ainda não cadastrou uma oficina na plataforma.</p>
          <Button asChild size="lg" className="rounded-xl">
            <Link href="/cadastro">Cadastrar Oficina</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    pendente: { icon: Clock, color: "text-yellow-600 bg-yellow-100", label: "Pendente de Aprovação" },
    ativa: { icon: CheckCircle2, color: "text-green-600 bg-green-100", label: "Ativa" },
    bloqueada: { icon: XCircle, color: "text-red-600 bg-red-100", label: "Bloqueada" },
    rejeitada: { icon: AlertCircle, color: "text-gray-600 bg-gray-100", label: "Rejeitada" },
  };

  const status = statusConfig[oficina.status] || statusConfig.pendente;
  const StatusIcon = status.icon;

  return (
    <PublicLayout>
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{oficina.nomeFantasia}</h1>
            <p className="text-muted-foreground">{oficina.razaoSocial}</p>
          </div>
          <Badge className={`${status.color} border-0 gap-1.5 px-3 py-1.5`}>
            <StatusIcon className="w-4 h-4" />
            {status.label}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{Number(oficina.scoreReputacao).toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Score de Reputação</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Building2 className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold capitalize">{oficina.categoria}</p>
              <p className="text-xs text-muted-foreground">Categoria</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{oficina.cidade || "—"}</p>
              <p className="text-xs text-muted-foreground">{oficina.estado || "Localização"}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Cadastro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">CNPJ</p>
                <p className="text-sm font-medium">{oficina.cnpj}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Telefone</p>
                <p className="text-sm font-medium">{oficina.telefone || "—"}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">E-mail</p>
                <p className="text-sm font-medium">{oficina.email || "—"}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Etapa do Cadastro</p>
                <p className="text-sm font-medium capitalize">{oficina.etapaCadastro}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Cadastrado em</p>
                <p className="text-sm font-medium">{new Date(oficina.createdAt).toLocaleDateString("pt-BR")}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Total de Avaliações</p>
                <p className="text-sm font-medium">{oficina.totalAvaliacoes}</p>
              </div>
            </div>
            {oficina.observacoesAdmin && (
              <div className="mt-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-xs font-medium text-yellow-800 mb-1">Observação do Administrador:</p>
                <p className="text-sm text-yellow-700">{oficina.observacoesAdmin}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
