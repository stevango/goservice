// Cache TTL simples em memória para caminhos públicos quentes (busca de
// oficinas). Reduz carga no banco sem nova infra. Para escala horizontal
// (vários processos) trocar por Redis — a API abaixo já isola o uso.

type Entry = { value: unknown; expiresAt: number };

const store = new Map<string, Entry>();
const MAX_ENTRIES = 500;

export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const hit = store.get(key);
  const now = Date.now();
  if (hit && hit.expiresAt > now) return hit.value as T;

  const value = await loader();

  if (store.size >= MAX_ENTRIES) {
    // Descarta a entrada mais antiga (FIFO) para limitar memória.
    const oldest = Array.from(store.keys())[0];
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

// Invalida tudo de um prefixo (ex.: todas as buscas de oficina).
export function invalidatePrefix(prefix: string): void {
  for (const k of Array.from(store.keys())) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}
