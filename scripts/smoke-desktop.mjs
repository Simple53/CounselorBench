import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const project = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const root = path.join(project, "output", "vault-tests");
await mkdir(root, { recursive: true });
const temporary = await mkdtemp(path.join(root, "desktop-"));
const require = createRequire(import.meta.url),
  electron = require("electron"),
  env = { ...process.env, SC_DATA_DIR: temporary, COUNSELORBENCH_SMOKE: "1" };
delete env.ELECTRON_RUN_AS_NODE;
let output = "";
try {
  const child = spawn(electron, [project], {
    cwd: project,
    env,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (b) => {
    output += b;
    process.stdout.write(b);
  });
  child.stderr.on("data", (b) => process.stderr.write(b));
  const timer = setTimeout(() => child.kill(), 60000);
  const code = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", resolve);
  });
  clearTimeout(timer);
  if (code !== 0 || !output.includes("COUNSELORBENCH_SMOKE_OK"))
    throw Error("桌面启动检查失败：" + code);
} finally {
  if (!temporary.startsWith(root + path.sep)) throw Error("无效测试目录");
  await rm(temporary, { recursive: true, force: true });
}
