import React, { useCallback, useEffect, useRef, useState } from "react";
import { App } from "./App.jsx";
import { Button } from "./ui.jsx";
import { downloadBlob } from "./files.js";
let csrf = "";
let workspaceId = "";
async function request(route, body, raw = false) {
  const response = await fetch("/api/" + route, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "X-SC-CSRF": csrf,
      "X-SC-Workspace": workspaceId,
      ...(body !== undefined && !raw
        ? { "Content-Type": "application/json" }
        : {}),
    },
    body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
  });
  if (!response.ok) {
    let message = "本地服务连接失败";
    try {
      message = (await response.json()).error || message;
    } catch {}
    throw Error(message);
  }
  return raw ? response : response.json();
}
function hydrate(result) {
  return {
    ...result,
    state: {
      ...result.state,
      attachments: result.state.attachments.map((a) =>
        a.stored
          ? {
              ...a,
              url: "/api/files/" + a.id + "?workspace=" + result.workspace.id,
              file: {
                name: a.name,
                size: a.size,
                type: a.type,
                arrayBuffer: async () => {
                  const r = await request("files/" + a.id, undefined, true);
                  return r.arrayBuffer();
                },
              },
            }
          : a,
      ),
    },
  };
}
export function LocalWorkspace() {
  const [service, setService] = useState(null),
    [loaded, setLoaded] = useState(null),
    [demo, setDemo] = useState(false),
    [mode, setMode] = useState("login"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [recovery, setRecovery] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [saved, setSaved] = useState("已保存");
  const pending = useRef(null),
    bootSequence = useRef(0),
    running = useRef(null),
    timer = useRef(null),
    revision = useRef(0),
    stored = useRef(new Set());
  const boot = useCallback(async () => {
    const sequence = ++bootSequence.current;
    try {
      const r = await fetch("/api/status");
      if (!r.ok) throw Error();
      const data = await r.json();
      if (sequence !== bootSequence.current) return;
      if (!data.connected) throw Error();
      csrf = data.csrf;
      setService(data);
      setMode("login");
      try {
        const result = await request("load");
        if (sequence !== bootSequence.current) return;
        activate(result);
      } catch {}
    } catch {
      if (sequence !== bootSequence.current) return;
      setService({ unavailable: true });
    }
  }, []);
  useEffect(() => {
    boot();
    return () => {
      bootSequence.current++;
      clearTimeout(timer.current);
    };
  }, [boot]);
  function activate(result) {
    clearTimeout(timer.current);
    workspaceId = result.workspace.id;
    revision.current = result.revision;
    stored.current = new Set(
      result.state.attachments.filter((a) => a.stored).map((a) => a.id),
    );
    pending.current = null;
    setSaved("已保存");
    setLoaded(hydrate(result));
  }
  async function submit(e) {
    e.preventDefault();
    bootSequence.current++;
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (mode !== "login" && data.password !== data.confirm)
        throw Error("两次密码不一致");
      const result = await request(
        mode === "recover" ? "password-reset" : mode,
        data,
      );
      activate(result);
      if (result.recovery) {
        setRecovery(result.recovery);
        setConfirmed(false);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  // ponytail: 单账套快照队列；大规模查询迁移到 SQLCipher，不在前端维护第二套数据库。
  async function flush() {
    clearTimeout(timer.current);
    if (running.current) {
      await running.current;
      if (pending.current) return flush();
      return;
    }
    if (!pending.current) return;
    const operation = (async () => {
      while (pending.current) {
        const snapshot = pending.current;
        pending.current = null;
        try {
          const attachments = [];
          for (const a of snapshot.attachments) {
            if (a.file && !stored.current.has(a.id)) {
              await request("files/" + a.id, a.file, true);
              stored.current.add(a.id);
            }
            const { file, url, ...meta } = a;
            attachments.push({ ...meta, stored: stored.current.has(a.id) });
          }
          const result = await request("save", {
            revision: revision.current,
            state: { ...snapshot, schemaVersion: 1, attachments },
          });
          revision.current = result.revision;
        } catch (e) {
          pending.current = pending.current || snapshot;
          setSaved("保存失败：" + e.message);
          throw e;
        }
      }
      setSaved("已保存");
    })();
    running.current = operation;
    try {
      await operation;
    } finally {
      running.current = null;
    }
  }
  const changed = useCallback((snapshot) => {
    pending.current = snapshot;
    setSaved("待保存");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!pending.current) return;
      setSaved("正在保存");
      flush().catch(() => {});
    }, 450);
  }, []);
  useEffect(() => {
    const leave = (e) => {
      if (pending.current || running.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, []);
  async function lock() {
    setBusy(true);
    setError("");
    try {
      await flush();
      await request("lock", {});
      workspaceId = "";
      setLoaded(null);
      await boot();
    } catch (e) {
      setSaved("锁定失败：" + e.message);
    } finally {
      setBusy(false);
    }
  }
  async function backup() {
    setBusy(true);
    try {
      await flush();
      const response = await request("backup", undefined, true);
      downloadBlob(
        await response.blob(),
        loaded.workspace.name + "-加密备份.zip",
      );
      setSaved("已导出加密备份");
    } catch (e) {
      setSaved("备份失败：" + e.message);
    } finally {
      setBusy(false);
    }
  }
  if (demo)
    return (
      <>
        <App />
        <div className="local-controls">
          <span>演示数据不保存</span>
          <Button
            onClick={() => {
              setDemo(false);
              boot();
            }}
          >
            返回账套
          </Button>
        </div>
      </>
    );
  if (recovery)
    return (
      <main className="workspace-gate">
        <form
          className="gate-card"
          onSubmit={(e) => {
            e.preventDefault();
            if (confirmed) setRecovery("");
          }}
        >
          <img src="/assets/workbench-icon.svg" alt="工作台" />
          <h1>保存恢复密钥</h1>
          <pre className="recovery-key">{recovery}</pre>
          <Button
            type="button"
            onClick={() =>
              downloadBlob(
                new Blob(
                  [
                    `用户：${loaded.workspace.name}\n恢复密钥：${recovery}\n请与本地数据分开保管。\n`,
                  ],
                  { type: "text/plain;charset=utf-8" },
                ),
                "用户恢复密钥.txt",
              )
            }
          >
            下载恢复密钥
          </Button>
          <label className="gate-check">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            我已另行保存恢复密钥
          </label>
          <Button primary disabled={!confirmed}>
            进入工作台
          </Button>
        </form>
      </main>
    );
  if (loaded)
    return (
      <App
        key={loaded.workspace.id}
        initialData={loaded.state}
        onDataChange={changed}
        workspaceControls={
          <div className="workspace-controls">
            <span>{loaded.workspace.name}</span>
            <span
              role="status"
              className={saved.includes("失败") ? "save-error" : ""}
            >
              {saved}
            </span>
            {saved.includes("失败") && (
              <Button onClick={() => flush().catch(() => {})}>重试保存</Button>
            )}
            <Button disabled={busy} onClick={backup}>
              加密备份
            </Button>
            <Button disabled={busy} onClick={lock}>
              退出登录
            </Button>
          </div>
        }
      />
    );
  return (
    <main className="workspace-gate">
      <form className="gate-card" onSubmit={submit}>
        <img src="/assets/workbench-icon.svg" alt="工作台" />
        <h1>辅导员工作台</h1>
        {service === null ? (
          <p>正在连接本地服务…</p>
        ) : service.unavailable ? (
          <>
            <p role="alert">未连接本地服务</p>
            <Button type="button" onClick={() => setDemo(true)}>
              演示体验
            </Button>
          </>
        ) : (
          <>
            {mode !== "login" && (
              <h2>{mode === "register" ? "创建用户" : "重设密码"}</h2>
            )}
            <label>
              用户名
              <input
                name="username"
                aria-label="用户名"
                required
                maxLength={mode === "register" ? 40 : 80}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
              />
            </label>
            {mode === "recover" && (
              <label>
                恢复密钥
                <input
                  name="recovery"
                  aria-label="恢复密钥"
                  required
                  autoComplete="off"
                />
              </label>
            )}
            <label>
              {mode === "login" ? "密码" : "设置密码"}
              <input
                name="password"
                aria-label={mode === "login" ? "密码" : "设置密码"}
                type="password"
                required
                minLength={mode === "login" ? 1 : 10}
                maxLength={256}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
            </label>
            {mode !== "login" && (
              <label>
                确认密码
                <input
                  name="confirm"
                  aria-label="确认密码"
                  type="password"
                  required
                  minLength={10}
                  maxLength={256}
                  autoComplete="new-password"
                />
              </label>
            )}
            {error && (
              <p className="save-error" role="alert">
                {error}
              </p>
            )}
            <Button primary disabled={busy}>
              {busy
                ? "正在处理…"
                : mode === "login"
                  ? "登录"
                  : mode === "register"
                    ? "注册并登录"
                    : "重设密码并登录"}
            </Button>
            <div className="login-actions">
              {mode === "login" ? (
                <>
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setMode("register");
                      setError("");
                    }}
                  >
                    创建用户
                  </Button>
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setMode("recover");
                      setError("");
                    }}
                  >
                    忘记密码
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                >
                  返回登录
                </Button>
              )}
            </div>
            <Button
              type="button"
              className="demo-entry"
              disabled={busy}
              onClick={() => setDemo(true)}
            >
              演示体验
            </Button>
          </>
        )}
      </form>
    </main>
  );
}
