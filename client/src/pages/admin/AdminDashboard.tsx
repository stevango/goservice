import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Building2, CheckCircle2, Clock, XCircle, Crown, Car, Store } from "lucide-react";

export default function AdminDashboard() {
  const { data: metricas, isLoading } = trpc.oficinas.metricas.useQuery();
  const { data: notificacoes } = trpc.notificacoes.listar.useQuery({ limit: 5 });

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da rede de oficinas</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Oficinas</p>
                <p className="text-3xl font-bold mt-1">{isLoading ? "—" : metricas?.total || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Store className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativas</p>
                <p className="text-3xl font-bold mt-1 text-green-600">{isLoading ? "—" : metricas?.ativas || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-3xl font-bold mt-1 text-yellow-600">{isLoading ? "—" : metricas?.pendentes || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bloqueadas</p>
                <p className="text-3xl font-bold mt-1 text-red-600">{isLoading ? "—" : metricas?.bloqueadas || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-sm">Premium</span>
              </div>
              <span className="font-bold text-amber-700">{metricas?.premium || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-100">
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-sm">Concessionária</span>
              </div>
              <span className="font-bold text-blue-700">{metricas?.concessionaria || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-sm">Padrão</span>
              </div>
              <span className="font-bold text-gray-700">{metricas?.padrao || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Últimas Notificações</CardTitle>
          </CardHeader>
          <CardContent>
            {notificacoes && notificacoes.length > 0 ? (
              <div className="space-y-3">
                {notificacoes.map(n => (
                  <div key={n.id} className={`p-3 rounded-lg border ${n.lida ? "border-border/60 bg-card" : "border-primary/20 bg-primary/5"}`}>
                    <p className="text-sm font-medium">{n.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(n.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma notificação</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
