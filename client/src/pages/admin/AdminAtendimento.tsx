import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Phone,
  MapPin,
  Star,
  Sparkles,
  Send,
  ExternalLink,
  Mail,
  MessageCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation, Link } from "wouter";
import { toast } from "sonner";
import {
  SEGMENTOS,
  ESTADOS_BRASIL,
  segmentoLabel,
  ATENDIMENTO_LANES,
  ATENDIMENTO_ETAPAS,
  ETAPA_LABEL,
  ATENDIMENTO_CANAIS,
  CANAL_LABEL,
  ATENDIMENTO_TIPOS,
  TIPO_LABEL,
  laneDaEtapa,
  sugerirMensagem,
  type AtendimentoCanal,
  type AtendimentoTipo,
  type AtendimentoEtapa,
} from "@shared/types";

// Radix Select não aceita value="" em SelectItem. Usamos sentinelas
// e convertemos para string vazia (= "sem filtro") ao mudar.
const ALL = "__all__";
const NENHUMA = "__none__";

type Prospect = {
  id: number;
  nomeFantasia: string;
  segmento: string;
  cidade: string | null;
  estado: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  scoreReputacao: string | null;
  totalAvaliacoes: number | null;
  etapaAtendimento: string;
};

export default function AdminAtendimento() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const [search, setSearch] = useState("");
  const [segmento, setSegmento] = useState("");
  const [estado, setEstado] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const kanban = trpc.atendimento.kanban.useQuery(
    {
      search: search || undefined,
      segmento: segmento || undefined,
      estado: estado || undefined,
    },
    { refetchInterval: 30_000 }
  );

  if (user?.role !== "admin") {
    navigate("/");
    return null;
  }

  const itens = (kanban.data?.itens ?? []) as Prospect[];
  const counts = kanban.data?.counts ?? {};

  const porLane = useMemo(() => {
    const map = new Map<string, Prospect[]>();
    for (const lane of ATENDIMENTO_LANES) map.set(lane.id, []);
    for (const p of itens) {
      const laneId = laneDaEtapa(p.etapaAtendimento);
      map.get(laneId)?.push(p);
    }
    return map;
  }, [itens]);

  const totalLane = (laneId: string) => {
    const lane = ATENDIMENTO_LANES.find(l => l.id === laneId);
    if (!lane) return 0;
    return lane.etapas.reduce((s, e) => s + (counts[e] ?? 0), 0);
  };
  const totalGeral = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Centro de Conversão de Parceiros
            </h1>
            <p className="text-gray-600">
              Pipeline de aquisição GO SERVICE — {totalGeral} prestadores na rede
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Buscar por nome ou cidade..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-64"
            />
            <Select
              value={segmento || ALL}
              onValueChange={v => setSegmento(v === ALL ? "" : v)}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Todos os segmentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos os segmentos</SelectItem>
                {SEGMENTOS.map(g => (
                  <SelectGroup key={g.grupo}>
                    <SelectLabel>{g.grupo}</SelectLabel>
                    {g.itens.map(it => (
                      <SelectItem key={it.value} value={it.value}>
                        {it.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={estado || ALL}
              onValueChange={v => setEstado(v === ALL ? "" : v)}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                {ESTADOS_BRASIL.map(e => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {kanban.isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {ATENDIMENTO_LANES.map(lane => {
              const cards = porLane.get(lane.id) ?? [];
              return (
                <div
                  key={lane.id}
                  className={`min-w-[300px] max-w-[300px] rounded-xl border ${lane.cor} flex flex-col`}
                >
                  <div className="px-4 py-3 border-b border-current/10 flex items-center justify-between">
                    <h2 className="font-semibold text-sm">{lane.label}</h2>
                    <span className="text-xs font-bold bg-white/70 rounded-full px-2 py-0.5">
                      {totalLane(lane.id)}
                    </span>
                  </div>
                  <div className="p-2 space-y-2 max-h-[70vh] overflow-y-auto">
                    {cards.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        Vazio
                      </p>
                    ) : (
                      cards.map(p => (
                        <ProspectCard
                          key={p.id}
                          prospect={p}
                          onOpen={() => setOpenId(p.id)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ProspectDialog
        id={openId}
        onClose={() => setOpenId(null)}
        onChanged={() => kanban.refetch()}
      />
    </div>
  );
}

function ProspectCard({
  prospect,
  onOpen,
}: {
  prospect: Prospect;
  onOpen: () => void;
}) {
  const etapa = prospect.etapaAtendimento as AtendimentoEtapa;
  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-white rounded-lg border border-border/60 p-3 hover:shadow-md hover:border-primary/30 transition-all"
    >
      <div className="font-medium text-sm truncate">{prospect.nomeFantasia}</div>
      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
        <MapPin className="w-3 h-3 shrink-0" />
        <span className="truncate">
          {prospect.cidade}/{prospect.estado}
        </span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <Badge variant="secondary" className="text-[10px]">
          {segmentoLabel(prospect.segmento)}
        </Badge>
        <span className="inline-flex items-center gap-0.5 text-xs">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          {Number(prospect.scoreReputacao ?? 0).toFixed(1)}
        </span>
      </div>
      <div className="mt-2 text-[10px] text-muted-foreground">
        Etapa: {ETAPA_LABEL[etapa] ?? etapa}
      </div>
    </button>
  );
}

function ProspectDialog({
  id,
  onClose,
  onChanged,
}: {
  id: number | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const q = trpc.atendimento.prospect.useQuery(
    { id: id ?? 0 },
    { enabled: !!id }
  );
  const utils = trpc.useUtils();
  const registrar = trpc.atendimento.registrarContato.useMutation({
    onSuccess: () => {
      toast.success("Contato registrado");
      utils.atendimento.prospect.invalidate({ id: id ?? 0 });
      onChanged();
    },
    onError: e => toast.error(e.message),
  });
  const mudarEtapa = trpc.atendimento.mudarEtapa.useMutation({
    onSuccess: () => {
      toast.success("Etapa atualizada");
      utils.atendimento.prospect.invalidate({ id: id ?? 0 });
      onChanged();
    },
    onError: e => toast.error(e.message),
  });

  const [canal, setCanal] = useState<AtendimentoCanal>("email");
  const [tipo, setTipo] = useState<AtendimentoTipo>("enviado");
  const [novaEtapa, setNovaEtapa] = useState<string>("");
  const [mensagem, setMensagem] = useState("");

  const oficina = q.data?.oficina;
  const eventos = q.data?.eventos ?? [];

  const aplicarSugestao = () => {
    if (!oficina) return;
    setMensagem(
      sugerirMensagem({
        nomeFantasia: oficina.nomeFantasia,
        segmento: oficina.segmento,
        cidade: oficina.cidade,
        estado: oficina.estado,
        canal,
      })
    );
  };

  const enviar = () => {
    if (!id) return;
    registrar.mutate({
      id,
      canal,
      tipo,
      mensagem: mensagem || undefined,
      novaEtapa: (novaEtapa || undefined) as AtendimentoEtapa | undefined,
    });
    setMensagem("");
    setNovaEtapa("");
  };

  return (
    <Dialog open={!!id} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {q.isLoading || !oficina ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">
                {oficina.nomeFantasia}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{segmentoLabel(oficina.segmento)}</Badge>
                <span>
                  {oficina.cidade}/{oficina.estado}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {Number(oficina.scoreReputacao ?? 0).toFixed(1)} (
                  {oficina.totalAvaliacoes ?? 0} avaliações)
                </span>
                <Link
                  href={`/admin/oficinas/${oficina.id}`}
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Ficha completa <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <Card className="p-4">
                <h3 className="font-semibold text-sm mb-3">Contato</h3>
                <div className="space-y-1.5 text-sm">
                  <ContatoLinha
                    icon={<Phone className="w-3.5 h-3.5" />}
                    valor={oficina.telefone}
                    href={oficina.telefone ? `tel:${oficina.telefone}` : undefined}
                  />
                  <ContatoLinha
                    icon={<MessageCircle className="w-3.5 h-3.5 text-green-600" />}
                    valor={oficina.whatsapp}
                    href={
                      oficina.whatsapp
                        ? `https://wa.me/${oficina.whatsapp.replace(/\D/g, "")}`
                        : undefined
                    }
                  />
                  <ContatoLinha
                    icon={<Mail className="w-3.5 h-3.5" />}
                    valor={oficina.email}
                    href={oficina.email ? `mailto:${oficina.email}` : undefined}
                  />
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold text-sm mb-3">Etapa no funil</h3>
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/10 text-primary border-0">
                    {ETAPA_LABEL[
                      oficina.etapaAtendimento as AtendimentoEtapa
                    ] ?? oficina.etapaAtendimento}
                  </Badge>
                </div>
                <div className="mt-3">
                  <Select
                    value=""
                    onValueChange={v =>
                      id && mudarEtapa.mutate({ id, etapa: v as AtendimentoEtapa })
                    }
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Mudar etapa..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ATENDIMENTO_ETAPAS.map(et => (
                        <SelectItem key={et} value={et}>
                          {ETAPA_LABEL[et]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            </div>

            <Card className="p-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Registrar contato</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs gap-1"
                  onClick={aplicarSugestao}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Sugerir mensagem
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                <Select
                  value={canal}
                  onValueChange={v => setCanal(v as AtendimentoCanal)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ATENDIMENTO_CANAIS.map(c => (
                      <SelectItem key={c} value={c}>
                        {CANAL_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={tipo}
                  onValueChange={v => setTipo(v as AtendimentoTipo)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ATENDIMENTO_TIPOS.map(t => (
                      <SelectItem key={t} value={t}>
                        {TIPO_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={novaEtapa || NENHUMA}
                  onValueChange={v => setNovaEtapa(v === NENHUMA ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mudar etapa (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NENHUMA}>Sem mudar etapa</SelectItem>
                    {ATENDIMENTO_ETAPAS.map(et => (
                      <SelectItem key={et} value={et}>
                        {ETAPA_LABEL[et]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                rows={5}
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
                placeholder="Cole ou escreva a mensagem enviada / o resumo do contato..."
              />
              <div className="flex justify-end mt-3">
                <Button onClick={enviar} disabled={registrar.isPending} className="gap-2">
                  {registrar.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Registrar
                </Button>
              </div>
            </Card>

            <Card className="p-4 mt-4">
              <h3 className="font-semibold text-sm mb-3">
                Histórico ({eventos.length})
              </h3>
              {eventos.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhum contato registrado ainda.
                </p>
              ) : (
                <ul className="space-y-3">
                  {eventos.map(ev => (
                    <li key={ev.id} className="border-l-2 border-primary/30 pl-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {new Date(ev.createdAt).toLocaleString("pt-BR")}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {CANAL_LABEL[ev.canal as AtendimentoCanal] ?? ev.canal}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {TIPO_LABEL[ev.tipo as AtendimentoTipo] ?? ev.tipo}
                        </Badge>
                        {ev.etapaNova && (
                          <Badge className="bg-primary/10 text-primary border-0 text-[10px]">
                            → {ETAPA_LABEL[ev.etapaNova as AtendimentoEtapa] ?? ev.etapaNova}
                          </Badge>
                        )}
                      </div>
                      {ev.mensagem && (
                        <p className="text-sm mt-1 whitespace-pre-wrap">
                          {ev.mensagem}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ContatoLinha({
  icon,
  valor,
  href,
}: {
  icon: React.ReactNode;
  valor: string | null | undefined;
  href?: string;
}) {
  if (!valor) return null;
  const inner = (
    <span className="inline-flex items-center gap-2">
      {icon}
      {valor}
    </span>
  );
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline block"
    >
      {inner}
    </a>
  ) : (
    <span className="block">{inner}</span>
  );
}
