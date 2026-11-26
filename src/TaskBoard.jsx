import React, { useMemo, useState } from "react";
import { Button, Chip } from "./ui.jsx";
import {
  segments,
  quadrants,
  quadrantMeta,
  weekDays,
  monthGrid,
  pendingSummary,
  addDays,
} from "./tasks.mjs";

const modes = ["三段式", "四象限", "周视图", "月视图"];
const weekNames = ["一", "二", "三", "四", "五", "六", "日"];

function Item({ t, today, onToggle, onImportant }) {
  return (
    <li className={`tb-item ${t.done ? "done" : ""}`}>
      <input
        type="checkbox"
        aria-label={`完成 ${t.text}`}
        checked={!!t.done}
        onChange={() => onToggle(t)}
      />
      <span className="tb-text">{t.text}</span>
      <span className="tabular tb-date">
        {t.date}
        {!t.done && t.date < today ? " 逾期" : ""}
      </span>
      <button
        type="button"
        className={`tb-star ${t.important ? "on" : ""}`}
        aria-pressed={!!t.important}
        title="标记为重要（用于四象限）"
        onClick={() => onImportant(t)}
      >
        {t.important ? "重要" : "标重要"}
      </button>
    </li>
  );
}

export function TaskBoard({ tasks, today, onToggle, onImportant, onAdd }) {
  const [mode, setMode] = useState("三段式"),
    [anchor, setAnchor] = useState(today),
    [picked, setPicked] = useState(today);
  const sum = pendingSummary(tasks, today);
  const seg = useMemo(() => segments(tasks, today), [tasks, today]);
  const quad = useMemo(() => quadrants(tasks, today), [tasks, today]);
  const on = (d) => tasks.filter((t) => t.date === d);
  const list = (items) =>
    items.length ? (
      <ul className="tb-list">
        {items.map((t) => (
          <Item key={t.id} t={t} today={today} onToggle={onToggle} onImportant={onImportant} />
        ))}
      </ul>
    ) : (
      <p className="tb-empty">暂无</p>
    );
  const [ay, am] = anchor.split("-").map(Number);
  const shift = (n) =>
    mode === "周视图"
      ? setAnchor(addDays(anchor, n * 7))
      : setAnchor(
          `${new Date(ay, am - 1 + n, 1).getFullYear()}-${String(new Date(ay, am - 1 + n, 1).getMonth() + 1).padStart(2, "0")}-01`,
        );
  return (
    <section className="taskboard" aria-label="待完成任务">
      <header className="tb-head">
        <div>
          <h2>当前待完成</h2>
          <div className="tb-sum">
            <Chip color={sum.total ? "accent" : "success"}>
              待办 <span className="tabular">{sum.total}</span>
            </Chip>
            <Chip color={sum.overdue ? "danger" : "default"}>
              逾期 <span className="tabular">{sum.overdue}</span>
            </Chip>
            <Chip color={sum.today ? "warning" : "default"}>
              今日 <span className="tabular">{sum.today}</span>
            </Chip>
          </div>
        </div>
        <div className="tb-tools">
          <div className="segmented" aria-label="任务视图">
            {modes.map((m) => (
              <button
                key={m}
                type="button"
                className={mode === m ? "active" : ""}
                onClick={() => {
                  setMode(m);
                  setAnchor(today);
                }}
              >
                {m}
              </button>
            ))}
          </div>
          <Button variant="primary" onClick={onAdd}>
            新增待办
          </Button>
        </div>
      </header>

      {mode === "三段式" && (
        <div className="tb-three">
          <div className="tb-col danger">
            <h3>已逾期 <span className="tabular">{seg.overdue.length}</span></h3>
            {list(seg.overdue)}
          </div>
          <div className="tb-col">
            <h3>今日 <span className="tabular">{seg.today.length}</span></h3>
            {list(seg.today)}
          </div>
          <div className="tb-col">
            <h3>之后 <span className="tabular">{seg.upcoming.length}</span></h3>
            {list(seg.upcoming)}
          </div>
        </div>
      )}

      {mode === "四象限" && (
        <>
          <p className="tb-hint">紧急＝已逾期或 2 天内到期；重要需手动点“标重要”。</p>
          <div className="tb-quad">
            {Object.entries(quadrantMeta).map(([k, m]) => (
              <div key={k} className={`tb-q tb-${k}`}>
                <h3>
                  {m.title} <small>{m.hint}</small>
                </h3>
                {list(quad[k])}
              </div>
            ))}
          </div>
        </>
      )}

      {(mode === "周视图" || mode === "月视图") && (
        <>
          <div className="tb-nav">
            <Button size="sm" onClick={() => shift(-1)}>
              上一{mode === "周视图" ? "周" : "月"}
            </Button>
            <strong className="tabular">
              {mode === "周视图" ? `${weekDays(anchor)[0]} 起一周` : `${ay} 年 ${am} 月`}
            </strong>
            <Button size="sm" onClick={() => shift(1)}>
              下一{mode === "周视图" ? "周" : "月"}
            </Button>
            <Button size="sm" variant="tertiary" onClick={() => (setAnchor(today), setPicked(today))}>
              回到今天
            </Button>
          </div>
          <div className={mode === "周视图" ? "tb-week" : "tb-month"}>
            {weekNames.map((n) => (
              <div key={n} className="tb-wn">
                周{n}
              </div>
            ))}
            {(mode === "周视图" ? weekDays(anchor) : monthGrid(ay, am - 1)).map((d) => {
              const items = on(d);
              const open = items.filter((t) => !t.done).length;
              return (
                <button
                  type="button"
                  key={d}
                  className={`tb-cell ${d === today ? "today" : ""} ${d === picked ? "picked" : ""} ${mode === "月视图" && d.slice(0, 7) !== anchor.slice(0, 7) ? "dim" : ""}`}
                  onClick={() => setPicked(d)}
                  aria-label={`${d} 待办 ${open} 项`}
                >
                  <span className="tabular">{Number(d.slice(8))}</span>
                  {open > 0 && <b className={d < today ? "late" : ""}>{open}</b>}
                  {mode === "周视图" &&
                    items.slice(0, 4).map((t) => (
                      <i key={t.id} className={t.done ? "done" : ""}>
                        {t.text}
                      </i>
                    ))}
                </button>
              );
            })}
          </div>
          <h3 className="tb-picked">{picked} 的任务</h3>
          {list(on(picked))}
        </>
      )}
    </section>
  );
}
