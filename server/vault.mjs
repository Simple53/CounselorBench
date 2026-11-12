import {
  randomBytes,
  randomUUID,
  scrypt,
  createCipheriv,
  createDecipheriv,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
import {
  mkdir,
  readFile,
  readdir,
  open,
  rename,
  copyFile,
  unlink,
} from "node:fs/promises";
import path from "node:path";
const derive = promisify(scrypt);
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function checkId(id) {
  if (!uuid.test(id || "")) throw new Error("无效的账套或文件编号");
  return id;
}
function password(value) {
  if (typeof value !== "string" || value.length < 10 || value.length > 256)
    throw new Error("密码须为10至256个字符");
}
async function passwordKey(value, salt) {
  return derive(value, Buffer.from(salt, "base64"), 32, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
}
function recoveryKey(value) {
  return createHash("sha256")
    .update(
      "SmartCounselor recovery v1\0" +
        value.replace(/[\s-]/g, "").toUpperCase(),
    )
    .digest();
}
function seal(data, key, context) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(context));
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]);
}
function unseal(data, key, context) {
  if (data.length < 28) throw Error("加密文件不完整");
  const decipher = createDecipheriv("aes-256-gcm", key, data.subarray(0, 12));
  decipher.setAAD(Buffer.from(context));
  decipher.setAuthTag(data.subarray(12, 28));
  return Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]);
}
async function atomic(file, data) {
  const temp = file + "." + randomUUID() + ".tmp";
  let handle;
  try {
    handle = await open(temp, "wx", 0o600);
    await handle.writeFile(data);
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(temp, file);
  } finally {
    await handle?.close();
    await unlink(temp).catch(() => {});
  }
}
export const emptyState = () => ({
  schemaVersion: 1,
  students: [],
  records: [],
  tasks: [],
  attachments: [],
  logs: [],
  careProfiles: [],
  briefs: {},
  statusOptions: ["待跟进", "已完成"],
});
export function validateState(state) {
  if (!state || state.schemaVersion !== 1) throw Error("不支持的账套数据版本");
  for (const key of [
    "students",
    "records",
    "tasks",
    "attachments",
    "logs",
    "careProfiles",
  ])
    if (!Array.isArray(state[key])) throw Error("账套数据结构错误");
  if (
    !state.briefs ||
    typeof state.briefs !== "object" ||
    Array.isArray(state.briefs)
  )
    throw Error("简报数据结构错误");
  for (const a of state.attachments) {
    if (a.stored) checkId(a.id);
    if ("file" in a || "url" in a) throw Error("文件内容不能放入数据快照");
  }
}
export class VaultStore {
  constructor(root) {
    this.root = path.resolve(root);
    this.queues = new Map();
  }
  directory(id) {
    return path.join(this.root, checkId(id) + ".scdata");
  }
  async serial(id, work) {
    const previous = this.queues.get(id) || Promise.resolve();
    const current = previous.catch(() => {}).then(work);
    this.queues.set(id, current);
    try {
      return await current;
    } finally {
      if (this.queues.get(id) === current) this.queues.delete(id);
    }
  }
  async list() {
    await mkdir(this.root, { recursive: true });
    const out = [];
    for (const entry of await readdir(this.root, { withFileTypes: true })) {
      if (!entry.isDirectory() || !entry.name.endsWith(".scdata")) continue;
      try {
        const meta = JSON.parse(
          await readFile(
            path.join(this.root, entry.name, "workspace.json"),
            "utf8",
          ),
        );
        checkId(meta.id);
        if (entry.name !== meta.id + ".scdata" || meta.version !== 1) continue;
        out.push({ id: meta.id, name: meta.name, createdAt: meta.createdAt });
      } catch {}
    }
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async create(name, secret) {
    password(secret);
    if (typeof name !== "string" || !name.trim() || name.length > 80)
      throw Error("请填写80字以内的账套名称");
    const id = randomUUID(),
      key = randomBytes(32),
      salt = randomBytes(16).toString("base64"),
      recovery = randomBytes(32)
        .toString("hex")
        .toUpperCase()
        .match(/.{8}/g)
        .join("-");
    const kek = await passwordKey(secret, salt);
    let rk;
    try {
      rk = recoveryKey(recovery);
      const meta = {
        version: 1,
        id,
        name: name.trim(),
        createdAt: new Date().toISOString(),
        cipher: "AES-256-GCM",
        kdf: "scrypt-N32768-r8-p1",
        salt,
        passwordWrap: seal(key, kek, id + ":password").toString("base64"),
        recoveryWrap: seal(key, rk, id + ":recovery").toString("base64"),
      };
      const dir = this.directory(id);
      await mkdir(path.join(dir, "database"), { recursive: true });
      await mkdir(path.join(dir, "managed_files"));
      await mkdir(path.join(dir, "backups"));
      await atomic(
        path.join(dir, "database", "state.scenc"),
        seal(
          Buffer.from(JSON.stringify({ revision: 0, state: emptyState() })),
          key,
          id + ":state",
        ),
      );
      await atomic(
        path.join(dir, "workspace.json"),
        JSON.stringify(meta, null, 2),
      );
      return { vault: { id, name: meta.name, key }, recovery };
    } catch (e) {
      key.fill(0);
      throw e;
    } finally {
      kek.fill(0);
      rk?.fill(0);
    }
  }
  async unlock(id, secret) {
    const meta = JSON.parse(
      await readFile(path.join(this.directory(id), "workspace.json"), "utf8"),
    );
    if (
      meta.version !== 1 ||
      meta.id !== id ||
      meta.kdf !== "scrypt-N32768-r8-p1"
    )
      throw Error("不支持的账套格式");
    let kek;
    try {
      kek = await passwordKey(String(secret), meta.salt);
      const key = unseal(
        Buffer.from(meta.passwordWrap, "base64"),
        kek,
        id + ":password",
      );
      const vault = { id, name: meta.name, key };
      await this.load(vault);
      return vault;
    } catch {
      throw Error("密码错误或账套文件已损坏");
    } finally {
      kek?.fill(0);
    }
  }
  async recover(id, recovery, newPassword) {
    password(newPassword);
    if (
      typeof recovery !== "string" ||
      !/^[A-Fa-f0-9\s-]{64,90}$/.test(recovery)
    )
      throw Error("恢复密钥格式错误");
    return this.serial(id, async () => {
      const file = path.join(this.directory(id), "workspace.json"),
        meta = JSON.parse(await readFile(file, "utf8"));
      let key, kek, rk;
      try {
        rk = recoveryKey(recovery);
        key = unseal(
          Buffer.from(meta.recoveryWrap, "base64"),
          rk,
          id + ":recovery",
        );
        const salt = randomBytes(16).toString("base64");
        kek = await passwordKey(newPassword, salt);
        meta.salt = salt;
        meta.passwordWrap = seal(key, kek, id + ":password").toString("base64");
        await atomic(file, JSON.stringify(meta, null, 2));
        return { id, name: meta.name, key };
      } catch (e) {
        key?.fill(0);
        throw Error("恢复密钥错误或账套文件损坏");
      } finally {
        kek?.fill(0);
        rk?.fill(0);
      }
    });
  }
  async load(vault) {
    const bytes = await readFile(
      path.join(this.directory(vault.id), "database", "state.scenc"),
    );
    const result = JSON.parse(unseal(bytes, vault.key, vault.id + ":state"));
    validateState(result.state);
    return result;
  }
  async save(vault, state, revision) {
    validateState(state);
    return this.serial(vault.id, async () => {
      const current = await this.load(vault);
      if (current.revision !== revision) {
        const e = Error("账套已在另一页面更新，请重新解锁后再编辑");
        e.status = 409;
        throw e;
      }
      const dir = this.directory(vault.id),
        file = path.join(dir, "database", "state.scenc");
      const businessChanged =
        JSON.stringify({ ...current.state, prefs: undefined }) !==
        JSON.stringify({ ...state, prefs: undefined });
      if (businessChanged) {
        await mkdir(path.join(dir, "backups"), { recursive: true });
        await copyFile(file, path.join(dir, "backups", "previous.scenc"));
      }
      const next = { revision: revision + 1, state };
      await atomic(
        file,
        seal(Buffer.from(JSON.stringify(next)), vault.key, vault.id + ":state"),
      );
      return next.revision;
    });
  }
  async putFile(vault, id, bytes) {
    checkId(id);
    await mkdir(path.join(this.directory(vault.id), "managed_files"), {
      recursive: true,
    });
    await atomic(
      path.join(this.directory(vault.id), "managed_files", id + ".scenc"),
      seal(bytes, vault.key, vault.id + ":file:" + id),
    );
  }
  async file(vault, id) {
    checkId(id);
    return unseal(
      await readFile(
        path.join(this.directory(vault.id), "managed_files", id + ".scenc"),
      ),
      vault.key,
      vault.id + ":file:" + id,
    );
  }
  async backup(vault) {
    return this.serial(vault.id, async () => {
      const ZIP = (await import("jszip")).default,
        zip = new ZIP(),
        dir = this.directory(vault.id);
      const { state } = await this.load(vault);
      zip.file(
        "workspace.json",
        await readFile(path.join(dir, "workspace.json")),
      );
      zip.file(
        "database/state.scenc",
        await readFile(path.join(dir, "database", "state.scenc")),
      );
      for (const a of state.attachments.filter((a) => a.stored)) {
        checkId(a.id);
        zip.file(
          "managed_files/" + a.id + ".scenc",
          await readFile(path.join(dir, "managed_files", a.id + ".scenc")),
        );
      }
      return zip.generateAsync({ type: "nodebuffer", compression: "STORE" });
    });
  }
  async importBackup(zipBytes) {
    const ZIP = (await import("jszip")).default;
    let zip;
    try {
      zip = await ZIP.loadAsync(zipBytes);
    } catch {
      throw Error("备份文件不是有效的 ZIP 压缩包");
    }
    const metaFile = zip.file("workspace.json"),
      stateFile = zip.file("database/state.scenc");
    if (!metaFile || !stateFile)
      throw Error("备份包缺少必要的加密工作区文件");
    const meta = JSON.parse(await metaFile.async("string"));
    checkId(meta.id);
    if (
      meta.version !== 1 ||
      meta.kdf !== "scrypt-N32768-r8-p1" ||
      !meta.salt ||
      !meta.passwordWrap ||
      !meta.recoveryWrap
    )
      throw Error("备份包版本或加密参数不受支持");
    return this.serial(meta.id, async () => {
      const dir = this.directory(meta.id);
      await mkdir(path.join(dir, "database"), { recursive: true });
      await mkdir(path.join(dir, "managed_files"), { recursive: true });
      await mkdir(path.join(dir, "backups"), { recursive: true });
      await atomic(
        path.join(dir, "database", "state.scenc"),
        await stateFile.async("nodebuffer"),
      );
      for (const [name, entry] of Object.entries(zip.files)) {
        if (entry.dir || !name.startsWith("managed_files/")) continue;
        const base = path.posix.basename(name);
        if (!base.endsWith(".scenc")) continue;
        const fileId = checkId(base.slice(0, -".scenc".length));
        await atomic(
          path.join(dir, "managed_files", fileId + ".scenc"),
          await entry.async("nodebuffer"),
        );
      }
      await atomic(
        path.join(dir, "workspace.json"),
        JSON.stringify(meta, null, 2),
      );
      return { id: meta.id, name: meta.name, createdAt: meta.createdAt };
    });
  }
}
