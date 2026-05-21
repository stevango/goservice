// Catálogo de segmentos da rede GO SERVICE. Cada segmento tem o termo
// de busca usado no Google Places. Agrupado para a UI.
export const SEGMENTOS = [
  {
    grupo: "Automotivo",
    itens: [
      {
        value: "oficina_mecanica",
        label: "Oficina Mecânica",
        termo: "oficina mecânica",
      },
      {
        value: "loja_pecas",
        label: "Loja de Peças Automotivas",
        termo: "loja de peças automotivas",
      },
      {
        value: "fornecedor_pecas",
        label: "Fornecedor de Peças Automotivas",
        termo: "distribuidora de autopeças",
      },
      { value: "lava_jato", label: "Lava-Jato", termo: "lava jato" },
      {
        value: "posto_gasolina",
        label: "Posto de Gasolina",
        termo: "posto de gasolina",
      },
      {
        value: "som_acessorios",
        label: "Som e Acessórios Automotivos",
        termo: "som e acessórios automotivos",
      },
      {
        value: "troca_pneu",
        label: "Troca de Pneu / Borracharia",
        termo: "borracharia",
      },
      {
        value: "recarga_bateria",
        label: "Recarga de Bateria",
        termo: "recarga de bateria automotiva",
      },
    ],
  },
  {
    grupo: "Assistência Veicular 24h",
    itens: [
      {
        value: "assistencia_24h",
        label: "Assistência Veicular 24h",
        termo: "assistência veicular 24 horas",
      },
      {
        value: "reboque_guincho",
        label: "Reboque / Guincho",
        termo: "guincho reboque",
      },
      {
        value: "chaveiro_auto",
        label: "Chaveiro Automotivo",
        termo: "chaveiro automotivo",
      },
    ],
  },
  {
    grupo: "Apoio ao Motorista",
    itens: [
      { value: "taxi_app", label: "Táxi / Aplicativo", termo: "ponto de táxi" },
      { value: "hospedagem", label: "Hospedagem", termo: "hotel" },
      {
        value: "carro_reserva",
        label: "Carro Reserva",
        termo: "locadora de veículos",
      },
      {
        value: "guarda_veiculo",
        label: "Guarda do Veículo",
        termo: "estacionamento",
      },
      {
        value: "motorista_substituto",
        label: "Motorista Substituto",
        termo: "motorista particular",
      },
    ],
  },
  {
    grupo: "Assistência Residencial",
    itens: [
      {
        value: "chaveiro_residencial",
        label: "Chaveiro Residencial",
        termo: "chaveiro",
      },
      { value: "eletricista", label: "Eletricista", termo: "eletricista" },
      { value: "encanador", label: "Encanador", termo: "encanador" },
      { value: "vidraceiro", label: "Vidraceiro", termo: "vidraçaria" },
      {
        value: "desentupimento",
        label: "Desentupimento",
        termo: "desentupidora",
      },
      {
        value: "reparos_emergenciais",
        label: "Reparos Emergenciais",
        termo: "serviços de reparos residenciais",
      },
      {
        value: "cobertura_telhado",
        label: "Cobertura Provisória de Telhado",
        termo: "reforma de telhado",
      },
      {
        value: "vigilancia_residencial",
        label: "Vigilância Residencial",
        termo: "empresa de segurança",
      },
      {
        value: "limpeza_emergencial",
        label: "Limpeza Emergencial",
        termo: "serviço de limpeza",
      },
    ],
  },
  {
    grupo: "Pet",
    itens: [
      {
        value: "clinica_veterinaria",
        label: "Clínica Veterinária",
        termo: "clínica veterinária",
      },
      {
        value: "hospital_veterinario",
        label: "Hospital Veterinário 24h",
        termo: "hospital veterinário 24 horas",
      },
      {
        value: "farmacia_veterinaria",
        label: "Farmácia Veterinária",
        termo: "farmácia veterinária",
      },
      {
        value: "laboratorio_veterinario",
        label: "Laboratório Veterinário",
        termo: "laboratório de análises veterinárias",
      },
      {
        value: "fisioterapia_animal",
        label: "Fisioterapia / Reabilitação Animal",
        termo: "fisioterapia veterinária",
      },
      { value: "pet_shop", label: "Pet Shop", termo: "pet shop" },
      { value: "banho_tosa", label: "Banho e Tosa", termo: "banho e tosa" },
      {
        value: "hotel_pet",
        label: "Hotel / Creche Pet",
        termo: "hotel para cães",
      },
      {
        value: "adestramento",
        label: "Adestramento",
        termo: "adestrador de cães",
      },
      {
        value: "transporte_pet",
        label: "Transporte / Táxi Pet",
        termo: "transporte de animais",
      },
    ],
  },
  {
    grupo: "Energia Solar",
    itens: [
      {
        value: "energia_solar_empresa",
        label: "Empresa de Energia Solar",
        termo: "empresa de energia solar",
      },
      {
        value: "loja_placa_solar",
        label: "Loja de Placas Solares",
        termo: "loja de energia solar",
      },
      {
        value: "revendedor_placa_solar",
        label: "Revendedor / Distribuidor Solar",
        termo: "distribuidora de energia solar",
      },
      {
        value: "instalador_placa_solar",
        label: "Instalador de Energia Solar",
        termo: "instalador de energia solar",
      },
      {
        value: "manutencao_placa_solar",
        label: "Manutenção / Limpeza de Painéis",
        termo: "manutenção de placas solares",
      },
    ],
  },
  {
    grupo: "Veículos — Lojas e Agências",
    itens: [
      { value: "loja_auto", label: "Automóveis", termo: "loja de carros" },
      { value: "loja_moto", label: "Motos", termo: "loja de motos" },
      {
        value: "loja_carro_eletrico",
        label: "Carro Elétrico",
        termo: "loja de carros elétricos",
      },
      { value: "loja_nautico", label: "Náutico", termo: "loja de barcos" },
      {
        value: "loja_caminhao",
        label: "Caminhões",
        termo: "concessionária de caminhões",
      },
      { value: "loja_onibus", label: "Ônibus", termo: "venda de ônibus" },
      {
        value: "loja_trator",
        label: "Tratores",
        termo: "concessionária de tratores",
      },
      {
        value: "loja_quadriciclo_utv",
        label: "Quadriciclo e UTV",
        termo: "loja de quadriciclos",
      },
      {
        value: "loja_triciclo",
        label: "Triciclos",
        termo: "loja de triciclos",
      },
    ],
  },
] as const;

export type SegmentoInfo = { label: string; termo: string; grupo: string };

export const SEGMENTO_INFO: Record<string, SegmentoInfo> = Object.fromEntries(
  SEGMENTOS.flatMap(g =>
    g.itens.map(i => [
      i.value,
      { label: i.label, termo: i.termo, grupo: g.grupo },
    ])
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

export function traduzHorario(texto: string | null | undefined): string {
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
  {
    value: "premium",
    label: "Premium",
    description: "Oficina com estrutura completa e certificações",
  },
  {
    value: "concessionaria",
    label: "Concessionária",
    description: "Autorizada pela montadora",
  },
  {
    value: "padrao",
    label: "Padrão",
    description: "Oficina com estrutura básica",
  },
] as const;

export const STATUS_OFICINA = [
  { value: "pendente", label: "Pendente", color: "yellow" },
  { value: "ativa", label: "Ativa", color: "green" },
  { value: "bloqueada", label: "Bloqueada", color: "red" },
  { value: "rejeitada", label: "Rejeitada", color: "gray" },
] as const;

export const ESTADOS_BRASIL = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export const ESTADOS_BRASIL_NOMES: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

export const FORNECE_PECAS_OPTIONS = [
  { value: "oficina", label: "Oficina fornece" },
  { value: "seguradora", label: "Seguradora fornece" },
  { value: "cliente", label: "Cliente fornece" },
  { value: "ambos", label: "Oficina ou Cliente" },
] as const;

// ============================================================
// CENTRO DE CONVERSÃO DE PARCEIROS (Atendimento / CRM)
// ============================================================

export const ATENDIMENTO_ETAPAS = [
  "lead_encontrado",
  "convite_enviado",
  "convite_entregue",
  "visualizou",
  "nao_respondeu",
  "followup_1",
  "followup_2",
  "negociando",
  "interesse_demonstrado",
  "cadastro_iniciado",
  "cadastro_concluido",
  "ativado",
  "operando",
  "recusou",
  "inativo",
] as const;
export type AtendimentoEtapa = (typeof ATENDIMENTO_ETAPAS)[number];

export const ETAPA_LABEL: Record<AtendimentoEtapa, string> = {
  lead_encontrado: "Lead encontrado",
  convite_enviado: "Convite enviado",
  convite_entregue: "Convite entregue",
  visualizou: "Visualizou",
  nao_respondeu: "Não respondeu",
  followup_1: "Follow-up 1",
  followup_2: "Follow-up 2",
  negociando: "Negociando",
  interesse_demonstrado: "Interesse demonstrado",
  cadastro_iniciado: "Cadastro iniciado",
  cadastro_concluido: "Cadastro concluído",
  ativado: "Ativado",
  operando: "Operando",
  recusou: "Recusou",
  inativo: "Inativo",
};

// Agrupa as 15 etapas em raias visuais do kanban.
export const ATENDIMENTO_LANES: Array<{
  id: string;
  label: string;
  etapas: AtendimentoEtapa[];
  cor: string;
}> = [
  {
    id: "descoberta",
    label: "Descoberta",
    etapas: ["lead_encontrado"],
    cor: "border-slate-200 bg-slate-50",
  },
  {
    id: "convite",
    label: "Convite",
    etapas: [
      "convite_enviado",
      "convite_entregue",
      "visualizou",
      "nao_respondeu",
    ],
    cor: "border-blue-200 bg-blue-50",
  },
  {
    id: "followup",
    label: "Follow-up",
    etapas: ["followup_1", "followup_2"],
    cor: "border-amber-200 bg-amber-50",
  },
  {
    id: "negociacao",
    label: "Negociação",
    etapas: ["negociando", "interesse_demonstrado"],
    cor: "border-purple-200 bg-purple-50",
  },
  {
    id: "ativacao",
    label: "Ativação",
    etapas: ["cadastro_iniciado", "cadastro_concluido", "ativado", "operando"],
    cor: "border-green-200 bg-green-50",
  },
  {
    id: "fora",
    label: "Fora",
    etapas: ["recusou", "inativo"],
    cor: "border-red-200 bg-red-50",
  },
];

export function laneDaEtapa(etapa: string | null | undefined): string {
  if (!etapa) return "descoberta";
  return (
    ATENDIMENTO_LANES.find(l => (l.etapas as string[]).includes(etapa))?.id ??
    "descoberta"
  );
}

export const ATENDIMENTO_CANAIS = [
  "email",
  "whatsapp",
  "sms",
  "telefone",
  "presencial",
  "outro",
] as const;
export type AtendimentoCanal = (typeof ATENDIMENTO_CANAIS)[number];
export const CANAL_LABEL: Record<AtendimentoCanal, string> = {
  email: "E-mail",
  whatsapp: "WhatsApp",
  sms: "SMS",
  telefone: "Ligação",
  presencial: "Presencial",
  outro: "Outro",
};

export const ATENDIMENTO_TIPOS = [
  "enviado",
  "entregue",
  "aberto",
  "clicado",
  "respondeu",
  "aceitou",
  "recusou",
  "nota",
] as const;
export type AtendimentoTipo = (typeof ATENDIMENTO_TIPOS)[number];
export const TIPO_LABEL: Record<AtendimentoTipo, string> = {
  enviado: "Enviado",
  entregue: "Entregue",
  aberto: "Aberto",
  clicado: "Clicado",
  respondeu: "Respondeu",
  aceitou: "Aceitou",
  recusou: "Recusou",
  nota: "Nota interna",
};

// Abertura por grupo de segmento — base pra sugestão automática de copy.
const ABERTURA_GRUPO: Record<string, string> = {
  Automotivo:
    "Conectamos sua oficina a seguradoras e associações da região, com volume garantido.",
  "Assistência Veicular 24h":
    "Sua empresa pode receber acionamentos 24h das nossas seguradoras parceiras.",
  "Apoio ao Motorista":
    "Atenda clientes de seguradoras e locadoras quando o veículo ficar parado.",
  "Assistência Residencial":
    "Receba chamados de assistência residencial 24h da nossa rede.",
  Pet: "Atenda clientes premium com recorrência através da nossa rede de seguros pet.",
  "Energia Solar": "Receba leads qualificados da nossa rede em todo o Brasil.",
  "Veículos — Lojas e Agências":
    "Ofereça opções de venda e carro reserva para nossa base de clientes.",
};

export function sugerirMensagem(input: {
  nomeFantasia: string;
  segmento: string | null | undefined;
  cidade: string | null | undefined;
  estado: string | null | undefined;
  canal: AtendimentoCanal;
}): string {
  const grupo =
    (input.segmento && SEGMENTO_INFO[input.segmento]?.grupo) || "Automotivo";
  const abertura = ABERTURA_GRUPO[grupo] ?? ABERTURA_GRUPO["Automotivo"];
  const local = [input.cidade, input.estado].filter(Boolean).join("/");
  if (input.canal === "whatsapp") {
    return `Olá, equipe da ${input.nomeFantasia}! Aqui é da GO SERVICE. ${abertura} Posso enviar mais detalhes sobre como credenciar ${local ? `a sua unidade em ${local}` : "sua unidade"} sem custo?`;
  }
  if (input.canal === "sms") {
    return `GO SERVICE: ${abertura} Responda SIM para receber os detalhes do credenciamento.`;
  }
  if (input.canal === "email") {
    return `Olá, ${input.nomeFantasia},\n\n${abertura}\n\nA GO SERVICE é a maior rede multissegmento de prestadores credenciados do Brasil. Conectamos seguradoras, associações e clientes finais à melhor estrutura local${local ? ` em ${local}` : ""}.\n\nPosso agendar uma conversa rápida (15 min) para apresentar a oportunidade?\n\nAtt,\nEquipe GO SERVICE`;
  }
  return `${abertura} Vamos conversar sobre o credenciamento da ${input.nomeFantasia}${local ? ` em ${local}` : ""}.`;
}

export function assuntoEmail(nomeFantasia: string): string {
  return `GO SERVICE — Convite de credenciamento para ${nomeFantasia}`;
}

// Deep-links para abrir o canal já com a mensagem sugerida preenchida.
function soDigitos(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "");
}

function comDDI(numero: string): string {
  return numero.startsWith("55") ? numero : `55${numero}`;
}

export function linkWhatsApp(
  numero: string | null | undefined,
  mensagem: string
): string | null {
  const d = soDigitos(numero);
  if (!d) return null;
  return `https://wa.me/${comDDI(d)}?text=${encodeURIComponent(mensagem)}`;
}

export function linkTelefone(numero: string | null | undefined): string | null {
  const d = soDigitos(numero);
  return d ? `tel:+${comDDI(d)}` : null;
}

export function linkEmail(
  email: string | null | undefined,
  assunto: string,
  corpo: string
): string | null {
  if (!email) return null;
  return `mailto:${email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
}
