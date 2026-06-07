import { useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  Wallet,
  TrendingUp,
  Hourglass,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  REPASSE_STATUS,
  REPASSE_STATUS_LABEL,
  REPASSE_STATUS_COR,
  formatarBRL,
  type RepasseStatus,
} from "@shared/types";

const FILTRO_TODOS = "__todos__";

type RepasseLinha = {
  id: number;
  oficinaId: number;
  oficinaNome: string | null;
  cidade: string | null;
  estado: string | null;
  valor: string;
  descricao: string;
  referencia: string | null;
  status: string;
  observacoes: string | null;
  createdAt: Date | string;
  pagoEm: Date | string | null;
};

export default function AdminFinanceiroRepasses() {
  const [statusFiltro, setStatusFiltro] = useState<string>("");
  const [busca, setBusca] = useState("");
  const [novoOpen, setNovoOpen] = useState(false);

  const utils = trpc.useUtils();
  const metricas = trpc.financeiro.repasses.metricas.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const lista = trpc.financeiro.repasses.listar.useQuery(
    {
      status: statusFiltro || undefined,
      search: busca || undefined,
    },
    { refetchInterval: 60_000 }
  );
  const alterar = trpc.financeiro.repasses.alterarStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado");
      utils.financeiro.repasses.listar.invalidate();
      utils.financeiro.repasses.metricas.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const linhas = (lista.data ?? []) as RepasseLinha[];
  const m = metricas.data;

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Repasses</h1>
          <p className="text-muted-foreground">
            Pagamentos a prestadores da rede por serviços executados.
          </p>
        </div>
        <Button onClick={() => setNovoOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo repasse
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <CardKpi
          icon={<Hourglass className="w-3.5 h-3.5" />}
          label="Pendentes"
          valor={formatarBRL(m?.totalPendente)}
          sub={`${m?.countPendente ?? 0} repasse(s)`}
          loading={metricas.isLoading}
          accent="text-amber-600"
        />
        <CardKpi
          icon={<Check className="w-3.5 h-3.5" />}
          label="Aprovados"
          valor={formatarBRL(m?.totalAprovado)}
          sub={`${m?.countAprovado ?? 0} prontos para pagamento`}
          loading={metricas.isLoading}
          accent="text-blue-600"
        />
        <CardKpi
          icon={<Wallet className="w-3.5 h-3.5" />}
          label="Pagos no mês"
          valor={formatarBRL(m?.totalPagoMes)}
          sub={`${m?.countPagoMes ?? 0} pagamento(s)`}
          loading={metricas.isLoading}
          accent="text-green-600"
        />
        <CardKpi
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          label="Pago acumulado"
          valor={formatarBRL(m?.totalPagoGeral)}
          sub="Histórico total"
          loading={metricas.isLoading}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Input
          placeholder="Buscar por descrição ou referência..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-72"
        />
        <Select
          value={statusFiltro || FILTRO_TODOS}
          onValueChange={v => setStatusFiltro(v === FILTRO_TODOS ? "" : v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILTRO_TODOS}>Todos os status</SelectItem>
            {REPASSE_STATUS.map(s => (
              <SelectItem key={s} value={s}>
                {REPASSE_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {lista.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : linhas.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Nenhum repasse encontrado.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">Prestador</th>
                <th className="px-4 py-2 font-medium">Descrição</th>
                <th className="px-4 py-2 font-medium">Referência</th>
                <th className="px-4 py-2 font-medium text-right">Valor</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Criado</th>
                <th className="px-4 py-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(r => (
                <RepasseRow
                  key={r.id}
                  r={r}
                  onMudar={(status, observacoes) =>
                    alterar.mutate({ id: r.id, status, observacoes })
                  }
                  pending={alterar.isPending}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <NovoRepasseDialog open={novoOpen} onClose={() => setNovoOpen(false)} />
    </AdminLayout>
  );
}

function CardKpi({
  icon,
  label,
  valor,
  sub,
  loading,
  accent = "text-foreground",
}: {
  icon: React.ReactNode;
  label: string;
  valor: string;
  sub: string;
  loading: boolean;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      {loading ? (
        <div className="mt-2 h-7 w-28 animate-pulse rounded bg-muted" />
      ) : (
        <>
          <div className={`mt-1 text-2xl font-bold ${accent}`}>{valor}</div>
          <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
        </>
      )}
    </div>
  );
}

function RepasseRow({
  r,
  onMudar,
  pending,
}: {
  r: RepasseLinha;
  onMudar: (status: RepasseStatus, observacoes?: string) => void;
  pending: boolean;
}) {
  const status = r.status as RepasseStatus;
  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/30">
      <td className="px-4 py-3">
        <div className="font-medium truncate max-w-[200px]">
          {r.oficinaNome ?? "—"}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {r.cidade && r.estado ? `${r.cidade}/${r.estado}` : "—"}
        </div>
      </td>
      <td className="px-4 py-3 max-w-[260px]">
        <div className="truncate">{r.descricao}</div>
      </td>
      <td className="px-4 py-3 text-muted-foreground text-xs">
        {r.referencia || "—"}
      </td>
      <td className="px-4 py-3 text-right font-medium">
        {formatarBRL(r.valor)}
      </td>
      <td className="px-4 py-3">
        <Badge
          variant="outline"
          className={`border ${REPASSE_STATUS_COR[status]}`}
        >
          {REPASSE_STATUS_LABEL[status]}
        </Badge>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {new Date(r.createdAt).toLocaleDateString("pt-BR")}
      </td>
      <td className="px-4 py-3">
        <Select
          value=""
          onValueChange={v => onMudar(v as RepasseStatus)}
          disabled={pending}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Mudar status" />
          </SelectTrigger>
          <SelectContent>
            {REPASSE_STATUS.filter(s => s !== status).map(s => (
              <SelectItem key={s} value={s}>
                {REPASSE_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
    </tr>
  );
}

function NovoRepasseDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const oficinasQ = trpc.financeiro.oficinasParaSelect.useQuery(undefined, {
    enabled: open,
  });
  const criar = trpc.financeiro.repasses.criar.useMutation({
    onSuccess: () => {
      toast.success("Repasse registrado");
      utils.financeiro.repasses.listar.invalidate();
      utils.financeiro.repasses.metricas.invalidate();
      reset();
      onClose();
    },
    onError: e => toast.error(e.message),
  });

  const [oficinaId, setOficinaId] = useState<string>("");
  const [valor, setValor] = useState<string>("");
  const [descricao, setDescricao] = useState<string>("");
  const [referencia, setReferencia] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");

  const reset = () => {
    setOficinaId("");
    setValor("");
    setDescricao("");
    setReferencia("");
    setObservacoes("");
  };

  const valorNumero = Number(valor.replace(",", "."));
  const podeEnviar =
    oficinaId &&
    descricao.trim().length >= 3 &&
    Number.isFinite(valorNumero) &&
    valorNumero > 0;

  const oficinas = useMemo(() => oficinasQ.data ?? [], [oficinasQ.data]);

  const enviar = () => {
    if (!podeEnviar) return;
    criar.mutate({
      oficinaId: Number(oficinaId),
      valor: valorNumero,
      descricao: descricao.trim(),
      referencia: referencia.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo repasse</DialogTitle>
          <DialogDescription>
            Registre um pagamento devido a um prestador da rede.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Prestador</label>
            <Select value={oficinaId} onValueChange={setOficinaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o prestador" />
              </SelectTrigger>
              <SelectContent>
                {oficinas.map(o => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.nomeFantasia}
                    {o.cidade && o.estado ? ` · ${o.cidade}/${o.estado}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Valor (R$)
              </label>
              <Input
                inputMode="decimal"
                placeholder="0,00"
                value={valor}
                onChange={e => setValor(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Referência (opcional)
              </label>
              <Input
                placeholder="Ex.: OS 2025-001"
                value={referencia}
                onChange={e => setReferencia(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Descrição</label>
            <Input
              placeholder="O que está sendo repassado?"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Observações (opcional)
            </label>
            <Textarea
              rows={3}
              placeholder="Anotações internas, condições, etc."
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={enviar} disabled={!podeEnviar || criar.isPending}>
              {criar.isPending && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Registrar repasse
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
