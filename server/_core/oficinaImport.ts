import * as db from "../db";
import type { InsertOficina } from "../../drizzle/schema";
import { makeRequest, type PlaceDetailsResult } from "./map";

// Resposta do Text Search (o tipo do map.ts não inclui o token de página).
type TextSearchResponse = {
  results: Array<{
    place_id: string;
    name: string;
    formatted_address?: string;
    geometry?: { location?: { lat: number; lng: number } };
  }>;
  status: string;
  next_page_token?: string;
  error_message?: string;
};

const TICK_MS = 60_000; // devagarinho: 1 página de no máx. 20 por minuto
let workerStarted = false;
let isRunning = false;

function clamp(value: string | undefined, max: number): string | undefined {
  if (!value) return undefined;
  return value.length > max ? value.slice(0, max) : value;
}

function coord(n: number | undefined): string | undefined {
  if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
  return n.toFixed(7);
}

async function buildOficina(
  place: TextSearchResponse["results"][number],
  cidade: string,
  estado: string
): Promise<InsertOficina> {
  let telefone: string | undefined;
  let website: string | undefined;
  let endereco = place.formatted_address;

  try {
    const details = await makeRequest<PlaceDetailsResult>(
      "/maps/api/place/details/json",
      {
        place_id: place.place_id,
        fields: "formatted_phone_number,website,formatted_address",
      }
    );
    telefone = clamp(details.result?.formatted_phone_number, 20);
    website = clamp(details.result?.website, 500);
    endereco = details.result?.formatted_address ?? endereco;
  } catch (error) {
    console.warn("[Import] Place Details falhou (segue sem telefone):", error);
  }

  const nome = clamp(place.name, 255) || "Oficina (sem nome)";

  return {
    cnpj: "",
    razaoSocial: nome,
    nomeFantasia: nome,
    telefone,
    website,
    logradouro: clamp(endereco, 500),
    cidade: clamp(cidade, 255),
    estado: clamp(estado, 2),
    latitude: coord(place.geometry?.location?.lat),
    longitude: coord(place.geometry?.location?.lng),
    status: "pendente",
    googlePlaceId: place.place_id,
    observacoesAdmin: `Importado via Google Places em ${new Date().toISOString()} (NÃO VERIFICADO).`,
  };
}

// Processa UMA página de UM job por vez. Chamado periodicamente.
export async function processNextImportBatch(): Promise<void> {
  if (isRunning) return;
  isRunning = true;
  try {
    const job = await db.pickNextImportJob();
    if (!job) return;

    if (job.importados >= job.limite) {
      await db.updateImportJob(job.id, {
        status: "concluido",
        nextPageToken: null,
      });
      return;
    }

    if (job.status === "pendente") {
      await db.updateImportJob(job.id, { status: "rodando" });
    }

    const params: Record<string, unknown> = job.nextPageToken
      ? { pagetoken: job.nextPageToken }
      : { query: `${job.termo} em ${job.cidade}, ${job.estado}, Brasil` };

    let resp: TextSearchResponse;
    try {
      resp = await makeRequest<TextSearchResponse>(
        "/maps/api/place/textsearch/json",
        params
      );
    } catch (error) {
      await db.updateImportJob(job.id, {
        status: "erro",
        erro: `Falha na busca Google: ${String(error)}`,
      });
      return;
    }

    // Token de página recém-criado ainda não ativo: tenta de novo no próximo ciclo.
    if (resp.status === "INVALID_REQUEST" && job.nextPageToken) {
      return;
    }

    if (resp.status !== "OK" && resp.status !== "ZERO_RESULTS") {
      await db.updateImportJob(job.id, {
        status: "erro",
        erro: `Google retornou ${resp.status}${resp.error_message ? `: ${resp.error_message}` : ""}`,
      });
      return;
    }

    const results = resp.results ?? [];
    let importados = job.importados;
    let duplicados = job.duplicados;

    for (const place of results) {
      if (importados >= job.limite) break;
      if (!place.place_id) continue;
      if (await db.oficinaExistsByGooglePlaceId(place.place_id)) {
        duplicados += 1;
        continue;
      }
      try {
        await db.insertImportedOficina(
          await buildOficina(place, job.cidade, job.estado)
        );
        importados += 1;
      } catch (error) {
        console.error("[Import] Falha ao inserir oficina:", error);
      }
    }

    const reachedLimit = importados >= job.limite;
    const hasMore = Boolean(resp.next_page_token) && !reachedLimit;
    await db.updateImportJob(job.id, {
      status: hasMore ? "rodando" : "concluido",
      nextPageToken: hasMore ? resp.next_page_token ?? null : null,
      pagina: job.pagina + 1,
      encontrados: job.encontrados + results.length,
      importados,
      duplicados,
      erro: null,
    });
  } finally {
    isRunning = false;
  }
}

export function startImportWorker(): void {
  if (workerStarted) return;
  workerStarted = true;
  setInterval(() => {
    processNextImportBatch().catch(error =>
      console.error("[Import] Erro no ciclo de importação:", error)
    );
  }, TICK_MS);
  console.log("[Import] Worker de importação iniciado (1 lote/min).");
}
