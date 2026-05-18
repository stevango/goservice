import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

// Aplica as migrations (cria/atualiza tabelas) na subida do app. É
// idempotente: o Drizzle registra o que já foi aplicado e pula o resto.
// Falha aqui NÃO derruba o servidor — o site sobe e o erro fica visível
// nos logs, evitando crash-loop/502 por um problema transitório de banco.
export async function runMigrations(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[Migrations] DATABASE_URL ausente — migrations puladas.");
    return;
  }

  let connection: mysql.Connection | undefined;
  try {
    connection = await mysql.createConnection(url);
    const db = drizzle(connection);
    await migrate(db, { migrationsFolder: "drizzle" });
    console.log("[Migrations] Banco atualizado com sucesso.");
  } catch (error) {
    console.error("[Migrations] Falha ao aplicar migrations:", error);
  } finally {
    if (connection) await connection.end();
  }
}
