import {
  AUTOMACAO_CADENCIA_HORAS,
  MAX_TENTATIVAS_AUTOMACAO,
  automacaoAtingiuLimite,
  etapaEncerraAutomacao,
  proximaEtapaCadencia,
  sugerirMensagem,
  assuntoEmail,
  type AtendimentoCanal,
} from "@shared/types";
import * as db from "../db";
import type { ProspectAutomacao } from "../db";
import { ENV } from "./env";
import { enviarMensagem } from "./sender";

const TICK_MS = 5 * 60 * 1000; // verifica a fila a cada 5 min
let workerStarted = false;

function proximaAcao(now: Date): Date {
  return new Date(now.getTime() + AUTOMACAO_CADENCIA_HORAS * 60 * 60 * 1000);
}

function escolherCanal(
  p: ProspectAutomacao
): { canal: AtendimentoCanal; destino: string } | null {
  const wa = p.whatsapp || p.telefone;
  if (wa) return { canal: "whatsapp", destino: wa };
  if (p.email) return { canal: "email", destino: p.email };
  return null;
}

function linkParceiro(token: string): string | null {
  return ENV.appUrl ? `${ENV.appUrl}/parceiro/${token}` : null;
}

// Processa um lote de prospects com automação ligada e ação vencida.
// Reconvida pelo canal disponível, registra o evento e avança a cadência.
export async function processarAutomacao(): Promise<number> {
  const now = new Date();
  const fila = await db.listProspectsParaAutomacao(now, 50);
  let processados = 0;

  for (const p of fila) {
    // Segurança: se já saiu da fase de convite, desliga a automação.
    if (etapaEncerraAutomacao(p.etapaAtendimento)) {
      await db.updateOficina(p.id, { automacaoAtiva: false });
      continue;
    }

    // Cap: depois do limite, pausa e devolve para revisão humana.
    if (automacaoAtingiuLimite(p.tentativasConvite)) {
      await db.updateOficina(p.id, {
        automacaoAtiva: false,
        etapaAtendimento: "nao_respondeu",
      });
      await db.addAtendimentoEvento({
        oficinaId: p.id,
        canal: "outro",
        tipo: "nota",
        etapaNova: "nao_respondeu",
        mensagem: `Automação pausada após ${MAX_TENTATIVAS_AUTOMACAO} reconvites sem resposta. Marcada para revisão humana.`,
      });
      continue;
    }

    const escolha = escolherCanal(p);
    if (!escolha) {
      await db.updateOficina(p.id, { automacaoAtiva: false });
      await db.addAtendimentoEvento({
        oficinaId: p.id,
        canal: "outro",
        tipo: "nota",
        mensagem:
          "Automação pausada: prestador sem WhatsApp, telefone ou e-mail para contato.",
      });
      continue;
    }

    const token = p.tokenParceiro ?? (await db.ensureTokenParceiro(p.id));
    const link = linkParceiro(token);
    const texto = sugerirMensagem({
      nomeFantasia: p.nomeFantasia,
      segmento: p.segmento,
      cidade: p.cidade,
      estado: p.estado,
      canal: escolha.canal,
      link,
    });

    const res = await enviarMensagem({
      canal: escolha.canal,
      destino: escolha.destino,
      assunto:
        escolha.canal === "email" ? assuntoEmail(p.nomeFantasia) : undefined,
      texto,
    });

    if (!res.ok) {
      // Não trava a fila: adia para o próximo ciclo.
      await db.updateOficina(p.id, { proximaAcaoAt: proximaAcao(now) });
      continue;
    }

    const novaEtapa = proximaEtapaCadencia(p.etapaAtendimento);
    await db.addAtendimentoEvento({
      oficinaId: p.id,
      canal: escolha.canal,
      tipo: "enviado",
      mensagem: `[Automação] ${texto}`,
      etapaNova: novaEtapa,
    });
    await db.updateOficina(p.id, {
      etapaAtendimento: novaEtapa,
      ultimoContatoAt: now,
      proximaAcaoAt: proximaAcao(now),
      tentativasConvite: p.tentativasConvite + 1,
    });
    processados++;
  }

  return processados;
}

export function startAutomacaoWorker(): void {
  if (workerStarted) return;
  workerStarted = true;
  setInterval(() => {
    processarAutomacao().catch(error =>
      console.error("[Automação] Erro no ciclo da esteira:", error)
    );
  }, TICK_MS);
  console.log("[Automação] Worker da esteira de conversão iniciado.");
}
