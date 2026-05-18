import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import type { User } from "../drizzle/schema";
import { hashPassword, verifyPassword } from "./_core/password";
import { setSessionCookie } from "./_core/session";
import { ENV } from "./_core/env";

// Nunca devolve o hash de senha pro cliente.
function publicUser(user: User): Omit<User, "passwordHash"> {
  const { passwordHash: _omit, ...rest } = user;
  return rest;
}

// Admin-only middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administradores' });
  return next({ ctx });
});

// B2B-only middleware - checks both role and clienteB2B status
const b2bProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role === 'admin') return next({ ctx });
  if (ctx.user.role === 'b2b') return next({ ctx });
  // Also allow if user has an active B2B client record
  const clienteB2B = await db.getClienteB2BByUserId(ctx.user.id);
  if (clienteB2B && clienteB2B.status === 'ativo') return next({ ctx });
  throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a clientes B2B aprovados' });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts =>
      opts.ctx.user ? publicUser(opts.ctx.user) : null
    ),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    register: publicProcedure
      .input(
        z.object({
          name: z.string().trim().min(2).max(120),
          email: z.string().trim().email().max(255),
          password: z.string().min(8).max(200),
          tipo: z.enum(["oficina", "b2b", "cliente"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const email = input.email.toLowerCase();
        const openId = `local:${email}`;

        const existing = await db.getUserByOpenId(openId);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe uma conta com esse e-mail.",
          });
        }

        const role =
          ENV.adminEmail && email === ENV.adminEmail
            ? "admin"
            : input.tipo === "cliente"
              ? "user"
              : input.tipo;

        await db.createUserWithPassword({
          openId,
          email,
          name: input.name,
          passwordHash: await hashPassword(input.password),
          role,
        });

        const user = await db.getUserByOpenId(openId);
        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao criar a conta. Tente novamente.",
          });
        }

        await setSessionCookie(ctx, user);
        return publicUser(user);
      }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().trim().email().max(255),
          password: z.string().min(1).max(200),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const email = input.email.toLowerCase();
        const user = await db.getUserByOpenId(`local:${email}`);

        if (
          !user ||
          !user.passwordHash ||
          !(await verifyPassword(input.password, user.passwordHash))
        ) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "E-mail ou senha inválidos.",
          });
        }

        // Promove a admin se este e-mail estiver configurado como dono.
        if (ENV.adminEmail && email === ENV.adminEmail && user.role !== "admin") {
          await db.updateUserRole(user.id, "admin");
          user.role = "admin";
        }

        await setSessionCookie(ctx, user);
        return publicUser(user);
      }),
  }),

  // ==================== OFICINAS ====================
  oficinas: router({
    // Public: busca de oficinas ativas
    buscar: publicProcedure.input(z.object({
      categoria: z.string().optional(),
      cidade: z.string().optional(),
      estado: z.string().optional(),
      tipoVeiculo: z.string().optional(),
      tipoServico: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional()).query(async ({ input }) => {
      return db.listOficinasPublic(input || {});
    }),

    // Public: detalhes de uma oficina ativa
    detalhe: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const oficina = await db.getOficinaById(input.id);
      if (!oficina || oficina.status !== 'ativa') throw new TRPCError({ code: 'NOT_FOUND' });
      return oficina;
    }),

    // Protected: criar oficina (auto-cadastro)
    criar: protectedProcedure.input(z.object({
      cnpj: z.string().min(14),
      razaoSocial: z.string().min(2),
      nomeFantasia: z.string().min(2),
      telefone: z.string().optional(),
      whatsapp: z.string().optional(),
      email: z.string().email().optional(),
      website: z.string().optional(),
      nomeRepresentante: z.string().optional(),
      cpfRepresentante: z.string().optional(),
      rgRepresentante: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createOficina({
        ...input,
        userId: ctx.user.id,
        status: "pendente",
        etapaCadastro: "dados",
      });
      
      // Notificar admin
      await db.createNotificacao({
        tipo: "novo_cadastro",
        titulo: `Nova oficina cadastrada: ${input.nomeFantasia}`,
        mensagem: `A oficina ${input.nomeFantasia} (${input.cnpj}) se cadastrou na plataforma e aguarda aprovação.`,
        dados: { oficinaId: id, nomeFantasia: input.nomeFantasia },
      });
      
      return { id };
    }),

    // Protected: atualizar dados da oficina (própria)
    atualizar: protectedProcedure.input(z.object({
      id: z.number(),
      cnpj: z.string().optional(),
      razaoSocial: z.string().optional(),
      nomeFantasia: z.string().optional(),
      telefone: z.string().optional(),
      whatsapp: z.string().optional(),
      email: z.string().optional(),
      website: z.string().optional(),
      nomeRepresentante: z.string().optional(),
      cpfRepresentante: z.string().optional(),
      rgRepresentante: z.string().optional(),
      cep: z.string().optional(),
      logradouro: z.string().optional(),
      numero: z.string().optional(),
      complemento: z.string().optional(),
      bairro: z.string().optional(),
      cidade: z.string().optional(),
      estado: z.string().optional(),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
      banco: z.string().optional(),
      agencia: z.string().optional(),
      contaCorrente: z.string().optional(),
      pixTipo: z.enum(["cpf", "cnpj", "telefone", "email", "chave_aleatoria"]).optional(),
      pixChave: z.string().optional(),
      categoria: z.enum(["premium", "concessionaria", "padrao"]).optional(),
      tiposVeiculos: z.array(z.string()).optional(),
      tiposServicos: z.array(z.string()).optional(),
      franquiaAntes: z.boolean().optional(),
      franquiaDepois: z.boolean().optional(),
      parcelamentoFranquia: z.number().optional(),
      fornecePecas: z.enum(["oficina", "seguradora", "cliente", "ambos"]).optional(),
      garantiaServico: z.string().optional(),
      etapaCadastro: z.enum(["dados", "endereco", "documentos", "fotos", "contrato", "completo"]).optional(),
    })).mutation(async ({ ctx, input }) => {
      const oficina = await db.getOficinaById(input.id);
      if (!oficina) throw new TRPCError({ code: 'NOT_FOUND' });
      if (oficina.userId !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      const { id, ...data } = input;
      await db.updateOficina(id, data);
      return { success: true };
    }),

    // Protected: minha oficina
    minha: protectedProcedure.query(async ({ ctx }) => {
      return db.getOficinaByUserId(ctx.user.id);
    }),

    // Admin: listar todas
    listarAdmin: adminProcedure.input(z.object({
      status: z.string().optional(),
      categoria: z.string().optional(),
      cidade: z.string().optional(),
      estado: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional()).query(async ({ input }) => {
      return db.listOficinas(input || {});
    }),

    // Admin: aprovar/bloquear/rejeitar
    alterarStatus: adminProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["ativa", "bloqueada", "rejeitada", "pendente"]),
      observacoes: z.string().optional(),
    })).mutation(async ({ input }) => {
      await db.updateOficina(input.id, { 
        status: input.status, 
        observacoesAdmin: input.observacoes 
      });
      
      await db.createNotificacao({
        tipo: "status_alterado",
        titulo: `Status de oficina alterado para: ${input.status}`,
        mensagem: input.observacoes || `Oficina #${input.id} teve seu status alterado.`,
        dados: { oficinaId: input.id, novoStatus: input.status },
      });
      
      return { success: true };
    }),

    // Admin: métricas
    metricas: adminProcedure.query(async () => {
      return db.getOficinasMetrics();
    }),

    // Admin: detalhe completo
    detalheAdmin: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const oficina = await db.getOficinaById(input.id);
      if (!oficina) throw new TRPCError({ code: 'NOT_FOUND' });
      const docs = await db.listDocumentos(input.id);
      const avs = await db.listAvaliacoes(input.id);
      return { ...oficina, documentos: docs, avaliacoes: avs };
    }),
  }),

  // ==================== AVALIAÇÕES ====================
  avaliacoes: router({
    // Public: listar avaliações de uma oficina
    listar: publicProcedure.input(z.object({ oficinaId: z.number() })).query(async ({ input }) => {
      const avs = await db.listAvaliacoes(input.oficinaId);
      return avs.filter(a => a.status === 'aprovada');
    }),

    // Protected: criar avaliação
    criar: protectedProcedure.input(z.object({
      oficinaId: z.number(),
      notaGeral: z.number().min(1).max(5),
      notaAtendimento: z.number().min(1).max(5).optional(),
      notaQualidade: z.number().min(1).max(5).optional(),
      notaPrazo: z.number().min(1).max(5).optional(),
      notaPreco: z.number().min(1).max(5).optional(),
      comentario: z.string().optional(),
      nomeCliente: z.string().optional(),
      tipoServico: z.string().optional(),
      tipoVeiculo: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      // Antifraude: oficina precisa existir e estar ativa.
      const oficina = await db.getOficinaById(input.oficinaId);
      if (!oficina || oficina.status !== 'ativa') {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Oficina não encontrada' });
      }
      // Não pode avaliar a própria oficina.
      if (oficina.userId === ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Você não pode avaliar a sua própria oficina' });
      }
      // Uma avaliação por usuário por oficina.
      const existente = await db.getAvaliacaoByUserAndOficina(ctx.user.id, input.oficinaId);
      if (existente) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Você já avaliou esta oficina' });
      }

      const id = await db.createAvaliacao({
        ...input,
        userId: ctx.user.id,
        status: "pendente",
      });
      
      await db.createNotificacao({
        tipo: "nova_avaliacao",
        titulo: `Nova avaliação recebida`,
        mensagem: `Oficina #${input.oficinaId} recebeu uma avaliação com nota ${input.notaGeral}/5.`,
        dados: { oficinaId: input.oficinaId, avaliacaoId: id, nota: input.notaGeral },
      });
      
      return { id };
    }),

    // Admin: listar todas
    listarAdmin: adminProcedure.input(z.object({
      status: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional()).query(async ({ input }) => {
      return db.listAllAvaliacoes(input || {});
    }),

    // Admin: aprovar/rejeitar
    moderar: adminProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["aprovada", "rejeitada"]),
    })).mutation(async ({ input }) => {
      await db.updateAvaliacaoStatus(input.id, input.status);
      return { success: true };
    }),
  }),

  // ==================== DOCUMENTOS ====================
  documentos: router({
    listar: protectedProcedure.input(z.object({ oficinaId: z.number() })).query(async ({ ctx, input }) => {
      const oficina = await db.getOficinaById(input.oficinaId);
      if (!oficina) throw new TRPCError({ code: 'NOT_FOUND' });
      if (oficina.userId !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      return db.listDocumentos(input.oficinaId);
    }),

    adicionar: protectedProcedure.input(z.object({
      oficinaId: z.number(),
      tipo: z.enum(["alvara", "cnpj_card", "contrato_social", "rg_frente", "rg_verso", "foto_fachada", "foto_interior", "foto_equipamentos", "outro"]),
      url: z.string(),
      nome: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const oficina = await db.getOficinaById(input.oficinaId);
      if (!oficina) throw new TRPCError({ code: 'NOT_FOUND' });
      if (oficina.userId !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      const id = await db.addDocumento(input);
      return { id };
    }),
  }),

  // ==================== B2B ====================
  b2b: router({
    // Criar conta B2B
    criar: protectedProcedure.input(z.object({
      razaoSocial: z.string().min(2),
      nomeFantasia: z.string().min(2),
      cnpj: z.string().min(14),
      tipo: z.enum(["seguradora", "associacao", "cooperativa"]),
      contatoNome: z.string().optional(),
      contatoEmail: z.string().email().optional(),
      contatoTelefone: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createClienteB2B({ ...input, userId: ctx.user.id });
      return { id };
    }),

    // Minha conta B2B
    minha: b2bProcedure.query(async ({ ctx }) => {
      return db.getClienteB2BByUserId(ctx.user.id);
    }),

    // B2B: buscar oficinas (acesso completo)
    buscarOficinas: b2bProcedure.input(z.object({
      categoria: z.string().optional(),
      cidade: z.string().optional(),
      estado: z.string().optional(),
      tipoVeiculo: z.string().optional(),
      tipoServico: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional()).query(async ({ input }) => {
      return db.listOficinasPublic(input || {});
    }),

    // Admin: listar clientes B2B
    listar: adminProcedure.query(async () => {
      return db.listClientesB2B();
    }),

    // Admin: atualizar status B2B
    alterarStatus: adminProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["ativo", "inativo", "pendente"]),
    })).mutation(async ({ input }) => {
      await db.updateClienteB2B(input.id, { status: input.status });
      // Update user role when B2B is approved
      const cliente = await db.getClienteB2BById(input.id);
      if (cliente && input.status === 'ativo' && cliente.userId) {
        await db.updateUserRole(cliente.userId, 'b2b');
      }
      return { success: true };
    }),
  }),

  // ==================== NOTIFICAÇÕES ====================
  notificacoes: router({
    listar: adminProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async ({ input }) => {
      return db.listNotificacoes(input?.limit || 20);
    }),

    marcarLida: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.markNotificacaoLida(input.id);
      return { success: true };
    }),

    contarNaoLidas: adminProcedure.query(async () => {
      return db.countNotificacoesNaoLidas();
    }),
  }),

  // ==================== IMPORTAÇÃO AUTOMÁTICA ====================
  importacao: router({
    iniciar: adminProcedure
      .input(
        z.object({
          termo: z.string().trim().min(2).max(120),
          cidade: z.string().trim().min(2).max(120),
          estado: z.string().trim().length(2),
          limite: z.number().int().min(1).max(300),
        })
      )
      .mutation(async ({ input }) => {
        const id = await db.createImportJob({
          termo: input.termo,
          cidade: input.cidade,
          estado: input.estado.toUpperCase(),
          limite: input.limite,
        });
        return { id };
      }),

    listar: adminProcedure.query(async () => {
      return db.listImportJobs(30);
    }),

    cancelar: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.cancelImportJob(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
