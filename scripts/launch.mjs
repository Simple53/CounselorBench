import { existsSync, statSync, readdirSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { startLocal } from "../server/local.mjs";
const project = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const origin = "http://127.0.0.1:4173";
const show = () => {
  if (process.platform === "win32")
    spawn("explorer.exe", [origin], {
      windowsHide: true,
      stdio: "ignore",
    }).unref();
};
let running = false;
try {
  const response = await fetch(origin + "/api/status", {
    signal: AbortSignal.timeout(1500),
  });
  running = response.ok && (await response.json()).connected === true;
} catch {}
if (running) {
  console.log("工作台已运行：" + origin);
  show();
} else {
  const built = path.join(project, "dist/client/index.html");
  function newest(dir) {
    return Math.max(
      ...readdirSync(dir, { withFileTypes: true }).map((e) =>
        e.isDirectory()
          ? newest(path.join(dir, e.name))
          : statSync(path.join(dir, e.name)).mtimeMs,
      ),
      0,
    );
  }
  const changed =
    !existsSync(built) ||
    Math.max(
      newest(path.join(project, "src")),
      newest(path.join(project, "public")),
      statSync(path.join(project, "index.html")).mtimeMs,
    ) > statSync(built).mtimeMs;
  if (changed) {
    console.log("正在构建本地界面…");
    const result = spawnSync(
      process.execPath,
      [path.join(project, "node_modules/vite/bin/vite.js"), "build"],
      { cwd: project, stdio: "inherit", windowsHide: true },
    );
    if (result.status !== 0) process.exit(result.status || 1);
  }
  try {
    await startLocal();
    show();
  } catch (e) {
    console.error(
      e.code === "EADDRINUSE"
        ? "4173端口被其他程序占用，请关闭旧预览后重试。"
        : e.message,
    );
    process.exitCode = 1;
  }
}
