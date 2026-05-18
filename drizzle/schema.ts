import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin", "oficina", "b2b"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Oficinas - tabela principal
 */
export const oficinas = mysqlTable("oficinas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  
  // Dados cadastrais
  cnpj: varchar("cnpj", { length: 18 }).notNull(),
  razaoSocial: varchar("razaoSocial", { length: 255 }).notNull(),
  nomeFantasia: varchar("nomeFantasia", { length: 255 }).notNull(),
  telefone: varchar("telefone", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 500 }),
  
  // Representante
  nomeRepresentante: varchar("nomeRepresentante", { length: 255 }),
  cpfRepresentante: varchar("cpfRepresentante", { length: 14 }),
  rgRepresentante: varchar("rgRepresentante", { length: 20 }),
  
  // Endereço
  cep: varchar("cep", { length: 9 }),
  logradouro: varchar("logradouro", { length: 500 }),
  numero: varchar("numero", { length: 20 }),
  complemento: varchar("complemento", { length: 255 }),
  bairro: varchar("bairro", { length: 255 }),
  cidade: varchar("cidade", { length: 255 }),
  estado: varchar("estado", { length: 2 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  
  // Dados bancários
  banco: varchar("banco", { length: 100 }),
  agencia: varchar("agencia", { length: 20 }),
  contaCorrente: varchar("contaCorrente", { length: 30 }),
  pixTipo: mysqlEnum("pixTipo", ["cpf", "cnpj", "telefone", "email", "chave_aleatoria"]),
  pixChave: varchar("pixChave", { length: 255 }),
  
  // Classificação
  categoria: mysqlEnum("categoria", ["premium", "concessionaria", "padrao"]).default("padrao").notNull(),
  
  // Tipos de veículos (JSON array)
  tiposVeiculos: json("tiposVeiculos").$type<string[]>(),
  
  // Tipos de serviços (JSON array)
  tiposServicos: json("tiposServicos").$type<string[]>(),
  
  // Informações comerciais
  franquiaAntes: boolean("franquiaAntes").default(false),
  franquiaDepois: boolean("franquiaDepois").default(true),
  parcelamentoFranquia: int("parcelamentoFranquia").default(1),
  fornecePecas: mysqlEnum("fornecePecas", ["oficina", "seguradora", "cliente", "ambos"]).default("oficina"),
  garantiaServico: varchar("garantiaServico", { length: 255 }),
  
  // Descrição e horários
  descricao: text("descricao"),
  horarioFuncionamento: text("horarioFuncionamento"),
  
  // Reputação
  scoreReputacao: decimal("scoreReputacao", { precision: 3, scale: 1 }).default("0.0"),
  totalAvaliacoes: int("totalAvaliacoes").default(0),
  
  // Status
  status: mysqlEnum("status", ["pendente", "ativa", "bloqueada", "rejeitada"]).default("pendente").notNull(),
  etapaCadastro: mysqlEnum("etapaCadastro", ["dados", "endereco", "documentos", "fotos", "contrato", "completo"]).default("dados"),
  
  // Observações internas (admin)
  observacoesAdmin: text("observacoesAdmin"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  // Listagem pública/admin: filtra por status e ordena por reputação
  statusScoreIdx: index("oficinas_status_score_idx").on(t.status, t.scoreReputacao),
  userIdIdx: index("oficinas_user_id_idx").on(t.userId),
  estadoIdx: index("oficinas_estado_idx").on(t.estado),
  categoriaIdx: index("oficinas_categoria_idx").on(t.categoria),
}));

export type Oficina = typeof oficinas.$inferSelect;
export type InsertOficina = typeof oficinas.$inferInsert;

/**
 * Documentos e fotos da oficina
 */
export const oficinaDocumentos = mysqlTable("oficina_documentos", {
  id: int("id").autoincrement().primaryKey(),
  oficinaId: int("oficinaId").notNull(),
  tipo: mysqlEnum("tipo", ["alvara", "cnpj_card", "contrato_social", "rg_frente", "rg_verso", "foto_fachada", "foto_interior", "foto_equipamentos", "outro"]).notNull(),
  url: varchar("url", { length: 1000 }).notNull(),
  nome: varchar("nome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  oficinaIdIdx: index("oficina_documentos_oficina_id_idx").on(t.oficinaId),
}));

export type OficinaDocumento = typeof oficinaDocumentos.$inferSelect;
export type InsertOficinaDocumento = typeof oficinaDocumentos.$inferInsert;

/**
 * Avaliações de clientes
 */
export const avaliacoes = mysqlTable("avaliacoes", {
  id: int("id").autoincrement().primaryKey(),
  oficinaId: int("oficinaId").notNull(),
  userId: int("userId"),
  
  // Notas (1-5)
  notaGeral: int("notaGeral").notNull(),
  notaAtendimento: int("notaAtendimento"),
  notaQualidade: int("notaQualidade"),
  notaPrazo: int("notaPrazo"),
  notaPreco: int("notaPreco"),
  
  comentario: text("comentario"),
  nomeCliente: varchar("nomeCliente", { length: 255 }),
  
  // Dados do serviço
  tipoServico: varchar("tipoServico", { length: 100 }),
  tipoVeiculo: varchar("tipoVeiculo", { length: 100 }),
  
  status: mysqlEnum("statusAvaliacao", ["pendente", "aprovada", "rejeitada"]).default("pendente").notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  // listAvaliacoes / recalcularScore filtram por oficina (+status)
  oficinaStatusIdx: index("avaliacoes_oficina_status_idx").on(t.oficinaId, t.status),
  // listAllAvaliacoes: filtra por status e ordena por data
  statusCreatedIdx: index("avaliacoes_status_created_idx").on(t.status, t.createdAt),
}));

export type Avaliacao = typeof avaliacoes.$inferSelect;
export type InsertAvaliacao = typeof avaliacoes.$inferInsert;

/**
 * Clientes B2B (Seguradoras e Associações)
 */
export const clientesB2B = mysqlTable("clientes_b2b", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  
  razaoSocial: varchar("razaoSocial", { length: 255 }).notNull(),
  nomeFantasia: varchar("nomeFantasia", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }).notNull(),
  tipo: mysqlEnum("tipo", ["seguradora", "associacao", "cooperativa"]).default("seguradora").notNull(),
  
  contatoNome: varchar("contatoNome", { length: 255 }),
  contatoEmail: varchar("contatoEmail", { length: 320 }),
  contatoTelefone: varchar("contatoTelefone", { length: 20 }),
  
  status: mysqlEnum("statusB2B", ["ativo", "inativo", "pendente"]).default("pendente").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userIdIdx: index("clientes_b2b_user_id_idx").on(t.userId),
}));

export type ClienteB2B = typeof clientesB2B.$inferSelect;
export type InsertClienteB2B = typeof clientesB2B.$inferInsert;

/**
 * Notificações do sistema
 */
export const notificacoes = mysqlTable("notificacoes", {
  id: int("id").autoincrement().primaryKey(),
  tipo: mysqlEnum("tipoNotificacao", ["novo_cadastro", "nova_avaliacao", "status_alterado", "documento_enviado"]).notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  mensagem: text("mensagem"),
  lida: boolean("lida").default(false),
  dados: json("dados").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  // Listagem por data e contagem de não lidas
  lidaCreatedIdx: index("notificacoes_lida_created_idx").on(t.lida, t.createdAt),
}));

export type Notificacao = typeof notificacoes.$inferSelect;
export type InsertNotificacao = typeof notificacoes.$inferInsert;
