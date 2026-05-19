import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useParams } from "wouter";
import { MapPin, Star, Phone, Mail, Globe, Clock, CreditCard, Wrench, Car, MessageSquare, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { TIPOS_VEICULOS, TIPOS_SERVICOS, CATEGORIAS_OFICINA, FORNECE_PECAS_OPTIONS } from "@shared/types";
import { OsmMap } from "@/components/OsmMap";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function OficinaDetalhe() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { isAuthenticated } = useAuth();

  const { data: oficina, isLoading } = trpc.oficinas.detalhe.useQuery({ id });
  const { data: avaliacoes } = trpc.avaliacoes.listar.useQuery({ oficinaId: id });
  const utils = trpc.useUtils();

  const [avaliacaoOpen, setAvaliacaoOpen] = useState(false);
  const [notaGeral, setNotaGeral] = useState(5);
  const [comentario, setComentario] = useState("");
  const [nomeCliente, setNomeCliente] = useState("");

  const criarAvaliacao = trpc.avaliacoes.criar.useMutation({
    onSuccess: () => {
      toast.success("Avaliação enviada com sucesso! Ela será revisada antes de ser publicada.");
      setAvaliacaoOpen(false);
      setComentario("");
      setNomeCliente("");
      utils.avaliacoes.listar.invalidate({ oficinaId: id });
    },
    onError: () => toast.error("Erro ao enviar avaliação. Faça login primeiro."),
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container py-8">
          <div className="h-64 rounded-xl bg-muted animate-pulse" />
        </div>
      </PublicLayout>
    );
  }

  if (!oficina) {
    return (
      <PublicLayout>
        <div className="container py-16 text-center">
          <h2 className="text-xl font-semibold mb-2">Oficina não encontrada</h2>
          <Link href="/buscar">
            <Button variant="outline">Voltar à busca</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const categoriaInfo = CATEGORIAS_OFICINA.find(c => c.value === oficina.categoria);
  const fornecePecasInfo = FORNECE_PECAS_OPTIONS.find(f => f.value === oficina.fornecePecas);

  return (
    <PublicLayout>
      <div className="container py-8">
        {/* Breadcrumb */}
        <Link href="/buscar" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar à busca
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold">{oficina.nomeFantasia}</h1>
              <Badge variant="outline" className={`${
                oficina.categoria === "premium" ? "bg-amber-100 text-amber-800 border-amber-200" :
                oficina.categoria === "concessionaria" ? "bg-blue-100 text-blue-800 border-blue-200" :
                "bg-gray-100 text-gray-700 border-gray-200"
              }`}>
                {categoriaInfo?.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">{oficina.razaoSocial}</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span className="font-bold text-lg">{Number(oficina.scoreReputacao).toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">({oficina.totalAvaliacoes} avaliações)</span>
              </div>
            </div>
          </div>
          {isAuthenticated && (
            <Dialog open={avaliacaoOpen} onOpenChange={setAvaliacaoOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Avaliar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Avaliar {oficina.nomeFantasia}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Nota Geral (1-5)</Label>
                    <div className="flex gap-2 mt-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          onClick={() => setNotaGeral(n)}
                          className="p-1"
                        >
                          <Star className={`w-7 h-7 ${n <= notaGeral ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Seu nome</Label>
                    <Input value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} placeholder="Nome (opcional)" className="mt-1" />
                  </div>
                  <div>
                    <Label>Comentário</Label>
                    <Textarea value={comentario} onChange={e => setComentario(e.target.value)} placeholder="Conte sua experiência..." className="mt-1" rows={4} />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => criarAvaliacao.mutate({ oficinaId: id, notaGeral, comentario, nomeCliente })}
                    disabled={criarAvaliacao.isPending}
                  >
                    {criarAvaliacao.isPending ? "Enviando..." : "Enviar Avaliação"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Galeria de Fotos */}
            {oficina.fotos && oficina.fotos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Galeria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {oficina.fotos.map((foto, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-muted group cursor-pointer">
                        <img
                          src={foto.url}
                          alt={foto.nome || `Foto ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Descrição */}
            {oficina.descricao && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sobre a Oficina</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{oficina.descricao}</p>
                </CardContent>
              </Card>
            )}

            {/* Horários */}
            {oficina.horarioFuncionamento && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="w-5 h-5 text-primary" />
                    Horário de Funcionamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {oficina.horarioFuncionamento.split('|').map((horario, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="font-medium">{horario.trim()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Serviços */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wrench className="w-5 h-5 text-primary" />
                  Serviços Oferecidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(oficina.tiposServicos as string[] || []).map(s => {
                    const label = TIPOS_SERVICOS.find(t => t.value === s)?.label || s;
                    return (
                      <Badge key={s} variant="secondary" className="rounded-lg px-3 py-1">
                        {label}
                      </Badge>
                    );
                  })}
                  {!(oficina.tiposServicos as string[] || []).length && (
                    <span className="text-sm text-muted-foreground">Não informado</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Veículos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Car className="w-5 h-5 text-primary" />
                  Veículos Atendidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(oficina.tiposVeiculos as string[] || []).map(v => {
                    const label = TIPOS_VEICULOS.find(t => t.value === v)?.label || v;
                    return (
                      <Badge key={v} variant="secondary" className="rounded-lg px-3 py-1">
                        {label}
                      </Badge>
                    );
                  })}
                  {!(oficina.tiposVeiculos as string[] || []).length && (
                    <span className="text-sm text-muted-foreground">Não informado</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informações Comerciais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Informações Comerciais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Franquia</p>
                    <p className="text-sm font-medium">
                      {oficina.franquiaAntes ? "Recebe antes do serviço" : "Recebe após o serviço"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Parcelamento</p>
                    <p className="text-sm font-medium">
                      {oficina.parcelamentoFranquia ? `Até ${oficina.parcelamentoFranquia}x` : "À vista"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Fornecimento de Peças</p>
                    <p className="text-sm font-medium">{fornecePecasInfo?.label || "Não informado"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Garantia</p>
                    <p className="text-sm font-medium">{oficina.garantiaServico || "Não informado"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reputação do Google */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="w-5 h-5 text-primary" />
                  Reputação (Google Maps)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-3xl font-bold">{Number(oficina.scoreReputacao).toFixed(1)}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} className={`w-5 h-5 ${n <= Math.round(Number(oficina.scoreReputacao)) ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{oficina.totalAvaliacoes} avaliações no Google Maps</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avaliações de Clientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="w-5 h-5 text-primary" />
                  Avaliações de Clientes ({avaliacoes?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {avaliacoes && avaliacoes.length > 0 ? (
                  <div className="space-y-4">
                    {avaliacoes.map(av => (
                      <div key={av.id} className="p-4 rounded-lg border border-border/60">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{av.nomeCliente || "Cliente"}</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(n => (
                              <Star key={n} className={`w-3.5 h-3.5 ${n <= av.notaGeral ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
                            ))}
                          </div>
                        </div>
                        {av.comentario && <p className="text-sm text-muted-foreground">{av.comentario}</p>}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(av.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhuma avaliação ainda.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contato */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {oficina.telefone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{oficina.telefone}</span>
                  </div>
                )}
                {oficina.whatsapp && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-green-600" />
                    <span className="text-sm">{oficina.whatsapp}</span>
                  </div>
                )}
                {oficina.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm truncate">{oficina.email}</span>
                  </div>
                )}
                {oficina.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a href={oficina.website} target="_blank" className="text-sm text-primary hover:underline truncate">{oficina.website}</a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Endereço */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {oficina.logradouro}{oficina.numero ? `, ${oficina.numero}` : ""}
                  {oficina.complemento ? ` - ${oficina.complemento}` : ""}
                  <br />
                  {oficina.bairro && `${oficina.bairro} - `}
                  {oficina.cidade}/{oficina.estado}
                  <br />
                  {oficina.cep && `CEP: ${oficina.cep}`}
                </p>
                {oficina.latitude && oficina.longitude && (
                  <div className="mt-4">
                    <OsmMap
                      lat={Number(oficina.latitude)}
                      lng={Number(oficina.longitude)}
                      label={oficina.nomeFantasia}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
