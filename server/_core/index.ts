import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import type { Request, Response, NextFunction } from "express";
import { serveStatic, setupVite } from "./vite";
import { isFieldEncryptionConfigured } from "./crypto";
import { runMigrations } from "./migrate";
import { startImportWorker } from "./oficinaImport";

// Falha cedo se o segredo de sessão for ausente/fraco: com segredo fraco
// qualquer pessoa forja o cookie de sessão (inclusive admin).
function assertSessionSecret() {
  const secret = process.env.JWT_SECRET ?? "";
  if (secret.length < 32) {
    const msg =
      "[Security] JWT_SECRET ausente ou fraco (<32 chars). Gere um segredo " +
      "aleatório forte (ex.: `openssl rand -base64 48`) e configure JWT_SECRET.";
    if (process.env.NODE_ENV === "production") {
      throw new Error(msg);
    }
    console.warn(msg);
  }
}

// Falha cedo em produção se a criptografia de campos sensíveis (LGPD)
// não estiver configurada.
function assertFieldEncryption() {
  if (!isFieldEncryptionConfigured()) {
    const msg =
      "[Security] FIELD_ENCRYPTION_KEY ausente. Dados bancários/PIX/CPF " +
      "ficariam em texto puro. Gere com `openssl rand -base64 32`.";
    if (process.env.NODE_ENV === "production") {
      throw new Error(msg);
    }
    console.warn(msg);
  }
}

// Proteção CSRF: mutações tRPC são POST. Se a requisição vier de outra
// origem (Origin presente e host != host do servidor), rejeita. Requests
// sem Origin (server-to-server/cron) passam — CSRF exige um navegador,
// que sempre envia Origin em POST cross-site.
function csrfGuard(req: Request, res: Response, next: NextFunction) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return next();
  }
  const origin = req.headers.origin;
  if (!origin) return next();
  try {
    const originHost = new URL(origin).host;
    const reqHost = req.headers.host;
    if (originHost !== reqHost) {
      return res.status(403).json({ error: "Cross-origin request blocked" });
    }
  } catch {
    return res.status(403).json({ error: "Invalid Origin header" });
  }
  return next();
}

async function startServer() {
  assertSessionSecret();
  assertFieldEncryption();

  await runMigrations();
  startImportWorker();

  const app = express();
  const server = createServer(app);

  // Necessário para o rate limiter enxergar o IP real atrás do proxy.
  app.set("trust proxy", 1);

  // Cabeçalhos de segurança. CSP/COEP ficam desligados por ora: precisam
  // de tuning fino com Google Maps/analytics/Vite antes de habilitar.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // Rate limiting básico (anti-abuso/DoS). Limites generosos para não
  // quebrar UX; ajustar conforme tráfego real.
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  });
  const oauthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  app.use("/api/oauth", oauthLimiter);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    apiLimiter,
    csrfGuard,
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Em containers (Railway/etc.) o proxy encaminha para uma porta fixa.
  // Escutamos exatamente em process.env.PORT e em 0.0.0.0 — nada de
  // "procurar outra porta", senão o proxy não acha o app (erro 502).
  const port = parseInt(process.env.PORT || "3000", 10);

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);
