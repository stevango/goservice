import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { Link } from "wouter";
import { ArrowLeft, Star, MapPin, Phone, Mail, CheckCircle2, XCircle, Ban, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { TIPOS_VEICULOS, TIPOS_SERVICOS, CATEGORIAS_OFICINA, FORNECE_PECAS_OPTIONS } from "@shared/types";

export default function AdminOficinaDetalhe() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [observacoes, setObservacoes] = useState("");

  const { data, isLoading, refetch } = trpc.oficinas.detalheAdmin.useQuery({ id });
  const alterarStatus = trpc.oficinas.alterarStatus.useMutation({
    onSuccess: () => { toast.success("Status alterado com sucesso"); refetch(); },
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

  return (
    <AdminLayout>
      <Link href="/admin/oficinas" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{data.nomeFantasia}</h1>
          <p className="text-muted-foreground">{data.razaoSocial} — {data.cnpj}</p>
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
        <div className="flex gap-2">
          {data.status !== "ativa" && (
            <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700" onClick={() => alterarStatus.mutate({ id, status: "ativa", observacoes })}>
              <CheckCircle2 className="w-4 h-4" /> Aprovar
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados */}
        <Card>
          <CardHeader><CardTitle className="text-base">Dados Cadastrais</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-muted/50"><span className="text-xs text-muted-foreground block">Telefone</span>{data.telefone || "—"}</div>
              <div className="p-2 rounded bg-muted/50"><span className="text-xs text-muted-foreground block">WhatsApp</span>{data.whatsapp || "—"}</div>
              <div className="p-2 rounded bg-muted/50"><span className="text-xs text-muted-foreground block">E-mail</span>{data.email || "—"}</div>
              <div className="p-2 rounded bg-muted/50"><span className="text-xs text-muted-foreground block">Representante</span>{data.nomeRepresentante || "—"}</div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader><CardTitle className="text-base">Endereço</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <p>{data.logradouro}{data.numero ? `, ${data.numero}` : ""}{data.complemento ? ` - ${data.complemento}` : ""}</p>
            <p>{data.bairro} — {data.cidade}/{data.estado}</p>
            <p className="text-muted-foreground">CEP: {data.cep || "—"}</p>
            {data.latitude && <p className="text-xs text-muted-foreground mt-2">Lat: {data.latitude}, Lng: {data.longitude}</p>}
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
              <div className="p-2 rounded bg-muted/50"><span className="text-xs text-muted-foreground block">Garantia</span>{data.garantiaServico || "—"}</div>
            </div>
          </CardContent>
        </Card>

        {/* Bancário */}
        <Card>
          <CardHeader><CardTitle className="text-base">Dados Bancários</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-muted/50"><span className="text-xs text-muted-foreground block">Banco</span>{data.banco || "—"}</div>
              <div className="p-2 rounded bg-muted/50"><span className="text-xs text-muted-foreground block">Agência</span>{data.agencia || "—"}</div>
              <div className="p-2 rounded bg-muted/50"><span className="text-xs text-muted-foreground block">Conta</span>{data.contaCorrente || "—"}</div>
              <div className="p-2 rounded bg-muted/50"><span className="text-xs text-muted-foreground block">PIX ({data.pixTipo || "—"})</span>{data.pixChave || "—"}</div>
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
    </AdminLayout>
  );
}
