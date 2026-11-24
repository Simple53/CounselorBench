const WORKSPACE_AUTH_KEY = "counselor-remembered-auth-v1";
const SCHOOL_AUTH_KEY = "counselor-remembered-school-v1";
const WEB_WORKSPACE_KEY = "counselor-web-workspace-v1";
export const WEB_AUTO_ENTER_KEY = "counselor-web-auto-enter-v1";

const IDB_NAME = "counselor-auth-keystore";
const IDB_STORE = "keys";
const DEVICE_KEY_ID = "device-aes-key-v1";

const memoryFallbackStore = new Map();

function hasStorage() {
  try {
    return typeof globalThis.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function hasWebCrypto() {
  return (
    typeof globalThis.crypto !== "undefined" &&
    Boolean(globalThis.crypto.subtle) &&
    typeof globalThis.TextEncoder !== "undefined" &&
    typeof globalThis.TextDecoder !== "undefined"
  );
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(encoded) {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function openKeyDb() {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = globalThis.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IndexedDB open failed"));
  });
}

async function getDeviceCryptoKey() {
  if (!hasWebCrypto()) return null;
  const subtle = globalThis.crypto.subtle;
  try {
    const db = await openKeyDb();
    try {
      const existing = await new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readonly");
        const req = tx.objectStore(IDB_STORE).get(DEVICE_KEY_ID);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
      if (existing) return existing;
      const created = await subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
      );
      await new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readwrite");
        const req = tx.objectStore(IDB_STORE).put(created, DEVICE_KEY_ID);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      return created;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

async function saveEncryptedPayload(storageKey, payload) {
  if (!payload || typeof payload !== "object") return;
  const serialized = JSON.stringify(payload);
  const cryptoKey = await getDeviceCryptoKey();
  if (cryptoKey && hasStorage()) {
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new globalThis.TextEncoder().encode(serialized);
    const cipherBuffer = await globalThis.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      encoded,
    );
    const envelope = {
      v: 1,
      alg: "AES-GCM",
      iv: bytesToBase64(iv),
      data: bytesToBase64(new Uint8Array(cipherBuffer)),
      savedAt: new Date().toISOString(),
    };
    try {
      globalThis.localStorage.setItem(storageKey, JSON.stringify(envelope));
      memoryFallbackStore.delete(storageKey);
      return;
    } catch {
      // Fallback to in-memory map if quota exceeded
    }
  }
  memoryFallbackStore.set(storageKey, serialized);
}

async function loadEncryptedPayload(storageKey) {
  if (hasStorage()) {
    try {
      const raw = globalThis.localStorage.getItem(storageKey);
      if (raw) {
        const envelope = JSON.parse(raw);
        if (envelope?.alg === "AES-GCM" && envelope.iv && envelope.data) {
          const cryptoKey = await getDeviceCryptoKey();
          if (cryptoKey) {
            const plainBuffer = await globalThis.crypto.subtle.decrypt(
              { name: "AES-GCM", iv: base64ToBytes(envelope.iv) },
              cryptoKey,
              base64ToBytes(envelope.data),
            );
            const text = new globalThis.TextDecoder().decode(plainBuffer);
            return JSON.parse(text);
          }
        }
      }
    } catch {
      return null;
    }
  }
  const mem = memoryFallbackStore.get(storageKey);
  if (!mem) return null;
  try {
    return JSON.parse(mem);
  } catch {
    return null;
  }
}

function clearEncryptedPayload(storageKey) {
  memoryFallbackStore.delete(storageKey);
  if (!hasStorage()) return;
  try {
    globalThis.localStorage.removeItem(storageKey);
  } catch {
    // Ignore storage removal errors
  }
}

/**
 * 持久化加密保存工作台登录账号与密码，避免服务重启或页面刷新后重复验证。
 */
export async function saveRememberedAuth({ username, password }) {
  if (!username || !password) return;
  await saveEncryptedPayload(WORKSPACE_AUTH_KEY, {
    username: String(username),
    password: String(password),
  });
}

export async function loadRememberedAuth() {
  const data = await loadEncryptedPayload(WORKSPACE_AUTH_KEY);
  if (!data?.username || !data?.password) return null;
  return { username: String(data.username), password: String(data.password) };
}

export function clearRememberedAuth() {
  clearEncryptedPayload(WORKSPACE_AUTH_KEY);
}

/**
 * 持久化加密保存学校请销假统一认证凭据及同步参数。
 */
export async function saveRememberedSchoolAuth(creds = {}) {
  const clean = {
    preset: creds.preset || "nnu",
    baseUrl: String(creds.baseUrl || ""),
    username: String(creds.username || ""),
    password: String(creds.password || ""),
    token: String(creds.token || ""),
    autoSync: creds.autoSync !== false,
  };
  await saveEncryptedPayload(SCHOOL_AUTH_KEY, clean);
}

export async function loadRememberedSchoolAuth() {
  const data = await loadEncryptedPayload(SCHOOL_AUTH_KEY);
  if (!data || typeof data !== "object") return null;
  return data;
}

export function clearRememberedSchoolAuth() {
  clearEncryptedPayload(SCHOOL_AUTH_KEY);
}

function sanitizeWebAttachments(attachments) {
  if (!Array.isArray(attachments)) return [];
  return attachments.map((item) => {
    if (!item || typeof item !== "object") return item;
    const { file, ...rest } = item;
    if (typeof rest.url === "string" && rest.url.startsWith("blob:")) {
      delete rest.url;
    }
    return rest;
  });
}

/**
 * 读取浏览器免后台测试版保存的工作区快照。
 */
export function loadWebWorkspace() {
  if (!hasStorage()) return null;
  try {
    const raw = globalThis.localStorage.getItem(WEB_WORKSPACE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * 自动将 Web 预览版状态序列化存入 localStorage（剔除不可序列化的 File/Blob 对象）。
 */
export function saveWebWorkspace(snapshot) {
  if (!hasStorage() || !snapshot || typeof snapshot !== "object") return false;
  try {
    const clean = {
      ...snapshot,
      attachments: sanitizeWebAttachments(snapshot.attachments),
    };
    globalThis.localStorage.setItem(WEB_WORKSPACE_KEY, JSON.stringify(clean));
    return true;
  } catch {
    return false;
  }
}

export function clearWebWorkspace() {
  if (!hasStorage()) return;
  try {
    globalThis.localStorage.removeItem(WEB_WORKSPACE_KEY);
  } catch {
    // Ignore storage removal errors
  }
}
