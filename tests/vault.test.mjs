import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import JSZip from "jszip";
import { VaultStore } from "../server/vault.mjs";
import { startLocal } from "../server/local.mjs";
const parent = path.resolve("output/vault-tests");
async function temporary(t) {
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(path.join(parent, "run-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}
test("加密快照及独立附件重开后恢复，密码错误和篡改均不能解密", async (t) => {
  const root = await temporary(t),
    store = new VaultStore(root),
    { vault, recovery } = await store.create("测试账套", "first-password-2026");
  const initial = await store.load(vault);
  assert.equal(initial.state.students.length, 0);
  const id = randomUUID(),
    bytes = Buffer.from("photo bytes: should never appear on disk");
  await store.putFile(vault, id, bytes);
  const state = {
    ...initial.state,
    students: [{ id: "student-1", name: "加密测试学生", number: "001" }],
    attachments: [
      { id, name: "私密肖像.png", stored: true, type: "image/png" },
    ],
  };
  assert.equal(await store.save(vault, state, 0), 1);
  const encrypted = await readFile(
    path.join(store.directory(vault.id), "database/state.scenc"),
  );
  assert(!encrypted.includes(Buffer.from("加密测试学生")));
  assert(!encrypted.includes(Buffer.from("私密肖像")));
  assert(
    !(
      await readFile(
        path.join(store.directory(vault.id), "managed_files", id + ".scenc"),
      )
    ).includes(bytes),
  );
  await assert.rejects(store.unlock(vault.id, "wrong-password"), /密码错误/);
  const reopened = await new VaultStore(root).unlock(
    vault.id,
    "first-password-2026",
  );
  assert.equal((await store.load(reopened)).state.students[0].number, "001");
  assert.deepEqual(await store.file(reopened, id), bytes);
  await assert.rejects(
    store.recover(vault.id, "A".repeat(64), "new-password-2026"),
    /恢复密钥错误/,
  );
  const recovered = await store.recover(
    vault.id,
    recovery,
    "new-password-2026",
  );
  assert.deepEqual(await store.file(recovered, id), bytes);
  await assert.rejects(store.unlock(vault.id, "first-password-2026"));
  assert.equal(
    (await store.load(await store.unlock(vault.id, "new-password-2026")))
      .revision,
    1,
  );
  const corrupt = Buffer.from(encrypted);
  corrupt[corrupt.length - 1] ^= 1;
  await writeFile(
    path.join(store.directory(vault.id), "database/state.scenc"),
    corrupt,
  );
  await assert.rejects(store.load(recovered));
});
test("并发保存拒绝旧版本，备份可在另一目录恢复且继续追加附件", async (t) => {
  const root = await temporary(t),
    store = new VaultStore(root),
    { vault } = await store.create("并发账套", "safe-password-2026"),
    { state } = await store.load(vault);
  const attempts = await Promise.allSettled([
    store.save(vault, { ...state, briefs: { "2026-11-07": "first" } }, 0),
    store.save(vault, { ...state, briefs: { "2026-11-07": "second" } }, 0),
  ]);
  assert.equal(attempts.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    attempts.find((r) => r.status === "rejected").reason.status,
    409,
  );
  const zip = await JSZip.loadAsync(await store.backup(vault)),
    restoreRoot = path.join(root, "restore"),
    restore = new VaultStore(restoreRoot),
    dir = restore.directory(vault.id);
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    const target = path.join(dir, entry.name);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, await entry.async("nodebuffer"));
  }
  const reopened = await restore.unlock(vault.id, "safe-password-2026");
  assert.equal(
    (await restore.load(reopened)).state.briefs["2026-11-07"],
    "first",
  );
  await restore.save(reopened, (await restore.load(reopened)).state, 1);
  await restore.putFile(reopened, randomUUID(), Buffer.from("new photo"));
  await assert.rejects(
    store.putFile(vault, "../escape", Buffer.from("x")),
    /无效/,
  );
});
test("本地API验证来源、CSRF、解锁与锁定，进程重启后要求重新解锁", async (t) => {
  const root = await temporary(t),
    app = await startLocal({ port: 0, root }),
    origin = "http://127.0.0.1:" + app.server.address().port;
  let cookie = "",
    scope = "";
  const status = await (await fetch(origin + "/api/status")).json();
  const call = (route, body, headers = {}) =>
    fetch(origin + "/api/" + route, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SC-CSRF": status.csrf,
        "X-SC-Workspace": scope,
        Cookie: cookie,
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  try {
    assert.equal(
      (
        await call(
          "create",
          { name: "test", password: "password-2026" },
          { "X-SC-CSRF": "" },
        )
      ).status,
      403,
    );
    assert.equal(
      (await call("load", undefined, { Origin: "https://other.example" }))
        .status,
      403,
    );
    assert.equal((await call("load")).status, 401);
    const response = await call("create", {
      name: "API账套",
      password: "password-2026",
    });
    cookie = response.headers.get("set-cookie").split(";")[0];
    const result = await response.json();
    scope = result.workspace.id;
    assert.equal(result.state.students.length, 0);
    assert.equal(
      (await call("save", { state: result.state, revision: 0 })).status,
      200,
    );
    assert.equal(
      (await call("save", { state: result.state, revision: 0 })).status,
      409,
    );
    assert.equal((await call("lock", {})).status, 200);
    assert.equal((await call("load")).status, 401);
    const login = await call("unlock", {
      id: result.workspace.id,
      password: "password-2026",
    });
    cookie = login.headers.get("set-cookie").split(";")[0];
    assert.equal((await login.json()).revision, 1);
    const other = await call("create", {
      name: "另一账套",
      password: "another-password-2026",
    });
    cookie = other.headers.get("set-cookie").split(";")[0];
    const otherData = await other.json();
    assert.equal(
      (await call("save", { state: result.state, revision: 0 })).status,
      409,
    );
    assert.equal((await call("backup")).status, 409);
    assert.equal((await call("lock", {})).status, 409);
    assert.equal(
      (await call("files/" + randomUUID() + "?workspace=" + scope)).status,
      409,
    );
    scope = otherData.workspace.id;
    assert.equal((await (await call("load")).json()).state.students.length, 0);
    const returnLogin = await call("unlock", {
      id: result.workspace.id,
      password: "password-2026",
    });
    cookie = returnLogin.headers.get("set-cookie").split(";")[0];
    scope = result.workspace.id;
    await app.close();
    const restarted = await startLocal({ port: 0, root });
    try {
      const r = await fetch(
        "http://127.0.0.1:" + restarted.server.address().port + "/api/status",
      );
      const status2 = await r.json();
      assert.notEqual(status2.csrf, status.csrf);
      assert.equal(status2.hasAccounts, true);
      assert.equal((await restarted.store.list()).length, 2);
      const locked = await fetch(
        "http://127.0.0.1:" + restarted.server.address().port + "/api/load",
        { headers: { "X-SC-CSRF": status2.csrf, Cookie: cookie } },
      );
      assert.equal(locked.status, 401);
    } finally {
      await restarted.close();
    }
  } finally {
    if (app.server.listening) await app.close();
  }
});
