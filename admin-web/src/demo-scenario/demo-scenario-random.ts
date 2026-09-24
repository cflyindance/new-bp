function normalizePart(value: string | number): string {
  return String(value).trim();
}

export function seedFromParts(...parts: Array<string | number>): number {
  const input = parts.map(normalizePart).join("\u001f");
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function idPart(value: string | number): string {
  if (typeof value === "number") return String(value).padStart(4, "0");
  return value.trim().replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1$2$3").replace(/[^A-Za-z0-9_-]+/g, "-");
}

export function stableDemoId(namespace: string, ...parts: Array<string | number>): string {
  return ["demo", idPart(namespace), ...parts.map(idPart)].join("-");
}
