// Catálogo de segmentos da rede GO SERVICE. Cada segmento tem o termo
// de busca usado no Google Places. Agrupado para a UI.
export const SEGMENTOS = [
  {
    grupo: "Automotivo",
    itens: [
      { value: "oficina_mecanica", label: "Oficina Mecânica", termo: "oficina mecânica" },
      { value: "loja_pecas", label: "Loja de Peças Automotivas", termo: "loja de peças automotivas" },
      { value: "fornecedor_pecas", label: "Fornecedor de Peças Automotivas", termo: "distribuidora de autopeças" },
      { value: "lava_jato", label: "Lava-Jato", termo: "lava jato" },
      { value: "posto_gasolina", label: "Posto de Gasolina", termo: "posto de gasolina" },
      { value: "som_acessorios", label: "Som e Acessórios Automotivos", termo: "som e acessórios automotivos" },
      { value: "troca_pneu", label: "Troca de Pneu / Borracharia", termo: "borracharia" },
      { value: "recarga_bateria", label: "Recarga de Bateria", termo: "recarga de bateria automotiva" },
    ],
  },
  {
    grupo: "Assistência Veicular 24h",
    itens: [
      { value: "assistencia_24h", label: "Assistência Veicular 24h", termo: "assistência veicular 24 horas" },
      { value: "reboque_guincho", label: "Reboque / Guincho", termo: "guincho reboque" },
      { value: "chaveiro_auto", label: "Chaveiro Automotivo", termo: "chaveiro automotivo" },
    ],
  },
  {
    grupo: "Apoio ao Motorista",
    itens: [
      { value: "taxi_app", label: "Táxi / Aplicativo", termo: "ponto de táxi" },
      { value: "hospedagem", label: "Hospedagem", termo: "hotel" },
      { value: "carro_reserva", label: "Carro Reserva", termo: "locadora de veículos" },
      { value: "guarda_veiculo", label: "Guarda do Veículo", termo: "estacionamento" },
      { value: "motorista_substituto", label: "Motorista Substituto", termo: "motorista particular" },
    ],
  },
  {
    grupo: "Assistência Residencial",
    itens: [
      { value: "chaveiro_residencial", label: "Chaveiro Residencial", termo: "chaveiro" },
      { value: "eletricista", label: "Eletricista", termo: "eletricista" },
      { value: "encanador", label: "Encanador", termo: "encanador" },
      { value: "vidraceiro", label: "Vidraceiro", termo: "vidraçaria" },
      { value: "desentupimento", label: "Desentupimento", termo: "desentupidora" },
      { value: "reparos_emergenciais", label: "Reparos Emergenciais", termo: "serviços de reparos residenciais" },
      { value: "cobertura_telhado", label: "Cobertura Provisória de Telhado", termo: "reforma de telhado" },
      { value: "vigilancia_residencial", label: "Vigilância Residencial", termo: "empresa de segurança" },
      { value: "limpeza_emergencial", label: "Limpeza Emergencial", termo: "serviço de limpeza" },
    ],
  },
  {
    grupo: "Pet",
    itens: [
      { value: "clinica_veterinaria", label: "Clínica Veterinária", termo: "clínica veterinária" },
    ],
  },
] as const;

export type SegmentoInfo = { label: string; termo: string; grupo: string };

export const SEGMENTO_INFO: Record<string, SegmentoInfo> = Object.fromEntries(
  SEGMENTOS.flatMap(g =>
    g.itens.map(i => [i.value, { label: i.label, termo: i.termo, grupo: g.grupo }])
  )
);

export function segmentoLabel(value: string | null | undefined): string {
  return (value && SEGMENTO_INFO[value]?.label) || value || "—";
}

// Google não tem campo de Instagram; mas muitos negócios cadastram o
// Instagram como "site". Detecta isso para exibir como rede social.
export function ehInstagram(url: string | null | undefined): boolean {
  return !!url && /(^|\/\/|\.)instagram\.com/i.test(url);
}

// Traduz o horário do Google (weekday_text) para PT-BR na exibição.
// Cobre dados já salvos em inglês sem precisar re-enriquecer.
const DIAS_EN_PT: Record<string, string> = {
  Monday: "Segunda-feira",
  Tuesday: "Terça-feira",
  Wednesday: "Quarta-feira",
  Thursday: "Quinta-feira",
  Friday: "Sexta-feira",
  Saturday: "Sábado",
  Sunday: "Domingo",
};

function horaPara24h(texto: string): string {
  return texto.replace(
    /(\d{1,2}):(\d{2})\s?(AM|PM)/g,
    (_all, h: string, mm: string, ap: string) => {
      let hour = parseInt(h, 10) % 12;
      if (ap === "PM") hour += 12;
      return `${String(hour).padStart(2, "0")}:${mm}`;
    }
  );
}

export function traduzHorario(
  texto: string | null | undefined
): string {
  if (!texto) return "";
  return texto
    .split("\n")
    .map(linha => {
      let l = linha;
      for (const [en, pt] of Object.entries(DIAS_EN_PT)) {
        l = l.replace(new RegExp(`\\b${en}\\b`, "g"), pt);
      }
      l = l
        .replace(/\bClosed\b/g, "Fechado")
        .replace(/\bOpen 24 hours\b/g, "Aberto 24 horas");
      return horaPara24h(l);
    })
    .join("\n");
}

export const TIPOS_VEICULOS = [
  { value: "leve", label: "Veículo Leve" },
  { value: "pesado", label: "Veículo Pesado" },
  { value: "moto", label: "Motocicleta" },
  { value: "van", label: "Van / Utilitário" },
  { value: "nautico", label: "Náutico" },
] as const;

export const TIPOS_SERVICOS = [
  { value: "funilaria", label: "Funilaria e Pintura" },
  { value: "mecanica", label: "Mecânica Geral" },
  { value: "eletrica", label: "Elétrica Automotiva" },
  { value: "vidros", label: "Vidros e Faróis" },
  { value: "revisao", label: "Revisão e Manutenção" },
  { value: "suspensao", label: "Suspensão e Freios" },
  { value: "ar_condicionado", label: "Ar Condicionado" },
  { value: "cambio", label: "Câmbio e Transmissão" },
  { value: "injecao", label: "Injeção Eletrônica" },
  { value: "alinhamento", label: "Alinhamento e Balanceamento" },
  { value: "martelinho", label: "Martelinho de Ouro" },
  { value: "envelopamento", label: "Envelopamento" },
] as const;

export const CATEGORIAS_OFICINA = [
  { value: "premium", label: "Premium", description: "Oficina com estrutura completa e certificações" },
  { value: "concessionaria", label: "Concessionária", description: "Autorizada pela montadora" },
  { value: "padrao", label: "Padrão", description: "Oficina com estrutura básica" },
] as const;

export const STATUS_OFICINA = [
  { value: "pendente", label: "Pendente", color: "yellow" },
  { value: "ativa", label: "Ativa", color: "green" },
  { value: "bloqueada", label: "Bloqueada", color: "red" },
  { value: "rejeitada", label: "Rejeitada", color: "gray" },
] as const;

export const ESTADOS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
] as const;

export const ESTADOS_BRASIL_NOMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia",
  CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
  MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul",
  MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná",
  PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia",
  RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe",
  TO: "Tocantins",
};

export const FORNECE_PECAS_OPTIONS = [
  { value: "oficina", label: "Oficina fornece" },
  { value: "seguradora", label: "Seguradora fornece" },
  { value: "cliente", label: "Cliente fornece" },
  { value: "ambos", label: "Oficina ou Cliente" },
] as const;
