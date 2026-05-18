import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Criptografia de campos sensíveis (LGPD): dados bancários, PIX e
// documentos do representante. AES-256-GCM (autenticado).
//
// Chave: env FIELD_ENCRYPTION_KEY = 32 bytes em base64.
// Gere com: openssl rand -base64 32
//
// Formato do valor cifrado: enc:v1:<iv>:<tag>:<ciphertext> (tudo base64).
// Valores antigos em texto puro continuam legíveis (fallback no decrypt).

const PREFIX = "enc:v1:";

function getKey(): Buffer | null {
  const raw = process.env.FIELD_ENCRYPTION_KEY;
  if (!raw) return null;
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      "[Security] FIELD_ENCRYPTION_KEY deve ter 32 bytes em base64 (openssl rand -base64 32)."
    );
  }
  return key;
}

export function isFieldEncryptionConfigured(): boolean {
  return Boolean(process.env.FIELD_ENCRYPTION_KEY);
}

export function encryptField<T extends string | null | undefined>(value: T): T {
  if (value === null || value === undefined || value === "") return value;
  const key = getKey();
  if (!key) return value; // sem chave: não cifra (dev). Produção falha no boot.
  if (value.startsWith(PREFIX)) return value; // já cifrado
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}` as T;
}

export function decryptField<T extends string | null | undefined>(value: T): T {
  if (value === null || value === undefined || value === "") return value;
  if (!value.startsWith(PREFIX)) return value; // legado em texto puro
  const key = getKey();
  if (!key) return value;
  try {
    const [, , ivB64, tagB64, ctB64] = value.split(":");
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const ct = Buffer.from(ctB64, "base64");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString("utf8") as T;
  } catch {
    console.error("[Security] Falha ao decifrar campo (chave trocada?).");
    return value;
  }
}

// Campos cifrados na tabela oficinas.
export const ENCRYPTED_OFICINA_FIELDS = [
  "agencia",
  "contaCorrente",
  "pixChave",
  "cpfRepresentante",
  "rgRepresentante",
] as const;

type EncField = (typeof ENCRYPTED_OFICINA_FIELDS)[number];

export function encryptOficinaFields<T extends Record<string, unknown>>(data: T): T {
  const out: Record<string, unknown> = { ...data };
  for (const f of ENCRYPTED_OFICINA_FIELDS) {
    if (f in out && typeof out[f] === "string") {
      out[f] = encryptField(out[f] as string);
    }
  }
  return out as T;
}

export function decryptOficinaFields<T extends Record<string, unknown> | undefined | null>(
  row: T
): T {
  if (!row) return row;
  const out: Record<string, unknown> = { ...row };
  for (const f of ENCRYPTED_OFICINA_FIELDS) {
    const v = out[f as EncField];
    if (typeof v === "string") out[f as EncField] = decryptField(v);
  }
  return out as T;
}
