import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  Users,
  Zap,
  Eye,
  CheckCircle2,
  TrendingUp,
  Hourglass,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatarBRL } from "@shared/types";

// Primeira tela "ao vivo" da área Investidor: consome as métricas do
// Centro de Conversão (PDCA) e apresenta os indicadores-chave para
// leitura rápida. Vai crescer com outras famílias de KPIs (financeiro,
// retenção, growth) à medida que essas áreas forem ativadas.
export default function AdminInvestidorKpis() {
  const q = trpc.atendimento.metricas.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const qFin = trpc.financeiro.repasses.metricas.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const m = q.data;
  const f = qFin.data;

  const pct = (n: number, total: number) =>
    total > 0 ? `${Math.round((n / total) * 100)}%` : "—";

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">KPIs do negócio</h1>
        <p className="text-muted-foreground">
          Indicadores-chave consolidados em tempo real. Esta visão será
          expandida com KPIs financeiros, de retenção e de growth conforme essas
          áreas forem ativadas.
        </p>
      </div>

      {q.isLoading || !m ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Aquisição & ativação
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Kpi
                icon={Users}
                label="Prospects na base"
                valor={m.totalProspects}
                hint="Total de prestadores identificados como potenciais parceiros."
              />
              <Kpi
                icon={Zap}
                label="Em automação"
                valor={m.comAutomacao}
                hint={`${pct(m.comAutomacao, m.totalProspects)} da base reconvidados pela esteira.`}
                accent="text-primary"
              />
              <Kpi
                icon={Eye}
                label="Viram a página"
                valor={m.visualizaramPagina}
                hint={`${pct(m.visualizaramPagina, m.totalProspects)} engajaram com a landing do parceiro.`}
              />
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Conversão
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Kpi
                icon={CheckCircle2}
                label="Clicaram no CTA"
                valor={m.aceitaramCTA}
                hint={`${pct(m.aceitaramCTA, m.totalProspects)} clicaram em "Quero credenciar".`}
                accent="text-green-600"
              />
              <Kpi
                icon={TrendingUp}
                label="Em conversão"
                valor={m.emConversao}
                hint={`${pct(m.emConversao, m.totalProspects)} já entraram no cadastro ou estão ativos.`}
                accent="text-green-600"
              />
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Financeiro
            </h2>
            {qFin.isLoading || !f ? (
              <div className="h-24 rounded-xl border bg-card animate-pulse" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Kpi
                  icon={Hourglass}
                  label="A pagar aos prestadores"
                  valor={formatarBRL(f.totalPendente + f.totalAprovado)}
                  hint={`${f.countPendente + f.countAprovado} repasse(s) aguardando pagamento.`}
                  accent="text-amber-600"
                />
                <Kpi
                  icon={Wallet}
                  label="Pago no mês"
                  valor={formatarBRL(f.totalPagoMes)}
                  hint={`${f.countPagoMes} pagamento(s) liquidado(s) este mês.`}
                  accent="text-green-600"
                />
                <Kpi
                  icon={TrendingUp}
                  label="Pago acumulado"
                  valor={formatarBRL(f.totalPagoGeral)}
                  hint="Total repassado à rede desde o início."
                />
              </div>
            )}
          </section>

          <div className="rounded-xl border border-dashed bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
            Próximas famílias de KPIs (em construção): receita recorrente, CAC,
            LTV, payback e retenção por coorte.
          </div>
        </>
      )}
    </AdminLayout>
  );
}

function Kpi({
  icon: Icon,
  label,
  valor,
  hint,
  accent = "text-foreground",
}: {
  icon: LucideIcon;
  label: string;
  valor: number | string;
  hint: string;
  accent?: string;
}) {
  const display =
    typeof valor === "number" ? valor.toLocaleString("pt-BR") : valor;
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className={`mt-1 text-3xl font-bold leading-tight ${accent}`}>
        {display}
      </div>
      <p className="mt-1 text-xs text-muted-foreground leading-snug">{hint}</p>
    </div>
  );
}
