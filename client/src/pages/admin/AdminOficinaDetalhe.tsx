import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { Link } from "wouter";
import { ArrowLeft, Star, MapPin, Phone, Mail, CheckCircle2, XCircle, Ban, Clock, Globe, Image as ImageIcon, Instagram, Pencil, Save } from "lucide-react";

function Campo({
  label,
  valor,
  editando,
  onChange,
  full,
}: {
  label: string;
  valor?: string | null;
  editando: boolean;
  onChange: (v: string) => void;
  full?: boolean;
}) {
  return (
    <div className={`p-2 rounded bg-muted/50 ${full ? "col-span-2" : ""}`}>
      <span className="text-xs text-muted-foreground block">{label}</span>
      {editando ? (
        <input
          value={valor ?? ""}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-transparent border-b border-input outline-none text-sm py-0.5 focus:border-primary"
        />
      ) : (
        <span>{valor || "—"}</span>
      )}
    </div>
  );
}
import { useState } from "react";
import { toast } from "sonner";
import { TIPOS_VEICULOS, TIPOS_SERVICOS, CATEGORIAS_OFICINA, FORNECE_PECAS_OPTIONS, SEGMENTOS, segmentoLabel, traduzHorario, ehInstagram } from "@shared/types";
import { OsmMap } from "@/components/OsmMap";
import { Lightbox } from "@/components/Lightbox";

export default function AdminOficinaDetalhe() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [observacoes, setObservacoes] = useState("");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const { data, isLoading, refetch } = trpc.oficinas.detalheAdmin.useQuery({ id });
  const alterarStatus = trpc.oficinas.alterarStatus.useMutation({
    onSuccess: () => { toast.success("Status alterado com sucesso"); refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const atualizar = trpc.oficinas.atualizar.useMutation({
    onSuccess: () => { toast.success("Dados salvos"); setEditando(false); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return <AdminLayout><div className="h-48 rounded-xl bg-muted animate-pulse" /></AdminLayout>;
  }

  if (!data) {
    return <AdminLayout><p>Oficina não encontrada</p></AdminLayout>;
  }

  const categoriaInfo = CATEGORIAS_OFICINA.find(c => c.value === data.categoria);
  const fornecePecasInfo = FORNECE_PECAS_OPTIONS.find(f => f.value === data.fornecePecas);
  const fotos = (data.documentos || []).filter(d => d.tipo.startsWith("foto"));
  const instaUrl = ehInstagram(data.website) ? data.website : null;
  const siteUrl = data.website && !ehInstagram(data.website) ? data.website : null;

  const reg = data as unknown as Record<string, unknown>;
  const campo = (field: string) => ({
    editando,
    valor: editando
      ? form[field] ?? ""
      : reg[field] == null
        ? ""
        : String(reg[field]),
    onChange: (v: string) => setForm(f => ({ ...f, [field]: v })),
  });
  const CAMPOS_EDIT = [
    "nomeFantasia", "razaoSocial", "cnpj", "telefone", "whatsapp", "email",
    "website", "nomeRepresentante", "cep", "logradouro", "numero",
    "complemento", "bairro", "cidade", "estado", "banco", "agencia",
    "contaCorrente", "pixChave", "garantiaServico", "segmento",
    "descricao", "horarioFuncionamento",
  ];
  const iniciarEdicao = () => {
    const seed: Record<string, string> = {};
    for (const k of CAMPOS_EDIT) seed[k] = reg[k] == null ? "" : String(reg[k]);
    setForm(seed);
    setEditando(true);
  };
  const salvar = () => atualizar.mutate({ id, ...form });

  return (
    <AdminLayout>
      <Link href="/admin/oficinas" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1 mr-4">
          {editando ? (
            <div className="space-y-1.5 max-w-md">
              <input
                value={form.nomeFantasia ?? ""}
                onChange={e => setForm(f => ({ ...f, nomeFantasia: e.target.value }))}
                className="text-2xl font-bold w-full bg-transparent border-b border-input outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <input
                  value={form.razaoSocial ?? ""}
                  onChange={e => setForm(f => ({ ...f, razaoSocial: e.target.value }))}
                  placeholder="Razão social"
                  className="flex-1 text-sm text-muted-foreground bg-transparent border-b border-input outline-none"
                />
                <input
                  value={form.cnpj ?? ""}
                  onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))}
                  placeholder="CNPJ"
                  className="w-40 text-sm text-muted-foreground bg-transparent border-b border-input outline-none"
                />
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{data.nomeFantasia}</h1>
              <p className="text-muted-foreground">{data.razaoSocial} — {data.cnpj}</p>
            </>
          )}
          <div className="flex items-center gap-3 mt-2">
            <Badge className={`${
              data.status === "ativa" ? "bg-green-100 text-green-700" :
              data.status === "pendente" ? "bg-yellow-100 text-yellow-700" :
              data.status === "bloqueada" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
            } border-0`}>
              {data.status}
            </Badge>
            <Badge variant="outline" className="capitalize">{categoriaInfo?.label}</Badge>
            <span className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              {Number(data.scoreReputacao).toFixed(1)} ({data.totalAvaliacoes} avaliações)
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {editando ? (
            <>
              <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700" disabled={atualizar.isPending} onClick={salvar}>
                <Save className="w-4 h-4" /> Salvar
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditando(false)}>
                <XCircle className="w-4 h-4" /> Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={iniciarEdicao}>
                <Pencil className="w-4 h-4" /> Editar
              </Button>
              {data.status !== "ativa" && (
                <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700" onClick={() => alterarStatus.mutate({ id, status: "ativa", observacoes })}>
                  <CheckCircle2 className="w-4 h-4" /> Aprovar
                </Button>
              )}
              {data.status !== "pendente" && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => alterarStatus.mutate({ id, status: "pendente", observacoes })}>
                  <Clock className="w-4 h-4" /> Voltar p/ pendente
                </Button>
              )}
              {data.status !== "bloqueada" && (
                <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => alterarStatus.mutate({ id, status: "bloqueada", observacoes })}>
                  <Ban className="w-4 h-4" /> Bloquear
                </Button>
              )}
              {data.status !== "rejeitada" && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => alterarStatus.mutate({ id, status: "rejeitada", observacoes })}>
                  <XCircle className="w-4 h-4" /> Rejeitar
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados */}
        <Card>
          <CardHeader><CardTitle className="text-base">Dados Cadastrais</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-muted/50">
                <span className="text-xs text-muted-foreground block">Segmento</span>
                {editando ? (
                  <select
                    value={form.segmento ?? ""}
                    onChange={e => setForm(f => ({ ...f, segmento: e.target.value }))}
                    className="w-full bg-transparent border-b border-input outline-none text-sm py-0.5"
                  >
                    {SEGMENTOS.map(g => (
                      <optgroup key={g.grupo} label={g.grupo}>
                        {g.itens.map(it => (
                          <option key={it.value} value={it.value}>{it.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                ) : (
                  segmentoLabel(data.segmento)
                )}
              </div>
              <Campo label="Telefone" {...campo("telefone")} />
              <Campo label="WhatsApp" {...campo("whatsapp")} />
              <Campo label="E-mail" {...campo("email")} />
              {editando ? (
                <Campo label="Website / Instagram" full {...campo("website")} />
              ) : (
                <>
                  <div className="p-2 rounded bg-muted/50">
                    <span className="text-xs text-muted-foreground block">Website</span>
                    {siteUrl ? (
                      <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1 break-all">
                        <Globe className="w-3.5 h-3.5 shrink-0" />{siteUrl}
                      </a>
                    ) : "—"}
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <span className="text-xs text-muted-foreground block">Instagram</span>
                    {instaUrl ? (
                      <a href={instaUrl} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline inline-flex items-center gap-1 break-all">
                        <Instagram className="w-3.5 h-3.5 shrink-0" />{instaUrl}
                      </a>
                    ) : "—"}
                  </div>
                </>
              )}
              <Campo label="Representante" {...campo("nomeRepresentante")} />
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader><CardTitle className="text-base">Endereço</CardTitle></CardHeader>
          <CardContent className="text-sm">
            {editando ? (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Campo label="Logradouro" full {...campo("logradouro")} />
                <Campo label="Número" {...campo("numero")} />
                <Campo label="Complemento" {...campo("complemento")} />
                <Campo label="Bairro" {...campo("bairro")} />
                <Campo label="CEP" {...campo("cep")} />
                <Campo label="Cidade" {...campo("cidade")} />
                <Campo label="Estado (UF)" {...campo("estado")} />
              </div>
            ) : (
              <>
                <p>{data.logradouro}{data.numero ? `, ${data.numero}` : ""}{data.complemento ? ` - ${data.complemento}` : ""}</p>
                <p>{data.bairro} — {data.cidade}/{data.estado}</p>
                <p className="text-muted-foreground">CEP: {data.cep || "—"}</p>
              </>
            )}
            {data.latitude && data.longitude && (
              <div className="mt-3">
                <OsmMap
                  lat={Number(data.latitude)}
                  lng={Number(data.longitude)}
                  label={data.nomeFantasia}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Lat: {data.latitude}, Lng: {data.longitude}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comercial */}
        <Card>
          <CardHeader><CardTitle className="text-base">Informações Comerciais</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-muted/50"><span className="text-xs text-muted-foreground block">Franquia</span>{data.franquiaAntes ? "Antes do serviço" : "Após o serviço"}</div>
              <div className="p-2 rounded bg-muted/50"><span className="text-xs text-muted-foreground block">Parcelamento</span>{data.parcelamentoFranquia}x</div>
              <div className="p-2 rounded bg-muted/50"><span className="text-xs text-muted-foreground block">Peças</span>{fornecePecasInfo?.label || "—"}</div>
              <Campo label="Garantia" {...campo("garantiaServico")} />
            </div>
          </CardContent>
        </Card>

        {/* Bancário */}
        <Card>
          <CardHeader><CardTitle className="text-base">Dados Bancários</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <Campo label="Banco" {...campo("banco")} />
              <Campo label="Agência" {...campo("agencia")} />
              <Campo label="Conta" {...campo("contaCorrente")} />
              <Campo label={`PIX (${data.pixTipo || "—"})`} {...campo("pixChave")} />
            </div>
          </CardContent>
        </Card>

        {/* Serviços */}
        <Card>
          <CardHeader><CardTitle className="text-base">Serviços e Veículos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Serviços:</p>
              <div className="flex flex-wrap gap-1.5">
                {(data.tiposServicos as string[] || []).map(s => (
                  <Badge key={s} variant="secondary" className="text-xs">{TIPOS_SERVICOS.find(t => t.value === s)?.label || s}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Veículos:</p>
              <div className="flex flex-wrap gap-1.5">
                {(data.tiposVeiculos as string[] || []).map(v => (
                  <Badge key={v} variant="secondary" className="text-xs">{TIPOS_VEICULOS.find(t => t.value === v)?.label || v}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Horário de Funcionamento */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" /> Horário de Funcionamento</CardTitle></CardHeader>
          <CardContent className="text-sm">
            {editando ? (
              <Textarea
                rows={7}
                value={form.horarioFuncionamento ?? ""}
                onChange={e => setForm(f => ({ ...f, horarioFuncionamento: e.target.value }))}
                placeholder={"Segunda-feira: 08:00 – 18:00\n..."}
              />
            ) : data.horarioFuncionamento ? (
              <div className="space-y-0.5">
                {traduzHorario(data.horarioFuncionamento).split("\n").map((linha, i) => (
                  <p key={i} className="text-muted-foreground">{linha}</p>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Não informado pelo Google.</p>
            )}
          </CardContent>
        </Card>

        {/* Sobre */}
        <Card>
          <CardHeader><CardTitle className="text-base">Sobre</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {editando ? (
              <Textarea
                rows={4}
                value={form.descricao ?? ""}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              />
            ) : (
              data.descricao || "—"
            )}
          </CardContent>
        </Card>

        {/* Galeria */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Galeria</CardTitle></CardHeader>
          <CardContent>
            {fotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {fotos.map((f, idx) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setLightboxIdx(idx)}
                    className="block aspect-square rounded-lg overflow-hidden border cursor-zoom-in"
                  >
                    <img src={f.url} alt={f.nome || "Foto"} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma foto importada.</p>
            )}
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader><CardTitle className="text-base">Observações Internas</CardTitle></CardHeader>
          <CardContent>
            {data.observacoesAdmin && (
              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 mb-3 text-sm">
                {data.observacoesAdmin}
              </div>
            )}
            <Textarea
              placeholder="Adicionar observação..."
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>
      </div>

      {/* Avaliações */}
      {data.avaliacoes && data.avaliacoes.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle className="text-base">Avaliações ({data.avaliacoes.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.avaliacoes.slice(0, 10).map(av => (
                <div key={av.id} className="flex items-center justify-between p-3 rounded-lg border border-border/60">
                  <div>
                    <p className="text-sm font-medium">{av.nomeCliente || "Cliente"}</p>
                    <p className="text-xs text-muted-foreground">{av.comentario?.slice(0, 80)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-medium text-sm">{av.notaGeral}</span>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">{av.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Lightbox
        fotos={fotos}
        index={lightboxIdx}
        onClose={() => setLightboxIdx(null)}
        onChange={setLightboxIdx}
      />
    </AdminLayout>
  );
}
