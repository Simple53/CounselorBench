import React, { useState } from "react";
import { dailyReport, localDate } from "./work.mjs";
import { Button } from "./ui.jsx";
export function BriefArchive({ logs, tasks, briefs, date, onDate }) {
  const [mode, setMode] = useState("每日简报"),
    [month, setMonth] = useState(date.slice(0, 7)),
    [span, setSpan] = useState(["", ""]);
  const dates = [
    ...new Set([
      ...logs.map((l) => l.time.slice(0, 10)),
      ...Object.keys(briefs),
      date,
    ]),
  ]
    .sort()
    .filter((d) => (!span[0] || d >= span[0]) && (!span[1] || d <= span[1]));
  const document =
    "# 每日工作简报汇编\n\n" +
    dates
      .map(
        (d) =>
          "## " +
          d +
          "\n\n" +
          dailyReport(logs, tasks, d).text +
          (briefs[d] ? "\n\n### AI 简报草稿\n" + briefs[d] : ""),
      )
      .join("\n\n---\n\n");
  function download() {
    const url = URL.createObjectURL(
      new Blob([document], { type: "text/markdown;charset=utf-8" }),
    );
    const a = window.document.createElement("a");
    a.href = url;
    a.download = "每日工作简报汇编.md";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const [year, m] = month.split("-").map(Number),
    start = new Date(year, m - 1, 1),
    offset = (start.getDay() + 6) % 7,
    count = new Date(year, m, 0).getDate();
  return (
    <section className="brief-archive">
      <div className="brief-tabs">
        {["每日简报", "综合文档", "日历模式"].map((v) => (
          <Button key={v} primary={v === mode} onClick={() => setMode(v)}>
            {v}
          </Button>
        ))}
      </div>
      {mode === "每日简报" && (
        <pre>
          {dailyReport(logs, tasks, date).text}
          {briefs[date] ? "\n\nAI 简报草稿\n" + briefs[date] : ""}
        </pre>
      )}
      {mode === "综合文档" && (
        <>
          <div className="filter-actions">
            <input
              aria-label="汇编开始日期"
              type="date"
              value={span[0]}
              onChange={(e) => setSpan([e.target.value, span[1]])}
            />
            <span>至</span>
            <input
              aria-label="汇编结束日期"
              type="date"
              min={span[0]}
              value={span[1]}
              onChange={(e) => setSpan([span[0], e.target.value])}
            />
            <Button onClick={download}>导出文档</Button>
          </div>
          <article className="brief-document">
            <pre>{document}</pre>
          </article>
        </>
      )}
      {mode === "日历模式" && (
        <>
          <input
            aria-label="简报月份"
            type="month"
            value={month}
            onChange={(e) => {
              if (e.target.value) setMonth(e.target.value);
            }}
          />
          <div className="brief-calendar">
            {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
              <b key={d}>周{d}</b>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <span key={"empty" + i} />
            ))}
            {Array.from({ length: count }, (_, i) => {
              const d = localDate(new Date(year, m - 1, i + 1)),
                n = logs.filter((l) => l.time.startsWith(d)).length,
                pending = tasks.filter((t) => t.date === d && !t.done).length;
              return (
                <button
                  key={d}
                  className={d === date ? "selected" : ""}
                  onClick={() => {
                    onDate(d);
                    setMode("每日简报");
                  }}
                >
                  <strong>{i + 1}</strong>
                  {n > 0 && <span>{n} 条留痕</span>}
                  {briefs[d] && <span>AI 简报</span>}
                  {pending > 0 && <span>{pending} 项待办</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
