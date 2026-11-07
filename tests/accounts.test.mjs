import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { VaultStore } from "../server/vault.mjs";
import { findAccount, registerAccount } from "../server/accounts.mjs";
import { startLocal } from "../server/local.mjs";
test("用户名不区分大小写，拒绝并发重名并兼容已有加密资料", async (t) => {
  const parent = path.resolve("output/vault-tests");
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(path.join(parent, "accounts-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = new VaultStore(root);
  const result = await Promise.allSettled([
    registerAccount(store, "Admin", "a-strong-password"),
    registerAccount(store, "ＡＤＭＩＮ", "another-strong-password"),
  ]);
  assert.equal(result.filter((x) => x.status === "fulfilled").length, 1);
  const created = result.find((x) => x.status === "fulfilled").value;
  assert.equal((await findAccount(store, " admin ")).id, created.vault.id);
  await assert.rejects(
    registerAccount(store, "../bad", "a-strong-password"),
    /用户名/,
  );
  await assert.rejects(findAccount(store, "missing"), /用户名或密码错误/);
  const legacy = await store.create("2026级 一班", "a-strong-password");
  assert.equal((await findAccount(store, "2026级 一班")).id, legacy.vault.id);
});
test("用户名登录、注册、恢复密码和用户数据隔离", async (t) => {
  const parent = path.resolve("output/vault-tests");
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(path.join(parent, "login-"));
  const app = await startLocal({ port: 0, root });
  t.after(async () => {
    await app.close();
    await rm(root, { recursive: true, force: true });
  });
  const origin = "http://127.0.0.1:" + app.server.address().port,
    { csrf } = await (await fetch(origin + "/api/status")).json();
  let cookie = "",
    scope = "";
  const call = (route, body) =>
    fetch(origin + "/api/" + route, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SC-CSRF": csrf,
        "X-SC-Workspace": scope,
        Cookie: cookie,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  const registration = await call("register", {
    username: "本地用户",
    password: "secure-password-2026",
  });
  assert.equal(registration.status, 200);
  const data = await registration.json();
  cookie = registration.headers.get("set-cookie").split(";")[0];
  scope = data.workspace.id;
  assert.equal((await call("lock", {})).status, 200);
  assert.equal(
    (await call("login", { username: "本地用户", password: "bad-password" }))
      .status,
    401,
  );
  assert.equal(
    (await call("login", { username: "不存在", password: "bad-password" }))
      .status,
    401,
  );
  const recovery = await call("password-reset", {
    username: "本地用户",
    recovery: data.recovery,
    password: "replacement-password",
  });
  assert.equal(recovery.status, 200);
  cookie = recovery.headers.get("set-cookie").split(";")[0];
  await call("lock", {});
  const login = await call("login", {
    username: "本地用户",
    password: "replacement-password",
  });
  assert.equal(login.status, 200);
  assert.equal((await login.json()).workspace.id, data.workspace.id);
});
