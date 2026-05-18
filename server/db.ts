import { eq, and, like, or, sql, desc, asc, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, oficinas, InsertOficina, Oficina, avaliacoes, InsertAvaliacao, oficinaDocumentos, InsertOficinaDocumento, clientesB2B, InsertClienteB2B, notificacoes, InsertNotificacao } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
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
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== OFICINAS ====================

export async function createOficina(data: InsertOficina) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(oficinas).values(data);
  return result[0].insertId;
}

export async function updateOficina(id: number, data: Partial<InsertOficina>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(oficinas).set(data).where(eq(oficinas.id, id));
}

export async function getOficinaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(oficinas).where(eq(oficinas.id, id)).limit(1);
  const oficina = result[0];
  
  if (oficina) {
    const fotos = await db.select().from(oficinaDocumentos).where(eq(oficinaDocumentos.oficinaId, id));
    return { ...oficina, fotos };
  }
  
  return undefined;
}

export async function getOficinaByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(oficinas).where(eq(oficinas.userId, userId)).limit(1);
  return result[0] || undefined;
}

export async function listOficinas(filters?: {
  status?: string;
  categoria?: string;
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
  
  if (filters?.status) conditions.push(eq(oficinas.status, filters.status as any));
  if (filters?.categoria) conditions.push(eq(oficinas.categoria, filters.categoria as any));
  if (filters?.cidade) conditions.push(like(oficinas.cidade, `%${filters.cidade}%`));
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

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  const [rows, totalResult] = await Promise.all([
    db.select().from(oficinas).where(where).orderBy(desc(oficinas.scoreReputacao)).limit(limit).offset(offset),
    db.select({ count: count() }).from(oficinas).where(where)
  ]);

  // Filter by JSON fields in application layer
  let filtered = rows;
  if (filters?.tipoVeiculo) {
    filtered = filtered.filter(o => {
      const tipos = o.tiposVeiculos as string[] | null;
      return tipos?.includes(filters.tipoVeiculo!);
    });
  }
  if (filters?.tipoServico) {
    filtered = filtered.filter(o => {
      const tipos = o.tiposServicos as string[] | null;
      return tipos?.includes(filters.tipoServico!);
    });
  }

  return { oficinas: filtered, total: totalResult[0]?.count || 0 };
}

export async function listOficinasPublic(filters?: {
  categoria?: string;
  cidade?: string;
  estado?: string;
  tipoVeiculo?: string;
  tipoServico?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return listOficinas({ ...filters, status: "ativa" });
}

export async function getOficinasMetrics() {
  const db = await getDb();
  if (!db) return { total: 0, ativas: 0, pendentes: 0, bloqueadas: 0, premium: 0, concessionaria: 0, padrao: 0 };

  const result = await db.select({
    status: oficinas.status,
    categoria: oficinas.categoria,
    count: count()
  }).from(oficinas).groupBy(oficinas.status, oficinas.categoria);

  const metrics = { total: 0, ativas: 0, pendentes: 0, bloqueadas: 0, premium: 0, concessionaria: 0, padrao: 0 };
  for (const row of result) {
    const c = Number(row.count);
    metrics.total += c;
    if (row.status === 'ativa') metrics.ativas += c;
    if (row.status === 'pendente') metrics.pendentes += c;
    if (row.status === 'bloqueada') metrics.bloqueadas += c;
    if (row.categoria === 'premium') metrics.premium += c;
    if (row.categoria === 'concessionaria') metrics.concessionaria += c;
    if (row.categoria === 'padrao') metrics.padrao += c;
  }
  return metrics;
}

// ==================== AVALIAÇÕES ====================

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
  
  const result = await db.select({
    avg: sql<number>`AVG(notaGeral)`,
    total: count()
  }).from(avaliacoes).where(
    and(eq(avaliacoes.oficinaId, oficinaId), eq(avaliacoes.status, "aprovada"))
  );

  const avg = result[0]?.avg || 0;
  const total = Number(result[0]?.total || 0);
  
  await db.update(oficinas).set({
    scoreReputacao: String(Math.round(avg * 10) / 10),
    totalAvaliacoes: total
  }).where(eq(oficinas.id, oficinaId));
}

export async function listAvaliacoes(oficinaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(avaliacoes).where(eq(avaliacoes.oficinaId, oficinaId)).orderBy(desc(avaliacoes.createdAt));
}

export async function listAllAvaliacoes(filters?: { status?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (filters?.status) conditions.push(eq(avaliacoes.status, filters.status as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(avaliacoes).where(where).orderBy(desc(avaliacoes.createdAt)).limit(filters?.limit || 50).offset(filters?.offset || 0);
}

export async function updateAvaliacaoStatus(id: number, status: "aprovada" | "rejeitada") {
  const db = await getDb();
  if (!db) return;
  const avaliacao = await db.select().from(avaliacoes).where(eq(avaliacoes.id, id)).limit(1);
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
  return db.select().from(oficinaDocumentos).where(eq(oficinaDocumentos.oficinaId, oficinaId));
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

export async function updateClienteB2B(id: number, data: Partial<InsertClienteB2B>) {
  const db = await getDb();
  if (!db) return;
  await db.update(clientesB2B).set(data).where(eq(clientesB2B.id, id));
}

export async function getClienteB2BByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clientesB2B).where(eq(clientesB2B.userId, userId)).limit(1);
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
  return db.select().from(notificacoes).orderBy(desc(notificacoes.createdAt)).limit(limit);
}

export async function markNotificacaoLida(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notificacoes).set({ lida: true }).where(eq(notificacoes.id, id));
}

export async function countNotificacoesNaoLidas() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(notificacoes).where(eq(notificacoes.lida, false));
  return Number(result[0]?.count || 0);
}

export async function getClienteB2BById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clientesB2B).where(eq(clientesB2B.id, id)).limit(1);
  return result[0] || undefined;
}

export async function updateUserRole(userId: number, role: "user" | "admin" | "oficina" | "b2b") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}
