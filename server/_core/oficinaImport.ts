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

type AddressComponent = { long_name: string; short_name: string; types: string[] };

// Pega o primeiro componente de endereço cujo "types" contenha um dos tipos.
function pickComponent(
  components: AddressComponent[] | undefined,
  types: string[],
  useShort = false
): string | undefined {
  if (!components) return undefined;
  for (const t of types) {
    const hit = components.find(c => c.types.includes(t));
    if (hit) return useShort ? hit.short_name : hit.long_name;
  }
  return undefined;
}

const DETAILS_FIELDS = [
  "name",
  "formatted_address",
  "address_component",
  "formatted_phone_number",
  "international_phone_number",
  "website",
  "rating",
  "user_ratings_total",
  "opening_hours",
  "business_status",
  "geometry",
].join(",");

async function buildOficina(
  place: TextSearchResponse["results"][number],
  cidade: string,
  estado: string
): Promise<InsertOficina> {
  const nome = clamp(place.name, 255) || "Oficina (sem nome)";
  const oficina: InsertOficina = {
    cnpj: "",
    razaoSocial: nome,
    nomeFantasia: nome,
    logradouro: clamp(place.formatted_address, 500),
    cidade: clamp(cidade, 255),
    estado: clamp(estado, 2),
    latitude: coord(place.geometry?.location?.lat),
    longitude: coord(place.geometry?.location?.lng),
    status: "pendente",
    googlePlaceId: place.place_id,
    observacoesAdmin: `Importado via Google Places em ${new Date().toISOString()} (NÃO VERIFICADO).`,
  };

  try {
    const { result } = await makeRequest<PlaceDetailsResult>(
      "/maps/api/place/details/json",
      { place_id: place.place_id, fields: DETAILS_FIELDS }
    );
    if (result) {
      const comps = result.address_components;
      const numero = pickComponent(comps, ["street_number"]);
      const rua = pickComponent(comps, ["route"]);
      const bairro = pickComponent(comps, [
        "sublocality_level_1",
        "sublocality",
        "neighborhood",
      ]);
      const cidadeComp = pickComponent(comps, [
        "administrative_area_level_2",
        "locality",
      ]);
      const ufComp = pickComponent(
        comps,
        ["administrative_area_level_1"],
        true
      );
      const cep = pickComponent(comps, ["postal_code"]);

      oficina.telefone = clamp(
        result.formatted_phone_number ?? result.international_phone_number,
        20
      );
      oficina.website = clamp(result.website, 500);
      oficina.logradouro = clamp(rua ?? result.formatted_address, 500);
      oficina.numero = clamp(numero, 20);
      oficina.bairro = clamp(bairro, 255);
      if (cidadeComp) oficina.cidade = clamp(cidadeComp, 255);
      if (ufComp && ufComp.length === 2) oficina.estado = ufComp;
      oficina.cep = clamp(cep, 9);
      if (typeof result.rating === "number") {
        oficina.scoreReputacao = result.rating.toFixed(1);
      }
      if (typeof result.user_ratings_total === "number") {
        oficina.totalAvaliacoes = result.user_ratings_total;
      }
      if (result.opening_hours?.weekday_text?.length) {
        oficina.horarioFuncionamento =
          result.opening_hours.weekday_text.join("\n");
      }
      const loc = result.geometry?.location;
      if (loc) {
        oficina.latitude = coord(loc.lat) ?? oficina.latitude;
        oficina.longitude = coord(loc.lng) ?? oficina.longitude;
      }
    }
  } catch (error) {
    console.warn(
      "[Import] Place Details falhou (segue com dados básicos):",
      error
    );
  }

  return oficina;
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
