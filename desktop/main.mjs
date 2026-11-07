import { app, BrowserWindow, Menu, dialog, session, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startLocal } from "../server/local.mjs";
const project = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const smoke = process.env.COUNSELORBENCH_SMOKE === "1";
let service,
  window,
  closing = false;
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (window?.isMinimized()) window.restore();
    window?.focus();
  });
  app
    .whenReady()
    .then(async () => {
      service = await startLocal({ port: 0 });
      const origin = `http://127.0.0.1:${service.server.address().port}`;
      session.defaultSession.setPermissionRequestHandler(
        (_contents, _permission, callback) => callback(false),
      );
      session.defaultSession.webRequest.onHeadersReceived((details, callback) =>
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            "Content-Security-Policy": [
              "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self' http: https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
            ],
          },
        }),
      );
      Menu.setApplicationMenu(
        process.platform === "darwin"
          ? Menu.buildFromTemplate([{ role: "appMenu" }, { role: "editMenu" }])
          : null,
      );
      window = new BrowserWindow({
        width: 1440,
        height: 960,
        minWidth: 1100,
        minHeight: 720,
        show: !smoke,
        title: "辅导员工作台",
        icon: path.join(project, "build", "icon.png"),
        backgroundColor: "#ffffff",
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          webSecurity: true,
          webviewTag: false,
          spellcheck: false,
        },
      });
      window.webContents.setWindowOpenHandler(({ url }) => {
        try {
          const target = new URL(url);
          if (
            target.origin === origin &&
            (target.pathname.startsWith("/api/files/") ||
              target.protocol === "blob:")
          )
            window.webContents.downloadURL(url);
          else if (
            ["https:", "http:"].includes(target.protocol) &&
            target.origin !== origin
          )
            shell.openExternal(url);
        } catch {}
        return { action: "deny" };
      });
      window.webContents.on("will-navigate", (event, url) => {
        try {
          const target = new URL(url);
          if (target.origin !== origin || target.pathname !== "/")
            event.preventDefault();
        } catch {
          event.preventDefault();
        }
      });
      window.webContents.on("will-prevent-unload", (event) => {
        const choice = dialog.showMessageBoxSync(window, {
          type: "warning",
          buttons: ["返回保存", "仍然退出"],
          defaultId: 0,
          cancelId: 0,
          title: "尚未保存",
          message: "本地修改尚未保存，是否退出？",
        });
        if (choice === 1) event.preventDefault();
      });
      await window.loadURL(origin);
      if (smoke) {
        let result;
        for (let i = 0; i < 60; i++) {
          result = await window.webContents.executeJavaScript(
            `({login:!!document.querySelector('input[name=username]'),node:typeof require,process:typeof process,width:innerWidth})`,
          );
          if (result.login) break;
          await new Promise((r) => setTimeout(r, 200));
        }
        if (
          !result.login ||
          result.node !== "undefined" ||
          result.process !== "undefined"
        )
          throw Error("桌面登录或渲染隔离检查失败");
        console.log("COUNSELORBENCH_SMOKE_OK " + JSON.stringify(result));
        app.quit();
      }
    })
    .catch((error) => {
      console.error(error);
      if (!smoke) dialog.showErrorBox("工作台启动失败", error.message);
      app.exit(1);
    });
  app.on("window-all-closed", () => app.quit());
  app.on("before-quit", (event) => {
    if (service && !closing) {
      event.preventDefault();
      closing = true;
      service.close().finally(() => app.quit());
    }
  });
}
