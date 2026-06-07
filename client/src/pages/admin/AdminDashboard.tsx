import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { SEGMENTOS } from "@shared/types";
import {
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  Download,
  Image as ImageIcon,
  Phone,
  Globe,
  Sparkles,
} from "lucide-react";

function pct(v: number, total: number) {
  return total > 0 ? Math.round((v / total) * 100) : 0;
}

export default function AdminDashboard() {
  const { data: m, isLoading } = trpc.oficinas.metricas.useQuery();
  const { data: notificacoes } = trpc.notificacoes.listar.useQuery({ limit: 5 });

  const total = m?.total ?? 0;
  const porSeg = new Map((m?.porSegmento ?? []).map(s => [s.segmento, s]));

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da rede GO SERVICE</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total de Prestadores", value: total, icon: Building2, color: "text-primary", bg: "bg-primary/10" },
          { label: "Ativos", value: m?.ativas ?? 0, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
          { label: "Pendentes", value: m?.pendentes ?? 0, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100" },
          { label: "Bloqueados / Rejeitados", value: (m?.bloqueadas ?? 0) + (m?.rejeitadas ?? 0), icon: XCircle, color: "text-red-600", bg: "bg-red-100" },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{k.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${k.color}`}>
                    {isLoading ? "—" : k.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${k.bg} flex items-center justify-center`}>
                  <k.icon className={`w-6 h-6 ${k.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funil de credenciamento (CS) */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Funil de Credenciamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-100">
              <p className="text-xs text-yellow-700 font-medium">Importados (a contatar)</p>
              <p className="text-2xl font-bold text-yellow-700 mt-1">{m?.pendentes ?? 0}</p>
              <Link href="/admin/atendimento" className="text-xs text-yellow-700 underline">
                Ir para Atendimento →
              </Link>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-100">
              <p className="text-xs text-green-700 font-medium">Credenciados (ativos)</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{m?.ativas ?? 0}</p>
              <p className="text-xs text-green-700">{pct(m?.ativas ?? 0, total)}% do total</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-600 font-medium">Fora (bloq./rej.)</p>
              <p className="text-2xl font-bold text-gray-700 mt-1">
                {(m?.bloqueadas ?? 0) + (m?.rejeitadas ?? 0)}
              </p>
              <p className="text-xs text-gray-600">
                Conversão: {pct(m?.ativas ?? 0, total)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cobertura por Segmento + lacunas */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Cobertura por Segmento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {SEGMENTOS.map(grupo => {
            const itens = grupo.itens.map(it => ({
              ...it,
              counts: porSeg.get(it.value),
            }));
            const totalGrupo = itens.reduce(
              (s, i) => s + (i.counts?.total ?? 0),
              0
            );
            return (
              <div key={grupo.grupo}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">{grupo.grupo}</h3>
                  <span className="text-sm font-bold">{totalGrupo}</span>
                </div>
                <Progress value={pct(totalGrupo, total)} className="h-1.5 mb-3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {itens.map(it => {
                    const c = it.counts?.total ?? 0;
                    return (
                      <div
                        key={it.value}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-sm"
                      >
                        <span className={c === 0 ? "text-muted-foreground" : ""}>
                          {it.label}
                        </span>
                        {c === 0 ? (
                          <Link
                            href={`/admin/importar?segmento=${it.value}`}
                            className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
                          >
                            <Download className="w-3 h-3" /> Importar
                          </Link>
                        ) : (
                          <span className="font-semibold">
                            {c}
                            <span className="text-xs text-muted-foreground font-normal">
                              {" "}
                              ({it.counts?.ativas ?? 0} ativos)
                            </span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Qualidade dos dados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Qualidade dos Dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {[
              { label: "Com telefone", v: m?.qualidade.comTelefone ?? 0, icon: Phone },
              { label: "Com foto", v: m?.qualidade.comFoto ?? 0, icon: ImageIcon },
              { label: "Com localização (mapa)", v: m?.qualidade.comGeo ?? 0, icon: MapPin },
              { label: "Com site", v: m?.qualidade.comWebsite ?? 0, icon: Globe },
              { label: "Enriquecidos (Google)", v: m?.qualidade.enriquecidas ?? 0, icon: Sparkles },
            ].map(q => (
              <div key={q.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <q.icon className="w-4 h-4" /> {q.label}
                  </span>
                  <span className="font-medium">
                    {q.v}/{total} ({pct(q.v, total)}%)
                  </span>
                </div>
                <Progress value={pct(q.v, total)} className="h-1.5" />
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-muted-foreground">
                Sem CNPJ (preencher no credenciamento)
              </span>
              <span className="font-medium">{m?.qualidade.semCnpj ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Pendentes de enriquecimento
              </span>
              <Link
                href="/admin/importar"
                className="font-medium text-primary hover:underline"
              >
                {m?.qualidade.pendentesEnriquecimento ?? 0} — re-enriquecer →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Cobertura geográfica */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cobertura Geográfica</CardTitle>
          </CardHeader>
          <CardContent>
            {m && m.topCidades.length > 0 ? (
              <div className="space-y-2">
                {m.topCidades.map(c => (
                  <div key={`${c.cidade}-${c.estado}`}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        {c.cidade}/{c.estado}
                      </span>
                      <span className="font-medium">{c.total}</span>
                    </div>
                    <Progress value={pct(c.total, total)} className="h-1.5" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                Sem prestadores ainda.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Últimas Notificações</CardTitle>
        </CardHeader>
        <CardContent>
          {notificacoes && notificacoes.length > 0 ? (
            <div className="space-y-3">
              {notificacoes.map(n => (
                <div
                  key={n.id}
                  className={`p-3 rounded-lg border ${n.lida ? "border-border/60 bg-card" : "border-primary/20 bg-primary/5"}`}
                >
                  <p className="text-sm font-medium">{n.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(n.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma notificação
            </p>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
