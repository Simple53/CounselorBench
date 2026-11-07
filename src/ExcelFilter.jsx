import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui.jsx";
export function excelMatch(value, filter) {
  const text = String(value ?? "");
  if (!filter) return true;
  if (typeof filter === "string") return text.includes(filter);
  if (filter.values && !filter.values.includes(text)) return false;
  const conditions = (filter.conditions || []).filter(
    (c) => c.op === "blank" || c.op === "notblank" || c.value !== "",
  );
  const results = conditions.map((c) => {
    const a = text.toLocaleLowerCase(),
      b = c.value.toLocaleLowerCase();
    const numeric =
      text.trim() !== "" &&
      c.value.trim() !== "" &&
      Number.isFinite(Number(text)) &&
      Number.isFinite(Number(c.value));
    const x = numeric ? Number(text) : text,
      y = numeric ? Number(c.value) : c.value;
    return {
      eq: a === b,
      neq: a !== b,
      contains: a.includes(b),
      excludes: !a.includes(b),
      starts: a.startsWith(b),
      ends: a.endsWith(b),
      gt: x > y,
      gte: x >= y,
      lt: x < y,
      lte: x <= y,
      blank: text.trim() === "",
      notblank: text.trim() !== "",
    }[c.op];
  });
  return (
    !results.length ||
    (filter.mode === "or" ? results.some(Boolean) : results.every(Boolean))
  );
}
const operators = {
  contains: "包含",
  excludes: "不包含",
  eq: "等于",
  neq: "不等于",
  starts: "开头是",
  ends: "结尾是",
  gt: "大于／晚于",
  gte: "大于等于／不早于",
  lt: "小于／早于",
  lte: "小于等于／不晚于",
  blank: "为空",
  notblank: "非空",
};
export function ExcelFilter({ column, rows, anchor, onClose }) {
  const values = [...new Set(rows.map((r) => String(r[column.id] ?? "")))].sort(
    (a, b) => a.localeCompare(b, "zh-CN", { numeric: true }),
  );
  const previous = column.getFilterValue();
  const [selected, setSelected] = useState(previous?.values || values),
    [search, setSearch] = useState(""),
    [mode, setMode] = useState(previous?.mode || "and"),
    [conditions, setConditions] = useState(
      previous?.conditions || [
        { op: "contains", value: "" },
        { op: "contains", value: "" },
      ],
    );
  const visible = values.filter((v) =>
    v.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  const update = (i, key, value) =>
    setConditions((s) =>
      s.map((c, j) => (i === j ? { ...c, [key]: value } : c)),
    );
  return createPortal(
    <div className="filter-backdrop" onClick={onClose}>
      <section
        role="dialog"
        aria-label={`筛选${column.columnDef.header}`}
        className="excel-filter"
        style={{
          left: Math.max(12, Math.min(anchor.left, window.innerWidth - 354)),
          top: Math.min(
            anchor.bottom + 6,
            Math.max(12, window.innerHeight - 620),
          ),
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <strong>筛选{column.columnDef.header}</strong>
        <div className="filter-actions">
          <Button
            onClick={() => {
              column.toggleSorting(false);
              onClose();
            }}
          >
            升序
          </Button>
          <Button
            onClick={() => {
              column.toggleSorting(true);
              onClose();
            }}
          >
            降序
          </Button>
          <Button
            onClick={() => {
              column.setFilterValue(undefined);
              onClose();
            }}
          >
            清除筛选
          </Button>
        </div>
        <input
          autoFocus
          aria-label="搜索筛选值"
          placeholder="搜索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-actions">
          <Button
            onClick={() => setSelected((s) => [...new Set([...s, ...visible])])}
          >
            全选
          </Button>
          <Button
            onClick={() =>
              setSelected((s) => s.filter((v) => !visible.includes(v)))
            }
          >
            全不选
          </Button>
          <Button
            onClick={() =>
              setSelected((s) => [
                ...s.filter((v) => !visible.includes(v)),
                ...visible.filter((v) => !s.includes(v)),
              ])
            }
          >
            反选
          </Button>
        </div>
        <div className="filter-values">
          {visible.map((v) => (
            <label key={v}>
              <input
                type="checkbox"
                checked={selected.includes(v)}
                onChange={() =>
                  setSelected((s) =>
                    s.includes(v) ? s.filter((x) => x !== v) : [...s, v],
                  )
                }
              />
              {v || "（空白）"}
            </label>
          ))}
          {!visible.length && <p>无匹配值</p>}
        </div>
        <details>
          <summary>条件筛选</summary>
          {conditions.map((c, i) => (
            <React.Fragment key={i}>
              {i === 1 && (
                <select
                  aria-label="条件关系"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <option value="and">且</option>
                  <option value="or">或</option>
                </select>
              )}
              <div className="filter-condition">
                <select
                  aria-label={`条件${i + 1}`}
                  value={c.op}
                  onChange={(e) => update(i, "op", e.target.value)}
                >
                  {Object.entries(operators).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <input
                  aria-label={`条件值${i + 1}`}
                  disabled={["blank", "notblank"].includes(c.op)}
                  value={c.value}
                  onChange={(e) => update(i, "value", e.target.value)}
                />
              </div>
            </React.Fragment>
          ))}
        </details>
        <footer>
          <Button onClick={onClose}>取消</Button>
          <Button
            primary
            onClick={() => {
              column.setFilterValue({
                values: search
                  ? selected.filter((v) => visible.includes(v))
                  : selected.length === values.length
                    ? null
                    : selected,
                conditions,
                mode,
              });
              onClose();
            }}
          >
            应用筛选
          </Button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
