import {
  eq,
  and,
  like,
  or,
  sql,
  desc,
  asc,
  count,
  inArray,
  isNull,
  isNotNull,
  type SQL,
} from "drizzle-orm";
import { type AnyMySqlColumn } from "drizzle-orm/mysql-core";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  oficinas,
  InsertOficina,
  Oficina,
  avaliacoes,
  InsertAvaliacao,
  oficinaDocumentos,
  InsertOficinaDocumento,
  clientesB2B,
  InsertClienteB2B,
  notificacoes,
  InsertNotificacao,
  importJobs,
  ImportJob,
  InsertImportJob,
  atendimentoEventos,
  AtendimentoEvento,
  InsertAtendimentoEvento,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { encryptOficinaFields, decryptOficinaFields } from "./_core/crypto";
import { cached, invalidatePrefix } from "./_core/cache";
import { randomBytes } from "node:crypto";

const OFICINAS_CACHE_PREFIX = "oficinas:public:";
const OFICINAS_CACHE_TTL_MS = 30_000;

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // `connection` como objeto: o mysql2 ainda faz o parsing da URI
      // (inclusive `ssl={...}` do TiDB), e podemos dimensionar o pool.
      _db = drizzle({
        connection: {
          uri: process.env.DATABASE_URL,
          connectionLimit: 15,
          enableKeepAlive: true,
          keepAliveInitialDelay: 10_000,
          supportBigNumbers: true,
          bigNumberStrings: false,
        },
      });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USERS ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) return;

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0)
      updateSet.lastSignedIn = new Date();
    await db
      .insert(users)
      .values(values)
      .onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserWithPassword(data: {
  openId: string;
  email: string;
  name: string;
  passwordHash: string;
  role: "user" | "admin" | "oficina" | "b2b";
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(users).values({
    openId: data.openId,
    email: data.email,
    name: data.name,
    passwordHash: data.passwordHash,
    loginMethod: "password",
    role: data.role,
    lastSignedIn: new Date(),
  });
}

// ==================== OFICINAS ====================

export async function createOficina(data: InsertOficina) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(oficinas).values(encryptOficinaFields(data));
  invalidatePrefix(OFICINAS_CACHE_PREFIX);
  return result[0].insertId;
}

export async function updateOficina(id: number, data: Partial<InsertOficina>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(oficinas)
    .set(encryptOficinaFields(data))
    .where(eq(oficinas.id, id));
  invalidatePrefix(OFICINAS_CACHE_PREFIX);
}

export async function getOficinaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(oficinas)
    .where(eq(oficinas.id, id))
    .limit(1);
  const oficina = decryptOficinaFields(result[0]);

  if (oficina) {
    const fotos = await db
      .select()
      .from(oficinaDocumentos)
      .where(eq(oficinaDocumentos.oficinaId, id));
    return { ...oficina, fotos };
  }

  return undefined;
}

export async function getOficinaByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(oficinas)
    .where(eq(oficinas.userId, userId))
    .limit(1);
  return decryptOficinaFields(result[0]) || undefined;
}

export async function listOficinas(filters?: {
  status?: string;
  categoria?: string;
  segmento?: string;
  segmentos?: string[];
  cidade?: string;
  estado?: string;
  tipoVeiculo?: string;
  tipoServico?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { oficinas: [], total: 0 };

  const conditions: any[] = [];

  if (filters?.status)
    conditions.push(eq(oficinas.status, filters.status as any));
  if (filters?.categoria)
    conditions.push(eq(oficinas.categoria, filters.categoria as any));
  if (filters?.segmento)
    conditions.push(eq(oficinas.segmento, filters.segmento));
  if (filters?.segmentos && filters.segmentos.length > 0) {
    conditions.push(inArray(oficinas.segmento, filters.segmentos));
  }
  if (filters?.cidade)
    conditions.push(like(oficinas.cidade, `%${filters.cidade}%`));
  if (filters?.estado) conditions.push(eq(oficinas.estado, filters.estado));
  if (filters?.search) {
    conditions.push(
      or(
        like(oficinas.nomeFantasia, `%${filters.search}%`),
        like(oficinas.razaoSocial, `%${filters.search}%`),
        like(oficinas.cidade, `%${filters.search}%`)
      )
    );
  }
  // Filtra arrays JSON no banco (não na aplicação) para que paginação e
  // contagem fiquem corretas.
  if (filters?.tipoVeiculo) {
    conditions.push(
      sql`JSON_CONTAINS(${oficinas.tiposVeiculos}, ${JSON.stringify(filters.tipoVeiculo)})`
    );
  }
  if (filters?.tipoServico) {
    conditions.push(
      sql`JSON_CONTAINS(${oficinas.tiposServicos}, ${JSON.stringify(filters.tipoServico)})`
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  const [rows, totalResult] = await Promise.all([
    db
      .select()
      .from(oficinas)
      .where(where)
      .orderBy(desc(oficinas.scoreReputacao))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(oficinas).where(where),
  ]);

  return { oficinas: rows, total: totalResult[0]?.count || 0 };
}

export async function listOficinasPublic(filters?: {
  categoria?: string;
  segmento?: string;
  segmentos?: string[];
  cidade?: string;
  estado?: string;
  tipoVeiculo?: string;
  tipoServico?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const key = OFICINAS_CACHE_PREFIX + JSON.stringify(filters ?? {});
  return cached(key, OFICINAS_CACHE_TTL_MS, () =>
    listOficinas({ ...filters, status: "ativa" })
  );
}

export type DashboardMetrics = {
  total: number;
  ativas: number;
  pendentes: number;
  bloqueadas: number;
  rejeitadas: number;
  porSegmento: Array<{
    segmento: string;
    total: number;
    ativas: number;
    pendentes: number;
  }>;
  qualidade: {
    comTelefone: number;
    comWebsite: number;
    comHorario: number;
    comGeo: number;
    comFoto: number;
    enriquecidas: number;
    semCnpj: number;
    pendentesEnriquecimento: number;
  };
  topCidades: Array<{ cidade: string; estado: string; total: number }>;
};

export async function getOficinasMetrics(): Promise<DashboardMetrics> {
  const vazio: DashboardMetrics = {
    total: 0,
    ativas: 0,
    pendentes: 0,
    bloqueadas: 0,
    rejeitadas: 0,
    porSegmento: [],
    qualidade: {
      comTelefone: 0,
      comWebsite: 0,
      comHorario: 0,
      comGeo: 0,
      comFoto: 0,
      enriquecidas: 0,
      semCnpj: 0,
      pendentesEnriquecimento: 0,
    },
    topCidades: [],
  };
  const db = await getDb();
  if (!db) return vazio;

  const m: DashboardMetrics = {
    ...vazio,
    porSegmento: [],
    qualidade: { ...vazio.qualidade },
    topCidades: [],
  };

  const statusRows = await db
    .select({ status: oficinas.status, count: count() })
    .from(oficinas)
    .groupBy(oficinas.status);
  for (const r of statusRows) {
    const c = Number(r.count);
    m.total += c;
    if (r.status === "ativa") m.ativas += c;
    else if (r.status === "pendente") m.pendentes += c;
    else if (r.status === "bloqueada") m.bloqueadas += c;
    else if (r.status === "rejeitada") m.rejeitadas += c;
  }

  const segRows = await db
    .select({
      segmento: oficinas.segmento,
      status: oficinas.status,
      count: count(),
    })
    .from(oficinas)
    .groupBy(oficinas.segmento, oficinas.status);
  const segMap = new Map<string, DashboardMetrics["porSegmento"][number]>();
  for (const r of segRows) {
    const seg = r.segmento || "desconhecido";
    const e = segMap.get(seg) ?? {
      segmento: seg,
      total: 0,
      ativas: 0,
      pendentes: 0,
    };
    const c = Number(r.count);
    e.total += c;
    if (r.status === "ativa") e.ativas += c;
    if (r.status === "pendente") e.pendentes += c;
    segMap.set(seg, e);
  }
  m.porSegmento = Array.from(segMap.values()).sort((a, b) => b.total - a.total);

  const cnt = async (cond: SQL): Promise<number> => {
    const r = await db.select({ c: count() }).from(oficinas).where(cond);
    return Number(r[0]?.c || 0);
  };
  const naoVazio = (col: AnyMySqlColumn) =>
    and(isNotNull(col), sql`${col} <> ''`) as SQL;

  m.qualidade.comTelefone = await cnt(naoVazio(oficinas.telefone));
  m.qualidade.comWebsite = await cnt(naoVazio(oficinas.website));
  m.qualidade.comHorario = await cnt(naoVazio(oficinas.horarioFuncionamento));
  m.qualidade.comGeo = await cnt(isNotNull(oficinas.latitude));
  m.qualidade.enriquecidas = await cnt(isNotNull(oficinas.enrichedAt));
  m.qualidade.semCnpj = await cnt(
    or(isNull(oficinas.cnpj), eq(oficinas.cnpj, "")) as SQL
  );
  m.qualidade.pendentesEnriquecimento = await cnt(
    and(isNotNull(oficinas.googlePlaceId), isNull(oficinas.enrichedAt)) as SQL
  );
  const fotoRows = await db
    .select({ c: sql<number>`count(distinct ${oficinaDocumentos.oficinaId})` })
    .from(oficinaDocumentos)
    .where(like(oficinaDocumentos.tipo, "foto%"));
  m.qualidade.comFoto = Number(fotoRows[0]?.c || 0);

  const cidRows = await db
    .select({
      cidade: oficinas.cidade,
      estado: oficinas.estado,
      count: count(),
    })
    .from(oficinas)
    .groupBy(oficinas.cidade, oficinas.estado)
    .orderBy(sql`count(*) desc`)
    .limit(8);
  m.topCidades = cidRows.map(r => ({
    cidade: r.cidade || "—",
    estado: r.estado || "",
    total: Number(r.count),
  }));

  return m;
}

// ==================== AVALIAÇÕES ====================

// Antifraude: uma avaliação por usuário por oficina.
export async function getAvaliacaoByUserAndOficina(
  userId: number,
  oficinaId: number
) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(avaliacoes)
    .where(
      and(eq(avaliacoes.userId, userId), eq(avaliacoes.oficinaId, oficinaId))
    )
    .limit(1);
  return result[0] || undefined;
}

export async function createAvaliacao(data: InsertAvaliacao) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(avaliacoes).values(data);

  // Update oficina score
  await recalcularScore(data.oficinaId);
  return result[0].insertId;
}

export async function recalcularScore(oficinaId: number) {
  const db = await getDb();
  if (!db) return;

  const result = await db
    .select({
      avg: sql<number>`AVG(notaGeral)`,
      total: count(),
    })
    .from(avaliacoes)
    .where(
      and(
        eq(avaliacoes.oficinaId, oficinaId),
        eq(avaliacoes.status, "aprovada")
      )
    );

  const avg = result[0]?.avg || 0;
  const total = Number(result[0]?.total || 0);

  await db
    .update(oficinas)
    .set({
      scoreReputacao: String(Math.round(avg * 10) / 10),
      totalAvaliacoes: total,
    })
    .where(eq(oficinas.id, oficinaId));

  // O score altera a ordenação da listagem pública em cache.
  invalidatePrefix(OFICINAS_CACHE_PREFIX);
}

export async function listAvaliacoes(oficinaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(avaliacoes)
    .where(eq(avaliacoes.oficinaId, oficinaId))
    .orderBy(desc(avaliacoes.createdAt));
}

export async function listAllAvaliacoes(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (filters?.status)
    conditions.push(eq(avaliacoes.status, filters.status as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db
    .select()
    .from(avaliacoes)
    .where(where)
    .orderBy(desc(avaliacoes.createdAt))
    .limit(filters?.limit || 50)
    .offset(filters?.offset || 0);
}

export async function updateAvaliacaoStatus(
  id: number,
  status: "aprovada" | "rejeitada"
) {
  const db = await getDb();
  if (!db) return;
  const avaliacao = await db
    .select()
    .from(avaliacoes)
    .where(eq(avaliacoes.id, id))
    .limit(1);
  await db.update(avaliacoes).set({ status }).where(eq(avaliacoes.id, id));
  if (avaliacao[0]) await recalcularScore(avaliacao[0].oficinaId);
}

// ==================== DOCUMENTOS ====================

export async function addDocumento(data: InsertOficinaDocumento) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(oficinaDocumentos).values(data);
  return result[0].insertId;
}

export async function listDocumentos(oficinaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(oficinaDocumentos)
    .where(eq(oficinaDocumentos.oficinaId, oficinaId));
}

// ==================== CLIENTES B2B ====================

export async function createClienteB2B(data: InsertClienteB2B) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clientesB2B).values(data);
  return result[0].insertId;
}

export async function listClientesB2B() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientesB2B).orderBy(desc(clientesB2B.createdAt));
}

export async function updateClienteB2B(
  id: number,
  data: Partial<InsertClienteB2B>
) {
  const db = await getDb();
  if (!db) return;
  await db.update(clientesB2B).set(data).where(eq(clientesB2B.id, id));
}

export async function getClienteB2BByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(clientesB2B)
    .where(eq(clientesB2B.userId, userId))
    .limit(1);
  return result[0] || undefined;
}

// ==================== NOTIFICAÇÕES ====================

export async function createNotificacao(data: InsertNotificacao) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notificacoes).values(data);
}

export async function listNotificacoes(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notificacoes)
    .orderBy(desc(notificacoes.createdAt))
    .limit(limit);
}

export async function markNotificacaoLida(id: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notificacoes)
    .set({ lida: true })
    .where(eq(notificacoes.id, id));
}

export async function countNotificacoesNaoLidas() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: count() })
    .from(notificacoes)
    .where(eq(notificacoes.lida, false));
  return Number(result[0]?.count || 0);
}

export async function getClienteB2BById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(clientesB2B)
    .where(eq(clientesB2B.id, id))
    .limit(1);
  return result[0] || undefined;
}

export async function updateUserRole(
  userId: number,
  role: "user" | "admin" | "oficina" | "b2b"
) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ==================== IMPORTAÇÃO (Google Places) ====================

export async function oficinaExistsByGooglePlaceId(
  placeId: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select({ id: oficinas.id })
    .from(oficinas)
    .where(eq(oficinas.googlePlaceId, placeId))
    .limit(1);
  return result.length > 0;
}

export async function insertImportedOficina(
  data: InsertOficina
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(oficinas).values(data);
  invalidatePrefix(OFICINAS_CACHE_PREFIX);
  return result[0].insertId;
}

// Oficinas importadas do Google que ainda precisam de enriquecimento.
export async function pickOficinasToEnrich(limit: number): Promise<Oficina[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(oficinas)
    .where(and(isNotNull(oficinas.googlePlaceId), isNull(oficinas.enrichedAt)))
    .orderBy(asc(oficinas.id))
    .limit(limit);
}

export async function countOficinasToEnrich(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: count() })
    .from(oficinas)
    .where(and(isNotNull(oficinas.googlePlaceId), isNull(oficinas.enrichedAt)));
  return Number(result[0]?.count || 0);
}

// Marca todas as importadas para re-enriquecer (worker reprocessa devagar).
export async function resetEnrichmentForImported(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .update(oficinas)
    .set({ enrichedAt: null })
    .where(isNotNull(oficinas.googlePlaceId));
  invalidatePrefix(OFICINAS_CACHE_PREFIX);
  return Number((result[0] as { affectedRows?: number })?.affectedRows || 0);
}

export async function createImportJob(data: {
  termo: string;
  segmento: string;
  cidade: string;
  estado: string;
  limite: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(importJobs).values(data);
  return result[0].insertId;
}

// Próximo job a processar: o mais antigo que ainda está pendente/rodando.
export async function pickNextImportJob(): Promise<ImportJob | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(importJobs)
    .where(inArray(importJobs.status, ["pendente", "rodando"]))
    .orderBy(asc(importJobs.createdAt))
    .limit(1);
  return result[0] || undefined;
}

export async function updateImportJob(
  id: number,
  patch: Partial<InsertImportJob>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(importJobs).set(patch).where(eq(importJobs.id, id));
}

export async function listImportJobs(limit = 30): Promise<ImportJob[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(importJobs)
    .orderBy(desc(importJobs.createdAt))
    .limit(limit);
}

export async function cancelImportJob(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(importJobs)
    .set({ status: "cancelado" })
    .where(
      and(
        eq(importJobs.id, id),
        inArray(importJobs.status, ["pendente", "rodando"])
      )
    );
}

// ==================== ATENDIMENTO (Centro de Conversão) ====================

type ProspectFilters = {
  search?: string;
  cidade?: string;
  estado?: string;
  segmento?: string;
  etapas?: string[];
};

function prospectConditions(f: ProspectFilters): SQL | undefined {
  const conds: SQL[] = [];
  if (f.search) {
    conds.push(
      or(
        like(oficinas.nomeFantasia, `%${f.search}%`),
        like(oficinas.razaoSocial, `%${f.search}%`),
        like(oficinas.cidade, `%${f.search}%`)
      ) as SQL
    );
  }
  if (f.cidade) conds.push(like(oficinas.cidade, `%${f.cidade}%`));
  if (f.estado) conds.push(eq(oficinas.estado, f.estado));
  if (f.segmento) conds.push(eq(oficinas.segmento, f.segmento));
  if (f.etapas && f.etapas.length > 0) {
    conds.push(
      inArray(
        oficinas.etapaAtendimento,
        f.etapas as Array<(typeof oficinas.etapaAtendimento.enumValues)[number]>
      )
    );
  }
  return conds.length ? (and(...conds) as SQL) : undefined;
}

export async function listProspects(
  filters: ProspectFilters = {},
  limit = 300
) {
  const db = await getDb();
  if (!db) return [];
  const where = prospectConditions(filters);
  const q = db
    .select({
      id: oficinas.id,
      nomeFantasia: oficinas.nomeFantasia,
      razaoSocial: oficinas.razaoSocial,
      segmento: oficinas.segmento,
      cidade: oficinas.cidade,
      estado: oficinas.estado,
      telefone: oficinas.telefone,
      whatsapp: oficinas.whatsapp,
      email: oficinas.email,
      website: oficinas.website,
      scoreReputacao: oficinas.scoreReputacao,
      totalAvaliacoes: oficinas.totalAvaliacoes,
      etapaAtendimento: oficinas.etapaAtendimento,
      status: oficinas.status,
      automacaoAtiva: oficinas.automacaoAtiva,
    })
    .from(oficinas);
  return (where ? q.where(where) : q)
    .orderBy(desc(oficinas.scoreReputacao))
    .limit(limit);
}

export async function countByEtapa(
  filters: Omit<ProspectFilters, "etapas"> = {}
): Promise<Record<string, number>> {
  const db = await getDb();
  if (!db) return {};
  const where = prospectConditions(filters);
  const q = db
    .select({ etapa: oficinas.etapaAtendimento, c: count() })
    .from(oficinas);
  const rows = await (where ? q.where(where) : q).groupBy(
    oficinas.etapaAtendimento
  );
  const out: Record<string, number> = {};
  for (const r of rows) out[String(r.etapa)] = Number(r.c);
  return out;
}

export async function addAtendimentoEvento(
  data: InsertAtendimentoEvento
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const r = await db.insert(atendimentoEventos).values(data);
  return r[0].insertId;
}

export async function listAtendimentoEventos(
  oficinaId: number
): Promise<AtendimentoEvento[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(atendimentoEventos)
    .where(eq(atendimentoEventos.oficinaId, oficinaId))
    .orderBy(desc(atendimentoEventos.createdAt));
}

// ==================== AUTOMAÇÃO DA ESTEIRA ====================

// Gera (se faltar) e devolve o token do link rastreável do parceiro.
export async function ensureTokenParceiro(id: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const of = await getOficinaById(id);
  if (of?.tokenParceiro) return of.tokenParceiro;
  const token = randomBytes(20).toString("hex");
  await db
    .update(oficinas)
    .set({ tokenParceiro: token })
    .where(eq(oficinas.id, id));
  invalidatePrefix(OFICINAS_CACHE_PREFIX);
  return token;
}

export async function getOficinaByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(oficinas)
    .where(eq(oficinas.tokenParceiro, token))
    .limit(1);
  return rows.length ? decryptOficinaFields(rows[0]) : undefined;
}

export type ProspectAutomacao = {
  id: number;
  nomeFantasia: string;
  segmento: string | null;
  cidade: string | null;
  estado: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  etapaAtendimento: string;
  tokenParceiro: string | null;
  tentativasConvite: number;
};

// Prospects com automação ligada e ação vencida — alvo do worker.
export async function listProspectsParaAutomacao(
  now: Date,
  limit = 50
): Promise<ProspectAutomacao[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: oficinas.id,
      nomeFantasia: oficinas.nomeFantasia,
      segmento: oficinas.segmento,
      cidade: oficinas.cidade,
      estado: oficinas.estado,
      telefone: oficinas.telefone,
      whatsapp: oficinas.whatsapp,
      email: oficinas.email,
      etapaAtendimento: oficinas.etapaAtendimento,
      tokenParceiro: oficinas.tokenParceiro,
      tentativasConvite: oficinas.tentativasConvite,
    })
    .from(oficinas)
    .where(
      and(
        eq(oficinas.automacaoAtiva, true),
        or(
          isNull(oficinas.proximaAcaoAt),
          sql`${oficinas.proximaAcaoAt} <= ${now}`
        )
      )
    )
    .orderBy(asc(oficinas.proximaAcaoAt))
    .limit(limit);
  return rows as ProspectAutomacao[];
}
