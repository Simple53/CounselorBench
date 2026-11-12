import React, { useState, useMemo } from "react";
import { Button, Modal } from "./ui.jsx";
import { groupStudentsByDorm } from "./model.mjs";

export function DormView({ students, records, onSelectStudent }) {
  const [buildingFilter, setBuildingFilter] = useState(""),
    [search, setSearch] = useState("");

  const rooms = useMemo(() => groupStudentsByDorm(students), [students]);
  const buildings = useMemo(
    () => [...new Set(rooms.map((r) => r.building))],
    [rooms],
  );
  const filteredRooms = useMemo(
    () =>
      rooms.filter(
        (r) =>
          (!buildingFilter || r.building === buildingFilter) &&
          (!search ||
            r.room.includes(search) ||
            r.members.some((m) => (m.name + m.number + m.className).includes(search))),
      ),
    [rooms, buildingFilter, search],
  );

  return (
    <div className="dorm-view">
      <h1>宿舍视图</h1>
      <div className="toolbar">
        <input
          aria-label="搜索宿舍或学生"
          placeholder="搜索寝室号、姓名或学号…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="筛选楼栋"
          value={buildingFilter}
          onChange={(e) => setBuildingFilter(e.target.value)}
        >
          <option value="">全部楼栋（{rooms.length} 间）</option>
          {buildings.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
      <div
        className="dorm-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 14,
          marginTop: 12,
        }}
      >
        {filteredRooms.map((r) => {
          const roomRecordCount = records.filter((rec) =>
            r.members.some((m) => m.id === rec.studentId),
          ).length;
          return (
            <section
              key={r.room}
              className="widget"
              style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}
            >
              <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{r.room}</strong>
                <span>
                  {r.members.length} 人 · 关联记录 {roomRecordCount} 条
                </span>
              </header>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {r.members.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 8px",
                      borderRadius: 6,
                      background: "var(--surface-2, rgba(0,0,0,0.03))",
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        textAlign: "left",
                        color: "inherit",
                        flex: 1,
                      }}
                      onClick={() => onSelectStudent(m)}
                    >
                      <b>{m.name}</b> <small>({m.status || "在校"})</small>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>{m.className} · {m.number}</div>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
