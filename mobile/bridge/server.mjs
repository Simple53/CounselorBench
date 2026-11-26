import http from "node:http";
import { timingSafeEqual, randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createNnuAdapter, nnuEntry } from "./nnu.mjs";

const token =
  process.env.SC_SCHOOL_BRIDGE_TOKEN || randomBytes(32).toString("hex");
if (!token || token.length < 24)
  throw Error(
    "请设置至少24字符的SC_SCHOOL_BRIDGE_TOKEN；不会生成或保存默认令牌",
  );
const port = Number(process.env.SC_SCHOOL_BRIDGE_PORT || 4175),
  allowedOrigins = new Set([
    "http://127.0.0.1:4173",
    "http://127.0.0.1:4176",
    "http://127.0.0.1:4178",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "https://simple53.github.io",
    ...(process.env.SC_SCHOOL_UI_ORIGIN
      ? process.env.SC_SCHOOL_UI_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean)
      : []),
  ]);
let context,
  page,
  opening = false;
const adapter = createNnuAdapter(() => page);
function parseProxy(proxyUrl) {
  const raw = String(proxyUrl || "").trim();
  if (!raw) return undefined;
  let u;
  try {
    u = new URL(raw);
  } catch {
    throw Error("校园网代理地址格式不正确，例如 http://127.0.0.1:1080");
  }
  if (!["http:", "https:", "socks5:"].includes(u.protocol))
    throw Error("校园网代理仅支持 http://、https:// 或 socks5://");
  return { server: u.origin };
}
function authenticated(req) {
  const supplied = Buffer.from(
      (req.headers.authorization || "").replace(/^Bearer /, ""),
    ),
    expected = Buffer.from(token);
  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  );
}
async function body(req) {
  let text = "";
  for await (const chunk of req) {
    text += chunk;
    if (Buffer.byteLength(text) > 16384) throw Error("请求过大");
  }
  return JSON.parse(text || "{}");
}
const server = http.createServer(async (req, res) => {
  const send = (value, status = 200) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(JSON.stringify(value));
  };
  if (req.headers.host !== `127.0.0.1:${port}`)
    return send({ error: "仅允许本机连接器地址" }, 403);
  const reqOrigin = req.headers.origin;
  if (reqOrigin && !allowedOrigins.has(reqOrigin))
    return send({ error: "来源不允许" }, 403);
  if (reqOrigin) {
    res.setHeader("Access-Control-Allow-Origin", reqOrigin);
    res.setHeader("Access-Control-Allow-Private-Network", "true");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Private-Network": "true",
      "Access-Control-Max-Age": "600",
    });
    return res.end();
  }
  if (
    req.method === "GET" &&
    req.url === "/bootstrap" &&
    (!reqOrigin || allowedOrigins.has(reqOrigin))
  )
    return send({ token });
  if (!authenticated(req)) return send({ error: "连接令牌无效" }, 401);
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (req.method === "POST" && url.pathname === "/session/open") {
      const login = await body(req);
      if (opening) return send({ error: "会话正在建立" }, 409);
      opening = true;
      try {
        if (!context) {
          const { chromium } = await import("playwright");
          const cdpUrl = String(login.cdpUrl || "").trim();
          if (cdpUrl) {
            const browser = await chromium.connectOverCDP(cdpUrl);
            context = browser.contexts()[0];
            if (!context) throw Error("外部浏览器未找到可用上下文");
            const existing = context.pages().find((p) => {
              try {
                return new URL(p.url()).hostname.endsWith("nnu.edu.cn");
              } catch {
                return false;
              }
            });
            page = existing || context.pages()[0] || (await context.newPage());
            if (!page.url().includes("lwNjnuStuLeaveManagement")) {
              await page.goto(nnuEntry, { waitUntil: "domcontentloaded", timeout: 25000 }).catch(() => {});
            }
          } else {
            const proxy = parseProxy(login.proxyUrl);
            context = await chromium.launchPersistentContext(
              path.resolve(
                path.dirname(fileURLToPath(import.meta.url)),
                "../../.local-data/school-browser",
              ),
              {
                channel: process.env.SC_SCHOOL_BROWSER || "msedge",
                headless: false,
                ...(proxy ? { proxy } : {}),
              },
            );
            context.on("close", () => {
              context = null;
              page = null;
            });
            page = context.pages()[0] || (await context.newPage());
            const response = await page.goto(nnuEntry, {
              waitUntil: "domcontentloaded",
              timeout: 25000,
            });
            if (response && response.status() >= 400)
              throw Error(
                `学校入口返回HTTP ${response.status()}，请先核实校方访问条件`,
              );
          }
        }
        // 查找已跳转到校方请假页的活动标签页
        const pages = context.pages();
        const activeNnu = pages.find((p) => {
          try {
            return new URL(p.url()).hostname.endsWith("nnu.edu.cn");
          } catch {
            return false;
          }
        });
        if (activeNnu) page = activeNnu;
        const curHost = (() => {
          try {
            return new URL(page.url()).hostname;
          } catch {
            return "";
          }
        })();
        if (curHost && !curHost.endsWith("nnu.edu.cn") && curHost !== "blank") {
          await page.goto(nnuEntry, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
        }
        const refreshedHost = (() => {
          try {
            return new URL(page.url()).hostname;
          } catch {
            return "";
          }
        })();
        if (
          refreshedHost === "authserver.nnu.edu.cn" &&
          login.username &&
          login.password
        ) {
          const user = page.locator('input[placeholder="请输入学号/工号"]'),
            pass = page.locator('input[placeholder="请输入密码"]');
          if ((await user.count()) && (await pass.count())) {
            await user.fill(String(login.username));
            await pass.fill(String(login.password));
            await page.locator('a:text-is("登录")').click();
            await page
              .waitForURL((u) => u.hostname !== "authserver.nnu.edu.cn", {
                timeout: 20000,
              })
              .catch(() => {});
          }
        }
        const manualLoginRequired = (() => {
          try {
            return new URL(page.url()).hostname === "authserver.nnu.edu.cn";
          } catch {
            return false;
          }
        })();
        if (manualLoginRequired && typeof page.bringToFront === "function") {
          await page.bringToFront().catch(() => {});
        }
        return send({ opened: true, manualLoginRequired });
      } finally {
        opening = false;
      }
    }
    if (req.method === "POST" && url.pathname === "/import") {
      const data = await body(req);
      const rows = Array.isArray(data.records) ? data.records : [];
      adapter.setImported(rows);
      return send({ imported: rows.length });
    }
    if (req.method === "GET" && url.pathname === "/leaves")
      return send(await adapter.list());
    const detail = /^\/leaves\/([^/]+)$/.exec(url.pathname);
    if (req.method === "GET" && detail)
      return send(await adapter.detail(decodeURIComponent(detail[1])));
    const action = /^\/leaves\/([^/]+)\/actions$/.exec(url.pathname);
    if (req.method === "POST" && action) {
      if (!req.headers["content-type"]?.startsWith("application/json"))
        return send({ error: "需要JSON请求" }, 415);
      const data = await body(req);
      return send(
        await adapter.act(
          decodeURIComponent(action[1]),
          data.action,
          data.comment,
        ),
      );
    }
    const att = /^\/leaves\/([^/]+)\/attachments\/([^/]+)$/.exec(url.pathname);
    if (req.method === "GET" && att) {
      const file = await adapter.attachment(
        decodeURIComponent(att[1]),
        decodeURIComponent(att[2]),
      );
      res.writeHead(200, {
        "Content-Type": file.mime,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      });
      return res.end(file.bytes);
    }
    return send({ error: "接口不存在" }, 404);
  } catch (e) {
    return send({ error: e.message }, 502);
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log(
    `学校连接器已启动：http://127.0.0.1:${port}（不会自动登录、同步或提交审核）`,
  ),
);
async function stop() {
  await context?.close();
  server.close();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
