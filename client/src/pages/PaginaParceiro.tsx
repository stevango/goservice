import { useEffect, useRef } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Users,
  Clock,
  Building2,
} from "lucide-react";
import { segmentoLabel } from "@shared/types";
import { toast } from "sonner";

const BENEFICIOS = [
  {
    icon: TrendingUp,
    titulo: "Volume garantido",
    texto:
      "Receba demanda recorrente de seguradoras, associações e clientes finais da nossa rede.",
  },
  {
    icon: ShieldCheck,
    titulo: "Sem custo de adesão",
    texto:
      "O credenciamento é gratuito. Você só ganha ao atender mais clientes.",
  },
  {
    icon: Users,
    titulo: "Rede multissegmento",
    texto:
      "A maior rede de prestadores credenciados do Brasil, conectando você a quem precisa do seu serviço.",
  },
  {
    icon: Clock,
    titulo: "Ativação rápida",
    texto:
      "Cadastro simples e suporte dedicado para começar a receber acionamentos.",
  },
];

export default function PaginaParceiro() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const utils = trpc.useUtils();
  const visualizouEnviado = useRef(false);

  const q = trpc.atendimento.paginaParceiro.useQuery(
    { token },
    { enabled: token.length >= 8, retry: false }
  );

  const visualizou = trpc.atendimento.parceiroVisualizou.useMutation();
  const aceitar = trpc.atendimento.parceiroAceitar.useMutation({
    onSuccess: () => {
      utils.atendimento.paginaParceiro.invalidate({ token });
    },
    onError: () => toast.error("Não foi possível registrar. Tente novamente."),
  });

  // Registra a visualização uma única vez por carregamento.
  useEffect(() => {
    if (q.data && !visualizouEnviado.current) {
      visualizouEnviado.current = true;
      visualizou.mutate({ token });
    }
  }, [q.data, token, visualizou]);

  if (q.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <Building2 className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
          <h1 className="text-xl font-bold mb-1">Convite não encontrado</h1>
          <p className="text-muted-foreground">
            Este link de credenciamento é inválido ou expirou. Fale com a equipe
            GO SERVICE.
          </p>
        </div>
      </div>
    );
  }

  const { nomeFantasia, segmento, cidade, estado, aceito } = q.data;
  const local = [cidade, estado].filter(Boolean).join("/");
  const jaAceitou = aceito || aceitar.isSuccess;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <header className="bg-primary text-white">
        <div className="max-w-3xl mx-auto px-6 py-12 text-center">
          <div className="text-2xl font-bold tracking-wide">GO SERVICE</div>
          <p className="text-sm text-white/80 mt-1">
            Rede multissegmento de prestadores credenciados
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 -mt-6 pb-16">
        <div className="bg-white rounded-2xl border shadow-sm p-6 sm:p-8">
          {jaAceitou ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-600 mb-3" />
              <h1 className="text-2xl font-bold mb-2">
                Recebemos seu interesse, {nomeFantasia}!
              </h1>
              <p className="text-muted-foreground">
                Nossa equipe vai entrar em contato para concluir o
                credenciamento da sua unidade
                {local ? ` em ${local}` : ""}. Obrigado por escolher a GO
                SERVICE.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center sm:text-left">
                <span className="inline-block text-xs font-medium text-primary bg-primary/10 rounded-full px-3 py-1 mb-3">
                  Convite de credenciamento
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                  {nomeFantasia}, sua {segmentoLabel(segmento).toLowerCase()}{" "}
                  pode fazer parte da rede GO SERVICE
                </h1>
                <p className="text-muted-foreground mt-3">
                  Conectamos a sua unidade
                  {local ? ` em ${local}` : ""} a seguradoras, associações e
                  clientes que precisam do seu serviço — com volume recorrente e
                  sem custo de adesão.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-8">
                {BENEFICIOS.map(b => (
                  <div key={b.titulo} className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <b.icon className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{b.titulo}</h3>
                      <p className="text-sm text-muted-foreground">{b.texto}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t text-center">
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-8 gap-2"
                  disabled={aceitar.isPending}
                  onClick={() => aceitar.mutate({ token })}
                >
                  {aceitar.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Quero credenciar minha unidade
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Sem compromisso. Nossa equipe entra em contato para concluir o
                  cadastro.
                </p>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          GO SERVICE • Rede de prestadores credenciados
        </p>
      </main>
    </div>
  );
}
