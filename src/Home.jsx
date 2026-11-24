import React, { useState, useEffect, useRef, useMemo } from "react";
import GridLayout, { WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import IconPlus from "@tabler/icons-react/dist/esm/icons/IconPlus.mjs";
import IconEdit from "@tabler/icons-react/dist/esm/icons/IconEdit.mjs";
import IconX from "@tabler/icons-react/dist/esm/icons/IconX.mjs";
import IconGripVertical from "@tabler/icons-react/dist/esm/icons/IconGripVertical.mjs";
import IconArrowRight from "@tabler/icons-react/dist/esm/icons/IconArrowRight.mjs";
import { Button, Chip, Modal } from "./ui.jsx";
import { summarize } from "./model.mjs";
import { leaveInsights } from "./leave-insights.mjs";

const Grid = WidthProvider(GridLayout);

export const moduleWidgets = [
  "学生信息",
  "请假销假",
  "日常管理",
  "学风建设",
  "奖惩助贷",
  "工作留痕",
].map((name, i) => ({
  i: `module:${name}`,
  x: (i % 3) * 4,
  y: Math.floor(i / 3) * 3,
  w: 4,
  h: 3,
  minW: 3,
  minH: 3,
}));

export const defaultWidgets = [
  { i: "overview", x: 0, y: 6, w: 12, h: 4, minW: 6, minH: 4 },
  { i: "leaveStats", x: 0, y: 10, w: 12, h: 9, minW: 6, minH: 6 },
  { i: "majors", x: 0, y: 19, w: 6, h: 7, minW: 4, minH: 5 },
  { i: "tasks", x: 6, y: 19, w: 6, h: 7, minW: 4, minH: 4 },
  ...moduleWidgets,
];

export function Home({
  widgets,
  onLayout,
  students,
  records,
  tasks,
  activeModules,
  navigate,
  onTask,
  onAddTask,
}) {
  const [editing, setEditing] = useState(false),
    [adding, setAdding] = useState(false),
    [width, setWidth] = useState(1200),
    host = useRef(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) =>
      setWidth(entries[0].contentRect.width),
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);

  const cols = width < 650 ? 4 : 12;
  const summary = useMemo(() => summarize(students, records), [students, records]);
  const leaveSummary = useMemo(
    () => leaveInsights(students, records),
    [students, records],
  );

  // 确保即使老的 prefs.grid 里没有 leaveStats 也能按需求向用户展示“恢复首页默认布局”或在存在时正常渲染
  const effectiveWidgets = useMemo(() => {
    const list = widgets || defaultWidgets;
    if (!list.some((w) => w.i === "leaveStats")) {
      return [
        ...list,
        { i: "leaveStats", x: 0, y: Math.max(0, ...list.map((w) => w.y + w.h)), w: 12, h: 9, minW: 6, minH: 6 },
      ];
    }
    return list;
  }, [widgets]);

  const layout = effectiveWidgets.map((w) => ({
    ...w,
    w: Math.min(w.w, cols),
    x: Math.min(w.x, Math.max(0, cols - Math.min(w.w, cols))),
    minW: Math.min(w.minW || 3, cols),
  }));

  const save = (next) =>
    onLayout(
      next.map((w) => ({
        i: w.i,
        x: w.x,
        y: w.y,
        w: w.w,
        h: w.h,
        minW: w.minW,
        minH: w.minH,
      })),
    );

  const add = (id) => {
    const type = id.startsWith("module:") ? "module" : id;
    onLayout([
      ...effectiveWidgets,
      {
        i: id,
        x: 0,
        y: Math.max(0, ...effectiveWidgets.map((w) => w.y + w.h)),
        w: type === "overview" || type === "leaveStats" ? 12 : type === "module" ? 4 : 6,
        h: type === "module" ? 3 : type === "leaveStats" ? 9 : 7,
        minW: 3,
        minH: type === "module" ? 2 : 4,
      },
    ]);
    setAdding(false);
  };

  const majors = Object.entries(
    students.reduce((s, v) => ({ ...s, [v.major]: (s[v.major] || 0) + 1 }), {}),
  ).map(([name, count]) => ({ name, count }));

  const maxCatHours = Math.max(
    1,
    ...(leaveSummary.categories || []).map((c) => c.hours || 0),
  );

  return (
    <div className="home" ref={host}>
      <div className="home-actions">
        <Button onClick={() => setAdding(true)}>
          <IconPlus size={16} />
          添加组件
        </Button>
        <Button
          className={editing ? "selected" : ""}
          onClick={() => setEditing(!editing)}
        >
          <IconEdit size={16} />
          {editing ? "完成布局" : "编辑布局"}
        </Button>
      </div>
      <Grid
        className="dashboard-grid"
        cols={cols}
        rowHeight={28}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        layout={layout}
        isDraggable={editing}
        isResizable={editing}
        draggableHandle=".widget-header"
        draggableCancel="button,input,a,select"
        resizeHandles={["se", "e", "s"]}
        onDragStop={save}
        onResizeStop={save}
        compactType="vertical"
        preventCollision={false}
      >
        {effectiveWidgets.map((w) => (
          <div
            key={w.i}
            className={`widget grid-widget ${editing ? "grid-editing" : ""}`}
          >
            <div className="widget-header">
              {editing && <IconGripVertical size={18} />}
              <h2>
                {{
                  overview: "数据概览",
                  leaveStats: "请假重点统计（频次 · 时长 · 事由 · 导师团组）",
                  majors: "专业分布",
                  tasks: "工作待办",
                }[w.i] || w.i.replace("module:", "")}
              </h2>
              {w.i === "leaveStats" && !editing && (
                <Button size="sm" variant="tertiary" onClick={() => navigate("请假销假")}>
                  进入请假模块
                  <IconArrowRight size={15} />
                </Button>
              )}
              {editing && (
                <Button
                  variant="tertiary"
                  size="sm"
                  aria-label={`移除组件${w.i}`}
                  onClick={() =>
                    onLayout(effectiveWidgets.filter((v) => v.i !== w.i))
                  }
                >
                  <IconX size={16} />
                </Button>
              )}
            </div>

            {w.i === "overview" && (
              <div className="metrics">
                {[
                  ["学生人数", "students"],
                  ["事件数", "events"],
                  ["记录数", "records"],
                  ["当前在校", "present"],
                  ["请假离校", "leave"],
                  ["心理关注", "concern"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <span>{label}</span>
                    <strong>{summary[key]}</strong>
                  </div>
                ))}
              </div>
            )}

            {w.i === "leaveStats" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, minHeight: 0, overflow: "auto" }}>
                <div className="leave-stat-grid">
                  <div className="leave-stat-item">
                    <span>当前请假中</span>
                    <strong className="stat-value" style={{ color: "var(--warning)" }}>
                      {leaveSummary.activeCount} 人
                    </strong>
                  </div>
                  <div className="leave-stat-item">
                    <span>待审批 / 待销假</span>
                    <strong className="stat-value" style={{ color: "var(--accent)" }}>
                      {leaveSummary.pendingCount} 条
                    </strong>
                  </div>
                  <div className="leave-stat-item">
                    <span>获批总时长（频次 {leaveSummary.total} 次）</span>
                    <strong className="stat-value">{leaveSummary.totalHours} h</strong>
                  </div>
                  <div className="leave-stat-item">
                    <span>单次平均时长</span>
                    <strong className="stat-value">{leaveSummary.avgHours} h</strong>
                  </div>
                </div>

                <div className="leave-split">
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 8 }}>
                      按事由分类频次与时长
                    </div>
                    <div className="leave-bar-list">
                      {(leaveSummary.categories || []).slice(0, 6).map((c) => (
                        <div key={c.label} className="leave-bar-row">
                          <span>{c.label}</span>
                          <div className="leave-bar-track">
                            <div
                              className="leave-bar-fill"
                              style={{
                                width: `${Math.max(6, (c.hours / maxCatHours) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="tabular" style={{ textAlign: "right", color: "var(--muted)" }}>
                            {c.count}次 · {c.hours}h
                          </span>
                        </div>
                      ))}
                      {!leaveSummary.categories?.length && (
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>暂无获批请假统计</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)" }}>
                      高频长时关注 & 同导师科研团队出差（{leaveSummary.advisorGroups.length} 组）
                    </div>
                    {leaveSummary.advisorGroups.slice(0, 2).map((g) => (
                      <div
                        key={g.id}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 8,
                          background: "var(--warning-soft)",
                          fontSize: 12,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span>
                          <strong>{g.advisor}</strong> · {g.category} ({g.destination})
                        </span>
                        <Chip color="warning" variant="soft">
                          {g.count}人同行
                        </Chip>
                      </div>
                    ))}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {(leaveSummary.studentDurations || []).slice(0, 3).map((stu) => (
                        <div
                          key={stu.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 12,
                            padding: "4px 8px",
                            borderRadius: 6,
                            background: "var(--surface-secondary)",
                          }}
                        >
                          <span>{stu.label}</span>
                          <span className="tabular" style={{ color: "var(--muted)" }}>
                            {stu.count}次 · {stu.hours}h
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {w.i === "majors" && (
              <div className="grid-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={majors}
                    layout="vertical"
                    margin={{ right: 32, bottom: 5 }}
                  >
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={width < 850 ? 140 : 190}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--foreground)", fontSize: 13 }}
                    />
                    <Tooltip />
                    <Bar
                      isAnimationActive={false}
                      dataKey="count"
                      name="人数"
                      fill="var(--accent)"
                      barSize={24}
                      radius={[0, 4, 4, 0]}
                      label={{ position: "right", fill: "var(--foreground)" }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {w.i === "tasks" && (
              <div className="task-list">
                {tasks.map((t) => (
                  <label key={t.id} className={t.done ? "done" : ""}>
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => onTask(t)}
                    />
                    <time>{t.date.slice(5)}</time>
                    <span>{t.text}</span>
                  </label>
                ))}
                <Button variant="tertiary" className="task-add" onClick={onAddTask}>
                  <IconPlus size={16} />
                  新增待办
                </Button>
              </div>
            )}

            {w.i.startsWith("module:") && (
              <Button
                variant="ghost"
                className="module-entry"
                onClick={() => navigate(w.i.slice(7))}
              >
                进入{w.i.slice(7)}
                <IconArrowRight size={18} />
              </Button>
            )}
          </div>
        ))}
      </Grid>
      {adding && (
        <Modal title="添加组件" wide onClose={() => setAdding(false)}>
          <h3>数据组件</h3>
          <div className="component-catalog">
            {[
              ["overview", "数据概览"],
              ["leaveStats", "请假重点统计"],
              ["majors", "专业分布"],
              ["tasks", "工作待办"],
            ].map(([id, label]) => (
              <Button
                key={id}
                disabled={effectiveWidgets.some((w) => w.i === id)}
                onClick={() => add(id)}
              >
                <IconPlus size={16} />
                {label}
              </Button>
            ))}
          </div>
          <h3>板块入口</h3>
          <div className="component-catalog">
            {activeModules.map((m) => (
              <Button
                key={m}
                disabled={effectiveWidgets.some((w) => w.i === `module:${m}`)}
                onClick={() => add(`module:${m}`)}
              >
                <IconPlus size={16} />
                {m}
              </Button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
