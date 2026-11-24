import React, { useCallback, useEffect, useRef, useState } from "react";
import { App } from "./App.jsx";
import { Button } from "./ui.jsx";
import { downloadBlob } from "./files.js";
import {
  saveRememberedAuth,
  loadRememberedAuth,
  clearRememberedAuth,
  loadWebWorkspace,
  saveWebWorkspace,
  clearWebWorkspace,
  WEB_AUTO_ENTER_KEY,
} from "./remember-auth.mjs";

const iconUrl = `${import.meta.env.BASE_URL}assets/workbench-icon.svg`;

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
          : a.path
            ? {
                ...a,
                url:
                  "/api/path-file/" +
                  encodeURIComponent(a.id) +
                  "?workspace=" +
                  result.workspace.id,
                file: {
                  name: a.name,
                  size: a.size,
                  type: a.type,
                  arrayBuffer: async () => {
                    const r = await request(
                      "path-file/" + encodeURIComponent(a.id),
                      undefined,
                      true,
                    );
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
    [demo, setDemo] = useState(
      () => new URLSearchParams(location.search).get("preview") === "demo",
    ),
    [webData, setWebData] = useState(() => loadWebWorkspace()),
    [webResetSeq, setWebResetSeq] = useState(0),
    [mode, setMode] = useState("login"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [recovery, setRecovery] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [saved, setSaved] = useState("已保存"),
    [notice, setNotice] = useState(""),
    [loginName, setLoginName] = useState("");
  const pending = useRef(null),
    bootSequence = useRef(0),
    running = useRef(null),
    timer = useRef(null),
    webTimer = useRef(null),
    revision = useRef(0),
    stored = useRef(new Set());

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

  const boot = useCallback(async () => {
    const sequence = ++bootSequence.current;
    try {
      const r = await fetch("/api/status");
      if (!r.ok) throw Error();
      const data = await r.json();
      if (sequence !== bootSequence.current) return;
      if (!data.connected) throw Error();
      csrf = data.csrf;
      if (typeof window !== "undefined") window.__SC_CSRF = data.csrf;
      setService(data);
      setMode("login");
      try {
        const result = await request("load");
        if (sequence !== bootSequence.current) return;
        activate(result);
        return;
      } catch {}
      // 若服务重启导致会话过期，尝试使用本机加密记住的密码免密重新解锁
      const remembered = await loadRememberedAuth();
      if (sequence !== bootSequence.current) return;
      if (remembered?.username && remembered?.password) {
        setLoginName(remembered.username);
        try {
          const result = await request("login", {
            username: remembered.username,
            password: remembered.password,
          });
          if (sequence !== bootSequence.current) return;
          activate(result);
        } catch {
          clearRememberedAuth();
        }
      }
    } catch {
      if (sequence !== bootSequence.current) return;
      setService({ unavailable: true });
      // 纯静态网页预览版（如 GitHub Pages）免反复拦截，默认自动进入并持久保存浏览器本地进度
      try {
        if (localStorage.getItem(WEB_AUTO_ENTER_KEY) !== "0") {
          setWebData(loadWebWorkspace());
          setDemo(true);
        }
      } catch {
        setDemo(true);
      }
    }
  }, []);

  useEffect(() => {
    boot();
    return () => {
      bootSequence.current++;
      clearTimeout(timer.current);
      clearTimeout(webTimer.current);
    };
  }, [boot]);

  async function submit(e) {
    e.preventDefault();
    bootSequence.current++;
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form);
    const remember = form.get("remember") === "on";
    try {
      if (mode !== "login" && data.password !== data.confirm)
        throw Error("两次密码不一致");
      const result = await request(
        mode === "recover" ? "password-reset" : mode,
        data,
      );
      if (remember && data.username && data.password) {
        await saveRememberedAuth({
          username: String(data.username),
          password: String(data.password),
        });
      } else {
        clearRememberedAuth();
      }
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
            if (a.file instanceof Blob && !stored.current.has(a.id)) {
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

  const webChanged = useCallback((snapshot) => {
    clearTimeout(webTimer.current);
    webTimer.current = setTimeout(() => {
      saveWebWorkspace(snapshot);
    }, 350);
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
      clearRememberedAuth();
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

  async function restoreBackup(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await request("restore", file, true);
      const data = await response.json();
      setMode("login");
      setLoginName(data.workspace.name || "");
      setNotice(
        `已导入备份账套「${data.workspace.name}」，请输入密码解锁登录`,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (demo)
    return (
      <App
        key={`web-preview-${webResetSeq}`}
        initialData={webData}
        onDataChange={webChanged}
        onAccountLock={() => {
          try {
            localStorage.setItem(WEB_AUTO_ENTER_KEY, "0");
          } catch {}
          setDemo(false);
        }}
        workspaceControls={
          <div className="workspace-controls">
            <span className="demo-tag">网页预览 · 本地已自动保存</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                clearWebWorkspace();
                setWebData(null);
                setWebResetSeq((n) => n + 1);
              }}
            >
              重置示例
            </Button>
            {!service?.unavailable && (
              <Button
                size="sm"
                onClick={() => {
                  setDemo(false);
                  boot();
                }}
              >
                返回账套
              </Button>
            )}
          </div>
        }
      />
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
          <img src={iconUrl} alt="辅智通" />
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
        currentWorkspace={loaded.workspace}
        onDataChange={changed}
        onAccountLock={lock}
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
              <Button size="sm" onClick={() => flush().catch(() => {})}>
                重试保存
              </Button>
            )}
            <Button size="sm" disabled={busy} onClick={backup}>
              加密备份
            </Button>
            <Button size="sm" disabled={busy} onClick={lock}>
              退出登录
            </Button>
          </div>
        }
      />
    );

  return (
    <main className="workspace-gate">
      <form className="gate-card" onSubmit={submit}>
        <img src={iconUrl} alt="辅智通" />
        <h1>辅智通 · 高校辅导员智慧管理系统</h1>
        {service === null ? (
          <p>正在连接本地服务…</p>
        ) : service.unavailable ? (
          <>
            <p className="chip chip--accent">Web 独立免后台测试模式已就绪</p>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>
              未检测到本地 Node.js 服务。点击进入后数据将自动保存在浏览器本地。
            </p>
            <Button
              primary
              type="button"
              onClick={() => {
                try {
                  localStorage.setItem(WEB_AUTO_ENTER_KEY, "1");
                } catch {}
                setWebData(loadWebWorkspace());
                setDemo(true);
              }}
            >
              进入工作台
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
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
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
            <label className="gate-check">
              <input type="checkbox" name="remember" defaultChecked />
              记住密码，下次直接进入工作台
            </label>
            {notice && <p role="status">{notice}</p>}
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
                    variant="tertiary"
                    size="sm"
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
                    variant="tertiary"
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                      setMode("recover");
                      setError("");
                    }}
                  >
                    忘记密码
                  </Button>
                  <label className="file-button">
                    导入备份恢复
                    <input
                      type="file"
                      aria-label="导入备份恢复"
                      accept=".zip,application/zip"
                      disabled={busy}
                      onChange={restoreBackup}
                    />
                  </label>
                </>
              ) : (
                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
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
              variant="ghost"
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
