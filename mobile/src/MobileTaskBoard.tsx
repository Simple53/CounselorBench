import { useMemo, useState } from "react";
import {
  segments,
  quadrants,
  quadrantMeta,
  weekDays,
  monthGrid,
  pendingSummary,
  addDays,
} from "../../src/tasks.mjs";
import type { Row } from "./domain";

const modes = ["三段式", "四象限", "周视图", "月视图"];

export function MobileTaskBoard({
  tasks,
  today,
  onToggle,
  onImportant,
  onAdd,
}: {
  tasks: Row[];
  today: string;
  onToggle: (t: Row) => void;
  onImportant: (t: Row) => void;
  onAdd: () => void;
}) {
  const [mode, setMode] = useState("三段式");
  const [anchor, setAnchor] = useState(today);
  const [picked, setPicked] = useState(today);

  const sum = useMemo(() => pendingSummary(tasks, today), [tasks, today]);
  const seg = useMemo(() => segments(tasks, today), [tasks, today]);
  const quad = useMemo(() => quadrants(tasks, today), [tasks, today]);
  const onDay = (d: string) => tasks.filter((t) => t.date === d);

  const [ay, am] = anchor.split("-").map(Number);
  const shift = (n: number) =>
    mode === "周视图"
      ? setAnchor(addDays(anchor, n * 7))
      : setAnchor(
          `${new Date(ay, am - 1 + n, 1).getFullYear()}-${String(new Date(ay, am - 1 + n, 1).getMonth() + 1).padStart(2, "0")}-01`,
        );

  const renderList = (items: Row[]) =>
    items.length ? (
      <div className="sc-list">
        {items.map((t) => (
          <div key={t.id} className={"sc-task " + (t.done ? "completed" : "")}>
            <input
              type="checkbox"
              aria-label={"完成" + t.text}
              checked={!!t.done}
              onChange={() => onToggle(t)}
            />
            <span style={{ flex: 1 }}>
              <strong>{t.text}</strong>
              <small>
                {t.module} · {t.date}
                {!t.done && t.date < today ? " · 已逾期" : ""}
              </small>
            </span>
            <button
              type="button"
              onClick={() => onImportant(t)}
              style={{
                fontSize: 11,
                padding: "2px 6px",
                borderRadius: 6,
                border: "1px solid var(--sc-line)",
                color: t.important ? "#b91c1c" : "var(--sc-muted)",
              }}
            >
              {t.important ? "重要" : "标重要"}
            </button>
          </div>
        ))}
      </div>
    ) : (
      <p className="sc-empty">暂无</p>
    );

  return (
    <section className="sc-taskboard">
      <div className="sc-toolbar">
        <span>
          待办 {sum.total} · 逾期 {sum.overdue} · 今日 {sum.today}
        </span>
        <button type="button" onClick={onAdd}>
          + 新增
        </button>
      </div>

      <div className="sc-tb-modes" aria-label="任务视图模式">
        {modes.map((m) => (
          <button
            type="button"
            key={m}
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

      {mode === "三段式" && (
        <>
          <div className="sc-tb-box">
            <h3>已逾期（{seg.overdue.length}）</h3>
            {renderList(seg.overdue)}
          </div>
          <div className="sc-tb-box">
            <h3>今日（{seg.today.length}）</h3>
            {renderList(seg.today)}
          </div>
          <div className="sc-tb-box">
            <h3>之后（{seg.upcoming.length}）</h3>
            {renderList(seg.upcoming)}
          </div>
        </>
      )}

      {mode === "四象限" &&
        Object.entries(quadrantMeta).map(([k, meta]: any) => (
          <div className="sc-tb-box" key={k}>
            <h3>
              {meta.title}（{quad[k].length}）· {meta.hint}
            </h3>
            {renderList(quad[k])}
          </div>
        ))}

      {(mode === "周视图" || mode === "月视图") && (
        <>
          <div className="sc-toolbar">
            <button type="button" onClick={() => shift(-1)}>
              上一{mode === "周视图" ? "周" : "月"}
            </button>
            <strong>
              {mode === "周视图"
                ? `${weekDays(anchor)[0]} 起一周`
                : `${ay}年${am}月`}
            </strong>
            <button type="button" onClick={() => shift(1)}>
              下一{mode === "周视图" ? "周" : "月"}
            </button>
          </div>
          <div className="sc-tb-grid">
            {(mode === "周视图" ? weekDays(anchor) : monthGrid(ay, am - 1)).map(
              (d: string) => {
                const open = onDay(d).filter((t) => !t.done).length;
                return (
                  <button
                    type="button"
                    key={d}
                    className={`sc-tb-cell ${d === today ? "today" : ""} ${d === picked ? "picked" : ""}`}
                    onClick={() => setPicked(d)}
                  >
                    <span>{Number(d.slice(8))}</span>
                    {open > 0 && <b>{open}</b>}
                  </button>
                );
              },
            )}
          </div>
          <h3 className="sc-section-title">{picked} 的任务</h3>
          {renderList(onDay(picked))}
        </>
      )}
    </section>
  );
}
