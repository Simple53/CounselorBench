import http from "node:http";
import { randomBytes } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { VaultStore, checkId } from "./vault.mjs";
import { findAccount, registerAccount } from "./accounts.mjs";
const project = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export async function startLocal({
  port = 4173,
  root = process.env.SC_DATA_DIR ||
    (process.platform === "win32"
      ? path.join(
          process.env.LOCALAPPDATA || path.join(homedir(), "AppData", "Local"),
          "SmartCounselor",
          "workspaces",
        )
      : process.platform === "darwin"
        ? path.join(
            homedir(),
            "Library",
            "Application Support",
            "SmartCounselor",
            "workspaces",
          )
        : path.join(
            process.env.XDG_DATA_HOME ||
              path.join(homedir(), ".local", "share"),
            "SmartCounselor",
            "workspaces",
          )),
  dev = false,
} = {}) {
  const store = new VaultStore(root),
    sessions = new Map(),
    csrf = randomBytes(32).toString("hex");
  let vite;
  function json(res, value, status = 200) {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(value));
  }
  async function body(req, max) {
    let size = 0,
      chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > max) {
        const e = Error("文件或数据超出本次上传限制");
        e.status = 413;
        throw e;
      }
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("X-Frame-Options", "DENY");
    try {
      const origin = `http://127.0.0.1:${server.address().port}`;
      if (
        req.headers.host !== `127.0.0.1:${server.address().port}` ||
        (req.headers.origin && req.headers.origin !== origin) ||
        req.headers["sec-fetch-site"] === "cross-site"
      )
        return json(res, { error: "仅允许本机同源访问" }, 403);
      const url = new URL(req.url, origin);
      if (url.pathname.startsWith("/api/")) {
        res.setHeader("Cache-Control", "no-store");
        if (req.method === "GET" && url.pathname === "/api/status")
          return json(res, {
            csrf,
            hasAccounts: (await store.list()).length > 0,
            storageRoot: store.root,
            connected: true,
          });
        const cookie = /sc_session=([a-f0-9]{64})(?:;|$)/.exec(
            req.headers.cookie || "",
          )?.[1],
          session = sessions.get(cookie);
        const isFile =
          req.method === "GET" &&
          (url.pathname.startsWith("/api/files/") ||
            url.pathname.startsWith("/api/path-file/"));
        if (!isFile && req.headers["x-sc-csrf"] !== csrf)
          return json(res, { error: "请求校验失效，请刷新页面" }, 403);
        if (req.method === "POST" && url.pathname === "/api/restore") {
          const bytes = await body(req, 200 * 1024 * 1024);
          const restored = await store.importBackup(bytes);
          return json(res, { workspace: restored });
        }
        const payload =
          req.method === "POST" && !url.pathname.startsWith("/api/files/")
            ? JSON.parse((await body(req, 8 * 1024 * 1024)).toString() || "{}")
            : {};
        if (req.method === "POST" && url.pathname === "/api/ai/chat") {
          let target;
          try {
            target = new URL(String(payload.endpoint || ""));
          } catch {
            return json(res, { error: "API 地址格式无效" }, 400);
          }
          if (!["http:", "https:"].includes(target.protocol))
            return json(res, { error: "API 地址必须使用 HTTP 或 HTTPS" }, 400);
          if (
            target.protocol === "http:" &&
            !["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)
          )
            return json(res, { error: "远程 API 请使用 HTTPS" }, 400);
          if (
            ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) &&
            target.port === String(server.address().port)
          )
            return json(res, { error: "API 地址不能指向工作台自身端口" }, 400);
          target.pathname = target.pathname.replace(/\/$/, "");
          if (!target.pathname.endsWith("/chat/completions"))
            target.pathname += "/chat/completions";
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 90000);
          try {
            const upstream = await fetch(target, {
              method: "POST",
              signal: controller.signal,
              headers: {
                "Content-Type": "application/json",
                ...(payload.key
                  ? { Authorization: `Bearer ${payload.key}` }
                  : {}),
              },
              body: JSON.stringify({
                model: payload.model,
                messages: payload.messages,
                stream: false,
              }),
            });
            if (!upstream.ok)
              return json(
                res,
                { error: `模型请求失败（HTTP ${upstream.status}）` },
                upstream.status,
              );
            return json(res, await upstream.json());
          } catch (err) {
            return json(
              res,
              {
                error:
                  err.name === "AbortError"
                    ? "模型请求超时"
                    : "连接本地或远程模型服务失败，请确认模型服务已启动",
              },
              502,
            );
          } finally {
            clearTimeout(timer);
          }
        }
        const login = (vault) => {
          if (session) {
            session.key.fill(0);
            sessions.delete(cookie);
          }
          const token = randomBytes(32).toString("hex");
          sessions.set(token, vault);
          res.setHeader(
            "Set-Cookie",
            `sc_session=${token}; HttpOnly; SameSite=Strict; Path=/`,
          );
        };
        if (
          req.method === "POST" &&
          ["/api/register", "/api/create"].includes(url.pathname)
        ) {
          const { vault, recovery } = await registerAccount(
            store,
            payload.username ?? payload.name,
            payload.password,
          );
          login(vault);
          return json(res, {
            workspace: { id: vault.id, name: vault.name },
            recovery,
            ...(await store.load(vault)),
          });
        }
        if (
          req.method === "POST" &&
          ["/api/login", "/api/unlock"].includes(url.pathname)
        ) {
          let vault;
          try {
            const id =
              url.pathname === "/api/login"
                ? (await findAccount(store, payload.username)).id
                : payload.id;
            vault = await store.unlock(id, payload.password);
          } catch {
            return json(res, { error: "用户名或密码错误" }, 401);
          }
          login(vault);
          return json(res, {
            workspace: { id: vault.id, name: vault.name },
            ...(await store.load(vault)),
          });
        }
        if (
          req.method === "POST" &&
          ["/api/password-reset", "/api/recover"].includes(url.pathname)
        ) {
          let id = payload.id;
          if (url.pathname === "/api/password-reset") {
            try {
              id = (await findAccount(store, payload.username)).id;
            } catch {
              return json(res, { error: "用户名或恢复密钥错误" }, 400);
            }
          }
          const vault = await store.recover(
            id,
            payload.recovery,
            payload.password,
          );
          for (const [key, v] of sessions)
            if (v.id === vault.id) {
              v.key.fill(0);
              sessions.delete(key);
            }
          login(vault);
          return json(res, {
            workspace: { id: vault.id, name: vault.name },
            ...(await store.load(vault)),
          });
        }
        if (!session)
          return json(res, { error: "当前用户已退出，请重新登录" }, 401);
        const scope =
          req.headers["x-sc-workspace"] || url.searchParams.get("workspace");
        if ((url.pathname !== "/api/load" || scope) && scope !== session.id)
          return json(
            res,
            { error: "另一页面已切换用户，请重新登录后编辑" },
            409,
          );
        if (req.method === "POST" && url.pathname === "/api/lock") {
          session.key.fill(0);
          sessions.delete(cookie);
          res.setHeader(
            "Set-Cookie",
            "sc_session=; Max-Age=0; HttpOnly; SameSite=Strict; Path=/",
          );
          return json(res, { locked: true });
        }
        if (req.method === "GET" && url.pathname === "/api/load")
          return json(res, {
            workspace: { id: session.id, name: session.name },
            ...(await store.load(session)),
          });
        if (req.method === "POST" && url.pathname === "/api/save")
          return json(res, {
            revision: await store.save(
              session,
              payload.state,
              payload.revision,
            ),
          });
        if (req.method === "GET" && url.pathname === "/api/backup") {
          const bytes = await store.backup(session);
          res.writeHead(200, {
            "Content-Type": "application/zip",
            "Content-Disposition":
              'attachment; filename="workspace-encrypted.zip"',
          });
          return res.end(bytes);
        }
        if (url.pathname.startsWith("/api/files/")) {
          const id = checkId(url.pathname.slice("/api/files/".length));
          if (req.method === "POST") {
            await store.putFile(
              session,
              id,
              await body(req, 100 * 1024 * 1024),
            );
            return json(res, { stored: true });
          }
          if (req.method === "GET") {
            const { state } = await store.load(session),
              a = state.attachments.find((a) => a.id === id && a.stored);
            if (!a) return json(res, { error: "附件未关联到当前账套" }, 404);
            const bytes = await store.file(session, id);
            res.writeHead(200, {
              "Content-Type": /^image\/(png|jpeg|gif|webp|avif|bmp)$/.test(
                a.type,
              )
                ? a.type
                : "application/octet-stream",
              "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(a.name)}`,
            });
            return res.end(bytes);
          }
        }
        if (
          req.method === "GET" &&
          url.pathname.startsWith("/api/path-file/")
        ) {
          const id = decodeURIComponent(
            url.pathname.slice("/api/path-file/".length),
          );
          const { state } = await store.load(session),
            a = state.attachments.find((x) => x.id === id && x.path);
          if (!a) return json(res, { error: "未找到登记路径附件" }, 404);
          const rootDir = state.prefs?.attachmentRoot || project;
          const target = path.isAbsolute(a.path)
            ? path.normalize(a.path)
            : path.resolve(rootDir, a.path);
          const bytes = await readFile(target);
          const ext = path.extname(a.name || target).toLowerCase();
          const mime =
            {
              ".png": "image/png",
              ".jpg": "image/jpeg",
              ".jpeg": "image/jpeg",
              ".gif": "image/gif",
              ".webp": "image/webp",
              ".pdf": "application/pdf",
            }[ext] || "application/octet-stream";
          res.writeHead(200, {
            "Content-Type": mime,
            "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(a.name || path.basename(target))}`,
          });
          return res.end(bytes);
        }
        return json(res, { error: "接口不存在" }, 404);
      }
      if (vite) return vite.middlewares(req, res);
      const base = path.join(project, "dist", "client"),
        candidate = path.resolve(base, "." + decodeURIComponent(url.pathname));
      if (candidate !== base && !candidate.startsWith(base + path.sep))
        return json(res, { error: "无效路径" }, 403);
      let file = candidate;
      try {
        if (!(await stat(file)).isFile()) file = path.join(base, "index.html");
      } catch {
        file = path.join(base, "index.html");
      }
      const bytes = await readFile(file);
      res.writeHead(200, {
        "Cache-Control": "no-cache",
        "Content-Type":
          {
            ".html": "text/html; charset=utf-8",
            ".js": "text/javascript",
            ".css": "text/css",
            ".svg": "image/svg+xml",
            ".png": "image/png",
            ".json": "application/json",
          }[path.extname(file)] || "application/octet-stream",
      });
      res.end(bytes);
    } catch (e) {
      const status = e.status || (e.code === "ENOENT" ? 404 : 400);
      json(
        res,
        { error: e.code === "ENOENT" ? "文件不存在或已被移动" : e.message },
        status,
      );
    }
  });
  if (dev) {
    const { createServer } = await import("vite");
    vite = await createServer({
      root: project,
      server: { middlewareMode: true, host: "127.0.0.1", hmr: { server } },
      appType: "spa",
    });
  }
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  server.on("close", () => {
    for (const v of sessions.values()) v.key.fill(0);
    sessions.clear();
    vite?.close();
  });
  console.log(
    `辅智通 · 高校辅导员智慧管理系统 http://127.0.0.1:${server.address().port}/\n本地数据目录：${store.root}`,
  );
  return {
    server,
    store,
    close: async () => {
      await vite?.close();
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await startLocal({ dev: process.argv.includes("--dev") });
