import type { AtendimentoCanal } from "@shared/types";
import { ENV } from "./env";

export type ResultadoEnvio = { ok: boolean; motivo?: string };

// Ponto único de envio de mensagens da esteira. E-mail entra real via
// Resend quando RESEND_API_KEY + FROM_EMAIL estão configurados; senão cai
// no stub. WhatsApp/SMS seguem em stub até a integração do provedor.
export async function enviarMensagem(opts: {
  canal: AtendimentoCanal;
  destino: string;
  assunto?: string;
  texto: string;
}): Promise<ResultadoEnvio> {
  if (!opts.destino) return { ok: false, motivo: "Sem destino para o canal" };

  if (opts.canal === "email" && ENV.resendApiKey && ENV.fromEmail) {
    return enviarPorResend({
      to: opts.destino,
      from: ENV.fromEmail,
      subject: opts.assunto ?? "GO SERVICE",
      text: opts.texto,
    });
  }

  console.log(
    `[Sender] (stub) ${opts.canal} -> ${opts.destino}: ${opts.texto.slice(0, 80)}`
  );
  return { ok: true };
}

async function enviarPorResend(opts: {
  to: string;
  from: string;
  subject: string;
  text: string;
}): Promise<ResultadoEnvio> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: opts.from,
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.warn(`[Sender] Resend ${res.status}: ${detail.slice(0, 200)}`);
      return { ok: false, motivo: `Resend HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (error) {
    console.error("[Sender] Falha ao enviar via Resend:", error);
    return { ok: false, motivo: "Erro de rede no envio de e-mail" };
  }
}
