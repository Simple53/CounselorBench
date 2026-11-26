import React, { useEffect, useState } from "react";
import IconX from "@tabler/icons-react/dist/esm/icons/IconX.mjs";
import { Button, Chip } from "./ui.jsx";
import { defaultWidgets } from "./Home.jsx";
import { modelPresets } from "./model-presets.mjs";
import { fields } from "./model.mjs";
import { schoolPresets, nnuLeaveReviewUrl } from "./school-client.mjs";

function askNotifyPermission() {
  if (typeof Notification !== "undefined" && Notification.permission === "default")
    Notification.requestPermission();
}

const settingsTabs = [
  "外观设置",
  "学校接入",
  "字段配置",
  "板块管理",
  "附件管理",
  "备份导出",
  "模型配置",
];

export function SettingsDrawer({
  open,
  tab,
  setTab,
  onClose,
  prefs,
  patchPrefs,
  allModules,
  page,
  navigate,
  notify,
  initialData,
  studentRows,
  requestExport,
  openAttachmentsModal,
  model,
  setModel,
  schoolCreds,
  onSaveSchoolCreds,
  onSyncSchool,
  schoolMeta,
}) {
  const [newModuleName, setNewModuleName] = useState("");
  const [schoolUser, setSchoolUser] = useState(schoolCreds?.username || "");
  const [schoolPass, setSchoolPass] = useState(schoolCreds?.password || "");
  const [schoolBaseUrl, setSchoolBaseUrl] = useState(
    schoolCreds?.baseUrl || schoolPresets.nnu.baseUrl,
  );
  const [schoolToken, setSchoolToken] = useState(schoolCreds?.token || "");
  const [schoolProxyUrl, setSchoolProxyUrl] = useState(schoolCreds?.proxyUrl || "");
  const [schoolCdpUrl, setSchoolCdpUrl] = useState(schoolCreds?.cdpUrl || "");
  const [schoolAutoSync, setSchoolAutoSync] = useState(
    schoolCreds?.autoSync !== false,
  );
  const [rememberSchool, setRememberSchool] = useState(true);

  useEffect(() => {
    if (!schoolCreds) return;
    if (schoolCreds.username) setSchoolUser(schoolCreds.username);
    if (schoolCreds.password) setSchoolPass(schoolCreds.password);
    if (schoolCreds.baseUrl) setSchoolBaseUrl(schoolCreds.baseUrl);
    if (schoolCreds.token) setSchoolToken(schoolCreds.token);
    if (schoolCreds.proxyUrl !== undefined) setSchoolProxyUrl(schoolCreds.proxyUrl || "");
    if (schoolCreds.cdpUrl !== undefined) setSchoolCdpUrl(schoolCreds.cdpUrl || "");
  }, [schoolCreds]);

  if (!open) return null;

  return (
    <aside className="settings-drawer" aria-label="系统设置">
      <header className="settings-drawer__header">
        <h2>系统设置</h2>
        <Button
          variant="tertiary"
          size="sm"
          aria-label="关闭设置面板"
          onClick={onClose}
        >
          <IconX size={18} />
        </Button>
      </header>

      <nav className="settings-drawer__tabs" aria-label="设置分类">
        {settingsTabs.map((t) => (
          <button
            key={t}
            type="button"
            className={`settings-drawer__tab ${tab === t ? "active" : ""}`}
            onClick={() => {
              if (t === "附件管理") openAttachmentsModal();
              else setTab(t);
            }}
          >
            {t}
          </button>
        ))}
      </nav>

      <div className="settings-drawer__body">
        {tab === "外观设置" && (
          <>
            <h3>外观设置</h3>
            <label>
              界面主题
              <select
                value={prefs.theme}
                onChange={(e) => patchPrefs({ theme: e.target.value })}
              >
                <option value="light">浅色</option>
                <option value="dark">深色</option>
              </select>
            </label>
            <label>
              基础字号
              <select
                value={prefs.font}
                onChange={(e) => patchPrefs({ font: Number(e.target.value) })}
              >
                {[14, 16, 18, 20].map((n) => (
                  <option key={n} value={n}>
                    {n}px
                  </option>
                ))}
              </select>
            </label>
            <Button onClick={() => patchPrefs({ grid: defaultWidgets })}>
              恢复首页默认布局
            </Button>
          </>
        )}

        {tab === "学校接入" && (
          <>
            <h3>学校请销假账户接入（南京师范大学）</h3>
            <div className="school-switch">
              <label>
                <input
                  type="checkbox"
                  checked={!!prefs.schoolEnabled}
                  onChange={(e) => {
                    patchPrefs({ schoolEnabled: e.target.checked });
                    if (e.target.checked) askNotifyPermission();
                  }}
                />
                <span>接入校园网：开启后在后台按心跳间隔自动抓取请销假</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={prefs.schoolNotify !== false}
                  onChange={(e) => {
                    patchPrefs({ schoolNotify: e.target.checked });
                    if (e.target.checked) askNotifyPermission();
                  }}
                />
                <span>有新请销假时弹出桌面提醒</span>
              </label>
              <label>
                心跳间隔
                <select
                  aria-label="心跳间隔"
                  value={prefs.schoolInterval || 60}
                  onChange={(e) =>
                    patchPrefs({ schoolInterval: Number(e.target.value) })
                  }
                >
                  {[30, 60, 120, 300].map((n) => (
                    <option key={n} value={n}>
                      {n} 秒
                    </option>
                  ))}
                </select>
              </label>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                首次保存账号后需在弹出的学校浏览器里完成一次登录（含验证码）；该浏览器保留登录状态，之后启动将复用，无需反复验证。本系统不伪造 IP 或绕过学校认证，登录失效时需重新登录。
              </p>
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
              输入学校统一身份认证工号与密码，保存后支持一键开启校方浏览器会话并每 60 秒实时同步请销假待办与离校状态。
            </p>
            <form
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
              onSubmit={(e) => {
                e.preventDefault();
                onSaveSchoolCreds({
                  preset: "nnu",
                  username: schoolUser.trim(),
                  password: schoolPass,
                  baseUrl: schoolBaseUrl.trim() || schoolPresets.nnu.baseUrl,
                  token: schoolToken.trim(),
                  proxyUrl: schoolProxyUrl.trim(),
                  cdpUrl: schoolCdpUrl.trim(),
                  autoSync: schoolAutoSync,
                  remember: rememberSchool,
                });
              }}
            >
              <label>
                学校账号（工号/学号）
                <input
                  aria-label="学校账号"
                  value={schoolUser}
                  onChange={(e) => setSchoolUser(e.target.value)}
                  placeholder="请输入南师大工号"
                  autoComplete="username"
                />
              </label>
              <label>
                统一认证密码
                <input
                  aria-label="统一认证密码"
                  type="password"
                  value={schoolPass}
                  onChange={(e) => setSchoolPass(e.target.value)}
                  placeholder="仅保存于本机加密存储"
                  autoComplete="current-password"
                />
              </label>
              <label>
                本机连接器地址（网页端配合桥接器时使用）
                <input
                  aria-label="连接器地址"
                  value={schoolBaseUrl}
                  onChange={(e) => setSchoolBaseUrl(e.target.value)}
                />
              </label>
              <label>
                连接器访问令牌（选填，留空自动获取本机握手）
                <input
                  aria-label="连接器令牌"
                  type="password"
                  value={schoolToken}
                  onChange={(e) => setSchoolToken(e.target.value)}
                />
              </label>
              <label>
                校园网代理 / 隧道地址（选填，用于校外访问校园网）
                <input
                  aria-label="校园网代理地址"
                  placeholder="如 http://127.0.0.1:1080 或 socks5://127.0.0.1:1080"
                  value={schoolProxyUrl}
                  onChange={(e) => setSchoolProxyUrl(e.target.value)}
                />
              </label>
              <label>
                外部浏览器远程调试地址（选填，接管已手动打开的 Edge/Chrome）
                <input
                  aria-label="外部浏览器调试地址"
                  placeholder="如 http://127.0.0.1:9222"
                  value={schoolCdpUrl}
                  onChange={(e) => setSchoolCdpUrl(e.target.value)}
                />
              </label>
              <label style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={rememberSchool}
                  onChange={(e) => setRememberSchool(e.target.checked)}
                />
                <span>记住校方账号密码（本机加密存储）</span>
              </label>
              <label style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={schoolAutoSync}
                  onChange={(e) => setSchoolAutoSync(e.target.checked)}
                />
                <span>开启实时自动同步（每分钟刷新一次）</span>
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button primary type="submit" disabled={schoolMeta?.busy}>
                  保存并建立会话
                </Button>
                <Button
                  type="button"
                  disabled={schoolMeta?.busy}
                  onClick={onSyncSchool}
                >
                  {schoolMeta?.busy ? "同步中…" : "立即同步"}
                </Button>
              </div>
            </form>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
              {schoolMeta?.syncedAt ? (
                <Chip color="success">
                  最近同步：{new Date(schoolMeta.syncedAt).toLocaleTimeString("zh-CN")}（{schoolMeta.records?.length || 0} 条）
                </Chip>
              ) : (
                <Chip color="default">尚未抓取校方实时记录</Chip>
              )}
              {schoolMeta?.syncError && (
                <p className="save-error" role="alert" style={{ margin: 0 }}>
                  {schoolMeta.syncError}
                </p>
              )}
              <a
                href={nnuLeaveReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent)" }}
              >
                在新标签页打开南师大请销假审核系统 ↗
              </a>
            </div>
          </>
        )}

        {tab === "字段配置" && (
          <>
            <h3>学生详情栏显示字段</h3>
            <div className="check-list" style={{ margin: 0 }}>
              {fields.map((f) => (
                <label key={f.id}>
                  <input
                    type="checkbox"
                    checked={prefs.detailFields.includes(f.id)}
                    onChange={(e) =>
                      patchPrefs({
                        detailFields: e.target.checked
                          ? [...prefs.detailFields, f.id]
                          : prefs.detailFields.filter((id) => id !== f.id),
                      })
                    }
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </>
        )}

        {tab === "板块管理" && (
          <>
            <h3>侧栏功能板块显示配置</h3>
            <div className="check-list" style={{ margin: 0 }}>
              {allModules.map((m) => (
                <label key={m}>
                  <input
                    type="checkbox"
                    checked={!prefs.hidden.includes(m)}
                    onChange={(e) => {
                      patchPrefs({
                        hidden: e.target.checked
                          ? prefs.hidden.filter((v) => v !== m)
                          : [...prefs.hidden, m],
                      });
                      if (m === page) navigate("工作首页");
                    }}
                  />
                  <span>{m}</span>
                  {prefs.extra.includes(m) && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        patchPrefs({
                          extra: prefs.extra.filter((v) => v !== m),
                          hidden: prefs.hidden.filter((v) => v !== m),
                        });
                        if (page === m) navigate("工作首页");
                      }}
                    >
                      移除
                    </Button>
                  )}
                </label>
              ))}
            </div>
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                const m = newModuleName.trim();
                if (
                  !/^[\u4e00-\u9fff]{4}$/.test(m) ||
                  [...allModules, "工作首页", "设置", "账户管理"].includes(m)
                ) {
                  notify("请输入不重复的四字板块名称");
                  return;
                }
                patchPrefs({ extra: [...prefs.extra, m] });
                setNewModuleName("");
              }}
            >
              <input
                aria-label="新板块名称"
                placeholder="四字板块名称"
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
                required
              />
              <Button type="submit">新增板块</Button>
            </form>
          </>
        )}

        {tab === "备份导出" && (
          <>
            <h3>数据存储与备份导出</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
              {initialData
                ? "当前数据已启用保存机制。可使用右上角“加密备份”按钮导出加密档案包。"
                : "当前为演示会话；正式环境会自动将业务数据加密保存在本地。"}
            </p>
            <Button
              primary
              onClick={() => requestExport(studentRows, fields, "学生信息")}
            >
              导出学生信息与附件
            </Button>
            <Button onClick={openAttachmentsModal}>打开附件统一管理</Button>
          </>
        )}

        {tab === "模型配置" && (
          <>
            <h3>本地 CPU / 远程 AI 协同模型</h3>
            <label>
              预设模板
              <select
                aria-label="模型预设模板"
                defaultValue="custom"
                onChange={(e) => {
                  const preset = modelPresets.find(
                    (p) => p.id === e.target.value,
                  );
                  if (!preset) return;
                  setModel({
                    ...model,
                    endpoint: preset.endpoint,
                    model: preset.model,
                    key: "",
                  });
                }}
              >
                {modelPresets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            {[
              ["endpoint", "API 基础地址"],
              ["model", "模型名称"],
              ["key", "API 密钥"],
            ].map(([id, label]) => (
              <label key={id}>
                {label}
                <input
                  type={id === "key" ? "password" : "text"}
                  autoComplete="off"
                  value={model[id]}
                  onChange={(e) => setModel({ ...model, [id]: e.target.value })}
                />
              </label>
            ))}
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                primary
                onClick={() => {
                  patchPrefs({
                    aiModel: {
                      endpoint: model.endpoint.trim(),
                      model: model.model.trim(),
                    },
                  });
                  notify("模型配置已持久化保存");
                }}
              >
                保存配置
              </Button>
              <Button
                onClick={() => {
                  setModel({ endpoint: "", model: "", key: "" });
                  patchPrefs({ aiModel: { endpoint: "", model: "" } });
                  notify("模型配置已清除");
                }}
              >
                清除配置
              </Button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
