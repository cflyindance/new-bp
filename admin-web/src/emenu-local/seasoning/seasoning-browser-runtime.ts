// @ts-ignore The seed module is shared with the Node API and intentionally remains plain ESM.
import { createEmenuSeasoningSeedDb } from "../../../scripts/lib/emenu-local-seasoning-seed.mjs";

const STORAGE_KEY = "emenu-local:seasoning-demo:v1";
const SCHEMA_VERSION = 1;
const temporaryFiles = new Map<string, string>();
let activeStorage: Storage | undefined;

type StoredEnvelope = { schemaVersion: 1; db: Record<string, unknown> };

function storageError(code: string, status: number): Error {
  return Object.assign(new Error(code), { statusCode: status, payload: { error: code, mode: "browser" } });
}

function currentStorage(): Storage {
  if (!activeStorage) throw storageError("browser_storage_unavailable", 503);
  return activeStorage;
}

function validateDb(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const db = value as Record<string, unknown>;
  return typeof db.version === "number"
    && typeof db.updatedAt === "string"
    && !!db.permissions && typeof db.permissions === "object"
    && !!db.migrations && typeof db.migrations === "object"
    && ["categories", "menuGroups", "products", "optionCategories", "options", "relations", "auditLog", "orderSnapshots"]
      .every((key) => Array.isArray(db[key]));
}

function readEnvelope(): StoredEnvelope | null {
  let raw: string | null;
  try {
    raw = currentStorage().getItem(STORAGE_KEY);
  } catch {
    throw storageError("browser_storage_unavailable", 503);
  }
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredEnvelope>;
    if (parsed.schemaVersion !== SCHEMA_VERSION || !validateDb(parsed.db)) throw new Error("invalid");
    return parsed as StoredEnvelope;
  } catch {
    throw storageError("browser_demo_data_invalid", 500);
  }
}

function writeEnvelope(db: Record<string, unknown>): void {
  if (!validateDb(db)) throw storageError("browser_demo_data_invalid", 500);
  const serialized = JSON.stringify({ schemaVersion: SCHEMA_VERSION, db });
  try {
    currentStorage().setItem(STORAGE_KEY, serialized);
  } catch {
    throw storageError("browser_storage_write_failed", 507);
  }
}

export function configureSeasoningBrowserStorage(storage: Storage): void {
  activeStorage = storage;
}

export function ensureSeasoningBrowserStorage(): void {
  if (readEnvelope()) return;
  writeEnvelope(createEmenuSeasoningSeedDb());
}

export const browserFs = {
  existsSync(filePath: string): boolean {
    if (temporaryFiles.has(filePath)) return true;
    return readEnvelope() !== null;
  },
  readFileSync(filePath: string): string {
    const temporary = temporaryFiles.get(filePath);
    if (temporary !== undefined) return temporary;
    const envelope = readEnvelope();
    if (!envelope) throw storageError("browser_storage_unavailable", 503);
    return JSON.stringify(envelope.db);
  },
  mkdirSync(): void {},
  writeFileSync(filePath: string, value: string): void {
    temporaryFiles.set(filePath, String(value));
  },
  renameSync(source: string): void {
    const raw = temporaryFiles.get(source);
    if (raw === undefined) throw storageError("browser_storage_write_failed", 507);
    let db: Record<string, unknown>;
    try {
      db = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw storageError("browser_demo_data_invalid", 500);
    }
    writeEnvelope(db);
    temporaryFiles.delete(source);
  },
  rmSync(filePath: string): void { temporaryFiles.delete(filePath); },
};

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

class BrowserByteBuffer {
  constructor(readonly bytes: Uint8Array) {}
  toString(encoding = "utf8"): string {
    if (encoding === "base64url") return bytesToBase64Url(this.bytes);
    return new TextDecoder().decode(this.bytes);
  }
}

export const BrowserBuffer = {
  from(value: string | Uint8Array, encoding = "utf8"): BrowserByteBuffer {
    if (value instanceof Uint8Array) return new BrowserByteBuffer(value);
    if (encoding === "base64url") return new BrowserByteBuffer(base64UrlToBytes(value));
    return new BrowserByteBuffer(new TextEncoder().encode(value));
  },
  concat(values: Array<BrowserByteBuffer | Uint8Array | string>): BrowserByteBuffer {
    const arrays = values.map((value) => value instanceof BrowserByteBuffer
      ? value.bytes
      : value instanceof Uint8Array
        ? value
        : new TextEncoder().encode(value));
    const output = new Uint8Array(arrays.reduce((total, value) => total + value.length, 0));
    let offset = 0;
    arrays.forEach((value) => { output.set(value, offset); offset += value.length; });
    return new BrowserByteBuffer(output);
  },
};

function stableHash(value: string): string {
  const parts: string[] = [];
  for (let seed = 0; seed < 8; seed += 1) {
    let hash = (0x811c9dc5 ^ seed) >>> 0;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    parts.push(hash.toString(16).padStart(8, "0"));
  }
  return parts.join("");
}

export const browserCrypto = {
  randomUUID(): string {
    return globalThis.crypto?.randomUUID?.() ?? `browser-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  },
  createHash(): { update(value: string): { digest(encoding: string): string } } {
    let content = "";
    const chain = {
      update(value: string) { content += String(value); return chain; },
      digest(_encoding: string) { return stableHash(content); },
    };
    return chain;
  },
};

export const browserPath = {
  dirname(value: string): string { return value.includes("/") ? value.slice(0, value.lastIndexOf("/")) : "."; },
  join(...parts: string[]): string { return parts.join("/").replace(/\/+/, "/"); },
};

export const BROWSER_PROCESS = { pid: "browser" };
