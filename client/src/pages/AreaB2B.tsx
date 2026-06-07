import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Building2, Shield, Search, MapPin, Star, Phone, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { TIPOS_VEICULOS, TIPOS_SERVICOS, CATEGORIAS_OFICINA, ESTADOS_BRASIL } from "@shared/types";
import { Link } from "wouter";

export default function AreaB2B() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: clienteB2B, isLoading: loadingB2B } = trpc.b2b.minha.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  // Registration form
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [tipo, setTipo] = useState<"seguradora" | "associacao" | "cooperativa">("seguradora");
  const [contatoNome, setContatoNome] = useState("");
  const [contatoEmail, setContatoEmail] = useState("");

  // Search
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");
  const [categoria, setCategoria] = useState("");

  const criarB2B = trpc.b2b.criar.useMutation({
    onSuccess: () => toast.success("Cadastro B2B realizado! Aguarde aprovação do administrador."),
    onError: (err) => toast.error(err.message),
  });

  const isB2BApproved = user?.role === "b2b" || user?.role === "admin" || (clienteB2B && clienteB2B.status === "ativo");

  const { data: oficinasData } = trpc.b2b.buscarOficinas.useQuery(
    { search: search || undefined, estado: estado || undefined, categoria: categoria || undefined },
    { enabled: isAuthenticated && !!isB2BApproved }
  );

  if (loading || loadingB2B) {
    return (
      <PublicLayout>
        <div className="container py-16"><div className="h-48 rounded-xl bg-muted animate-pulse" /></div>
      </PublicLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <PublicLayout>
        <div className="container py-16 max-w-lg mx-auto text-center">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-3">Área B2B</h1>
          <p className="text-muted-foreground mb-6">Acesso exclusivo para seguradoras, associações e cooperativas.</p>
          <Button asChild size="lg" className="rounded-xl">
            <a href={getLoginUrl("/b2b")}>Entrar</a>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  // If user has no B2B record or it's pending, show appropriate view
  if (user?.role !== "b2b" && user?.role !== "admin" && !clienteB2B) {
    return (
      <PublicLayout>
        <div className="container py-8 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Solicitar Acesso B2B</h1>
            <p className="text-muted-foreground">Cadastre sua empresa para acessar a rede completa de oficinas</p>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Razão Social *</Label>
                  <Input value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Nome Fantasia *</Label>
                  <Input value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>CNPJ *</Label>
                  <Input value={cnpj} onChange={e => setCnpj(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Tipo de Empresa *</Label>
                  <Select value={tipo} onValueChange={v => setTipo(v as any)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seguradora">Seguradora</SelectItem>
                      <SelectItem value="associacao">Associação</SelectItem>
                      <SelectItem value="cooperativa">Cooperativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Contato</Label>
                  <Input value={contatoNome} onChange={e => setContatoNome(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>E-mail do Contato</Label>
                  <Input value={contatoEmail} onChange={e => setContatoEmail(e.target.value)} className="mt-1" />
                </div>
              </div>
              <Button
                className="w-full rounded-xl"
                onClick={() => criarB2B.mutate({ razaoSocial, nomeFantasia, cnpj, tipo, contatoNome, contatoEmail })}
                disabled={!razaoSocial || !nomeFantasia || !cnpj || criarB2B.isPending}
              >
                {criarB2B.isPending ? "Enviando..." : "Solicitar Acesso"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  // If B2B is pending approval, show waiting state
  if (clienteB2B && clienteB2B.status === "pendente") {
    return (
      <PublicLayout>
        <div className="container py-16 max-w-lg mx-auto text-center">
          <Shield className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-3">Cadastro em Análise</h1>
          <p className="text-muted-foreground mb-2">
            Sua solicitação B2B para <strong>{clienteB2B.nomeFantasia}</strong> está sendo analisada.
          </p>
          <p className="text-sm text-muted-foreground">
            Você receberá acesso completo à rede assim que for aprovado pelo administrador.
          </p>
        </div>
      </PublicLayout>
    );
  }

  // B2B Dashboard
  return (
    <PublicLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Área B2B</h1>
            <p className="text-muted-foreground">Acesso completo à rede de oficinas credenciadas</p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1.5">
            <Shield className="w-3.5 h-3.5 mr-1.5" />
            {clienteB2B?.nomeFantasia || "Acesso B2B"}
          </Badge>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar oficina..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  {ESTADOS_BRASIL.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_OFICINA.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{oficinasData?.oficinas.length || 0} oficinas encontradas</p>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => {
            if (!oficinasData?.oficinas.length) { toast.info("Nenhum dado para exportar"); return; }
            const headers = ["Nome Fantasia","Razão Social","CNPJ","Categoria","Cidade","Estado","Telefone","WhatsApp","Email","Score","Avaliações","Franquia","Parcelamento","Peças","Garantia"];
            const rows = oficinasData.oficinas.map(o => [
              o.nomeFantasia, o.razaoSocial, o.cnpj, o.categoria, o.cidade, o.estado,
              o.telefone || "", o.whatsapp || "", o.email || "",
              Number(o.scoreReputacao).toFixed(1), String(o.totalAvaliacoes),
              o.franquiaAntes ? "Antes" : "Depois", String(o.parcelamentoFranquia || 0),
              o.fornecePecas || "", o.garantiaServico || ""
            ]);
            const csv = [headers.join(";"), ...rows.map(r => r.map(c => `"${(c||'').replace(/"/g,'""')}"`).join(";"))].join("\n");
            const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `oficinas_rede_${new Date().toISOString().slice(0,10)}.csv`;
            a.click(); URL.revokeObjectURL(url);
            toast.success("Exportação realizada!");
          }}>
            <Download className="w-4 h-4" /> Exportar CSV
          </Button>
        </div>

        <div className="space-y-3">
          {oficinasData?.oficinas.map(oficina => (
            <Card key={oficina.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Link href={`/oficina/${oficina.id}`}>
                        <h3 className="font-semibold hover:text-primary transition-colors cursor-pointer">{oficina.nomeFantasia}</h3>
                      </Link>
                      <Badge variant="outline" className="text-xs capitalize">{oficina.categoria}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{oficina.cidade}/{oficina.estado}</span>
                      <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-500" />{Number(oficina.scoreReputacao).toFixed(1)}</span>
                      {oficina.telefone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{oficina.telefone}</span>}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Franquia: {oficina.franquiaAntes ? "Antes" : "Depois"}</p>
                    <p>Peças: {oficina.fornecePecas}</p>
                    <p>Parcela: {oficina.parcelamentoFranquia}x</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
