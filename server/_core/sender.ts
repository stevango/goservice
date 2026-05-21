import type { AtendimentoCanal } from "@shared/types";

export type ResultadoEnvio = { ok: boolean; motivo?: string };

// Ponto único de envio de mensagens da esteira. HOJE é um stub: registra
// no log e retorna sucesso, sem entregar de fato. Para ligar o envio real,
// implemente aqui a integração do canal (WhatsApp Business API, provedor de
// e-mail/SMS) — o resto da automação já está pronto para usar.
export async function enviarMensagem(opts: {
  canal: AtendimentoCanal;
  destino: string;
  assunto?: string;
  texto: string;
}): Promise<ResultadoEnvio> {
  if (!opts.destino) return { ok: false, motivo: "Sem destino para o canal" };
  console.log(
    `[Sender] (stub) ${opts.canal} -> ${opts.destino}: ${opts.texto.slice(0, 80)}`
  );
  // TODO: integração real de envio por canal.
  return { ok: true };
}
