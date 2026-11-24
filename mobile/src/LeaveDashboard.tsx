import { useState } from "react";
import { leaveInsights } from "../../src/leave-insights.mjs";
import { KeyboardInput, useKeyboard } from "./mobile";
import type { Row } from "./domain";
export function LeaveDashboard({
  students,
  records,
  onOpen,
  coverage,
}: {
  students: Row[];
  records: Row[];
  onOpen: (r: Row) => void;
  coverage: string;
}) {
  const [widgets, setWidgets] = useState(["状态名单", "事由分类"]),
    [settings, setSettings] = useState(false),
    [query, setQuery] = useState(""),
    [all, setAll] = useState(false),
    [start, setStart] = useState(""),
    [end, setEnd] = useState("");
  const keyboard = useKeyboard();
  const invalid = !!(start && end && start > end),
    data = leaveInsights(students, records, invalid ? {} : { start, end });
  const rows = data.students.filter((s: Row) =>
    [s.name, s.number, s.leaveStatus].some((v) =>
      String(v || "").includes(query),
    ),
  );
  return (
    <section className="sc-leave-dashboard">
      <div className="sc-toolbar">
        <h2 className="sc-section-title">请假概览</h2>
        <button onClick={() => setSettings(!settings)} aria-expanded={settings}>
          统计配置
        </button>
      </div>
      <p className="sc-coverage">{coverage}</p>
      {!invalid && (
        <div className="sc-leave-kpis">
          <div className="sc-leave-kpi">
            <span>当前在假</span>
            <strong>{data.activeCount} 人</strong>
          </div>
          <div className="sc-leave-kpi">
            <span>累计获批</span>
            <strong>{data.total} 次</strong>
          </div>
          <div className="sc-leave-kpi">
            <span>累计时长</span>
            <strong>{data.totalHours} h</strong>
          </div>
          <div className="sc-leave-kpi">
            <span>单次均值</span>
            <strong>{data.avgHours} h</strong>
          </div>
        </div>
      )}
      {!invalid && data.advisorGroups?.length > 0 && (
        <div className="sc-group-alert" role="status">
          <strong>同导师同项目同行提醒（{data.advisorGroups.length}组）</strong>
          {data.advisorGroups.slice(0, 3).map((g: any) => (
            <div key={g.id} className="sc-group-alert__item">
              <span>
                {g.advisor}导师 · {g.projectName}（{g.destination}）
              </span>
              <small>
                {g.count}名学生同行：{g.studentNames.join("、")}
              </small>
            </div>
          ))}
        </div>
      )}
      {settings && (
        <div className="sc-stat-settings">
          <div className="sc-calendar-layers">
            {["状态名单", "事由分类", "请假频次", "去向分布", "时间分布"].map((w) => (
              <label key={w}>
                <input
                  type="checkbox"
                  checked={widgets.includes(w)}
                  onChange={() =>
                    setWidgets((s) =>
                      s.includes(w) ? s.filter((x) => x !== w) : [...s, w],
                    )
                  }
                />
                {w}
              </label>
            ))}
          </div>
          <div className="sc-date-range">
            <label>
              开始日期
              <KeyboardInput
                type="date"
                aria-label="统计开始日期"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                onBlur={() => keyboard.hide()}
              />
            </label>
            <label>
              结束日期
              <KeyboardInput
                type="date"
                aria-label="统计结束日期"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                onBlur={() => keyboard.hide()}
              />
            </label>
          </div>
          <p>频次按获批申请的开始日期统计，排除待审批和驳回。</p>
          {invalid && <p role="alert">结束日期不能早于开始日期</p>}
        </div>
      )}
      {widgets.includes("状态名单") && (
        <>
          <div className="sc-search">
            <KeyboardInput
              aria-label="搜索学生请假状态"
              placeholder="搜索学生、学号或状态"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setAll(false);
              }}
              onBlur={() => keyboard.hide()}
            />
          </div>
          <div className="sc-list">
            {rows.slice(0, all ? rows.length : 6).map((s: Row) => (
              <button
                className="sc-leave-student"
                key={s.id}
                onClick={() => {
                  const r = records
                    .filter((r) => r.studentId === s.id)
                    .sort((a, b) =>
                      String(b.startAt).localeCompare(String(a.startAt)),
                    )[0];
                  if (r) onOpen(r);
                }}
                disabled={!records.some((r) => r.studentId === s.id)}
              >
                <span>
                  <strong>{s.name}</strong>
                  <small>{s.number || "未提供学号"}</small>
                </span>
                <span
                  className={
                    "sc-status " + (s.leaveStatus === "逾期未返" ? "late" : "")
                  }
                >
                  {s.leaveStatus}
                </span>
                  <span>{invalid ? "—" : `${s.leaveCount}次 / ${s.leaveHours}h`}</span>
              </button>
            ))}
          </div>
          {rows.length > 6 && (
            <button className="sc-more" onClick={() => setAll(!all)}>
              {all ? "收起名单" : `查看全部（${rows.length}）`}
            </button>
          )}
          {!rows.length && <p className="sc-empty">暂无匹配学生</p>}
        </>
      )}
      {!invalid &&
        [
          ["事由分类", data.categories],
          ["请假频次", data.frequency],
          ["去向分布", data.regions],
          ["时间分布", data.months],
        ]
          .filter(([title]) => widgets.includes(title as string))
          .map(([title, items]: any) => (
            <section className="sc-stat-chart" key={title}>
              <h3>{title}</h3>
              {items.slice(0, 10).map((x: any) => (
                <div className="sc-stat-bar" key={x.id || x.label}>
                  <span title={x.label}>{x.label}</span>
                  <div>
                    <i
                      style={{
                        width: `${(x.count / Math.max(...items.map((v: any) => v.count), 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <strong>{x.count}</strong>
                </div>
              ))}
              {!items.length && <p className="sc-empty">该区间暂无获批记录</p>}
            </section>
          ))}
    </section>
  );
}
