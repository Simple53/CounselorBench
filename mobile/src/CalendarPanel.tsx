import { useState } from "react";
import { calendarDays, onCalendarDay } from "../../src/leave-insights.mjs";
import { localDay, type Row } from "./domain";
export function CalendarPanel({
  events,
  onOpen,
}: {
  events: Row[];
  onOpen: (row: Row) => void;
}) {
  const [month, setMonth] = useState(localDay().slice(0, 7)),
    [day, setDay] = useState(localDay()),
    [hidden, setHidden] = useState<string[]>([]),
    [layers, setLayers] = useState(false);
  const modules = [...new Set(events.map((e) => e.module || "工作待办"))];
  const shown = events.filter((e) => !hidden.includes(e.module || "工作待办"));
  function move(delta: number) {
    const [y, m] = month.split("-").map(Number),
      d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return (
    <section className="sc-calendar" aria-label="日历视图">
      <div className="sc-toolbar">
        <button aria-label="上个月" onClick={() => move(-1)}>
          ‹
        </button>
        <strong>{month.replace("-", "年")}月</strong>
        <button aria-label="下个月" onClick={() => move(1)}>
          ›
        </button>
        <button
          onClick={() => {
            setMonth(localDay().slice(0, 7));
            setDay(localDay());
          }}
        >
          今天
        </button>
        <button aria-expanded={layers} onClick={() => setLayers(!layers)}>
          叠加项目
        </button>
      </div>
      {layers && (
        <div className="sc-calendar-layers">
          {modules.map((m) => (
            <label key={m}>
              <input
                type="checkbox"
                checked={!hidden.includes(m)}
                onChange={() =>
                  setHidden((s) =>
                    s.includes(m) ? s.filter((x) => x !== m) : [...s, m],
                  )
                }
              />
              {m}
            </label>
          ))}
        </div>
      )}
      <div className="sc-calendar-grid">
        {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
          <span key={d}>{d}</span>
        ))}
        {calendarDays(month).map((d: string) => {
          const count = shown.filter((e) => onCalendarDay(e, d)).length;
          return (
            <button
              key={d}
              aria-label={`${d}，${count}项`}
              aria-pressed={day === d}
              className={
                (d.startsWith(month) ? "" : "outside") +
                (d === localDay() ? " today" : "")
              }
              onClick={() => setDay(d)}
            >
              <span>{Number(d.slice(8))}</span>
              <small aria-hidden="true">{count > 0 ? count : "\u00a0"}</small>
            </button>
          );
        })}
      </div>
      <h3>{day}</h3>
      <div className="sc-list">
        {shown
          .filter((e) => onCalendarDay(e, day))
          .map((e) => (
            <button
              className="sc-menu-row"
              key={e.id}
              onClick={() => onOpen(e)}
            >
              <span>
                <strong>{e.title || e.text || e.action}</strong>
                <small className="sc-calendar-meta">
                  {e.module || "工作待办"} ·{" "}
                  {e.status || (e.done ? "已完成" : "待办")}
                </small>
              </span>
              <span>›</span>
            </button>
          ))}
      </div>
      {!shown.some((e) => onCalendarDay(e, day)) && (
        <p className="sc-empty">当天暂无事项</p>
      )}
    </section>
  );
}
