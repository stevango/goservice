import * as db from "../db";
import type { InsertOficina, Oficina } from "../../drizzle/schema";
import { makeRequest, type PlaceDetailsResult } from "./map";
import { segmentoLabel } from "@shared/types";

// Resposta do Text Search (o tipo do map.ts não inclui o token de página).
type TextSearchResponse = {
  results: Array<{
    place_id: string;
    name: string;
    formatted_address?: string;
    rating?: number;
    user_ratings_total?: number;
    geometry?: { location?: { lat: number; lng: number } };
  }>;
  status: string;
  next_page_token?: string;
  error_message?: string;
};

type Candidato = {
  placeId: string;
  nome: string;
  rating: number;
  urt: number;
  lat?: number;
  lng?: number;
  endereco?: string;
};

const TICK_MS = 60_000; // ciclo de segurança / re-enriquecimento em background
const ENRICH_PER_TICK = 5; // re-enriquece antigas quando não há import ativo
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

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || v === "";
}

type AddressComponent = { long_name: string; short_name: string; types: string[] };

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
  "photo",
].join(",");

type ParsedDetails = {
  telefone?: string;
  website?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  scoreReputacao?: string;
  totalAvaliacoes?: number;
  horarioFuncionamento?: string;
  latitude?: string;
  longitude?: string;
  photoRefs?: string[];
};

// Busca o Place Details e normaliza os campos que nos interessam. É a
// MESMA fonte que o Manus usava (Google Places) — só lemos mais campos.
async function fetchDetails(placeId: string): Promise<ParsedDetails | null> {
  try {
    const { result } = await makeRequest<PlaceDetailsResult>(
      "/maps/api/place/details/json",
      { place_id: placeId, fields: DETAILS_FIELDS, language: "pt-BR" }
    );
    if (!result) return null;

    const comps = result.address_components;
    const ufComp = pickComponent(comps, ["administrative_area_level_1"], true);
    const parsed: ParsedDetails = {
      telefone: clamp(
        result.formatted_phone_number ?? result.international_phone_number,
        20
      ),
      website: clamp(result.website, 500),
      logradouro: clamp(
        pickComponent(comps, ["route"]) ?? result.formatted_address,
        500
      ),
      numero: clamp(pickComponent(comps, ["street_number"]), 20),
      bairro: clamp(
        pickComponent(comps, [
          "sublocality_level_1",
          "sublocality",
          "neighborhood",
        ]),
        255
      ),
      cidade: clamp(
        pickComponent(comps, ["administrative_area_level_2", "locality"]),
        255
      ),
      estado: ufComp && ufComp.length === 2 ? ufComp : undefined,
      cep: clamp(pickComponent(comps, ["postal_code"]), 9),
      photoRefs: (result.photos ?? [])
        .slice(0, 10)
        .map(p => p.photo_reference)
        .filter(Boolean),
    };
    if (typeof result.rating === "number") {
      parsed.scoreReputacao = result.rating.toFixed(1);
    }
    if (typeof result.user_ratings_total === "number") {
      parsed.totalAvaliacoes = result.user_ratings_total;
    }
    if (result.opening_hours?.weekday_text?.length) {
      parsed.horarioFuncionamento = result.opening_hours.weekday_text.join("\n");
    }
    const loc = result.geometry?.location;
    if (loc) {
      parsed.latitude = coord(loc.lat);
      parsed.longitude = coord(loc.lng);
    }
    return parsed;
  } catch (error) {
    console.warn("[Import] Place Details falhou:", error);
    return null;
  }
}

export type GoogleReview = {
  autor: string;
  nota: number;
  texto: string;
  quando: string;
};

// Busca as avaliações do Google sob demanda. O Google retorna no
// máximo ~5 reviews por estabelecimento (limite da API, não nosso).
export async function fetchGoogleReviews(
  placeId: string
): Promise<GoogleReview[]> {
  try {
    const { result } = await makeRequest<PlaceDetailsResult>(
      "/maps/api/place/details/json",
      { place_id: placeId, fields: "reviews", language: "pt-BR" }
    );
    return (result?.reviews ?? []).map(r => ({
      autor: r.author_name,
      nota: r.rating,
      texto: r.text,
      quando: r.relative_time_description ?? "",
    }));
  } catch (error) {
    console.warn("[Reviews] Falha ao buscar avaliações Google:", error);
    return [];
  }
}

function defaultDescricao(
  segmento: string,
  cidade: string,
  estado: string
): string {
  return `${segmentoLabel(segmento)} em ${cidade}/${estado}. Cadastro importado do Google — dados ainda não verificados.`;
}

async function buildOficina(
  cand: Candidato,
  cidade: string,
  estado: string,
  segmento: string
): Promise<{ oficina: InsertOficina; photoRefs?: string[] }> {
  const nome = clamp(cand.nome, 255) || "Prestador (sem nome)";
  const oficina: InsertOficina = {
    cnpj: "",
    razaoSocial: nome,
    nomeFantasia: nome,
    segmento,
    logradouro: clamp(cand.endereco, 500),
    cidade: clamp(cidade, 255),
    estado: clamp(estado, 2),
    latitude: coord(cand.lat),
    longitude: coord(cand.lng),
    descricao: defaultDescricao(segmento, cidade, estado),
    // Defaults de oficina só fazem sentido no segmento automotivo.
    tiposServicos: segmento === "oficina_mecanica" ? ["mecanica"] : undefined,
    tiposVeiculos: segmento === "oficina_mecanica" ? ["leve"] : undefined,
    status: "pendente",
    googlePlaceId: cand.placeId,
    enrichedAt: new Date(),
    observacoesAdmin: `Importado via Google Places em ${new Date().toISOString()} (NÃO VERIFICADO).`,
  };

  const d = await fetchDetails(cand.placeId);
  if (d) {
    if (d.telefone) oficina.telefone = d.telefone;
    if (d.website) oficina.website = d.website;
    if (d.logradouro) oficina.logradouro = d.logradouro;
    if (d.numero) oficina.numero = d.numero;
    if (d.bairro) oficina.bairro = d.bairro;
    if (d.cidade) oficina.cidade = d.cidade;
    if (d.estado) oficina.estado = d.estado;
    if (d.cep) oficina.cep = d.cep;
    if (d.scoreReputacao) oficina.scoreReputacao = d.scoreReputacao;
    if (typeof d.totalAvaliacoes === "number")
      oficina.totalAvaliacoes = d.totalAvaliacoes;
    if (d.horarioFuncionamento)
      oficina.horarioFuncionamento = d.horarioFuncionamento;
    if (d.latitude) oficina.latitude = d.latitude;
    if (d.longitude) oficina.longitude = d.longitude;
  }
  return { oficina, photoRefs: d?.photoRefs };
}

// Salva várias fotos do Google. Idempotente: não duplica refs já
// salvos (útil no re-enriquecimento). 1ª vira fachada, demais interior.
async function saveFotos(
  oficinaId: number,
  refs: string[]
): Promise<void> {
  if (!refs.length) return;
  const docs = await db.listDocumentos(oficinaId);
  const existentes = new Set<string>();
  for (const d of docs) {
    const mref = /[?&]ref=([^&]+)/.exec(d.url);
    if (mref) existentes.add(decodeURIComponent(mref[1]));
  }
  let temFachada = docs.some(d => d.tipo === "foto_fachada");
  for (const ref of refs) {
    if (!ref || existentes.has(ref)) continue;
    existentes.add(ref);
    const tipo = temFachada ? "foto_interior" : "foto_fachada";
    temFachada = true;
    await db.addDocumento({
      oficinaId,
      tipo,
      url: `/api/place-photo?ref=${encodeURIComponent(ref)}`,
      nome: tipo === "foto_fachada" ? "Fachada (Google)" : "Foto (Google)",
    });
  }
}

// Re-enriquece uma oficina já existente SEM sobrescrever edições manuais:
// só preenche campos vazios. Reputação/horário (donos = Google) sempre
// atualizam. Marca enrichedAt para não reprocessar.
async function reenrichOficina(of: Oficina): Promise<void> {
  if (!of.googlePlaceId) {
    await db.updateOficina(of.id, { enrichedAt: new Date() });
    return;
  }
  const d = await fetchDetails(of.googlePlaceId);
  const patch: Partial<InsertOficina> = { enrichedAt: new Date() };
  if (d) {
    if (isEmpty(of.telefone) && d.telefone) patch.telefone = d.telefone;
    if (isEmpty(of.website) && d.website) patch.website = d.website;
    if (isEmpty(of.logradouro) && d.logradouro)
      patch.logradouro = d.logradouro;
    if (isEmpty(of.numero) && d.numero) patch.numero = d.numero;
    if (isEmpty(of.bairro) && d.bairro) patch.bairro = d.bairro;
    if (isEmpty(of.cidade) && d.cidade) patch.cidade = d.cidade;
    if (isEmpty(of.estado) && d.estado) patch.estado = d.estado;
    if (isEmpty(of.cep) && d.cep) patch.cep = d.cep;
    if (isEmpty(of.descricao))
      patch.descricao = defaultDescricao(
        of.segmento,
        of.cidade ?? "",
        of.estado ?? ""
      );
    if (
      of.segmento === "oficina_mecanica" &&
      (!of.tiposServicos || of.tiposServicos.length === 0)
    )
      patch.tiposServicos = ["mecanica"];
    if (
      of.segmento === "oficina_mecanica" &&
      (!of.tiposVeiculos || of.tiposVeiculos.length === 0)
    )
      patch.tiposVeiculos = ["leve"];
    if (d.scoreReputacao) patch.scoreReputacao = d.scoreReputacao;
    if (typeof d.totalAvaliacoes === "number")
      patch.totalAvaliacoes = d.totalAvaliacoes;
    if (d.horarioFuncionamento)
      patch.horarioFuncionamento = d.horarioFuncionamento;
    if (isEmpty(of.latitude) && d.latitude) patch.latitude = d.latitude;
    if (isEmpty(of.longitude) && d.longitude) patch.longitude = d.longitude;
  }
  await db.updateOficina(of.id, patch);
  if (d?.photoRefs?.length) await saveFotos(of.id, d.photoRefs);
}

async function runReenrichPass(): Promise<void> {
  const pend = await db.pickOficinasToEnrich(ENRICH_PER_TICK);
  for (const of of pend) {
    try {
      await reenrichOficina(of);
    } catch (error) {
      console.error("[Import] Re-enriquecimento falhou:", error);
      await db.updateOficina(of.id, { enrichedAt: new Date() });
    }
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Processa o job INTEIRO em uma única passada: busca as páginas
// necessárias, ranqueia por avaliação e insere até o limite. Rápido
// (10 estabelecimentos em ~segundos), não espalhado por ciclos.
async function processJobFully(
  job: Awaited<ReturnType<typeof db.pickNextImportJob>> & object
): Promise<void> {
  const acc: Candidato[] = [...(job.candidatos ?? [])];
  const seen = new Set(acc.map(c => c.placeId));

  if (job.fase === "coletando") {
    let token = job.nextPageToken;
    // 1 página = 20 resultados. Só pagina se o limite exigir mais.
    const maxPages = Math.min(3, Math.ceil(job.limite / 20) + 1);
    let pages = 0;

    while (acc.length < job.limite && pages < maxPages) {
      const params: Record<string, unknown> = token
        ? { pagetoken: token }
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

      // Token de paginação recusado: usa o que já temos, sem travar.
      if (resp.status === "INVALID_REQUEST" && token) break;

      if (resp.status !== "OK" && resp.status !== "ZERO_RESULTS") {
        await db.updateImportJob(job.id, {
          status: "erro",
          erro: `Google retornou ${resp.status}${resp.error_message ? `: ${resp.error_message}` : ""}`,
        });
        return;
      }

      for (const r of resp.results ?? []) {
        if (!r.place_id || seen.has(r.place_id)) continue;
        seen.add(r.place_id);
        acc.push({
          placeId: r.place_id,
          nome: r.name,
          rating: typeof r.rating === "number" ? r.rating : 0,
          urt:
            typeof r.user_ratings_total === "number"
              ? r.user_ratings_total
              : 0,
          lat: r.geometry?.location?.lat,
          lng: r.geometry?.location?.lng,
          endereco: r.formatted_address,
        });
      }

      pages += 1;
      token = resp.next_page_token ?? null;
      if (!token || acc.length >= job.limite) break;
      await sleep(2500); // next_page_token leva ~2s pra ativar
    }

    acc.sort((a, b) => b.rating - a.rating || b.urt - a.urt);
  }

  // Insere os melhores até o limite, tudo de uma vez.
  const fila = acc.slice(0, job.limite);
  let importados = job.importados;
  let duplicados = job.duplicados;

  for (const cand of fila) {
    if (importados >= job.limite) break;
    try {
      if (await db.oficinaExistsByGooglePlaceId(cand.placeId)) {
        duplicados += 1;
        continue;
      }
      const { oficina, photoRefs } = await buildOficina(
        cand,
        job.cidade,
        job.estado,
        job.segmento
      );
      const id = await db.insertImportedOficina(oficina);
      if (photoRefs?.length) await saveFotos(id, photoRefs);
      importados += 1;
    } catch (error) {
      console.error("[Import] Falha ao inserir oficina:", error);
    }
  }

  await db.updateImportJob(job.id, {
    status: "concluido",
    fase: "inserindo",
    candidatos: [],
    nextPageToken: null,
    pagina: job.pagina + 1,
    encontrados: acc.length,
    importados,
    duplicados,
    erro: null,
  });
}

export async function processNextImportBatch(): Promise<void> {
  if (isRunning) return;
  isRunning = true;
  try {
    const job = await db.pickNextImportJob();

    if (!job) {
      await runReenrichPass();
      return;
    }

    if (job.status === "pendente") {
      await db.updateImportJob(job.id, { status: "rodando" });
    }
    if (job.importados >= job.limite) {
      await db.updateImportJob(job.id, {
        status: "concluido",
        candidatos: [],
      });
      return;
    }

    await processJobFully(job);
  } finally {
    isRunning = false;
  }
}

// Dispara o worker imediatamente (ex.: logo após criar um job), sem
// esperar o próximo ciclo. Fire-and-forget.
export function kickImportWorker(): void {
  processNextImportBatch().catch(error =>
    console.error("[Import] Erro no ciclo de importação:", error)
  );
}

export function startImportWorker(): void {
  if (workerStarted) return;
  workerStarted = true;
  setInterval(() => {
    processNextImportBatch().catch(error =>
      console.error("[Import] Erro no ciclo de importação:", error)
    );
  }, TICK_MS);
  console.log("[Import] Worker de importação iniciado.");
}
