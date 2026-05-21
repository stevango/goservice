import { describe, expect, it } from "vitest";
import {
  proximaEtapaEsteira,
  proximaEtapaCadencia,
  etapaConvidavel,
  etapaEncerraAutomacao,
} from "@shared/types";

describe("avanço manual da esteira", () => {
  it("avança para a próxima etapa linear", () => {
    expect(proximaEtapaEsteira("lead_encontrado")).toBe("convite_enviado");
    expect(proximaEtapaEsteira("convite_enviado")).toBe("convite_entregue");
    expect(proximaEtapaEsteira("cadastro_iniciado")).toBe("cadastro_concluido");
  });

  it("retorna null no fim da esteira", () => {
    expect(proximaEtapaEsteira("operando")).toBeNull();
  });

  it("retorna null para etapas fora do caminho linear", () => {
    expect(proximaEtapaEsteira("recusou")).toBeNull();
    expect(proximaEtapaEsteira("inativo")).toBeNull();
    expect(proximaEtapaEsteira("nao_respondeu")).toBeNull();
  });
});

describe("cadência da automação", () => {
  it("primeiro toque envia o convite", () => {
    expect(proximaEtapaCadencia("lead_encontrado")).toBe("convite_enviado");
  });

  it("converge para follow-up e se mantém reconvidando", () => {
    expect(proximaEtapaCadencia("convite_enviado")).toBe("followup_1");
    expect(proximaEtapaCadencia("nao_respondeu")).toBe("followup_1");
    expect(proximaEtapaCadencia("followup_1")).toBe("followup_2");
    expect(proximaEtapaCadencia("followup_2")).toBe("followup_2");
  });
});

describe("condições de parada da automação", () => {
  it("segue convidando nas etapas iniciais", () => {
    expect(etapaConvidavel("lead_encontrado")).toBe(true);
    expect(etapaConvidavel("followup_2")).toBe(true);
    expect(etapaEncerraAutomacao("lead_encontrado")).toBe(false);
  });

  it("encerra ao aceitar (entrou no cadastro/ativação)", () => {
    expect(etapaEncerraAutomacao("cadastro_iniciado")).toBe(true);
    expect(etapaEncerraAutomacao("ativado")).toBe(true);
  });

  it("encerra ao sair do funil", () => {
    expect(etapaEncerraAutomacao("recusou")).toBe(true);
    expect(etapaEncerraAutomacao("inativo")).toBe(true);
  });

  it("negociando/interesse não são reconvidados pela automação", () => {
    expect(etapaConvidavel("negociando")).toBe(false);
    expect(etapaEncerraAutomacao("negociando")).toBe(true);
  });
});
