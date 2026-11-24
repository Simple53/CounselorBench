import { useEffect, useRef, useState } from "react";
import {
  KeyboardInput,
  KeyboardTextarea,
  useKeyboard,
  BottomSheet,
} from "./mobile";
import {
  schoolPresets,
  validateSchoolConfig,
  nnuLeaveReviewUrl,
} from "./school-client.mjs";
import {
  loadRememberedSchoolAuth,
  saveRememberedSchoolAuth,
  clearRememberedSchoolAuth,
} from "../../src/remember-auth.mjs";
import { leaveActions, leaveStatus } from "../../src/leave.mjs";
import type { Row } from "./domain";
export function SchoolConnection({
  config,
  onSave,
  onSync,
  onSession,
  busy,
  meta,
}: {
  config: any;
  onSave: (
    c: any,
    t: string,
    login: { username: string; password: string },
  ) => void;
  onSync: () => void;
  onSession: () => void;
  busy: boolean;
  meta: any;
}) {
  const [draft, setDraft] = useState(config),
    [token, setToken] = useState(""),
    [mapping, setMapping] = useState(
      JSON.stringify(
        { fields: config.fields, statuses: config.statuses },
        null,
        2,
      ),
    ),
    [error, setError] = useState("");
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [remember, setRemember] = useState(true);
  const keyboard = useKeyboard();
  useEffect(() => {
    let active = true;
    loadRememberedSchoolAuth().then((saved: any) => {
      if (!active || !saved) return;
      if (saved.username) setUsername(saved.username);
      if (saved.password) setPassword(saved.password);
      if (saved.token) setToken(saved.token);
      setDraft((d: any) => ({
        ...d,
        ...(saved.baseUrl ? { baseUrl: saved.baseUrl } : {}),
        ...(saved.preset ? { preset: saved.preset } : {}),
        autoSync: saved.autoSync !== false,
      }));
    });
    return () => {
      active = false;
    };
  }, []);
  function preset(id: string) {
    const c = (schoolPresets as any)[id];
    setDraft({ ...c, preset: id });
    setMapping(
      JSON.stringify({ fields: c.fields, statuses: c.statuses }, null, 2),
    );
    setToken("");
    setError("");
  }
  return (
    <>
      <form
        className="sc-form"
        onSubmit={async (e) => {
          e.preventDefault();
          keyboard.hide();
          try {
            const m = JSON.parse(mapping);
            if (!m.fields || typeof m.fields !== "object")
              throw Error("请填写字段映射");
            const c = validateSchoolConfig({ ...draft, ...m });
            if (remember) {
              await saveRememberedSchoolAuth({
                ...c,
                token,
                username,
                password,
              });
            } else {
              clearRememberedSchoolAuth();
            }
            onSave(c, token, { username, password });
            if (!remember) setPassword("");
            setError("");
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <label>
          高校预设
          <select
            aria-label="高校预设"
            value={draft.preset || "custom"}
            onChange={(e) => preset(e.target.value)}
          >
            {Object.entries(schoolPresets).map(([id, p]: any) => (
              <option key={id} value={id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        {(
          [
            ["label", "连接名称"],
            ["baseUrl", "接口根地址"],
            ["listPath", "列表接口"],
            ["detailPath", "详情接口"],
            ["actionPath", "操作接口"],
            ["attachmentPath", "附件接口"],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            {label}
            <KeyboardInput
              aria-label={label}
              value={draft[key]}
              onChange={(e) =>
                setDraft((s: any) => ({ ...s, [key]: e.target.value }))
              }
              onBlur={() => keyboard.hide()}
            />
          </label>
        ))}
        <label>
          访问令牌
          <KeyboardInput
            aria-label="学校访问令牌"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onBlur={() => keyboard.hide()}
          />
        </label>
        <label>
          学校账号
          <KeyboardInput
            aria-label="学校账号"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={() => keyboard.hide()}
          />
        </label>
        <label>
          学校密码
          <KeyboardInput
            aria-label="学校密码"
            type="password"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => keyboard.hide()}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={draft.autoSync !== false}
            onChange={(e) =>
              setDraft((s: any) => ({ ...s, autoSync: e.target.checked }))
            }
          />
          自动同步（每分钟）
        </label>
        <label>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          记住学校账号密码（加密保存，下次免重复验证）
        </label>
        <p className="sc-coverage">
          南师大请销假系统入口：
          <a href={nnuLeaveReviewUrl} target="_blank" rel="noopener noreferrer">
            打开学工请假审核页面
          </a>
        </p>
        <details>
          <summary>字段与状态映射</summary>
          <KeyboardTextarea
            aria-label="字段与状态映射"
            value={mapping}
            onChange={(e) => setMapping(e.target.value)}
            onBlur={() => keyboard.hide()}
          />
        </details>
        {error && (
          <p role="alert" className="sc-error">
            {error}
          </p>
        )}
        <button className="sc-primary" disabled={busy}>
          保存学校配置
        </button>
      </form>
      <div className="sc-actions">
        <button
          className="sc-secondary"
          disabled={busy || !config.baseUrl}
          onClick={onSync}
        >
          {busy ? "处理中…" : "同步校方记录"}
        </button>
        {config.preset === "nnu" && (
          <button className="sc-secondary" disabled={busy} onClick={onSession}>
            建立校方会话
          </button>
        )}
      </div>
      {meta.syncError && (
        <p role="status" className="sc-error">
          自动同步已暂停：{meta.syncError}。完成登录后重新保存或同步。
        </p>
      )}
      <p className="sc-coverage">
        {meta.syncedAt
          ? `最近同步 ${new Date(meta.syncedAt).toLocaleString("zh-CN")} · ${meta.complete ? "接口声明完整" : "仅部分记录"}`
          : "尚未连接学校接口"}
      </p>
      <p className="sc-coverage">
        接口凭据与校方资料仅保存在本次页面内存。南师大预设需运行独立连接器，并在电脑浏览器手动登录。
      </p>
    </>
  );
}
export function SchoolRecordTools({
  record,
  client,
  capabilities,
  busy,
  onBusy,
  onSync,
  onDone,
  notify,
  onDetail,
}: {
  record: Row;
  client: () => any;
  capabilities: string[];
  busy: boolean;
  onBusy: (b: boolean) => void;
  onSync: (v: any) => void;
  onDone: () => void;
  notify: (s: string) => void;
  onDetail: (r: Row) => void;
}) {
  const [action, setAction] = useState(""),
    [comment, setComment] = useState(""),
    [preview, setPreview] = useState<{
      url: string;
      mime: string;
      name: string;
    } | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const lock = useRef(false),
    keyboard = useKeyboard();
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview.url);
    },
    [preview],
  );
  async function run(work: () => Promise<void>) {
    if (lock.current || busy) return;
    lock.current = true;
    onBusy(true);
    try {
      await work();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      lock.current = false;
      onBusy(false);
    }
  }
  return (
    <section className="sc-school-record">
      <p className="sc-coverage">
        校方记录 · {record.rawStatus || record.status}
      </p>
      <button
        className="sc-secondary"
        disabled={busy}
        onClick={() =>
          run(async () => {
            onDetail(await client().detail(record.externalId));
            setUncertain(false);
          })
        }
      >
        刷新校方详情
      </button>
      {uncertain && (
        <p className="sc-error" role="status">
          操作结果尚未核实，请先刷新校方详情，勿重复提交。
        </p>
      )}
      <div className="sc-actions">
        {(leaveActions[leaveStatus(record)] || [])
          .filter((a: any) => capabilities.includes(a.action))
          .map((a: any) => (
            <button
              key={a.action}
              className="sc-primary"
              disabled={busy || uncertain}
              onClick={() => {
                keyboard.hide();
                setAction(a.action);
                setComment("");
              }}
            >
              {a.label}
            </button>
          ))}
      </div>
      {action && (
        <form
          className="sc-form sc-confirm"
          onSubmit={(e) => {
            e.preventDefault();
            keyboard.hide();
            run(async () => {
              if (uncertain) throw Error("请先核实校方状态");
              setUncertain(true);
              const api = client(),
                result = await api.act(record.externalId, action, comment);
              if (result.accepted !== true)
                throw Error("校方未确认接收操作，请刷新后核实");
              setAction("");
              notify("操作已提交，正在重新核对校方状态");
              try {
                onSync(await api.list());
                onDone();
              } catch {
                notify("操作已提交，但刷新失败；请先核实校方状态，勿重复提交");
              }
            });
          }}
        >
          <h3>确认办理 · {record.studentName}</h3>
          <p>
            {
              (leaveActions[leaveStatus(record)] || []).find(
                (a: any) => a.action === action,
              )?.label
            }
            ：{record.summary}
          </p>
          <label>
            操作意见
            <KeyboardTextarea
              aria-label="校方操作意见"
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onBlur={() => keyboard.hide()}
            />
          </label>
          <button className="sc-primary" disabled={busy || uncertain}>
            确认提交校方
          </button>
          <button
            type="button"
            className="sc-secondary"
            disabled={busy}
            onClick={() => setAction("")}
          >
            取消操作
          </button>
        </form>
      )}
      <h3>关联附件</h3>
      {record.attachments?.map((a: Row) => (
        <div className="sc-file-row" key={a.id}>
          <span>{a.name}</span>
          <button
            disabled={busy}
            onClick={() =>
              run(async () => {
                const blob = await client().attachment(record.externalId, a.id);
                const head = new Uint8Array(
                  await blob.slice(0, 8).arrayBuffer(),
                );
                const safe =
                  head[0] === 0x89 &&
                  head[1] === 0x50 &&
                  head[2] === 0x4e &&
                  head[3] === 0x47
                    ? "image/png"
                    : head[0] === 0xff && head[1] === 0xd8
                      ? "image/jpeg"
                      : String.fromCharCode(...head.slice(0, 5)) === "%PDF-"
                        ? "application/pdf"
                        : "";
                const url = URL.createObjectURL(
                  new Blob([blob], {
                    type: safe || "application/octet-stream",
                  }),
                );
                if (safe) setPreview({ url, mime: safe, name: a.name });
                else {
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = a.name;
                  link.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }
              })
            }
          >
            查看附件
          </button>
        </div>
      ))}
      {!record.attachments?.length && (
        <p className="sc-empty">接口未提供附件</p>
      )}
      <BottomSheet
        open={!!preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
        title={preview?.name || "附件预览"}
      >
        {preview && (
          <div className="sc-attachment-preview">
            <div className="sc-toolbar">
              <button onClick={() => setPreview(null)}>关闭预览</button>
            </div>
            {preview.mime.startsWith("image/") ? (
              <img src={preview.url} alt={preview.name} />
            ) : (
              <iframe title={preview.name} src={preview.url} sandbox="" />
            )}
            <a href={preview.url} download={preview.name}>
              下载附件
            </a>
          </div>
        )}
      </BottomSheet>
    </section>
  );
}
