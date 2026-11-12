import React, { useState, useMemo } from "react";
import { Button } from "./ui.jsx";
import { StepperProgress, getPoliticalStep } from "./StepperProgress.jsx";

export function PartyBuildingView({ students, records, onSelectStudent, onAddRecord }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const categorized = useMemo(() => {
    return students.map((s) => {
      const step = getPoliticalStep(s.political);
      const partyRecords = records.filter(
        (r) => r.studentId === s.id && r.module === "党团建设",
      );
      return {
        ...s,
        step,
        partyRecords,
      };
    });
  }, [students, records]);

  const filtered = useMemo(() => {
    return categorized.filter((s) => {
      if (search && !(s.name + s.number + s.className + s.political).includes(search)) {
        return false;
      }
      if (filter === "party") return s.step === 5;
      if (filter === "developing") return s.step >= 1 && s.step <= 4;
      if (filter === "mass") return s.step === 0;
      return true;
    });
  }, [categorized, filter, search]);

  const counts = useMemo(() => {
    return {
      all: categorized.length,
      party: categorized.filter((s) => s.step === 5).length,
      developing: categorized.filter((s) => s.step >= 1 && s.step <= 4).length,
      mass: categorized.filter((s) => s.step === 0).length,
    };
  }, [categorized]);

  return (
    <div className="party-building-view">
      <h1>党团建设 · 党员发展全周期管理</h1>
      <div className="toolbar" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          aria-label="搜索学生"
          placeholder="搜索姓名、学号、班级…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="segmented">
          {[
            ["all", `全部 (${counts.all})`],
            ["developing", `培养发展中 (${counts.developing})`],
            ["party", `正式党员 (${counts.party})`],
            ["mass", `团员群众 (${counts.mass})`],
          ].map(([key, label]) => (
            <button
              key={key}
              className={filter === key ? "active" : ""}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <Button primary onClick={onAddRecord}>
          新增党团记录
        </Button>
      </div>

      <div className="party-student-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 14, marginTop: 14 }}>
        {filtered.map((s) => (
          <article
            key={s.id}
            className="widget"
            style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, cursor: "pointer" }}
            onClick={() => onSelectStudent(s)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <strong style={{ fontSize: 16 }}>{s.name}</strong>
                <span style={{ marginLeft: 8, fontSize: 13, opacity: 0.8 }}>{s.number}</span>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{s.className} · {s.major}</div>
              </div>
              <span
                className="care-badge"
                style={{
                  padding: "3px 8px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: s.step === 5 ? "#dcfce7" : s.step >= 1 ? "#dbeafe" : "#f1f5f9",
                  color: s.step === 5 ? "#15803d" : s.step >= 1 ? "#1d4ed8" : "#475569",
                }}
              >
                {s.political || "群众"}
              </span>
            </div>

            <StepperProgress political={s.political} />

            <div style={{ borderTop: "1px dashed var(--border, #e2e8f0)", paddingTop: 8, fontSize: 12 }}>
              <span style={{ fontWeight: 600 }}>阶段记录 ({s.partyRecords.length} 条)：</span>
              {s.partyRecords.length ? (
                <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                  {s.partyRecords.slice(0, 2).map((r) => (
                    <li key={r.id} style={{ opacity: 0.85 }}>
                      [{r.date}] {r.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <span style={{ opacity: 0.6, marginLeft: 6 }}>暂无详细考察材料记录</span>
              )}
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && <div className="empty">没有匹配的学生</div>}
    </div>
  );
}
