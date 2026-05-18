import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { CheckCircle2, Building2, MapPin, FileText, Camera, FileSignature } from "lucide-react";
import { TIPOS_VEICULOS, TIPOS_SERVICOS, ESTADOS_BRASIL } from "@shared/types";

const STEPS = [
  { id: "dados", label: "Dados Cadastrais", icon: Building2 },
  { id: "endereco", label: "Endereço", icon: MapPin },
  { id: "servicos", label: "Serviços", icon: FileText },
  { id: "comercial", label: "Comercial", icon: FileSignature },
  { id: "confirmacao", label: "Confirmação", icon: CheckCircle2 },
];

export default function CadastroOficina() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);

  // Form state
  const [cnpj, setCnpj] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [nomeRepresentante, setNomeRepresentante] = useState("");

  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  const [tiposVeiculos, setTiposVeiculos] = useState<string[]>([]);
  const [tiposServicos, setTiposServicos] = useState<string[]>([]);
  const [categoria, setCategoria] = useState("padrao");

  const [franquiaAntes, setFranquiaAntes] = useState(false);
  const [parcelamentoFranquia, setParcelamentoFranquia] = useState("3");
  const [fornecePecas, setFornecePecas] = useState("oficina");
  const [garantiaServico, setGarantiaServico] = useState("");
  const [banco, setBanco] = useState("");
  const [agencia, setAgencia] = useState("");
  const [contaCorrente, setContaCorrente] = useState("");
  const [pixTipo, setPixTipo] = useState("");
  const [pixChave, setPixChave] = useState("");

  const criarOficina = trpc.oficinas.criar.useMutation({
    onSuccess: (data) => {
      // Update with all data
      atualizarOficina.mutate({
        id: data.id,
        cep, logradouro, numero, complemento, bairro, cidade, estado,
        tiposVeiculos, tiposServicos,
        categoria: categoria as any,
        franquiaAntes,
        franquiaDepois: !franquiaAntes,
        parcelamentoFranquia: Number(parcelamentoFranquia),
        fornecePecas: fornecePecas as any,
        garantiaServico,
        etapaCadastro: "completo",
      });
    },
    onError: (err) => toast.error(err.message || "Erro ao cadastrar oficina"),
  });

  const atualizarOficina = trpc.oficinas.atualizar.useMutation({
    onSuccess: () => {
      setStep(4);
      toast.success("Oficina cadastrada com sucesso!");
    },
    onError: () => toast.error("Erro ao salvar dados complementares"),
  });

  const handleSubmit = () => {
    criarOficina.mutate({
      cnpj, razaoSocial, nomeFantasia, telefone, whatsapp, email, nomeRepresentante,
    });
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="container py-16">
          <div className="h-64 rounded-xl bg-muted animate-pulse" />
        </div>
      </PublicLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <PublicLayout>
        <div className="container py-16 max-w-lg mx-auto text-center">
          <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-3">Credenciar Oficina</h1>
          <p className="text-muted-foreground mb-6">
            Para cadastrar sua oficina na rede, faça login primeiro.
          </p>
          <Button asChild size="lg" className="rounded-xl">
            <a href={getLoginUrl("/cadastro")}>Entrar para Cadastrar</a>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container py-8 max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Credenciar Oficina</h1>
        <p className="text-muted-foreground mb-8">Preencha os dados para fazer parte da rede</p>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-10 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i === step ? "bg-primary text-white" :
                i < step ? "bg-primary/10 text-primary" :
                "bg-muted text-muted-foreground"
              }`}>
                <s.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${i < step ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Dados Cadastrais */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Dados Cadastrais</CardTitle>
              <CardDescription>Informações básicas da oficina e representante</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>CNPJ *</Label>
                  <Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" className="mt-1" />
                </div>
                <div>
                  <Label>Nome Fantasia *</Label>
                  <Input value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} placeholder="Nome da oficina" className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Razão Social *</Label>
                <Input value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} placeholder="Razão social completa" className="mt-1" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Telefone</Label>
                  <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 0000-0000" className="mt-1" />
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(00) 00000-0000" className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>E-mail</Label>
                  <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="contato@oficina.com" className="mt-1" />
                </div>
                <div>
                  <Label>Nome do Representante</Label>
                  <Input value={nomeRepresentante} onChange={e => setNomeRepresentante(e.target.value)} placeholder="Nome completo" className="mt-1" />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={() => setStep(1)} disabled={!cnpj || !razaoSocial || !nomeFantasia} className="rounded-xl">
                  Próximo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Endereço */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>Localização da oficina</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>CEP</Label>
                  <Input value={cep} onChange={e => setCep(e.target.value)} placeholder="00000-000" className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Logradouro</Label>
                  <Input value={logradouro} onChange={e => setLogradouro(e.target.value)} placeholder="Rua, Avenida..." className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Número</Label>
                  <Input value={numero} onChange={e => setNumero(e.target.value)} placeholder="123" className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Complemento</Label>
                  <Input value={complemento} onChange={e => setComplemento(e.target.value)} placeholder="Sala, Galpão..." className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Bairro</Label>
                  <Input value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Bairro" className="mt-1" />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Cidade" className="mt-1" />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select value={estado} onValueChange={setEstado}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BRASIL.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(0)} className="rounded-xl">Voltar</Button>
                <Button onClick={() => setStep(2)} className="rounded-xl">Próximo</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Serviços */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Serviços e Veículos</CardTitle>
              <CardDescription>Selecione os serviços oferecidos e tipos de veículos atendidos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Categoria da Oficina</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="padrao">Padrão</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="concessionaria">Concessionária</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-medium mb-3 block">Tipos de Veículos Atendidos</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {TIPOS_VEICULOS.map(t => (
                    <label key={t.value} className="flex items-center gap-2 p-3 rounded-lg border border-border/60 hover:border-primary/30 cursor-pointer transition-colors">
                      <Checkbox
                        checked={tiposVeiculos.includes(t.value)}
                        onCheckedChange={(checked) => {
                          if (checked) setTiposVeiculos([...tiposVeiculos, t.value]);
                          else setTiposVeiculos(tiposVeiculos.filter(v => v !== t.value));
                        }}
                      />
                      <span className="text-sm">{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium mb-3 block">Serviços Oferecidos</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {TIPOS_SERVICOS.map(t => (
                    <label key={t.value} className="flex items-center gap-2 p-3 rounded-lg border border-border/60 hover:border-primary/30 cursor-pointer transition-colors">
                      <Checkbox
                        checked={tiposServicos.includes(t.value)}
                        onCheckedChange={(checked) => {
                          if (checked) setTiposServicos([...tiposServicos, t.value]);
                          else setTiposServicos(tiposServicos.filter(v => v !== t.value));
                        }}
                      />
                      <span className="text-sm">{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">Voltar</Button>
                <Button onClick={() => setStep(3)} className="rounded-xl">Próximo</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Comercial */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Informações Comerciais</CardTitle>
              <CardDescription>Dados financeiros e condições de atendimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Recebe franquia antes do serviço?</Label>
                  <Select value={franquiaAntes ? "sim" : "nao"} onValueChange={v => setFranquiaAntes(v === "sim")}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao">Não, após o serviço</SelectItem>
                      <SelectItem value="sim">Sim, antes do serviço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Parcelamento da Franquia (vezes)</Label>
                  <Input type="number" value={parcelamentoFranquia} onChange={e => setParcelamentoFranquia(e.target.value)} min="1" max="12" className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Quem fornece as peças?</Label>
                  <Select value={fornecePecas} onValueChange={setFornecePecas}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oficina">Oficina fornece</SelectItem>
                      <SelectItem value="seguradora">Seguradora fornece</SelectItem>
                      <SelectItem value="cliente">Cliente fornece</SelectItem>
                      <SelectItem value="ambos">Oficina ou Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Garantia do Serviço</Label>
                  <Input value={garantiaServico} onChange={e => setGarantiaServico(e.target.value)} placeholder="Ex: 1 ano" className="mt-1" />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Dados Bancários</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Banco</Label>
                    <Input value={banco} onChange={e => setBanco(e.target.value)} placeholder="Nome do banco" className="mt-1" />
                  </div>
                  <div>
                    <Label>Agência</Label>
                    <Input value={agencia} onChange={e => setAgencia(e.target.value)} placeholder="0000" className="mt-1" />
                  </div>
                  <div>
                    <Label>Conta Corrente</Label>
                    <Input value={contaCorrente} onChange={e => setContaCorrente(e.target.value)} placeholder="00000-0" className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label>Tipo PIX</Label>
                    <Select value={pixTipo} onValueChange={setPixTipo}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                        <SelectItem value="telefone">Telefone</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="chave_aleatoria">Chave Aleatória</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Chave PIX</Label>
                    <Input value={pixChave} onChange={e => setPixChave(e.target.value)} placeholder="Chave PIX" className="mt-1" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl">Voltar</Button>
                <Button onClick={handleSubmit} disabled={criarOficina.isPending || atualizarOficina.isPending} className="rounded-xl">
                  {criarOficina.isPending || atualizarOficina.isPending ? "Cadastrando..." : "Finalizar Cadastro"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Confirmação */}
        {step === 4 && (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Cadastro Realizado!</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Sua oficina foi cadastrada com sucesso e está em análise. 
                Você receberá uma notificação quando for aprovada.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" asChild className="rounded-xl">
                  <a href="/minha-oficina">Ver Minha Oficina</a>
                </Button>
                <Button asChild className="rounded-xl">
                  <a href="/">Voltar ao Início</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PublicLayout>
  );
}
