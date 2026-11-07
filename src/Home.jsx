import React, { useState, useEffect, useRef } from "react";
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
import { Button, Modal } from "./ui.jsx";
import { summarize } from "./model.mjs";
const Grid = WidthProvider(GridLayout);
export const moduleWidgets = [
  "学生信息",
  "日常管理",
  "学风建设",
  "资助育人",
  "心理健康",
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
  { i: "majors", x: 0, y: 10, w: 6, h: 7, minW: 4, minH: 5 },
  { i: "tasks", x: 6, y: 10, w: 6, h: 7, minW: 4, minH: 4 },
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
  const cols = width < 650 ? 4 : 12,
    summary = summarize(students, records);
  const layout = widgets.map((w) => ({
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
      ...widgets,
      {
        i: id,
        x: 0,
        y: Math.max(0, ...widgets.map((w) => w.y + w.h)),
        w: type === "overview" ? 12 : type === "module" ? 4 : 6,
        h: type === "module" ? 3 : 7,
        minW: 3,
        minH: type === "module" ? 2 : 4,
      },
    ]);
    setAdding(false);
  };
  const majors = Object.entries(
    students.reduce((s, v) => ({ ...s, [v.major]: (s[v.major] || 0) + 1 }), {}),
  ).map(([name, count]) => ({ name, count }));
  return (
    <div className="home" ref={host}>
      <div className="home-actions">
        <Button onClick={() => setAdding(true)}>
          <IconPlus />
          添加组件
        </Button>
        <Button
          className={editing ? "selected" : ""}
          onClick={() => setEditing(!editing)}
        >
          <IconEdit />
          {editing ? "完成布局" : "编辑布局"}
        </Button>
      </div>
      <Grid
        className="dashboard-grid"
        cols={cols}
        rowHeight={28}
        margin={[18, 18]}
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
        {widgets.map((w) => (
          <div
            key={w.i}
            className={`widget grid-widget ${editing ? "grid-editing" : ""}`}
          >
            <div className="widget-header">
              {editing && <IconGripVertical size={18} />}
              <h2>
                {{
                  overview: "数据概览",
                  majors: "专业分布",
                  tasks: "工作待办",
                }[w.i] || w.i.replace("module:", "")}
              </h2>
              {editing && (
                <Button
                  aria-label={`移除组件${w.i}`}
                  onClick={() => onLayout(widgets.filter((v) => v.i !== w.i))}
                >
                  <IconX size={18} />
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
                      tick={{ fill: "var(--text)", fontSize: 14 }}
                    />
                    <Tooltip />
                    <Bar
                      isAnimationActive={false}
                      dataKey="count"
                      name="人数"
                      fill="#1670ff"
                      barSize={26}
                      label={{ position: "right", fill: "var(--text)" }}
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
                <Button className="task-add" onClick={onAddTask}>
                  <IconPlus size={16} />
                  新增待办
                </Button>
              </div>
            )}
            {w.i.startsWith("module:") && (
              <Button
                className="module-entry"
                onClick={() => navigate(w.i.slice(7))}
              >
                进入{w.i.slice(7)}
                <IconArrowRight size={20} />
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
              ["majors", "专业分布"],
              ["tasks", "工作待办"],
            ].map(([id, label]) => (
              <Button
                key={id}
                disabled={widgets.some((w) => w.i === id)}
                onClick={() => add(id)}
              >
                <IconPlus />
                {label}
              </Button>
            ))}
          </div>
          <h3>板块入口</h3>
          <div className="component-catalog">
            {activeModules.map((m) => (
              <Button
                key={m}
                disabled={widgets.some((w) => w.i === `module:${m}`)}
                onClick={() => add(`module:${m}`)}
              >
                <IconPlus />
                {m}
              </Button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
