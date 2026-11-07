import React, { useState, useRef, useEffect } from "react";
import IconX from "@tabler/icons-react/dist/esm/icons/IconX.mjs";
import IconPin from "@tabler/icons-react/dist/esm/icons/IconPin.mjs";
import IconPinnedOff from "@tabler/icons-react/dist/esm/icons/IconPinnedOff.mjs";
import IconSettings from "@tabler/icons-react/dist/esm/icons/IconSettings.mjs";
import { Button, Modal } from "./ui.jsx";
const suggestions = {
  工作首页: ["复核到期待办与未完成事项", "核对概览统计后安排今日工作"],
  思政教育: ["核对谈话对象、主题与沟通时间", "补齐后续跟进安排与相关材料"],
  党团建设: ["复核发展阶段与阶段生效日期", "检查思想汇报和考察材料是否齐备"],
  行为奖惩: ["核对决定文号、期限与办理状态", "复核教育跟进、申诉及解除材料"],
  学风建设: ["核对成绩来源、学期与考试批次", "复核学业帮扶事项与跟进时间"],
  就业指导: ["区分求职意向和已核验毕业去向", "复核指导记录与待补材料"],
  安全管理: ["复核隐患责任人、整改期限与验收状态", "检查尚未结案的整改事项"],
  网络育人: ["核对作品与事件来源和发生时间", "复核后续沟通及处置记录"],
  应急处突: [
    "核对事件时间线与未完成处置事项",
    "检查家校沟通材料与个人信息范围",
  ],
  工作实务: ["核对办事流程与当前通知版本", "复核工作日志和到期待办"],
  专业成长: ["整理培训学时、证书与研修材料", "检查案例复盘是否已脱敏"],
  学生信息: ["核对学号重复与缺失字段", "核对紧急联系人与在校状态"],
  日常管理: ["复核待销假与到期记录", "核对住宿变更及未完成事项"],
  工作留痕: ["核对今日完成记录与操作清单", "复核逾期待办后生成每日简报"],
  心理健康: ["核对资料授权范围与随访安排", "导出前检查敏感内容与接收范围"],
  资助育人: ["分别核对应发与实发金额", "复核未补齐材料与发放状态"],
};
export function Assistant({
  page,
  open,
  setOpen,
  docked,
  setDocked,
  model,
  onSettings,
  prompt,
  setPrompt,
  position,
  onPosition,
  onSaveBrief,
}) {
  const initial = () =>
    position || {
      x: Math.max(0, window.innerWidth - 100),
      y: Math.max(0, window.innerHeight - 100),
    };
  const [pos, setPos] = useState(initial),
    [text, setText] = useState(""),
    [reply, setReply] = useState(""),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const drag = useRef(null),
    abort = useRef(null);
  const panelWidth = Math.min(370, window.innerWidth - 24),
    panelHeight = Math.min(520, window.innerHeight - 80);
  const panelStyle = docked
    ? {}
    : {
        width: panelWidth,
        left: Math.max(
          12,
          pos.x >= panelWidth + 20
            ? pos.x - panelWidth - 12
            : Math.min(window.innerWidth - panelWidth - 12, pos.x + 77),
        ),
        top: Math.max(
          64,
          Math.min(pos.y - 80, window.innerHeight - panelHeight - 12),
        ),
        maxHeight: panelHeight,
      };
  useEffect(() => {
    if (prompt) {
      setText(prompt);
      setOpen(true);
      setPrompt("");
    }
  }, [prompt]);
  useEffect(() => {
    const clamp = () =>
      setPos((p) => ({
        x: Math.max(8, Math.min(p.x, window.innerWidth - 72)),
        y: Math.max(72, Math.min(p.y, window.innerHeight - 72)),
      }));
    window.addEventListener("resize", clamp);
    clamp();
    return () => {
      window.removeEventListener("resize", clamp);
      abort.current?.abort();
    };
  }, []);
  async function send() {
    setConfirm(false);
    setError("");
    setBusy(true);
    setReply("");
    try {
      const url = new URL(model.endpoint);
      if (!["http:", "https:"].includes(url.protocol))
        throw Error("API 地址必须使用 HTTP 或 HTTPS");
      if (
        url.protocol === "http:" &&
        !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      )
        throw Error("远程 API 请使用 HTTPS");
      url.pathname = url.pathname.replace(/\/$/, "");
      if (!url.pathname.endsWith("/chat/completions"))
        url.pathname += "/chat/completions";
      abort.current = new AbortController();
      const timer = setTimeout(() => abort.current?.abort(), 90000);
      let response;
      try {
        response = await fetch(url, {
          method: "POST",
          signal: abort.current.signal,
          headers: {
            "Content-Type": "application/json",
            ...(model.key ? { Authorization: `Bearer ${model.key}` } : {}),
          },
          body: JSON.stringify({
            model: model.model,
            messages: [
              {
                role: "system",
                content:
                  "你是辅导员工作助手。仅基于提供的信息草拟建议和简报，不编造已完成事项，不替代处分、资助或心理等专业决定。",
              },
              { role: "user", content: text },
            ],
            stream: false,
          }),
        });
      } finally {
        clearTimeout(timer);
      }
      if (!response.ok) throw Error(`模型请求失败（HTTP ${response.status}）`);
      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content;
      if (typeof answer !== "string") throw Error("响应缺少可读内容");
      setReply(answer);
    } catch (e) {
      setError(
        e.name === "AbortError"
          ? "请求已停止或超时"
          : e.message === "Failed to fetch"
            ? "连接失败，请核对 API 地址及服务端跨域配置"
            : e.message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="ai-fab movable"
        aria-label="打开AI助手"
        style={{ left: pos.x, top: pos.y, right: "auto", bottom: "auto" }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            moved: false,
            base: { ...pos },
          };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const d = drag.current,
            dx = e.clientX - d.x,
            dy = e.clientY - d.y;
          if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
          if (d.moved)
            setPos({
              x: Math.max(8, Math.min(d.base.x + dx, window.innerWidth - 72)),
              y: Math.max(72, Math.min(d.base.y + dy, window.innerHeight - 72)),
            });
        }}
        onPointerUp={() => {
          if (!drag.current) return;
          if (!drag.current.moved) setOpen(!open);
          else onPosition(pos);
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onClick={(e) => {
          if (e.detail === 0) setOpen(!open);
        }}
      >
        AI
      </button>
      {open && (
        <aside
          className={`ai-panel ${docked ? "docked" : ""}`}
          style={panelStyle}
        >
          <header>
            <h2>AI 助手</h2>
            <Button
              aria-label={docked ? "取消固定AI" : "固定AI侧栏"}
              onClick={() => setDocked(!docked)}
            >
              {docked ? <IconPinnedOff /> : <IconPin />}
            </Button>
            <Button aria-label="配置AI模型" onClick={onSettings}>
              <IconSettings />
            </Button>
            <Button
              aria-label="关闭AI助手"
              onClick={() => {
                setOpen(false);
                setDocked(false);
              }}
            >
              <IconX />
            </Button>
          </header>
          <h3>{page} · 工作建议</h3>
          <ul className="advice-list">
            {(
              suggestions[page] || [
                "核对未完成事项与材料缺项",
                "检查日期、关联学生及附件有效性",
              ]
            ).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          {/* 上方为本地规则建议，不冒充模型生成；模型仅在用户确认发送内容后调用。 */}
          <label>
            问题或简报内容
            <textarea
              aria-label="AI输入"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          <Button
            primary
            disabled={!text.trim() || busy}
            onClick={() => {
              if (!model.endpoint || !model.model) {
                setError("请先配置 API 地址和模型名称");
                return;
              }
              setConfirm(true);
            }}
          >
            发送至模型
          </Button>
          {busy && (
            <Button onClick={() => abort.current?.abort()}>停止生成</Button>
          )}
          {error && <p role="alert">{error}</p>}
          {reply && (
            <div className="ai-reply">
              <h3>模型草稿</h3>
              <pre>{reply}</pre>
              <Button
                onClick={() =>
                  navigator.clipboard
                    .writeText(reply)
                    .catch(() => setError("复制失败"))
                }
              >
                复制草稿
              </Button>
              {onSaveBrief && (
                <Button onClick={() => onSaveBrief(reply)}>
                  保存至每日简报
                </Button>
              )}
            </div>
          )}
        </aside>
      )}
      {confirm && (
        <Modal title="确认发送内容" wide onClose={() => setConfirm(false)}>
          <p>目标：{model.endpoint}</p>
          <pre className="send-preview">{text}</pre>
          <footer>
            <Button onClick={() => setConfirm(false)}>取消</Button>
            <Button primary onClick={send}>
              确认发送
            </Button>
          </footer>
        </Modal>
      )}
    </>
  );
}
