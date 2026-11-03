// Minimal browser globals for source-level domain/catalog checks run directly in Node.
// Each invocation owns isolated memory; this does not touch browser or product data.
const values = new Map();
const storage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: key => values.delete(key),
  clear: () => values.clear(),
};
globalThis.localStorage = storage;
globalThis.window = Object.assign(new EventTarget(), { localStorage: storage });
globalThis.location = { hash: '' };
