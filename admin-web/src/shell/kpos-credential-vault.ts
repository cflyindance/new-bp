const DB_NAME = "menusifu-kpos-credential-vault";
const DB_VERSION = 1;
const KEY_STORE = "keys";
const CREDENTIAL_STORE = "credentials";

type CredentialRecord = {
  id: string;
  iv: Uint8Array;
  ciphertext: ArrayBuffer;
  version: 1;
  updatedAt: number;
};

function openVault(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(KEY_STORE)) db.createObjectStore(KEY_STORE);
      if (!db.objectStoreNames.contains(CREDENTIAL_STORE)) db.createObjectStore(CREDENTIAL_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("无法打开凭据仓储"));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB 操作失败"));
  });
}

async function deviceKey(db: IDBDatabase): Promise<CryptoKey> {
  const tx = db.transaction(KEY_STORE, "readwrite");
  const store = tx.objectStore(KEY_STORE);
  const existing = await requestResult(store.get("aes-gcm-v1"));
  if (existing instanceof CryptoKey) return existing;
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  await requestResult(store.put(key, "aes-gcm-v1"));
  return key;
}

export function kposCredentialId(userId: string, host: string, licenseName: string): string {
  return `${userId.trim().toLowerCase()}|${host.trim().toLowerCase()}|${licenseName.trim()}`;
}

export async function saveKposCredential(id: string, password: string): Promise<void> {
  const db = await openVault();
  try {
    const key = await deviceKey(db);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(password));
    const tx = db.transaction(CREDENTIAL_STORE, "readwrite");
    await requestResult(tx.objectStore(CREDENTIAL_STORE).put({ id, iv, ciphertext, version: 1, updatedAt: Date.now() } satisfies CredentialRecord));
  } finally {
    db.close();
  }
}

export async function readKposCredential(id: string): Promise<string | null> {
  const db = await openVault();
  try {
    const record = (await requestResult(db.transaction(CREDENTIAL_STORE).objectStore(CREDENTIAL_STORE).get(id))) as CredentialRecord | undefined;
    if (!record || record.version !== 1) return null;
    const key = await deviceKey(db);
    try {
      const clear = await crypto.subtle.decrypt({ name: "AES-GCM", iv: record.iv }, key, record.ciphertext);
      return new TextDecoder().decode(clear);
    } catch {
      await requestResult(db.transaction(CREDENTIAL_STORE, "readwrite").objectStore(CREDENTIAL_STORE).delete(id));
      return null;
    }
  } finally {
    db.close();
  }
}

export async function deleteKposCredential(id: string): Promise<void> {
  const db = await openVault();
  try {
    await requestResult(db.transaction(CREDENTIAL_STORE, "readwrite").objectStore(CREDENTIAL_STORE).delete(id));
  } finally {
    db.close();
  }
}

