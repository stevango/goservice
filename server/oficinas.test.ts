import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// Mock db module
vi.mock("./db", () => ({
  createOficina: vi.fn().mockResolvedValue(1),
  updateOficina: vi.fn().mockResolvedValue(undefined),
  getOficinaById: vi.fn().mockResolvedValue({
    id: 1, userId: 1, cnpj: "12345678000199", razaoSocial: "Test Ltda",
    nomeFantasia: "Test Auto", status: "ativa", categoria: "padrao",
    scoreReputacao: "4.5", totalAvaliacoes: 10,
  }),
  getOficinaByUserId: vi.fn().mockResolvedValue({
    id: 1, userId: 1, cnpj: "12345678000199", razaoSocial: "Test Ltda",
    nomeFantasia: "Test Auto", status: "pendente", categoria: "padrao",
  }),
  listOficinasPublic: vi.fn().mockResolvedValue({ oficinas: [], total: 0 }),
  listOficinas: vi.fn().mockResolvedValue({ oficinas: [], total: 0 }),
  getOficinasMetrics: vi.fn().mockResolvedValue({ total: 5, ativas: 3, pendentes: 1, bloqueadas: 1, premium: 1, concessionaria: 1, padrao: 3 }),
  createNotificacao: vi.fn().mockResolvedValue(1),
  listDocumentos: vi.fn().mockResolvedValue([]),
  listAvaliacoes: vi.fn().mockResolvedValue([]),
  createAvaliacao: vi.fn().mockResolvedValue(1),
  getAvaliacaoByUserAndOficina: vi.fn().mockResolvedValue(null),
  listAllAvaliacoes: vi.fn().mockResolvedValue([]),
  updateAvaliacaoStatus: vi.fn().mockResolvedValue(undefined),
  createClienteB2B: vi.fn().mockResolvedValue(1),
  getClienteB2BByUserId: vi.fn().mockResolvedValue(null),
  listClientesB2B: vi.fn().mockResolvedValue([]),
  updateClienteB2B: vi.fn().mockResolvedValue(undefined),
  listNotificacoes: vi.fn().mockResolvedValue([]),
  markNotificacaoLida: vi.fn().mockResolvedValue(undefined),
  countNotificacoesNaoLidas: vi.fn().mockResolvedValue(3),
  addDocumento: vi.fn().mockResolvedValue(1),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getDb: vi.fn(),
}));

function createContext(role: "user" | "admin" | "b2b" = "user", userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: "test-open-id",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

describe("oficinas.buscar", () => {
  it("returns oficinas list publicly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.oficinas.buscar({});
    expect(result).toHaveProperty("oficinas");
    expect(result).toHaveProperty("total");
  });
});

describe("oficinas.criar", () => {
  it("creates an oficina for authenticated user", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    const result = await caller.oficinas.criar({
      cnpj: "12345678000199",
      razaoSocial: "Oficina Teste Ltda",
      nomeFantasia: "Oficina Teste",
    });
    expect(result).toHaveProperty("id");
    expect(result.id).toBe(1);
  });

  it("rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.oficinas.criar({
      cnpj: "12345678000199",
      razaoSocial: "Oficina Teste Ltda",
      nomeFantasia: "Oficina Teste",
    })).rejects.toThrow();
  });
});

describe("oficinas.minha", () => {
  it("returns user oficina", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    const result = await caller.oficinas.minha();
    expect(result).toHaveProperty("nomeFantasia");
  });
});

describe("oficinas.metricas (admin)", () => {
  it("returns metrics for admin", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    const result = await caller.oficinas.metricas();
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("ativas");
    expect(result).toHaveProperty("pendentes");
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.oficinas.metricas()).rejects.toThrow();
  });
});

describe("oficinas.alterarStatus (admin)", () => {
  it("allows admin to change status", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    const result = await caller.oficinas.alterarStatus({ id: 1, status: "ativa" });
    expect(result).toEqual({ success: true });
  });

  it("rejects non-admin", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.oficinas.alterarStatus({ id: 1, status: "ativa" })).rejects.toThrow();
  });
});

describe("avaliacoes.criar", () => {
  it("creates an avaliacao for a non-owner with no prior review", async () => {
    // oficina mock tem userId 1; avaliador é o usuário 2.
    const caller = appRouter.createCaller(createContext("user", 2));
    const result = await caller.avaliacoes.criar({
      oficinaId: 1,
      notaGeral: 5,
      comentario: "Excelente serviço!",
    });
    expect(result).toHaveProperty("id");
  });

  it("blocks reviewing your own oficina", async () => {
    // contexto userId 1 == oficina.userId 1
    const caller = appRouter.createCaller(createContext("user", 1));
    await expect(
      caller.avaliacoes.criar({ oficinaId: 1, notaGeral: 5 })
    ).rejects.toThrow();
  });

  it("blocks a duplicate review by the same user", async () => {
    vi.mocked(db.getAvaliacaoByUserAndOficina).mockResolvedValueOnce({ id: 9 } as any);
    const caller = appRouter.createCaller(createContext("user", 2));
    await expect(
      caller.avaliacoes.criar({ oficinaId: 1, notaGeral: 4 })
    ).rejects.toThrow();
  });

  it("blocks reviewing a non-active oficina", async () => {
    vi.mocked(db.getOficinaById).mockResolvedValueOnce({
      id: 1, userId: 1, status: "pendente",
    } as any);
    const caller = appRouter.createCaller(createContext("user", 2));
    await expect(
      caller.avaliacoes.criar({ oficinaId: 1, notaGeral: 4 })
    ).rejects.toThrow();
  });
});

describe("notificacoes.contarNaoLidas (admin)", () => {
  it("returns count for admin", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    const result = await caller.notificacoes.contarNaoLidas();
    expect(result).toBe(3);
  });
});

describe("b2b.criar", () => {
  it("creates B2B client for authenticated user", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    const result = await caller.b2b.criar({
      razaoSocial: "Seguradora Teste SA",
      nomeFantasia: "Seg Teste",
      cnpj: "12345678000199",
      tipo: "seguradora",
    });
    expect(result).toHaveProperty("id");
  });
});
