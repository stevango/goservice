import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/AdminLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  StickyNote,
  Check,
  ChevronLeft,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
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
  assuntoEmail,
  linkWhatsApp,
  linkTelefone,
  linkEmail,
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
    <AdminLayout>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Centro de Conversão de Parceiros
          </h1>
          <p className="text-muted-foreground">
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

      <ProspectDialog
        id={openId}
        onClose={() => setOpenId(null)}
        onChanged={() => kanban.refetch()}
      />
    </AdminLayout>
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
      <div className="font-medium text-sm truncate">
        {prospect.nomeFantasia}
      </div>
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

  const [canal, setCanal] = useState<AtendimentoCanal>("whatsapp");
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
        canal:
          canal === "telefone" || canal === "presencial" ? "whatsapp" : canal,
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

  const inicial = (oficina?.nomeFantasia?.trim()?.[0] ?? "?").toUpperCase();
  const funnelLanes = ATENDIMENTO_LANES.filter(l => l.id !== "fora");
  const currentLaneId = oficina
    ? laneDaEtapa(oficina.etapaAtendimento)
    : "descoberta";
  const foraDoFunil = currentLaneId === "fora";
  const currentIndex = funnelLanes.findIndex(l => l.id === currentLaneId);

  const waMsg = oficina
    ? sugerirMensagem({
        nomeFantasia: oficina.nomeFantasia,
        segmento: oficina.segmento,
        cidade: oficina.cidade,
        estado: oficina.estado,
        canal: "whatsapp",
      })
    : "";
  const emailMsg = oficina
    ? sugerirMensagem({
        nomeFantasia: oficina.nomeFantasia,
        segmento: oficina.segmento,
        cidade: oficina.cidade,
        estado: oficina.estado,
        canal: "email",
      })
    : "";
  const waHref = oficina
    ? linkWhatsApp(oficina.whatsapp ?? oficina.telefone, waMsg)
    : null;
  const telHref = oficina
    ? linkTelefone(oficina.telefone ?? oficina.whatsapp)
    : null;
  const emailHref = oficina
    ? linkEmail(oficina.email, assuntoEmail(oficina.nomeFantasia), emailMsg)
    : null;

  return (
    <Dialog open={!!id} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {q.isLoading || !oficina ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Cabeçalho */}
            <DialogHeader className="space-y-0 px-6 pt-6 pb-5 border-b bg-muted/30">
              <div className="flex items-start gap-4 pr-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg font-bold shrink-0">
                  {inicial}
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-xl leading-tight truncate">
                    {oficina.nomeFantasia}
                  </DialogTitle>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="font-normal">
                      {segmentoLabel(oficina.segmento)}
                    </Badge>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {oficina.cidade}/{oficina.estado}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {Number(oficina.scoreReputacao ?? 0).toFixed(1)}
                      <span className="text-muted-foreground/70">
                        · {oficina.totalAvaliacoes ?? 0} avaliações
                      </span>
                    </span>
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                >
                  <Link href={`/admin/oficinas/${oficina.id}`}>
                    Ver ficha
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            </DialogHeader>

            <div className="px-6 py-5 space-y-6">
              {/* Posição no funil */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>Posição no funil</SectionLabel>
                  <Select
                    value=""
                    onValueChange={v =>
                      id &&
                      mudarEtapa.mutate({ id, etapa: v as AtendimentoEtapa })
                    }
                  >
                    <SelectTrigger className="h-8 w-auto gap-1.5 text-xs">
                      <SelectValue placeholder="Mover etapa" />
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

                {foraDoFunil ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-red-700">
                      Fora do funil
                    </span>
                    <Badge className="bg-red-100 text-red-700 border-0">
                      {ETAPA_LABEL[
                        oficina.etapaAtendimento as AtendimentoEtapa
                      ] ?? oficina.etapaAtendimento}
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-stretch gap-1.5">
                    {funnelLanes.map((lane, i) => {
                      const done = i < currentIndex;
                      const atual = i === currentIndex;
                      return (
                        <div key={lane.id} className="flex-1 min-w-0">
                          <div
                            className={`h-1.5 rounded-full transition-colors ${
                              done || atual ? "bg-primary" : "bg-muted"
                            }`}
                          />
                          <div
                            className={`mt-1.5 flex items-center gap-1 text-[11px] truncate ${
                              atual
                                ? "font-semibold text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {done && (
                              <Check className="w-3 h-3 text-primary shrink-0" />
                            )}
                            <span className="truncate">{lane.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {!foraDoFunil && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Etapa atual:{" "}
                    <span className="font-medium text-foreground">
                      {ETAPA_LABEL[
                        oficina.etapaAtendimento as AtendimentoEtapa
                      ] ?? oficina.etapaAtendimento}
                    </span>
                  </p>
                )}
              </section>

              {/* Falar agora */}
              <section>
                <SectionLabel className="mb-3">
                  Falar com o prospect
                </SectionLabel>
                <div className="grid grid-cols-3 gap-2">
                  <AcaoCanal
                    href={waHref}
                    onClick={() => setCanal("whatsapp")}
                    icon={<MessageCircle className="w-4 h-4" />}
                    label="WhatsApp"
                    className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                  />
                  <AcaoCanal
                    href={telHref}
                    onClick={() => setCanal("telefone")}
                    icon={<Phone className="w-4 h-4" />}
                    label="Ligar"
                    className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  />
                  <AcaoCanal
                    href={emailHref}
                    onClick={() => setCanal("email")}
                    icon={<Mail className="w-4 h-4" />}
                    label="E-mail"
                    className="border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Abre o canal com a mensagem sugerida já preenchida. Depois,
                  registre o contato abaixo.
                </p>
              </section>

              {/* Registrar contato */}
              <section className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>Registrar contato</SectionLabel>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1"
                    onClick={aplicarSugestao}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Sugerir mensagem
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                  <CampoSelect label="Canal">
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
                  </CampoSelect>
                  <CampoSelect label="Resultado">
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
                  </CampoSelect>
                  <CampoSelect label="Mover para">
                    <Select
                      value={novaEtapa || NENHUMA}
                      onValueChange={v => setNovaEtapa(v === NENHUMA ? "" : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Mover etapa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NENHUMA}>Manter etapa</SelectItem>
                        {ATENDIMENTO_ETAPAS.map(et => (
                          <SelectItem key={et} value={et}>
                            {ETAPA_LABEL[et]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CampoSelect>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">
                      Mensagem
                    </label>
                    <Textarea
                      rows={canal === "email" ? 9 : 6}
                      value={mensagem}
                      onChange={e => setMensagem(e.target.value)}
                      placeholder="Cole a mensagem enviada ou anote o resumo do contato..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">
                      Como o prestador vai receber · {CANAL_LABEL[canal]}
                    </label>
                    <PreviewMensagem
                      canal={canal}
                      texto={mensagem}
                      assunto={assuntoEmail(oficina.nomeFantasia)}
                      paraEmail={oficina.email}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={enviar}
                    disabled={registrar.isPending}
                    className="gap-2"
                  >
                    {registrar.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Registrar contato
                  </Button>
                </div>
              </section>

              {/* Linha do tempo */}
              <section>
                <SectionLabel className="mb-3">
                  Linha do tempo ({eventos.length})
                </SectionLabel>
                {eventos.length === 0 ? (
                  <div className="rounded-xl border border-dashed py-8 text-center">
                    <StickyNote className="w-6 h-6 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum contato registrado ainda.
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      Use os botões acima para iniciar a conversa.
                    </p>
                  </div>
                ) : (
                  <ol className="relative space-y-4 pl-6 before:absolute before:left-[7px] before:top-1 before:bottom-1 before:w-px before:bg-border">
                    {eventos.map(ev => (
                      <li key={ev.id} className="relative">
                        <span className="absolute -left-[22px] top-1 w-3.5 h-3.5 rounded-full bg-background border-2 border-primary" />
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {CANAL_LABEL[ev.canal as AtendimentoCanal] ??
                              ev.canal}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {TIPO_LABEL[ev.tipo as AtendimentoTipo] ?? ev.tipo}
                          </Badge>
                          {ev.etapaNova && (
                            <Badge className="bg-primary/10 text-primary border-0 text-[10px]">
                              →{" "}
                              {ETAPA_LABEL[ev.etapaNova as AtendimentoEtapa] ??
                                ev.etapaNova}
                            </Badge>
                          )}
                          <span className="text-[11px] text-muted-foreground ml-auto">
                            {new Date(ev.createdAt).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {ev.mensagem && (
                          <p className="text-sm mt-1.5 whitespace-pre-wrap text-foreground/90">
                            {ev.mensagem}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={`text-xs font-semibold uppercase tracking-wide text-muted-foreground ${className}`}
    >
      {children}
    </h3>
  );
}

function CampoSelect({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function AcaoCanal({
  href,
  onClick,
  icon,
  label,
  className,
}: {
  href: string | null;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  className: string;
}) {
  if (!href) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed py-3 text-muted-foreground/50 cursor-not-allowed">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 rounded-lg border py-3 font-medium transition-colors ${className}`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </a>
  );
}

function PreviewMensagem({
  canal,
  texto,
  assunto,
  paraEmail,
}: {
  canal: AtendimentoCanal;
  texto: string;
  assunto: string;
  paraEmail: string | null;
}) {
  if (!texto.trim()) {
    return (
      <div className="flex h-full min-h-[120px] items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center">
        <p className="text-xs text-muted-foreground">
          A prévia aparece aqui. Clique em{" "}
          <span className="font-medium">Sugerir mensagem</span> ou comece a
          escrever.
        </p>
      </div>
    );
  }
  if (canal === "whatsapp") return <PreviewWhatsApp texto={texto} />;
  if (canal === "email")
    return <PreviewEmail assunto={assunto} corpo={texto} para={paraEmail} />;
  if (canal === "sms") return <PreviewSms texto={texto} />;
  return <PreviewNota texto={texto} />;
}

function PreviewWhatsApp({ texto }: { texto: string }) {
  const hora = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="overflow-hidden rounded-xl border shadow-sm">
      <div className="flex items-center gap-2 bg-[#075E54] px-3 py-2 text-white">
        <ChevronLeft className="h-4 w-4 opacity-80" />
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold">
          GO
        </div>
        <div className="leading-tight">
          <div className="text-sm font-medium">GO SERVICE</div>
          <div className="text-[10px] text-white/70">online</div>
        </div>
      </div>
      <div className="min-h-[120px] bg-[#ECE5DD] px-3 py-4">
        <div className="max-w-[88%] rounded-lg rounded-tl-sm bg-white px-2.5 py-1.5 shadow-sm">
          <p className="whitespace-pre-wrap text-[13px] leading-snug text-gray-800">
            {texto}
          </p>
          <div className="mt-0.5 text-right text-[10px] text-gray-400">
            {hora}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewSms({ texto }: { texto: string }) {
  return (
    <div className="overflow-hidden rounded-xl border shadow-sm">
      <div className="bg-muted px-3 py-2 text-center text-[11px] font-medium text-muted-foreground">
        SMS · GO SERVICE
      </div>
      <div className="min-h-[100px] bg-background px-3 py-4">
        <div className="max-w-[88%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2">
          <p className="whitespace-pre-wrap text-[13px] text-foreground">
            {texto}
          </p>
        </div>
      </div>
    </div>
  );
}

function PreviewNota({ texto }: { texto: string }) {
  return (
    <div className="min-h-[120px] rounded-xl border bg-muted/30 px-4 py-3">
      <p className="whitespace-pre-wrap text-sm text-foreground/90">{texto}</p>
    </div>
  );
}

function PreviewEmail({
  assunto,
  corpo,
  para,
}: {
  assunto: string;
  corpo: string;
  para: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="space-y-0.5 border-b bg-muted/40 px-4 py-2.5 text-xs">
        <div>
          <span className="text-muted-foreground">De: </span>
          <span className="font-medium">GO SERVICE</span>{" "}
          <span className="text-muted-foreground">
            &lt;parcerias@goservice.com.br&gt;
          </span>
        </div>
        <div className="truncate">
          <span className="text-muted-foreground">Para: </span>
          {para || "contato do prestador"}
        </div>
        <div className="pt-0.5 text-sm font-semibold">{assunto}</div>
      </div>
      <div className="bg-primary px-6 py-5 text-center text-white">
        <div className="text-lg font-bold tracking-wide">GO SERVICE</div>
        <div className="text-[11px] text-white/80">
          Rede multissegmento de prestadores credenciados
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {corpo}
        </p>
        <div className="mt-5">
          <span className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white">
            Quero credenciar minha unidade
          </span>
        </div>
      </div>
      <div className="border-t bg-muted/30 px-6 py-4 text-[11px] leading-relaxed text-muted-foreground">
        GO SERVICE • Rede de prestadores credenciados
        <br />
        Você recebeu este e-mail porque seu estabelecimento foi identificado
        como potencial parceiro da rede.
      </div>
    </div>
  );
}
