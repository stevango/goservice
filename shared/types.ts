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

export const FORNECE_PECAS_OPTIONS = [
  { value: "oficina", label: "Oficina fornece" },
  { value: "seguradora", label: "Seguradora fornece" },
  { value: "cliente", label: "Cliente fornece" },
  { value: "ambos", label: "Oficina ou Cliente" },
] as const;
