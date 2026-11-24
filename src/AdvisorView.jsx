import React, { useState, useMemo } from "react";
import { Card, Chip } from "./ui.jsx";
import { groupStudentsByAdvisor } from "./model.mjs";
import { detectAdvisorProjectGroups } from "./leave-insights.mjs";

export function AdvisorView({ students, records, onSelectStudent }) {
  const [search, setSearch] = useState("");
  const [onlyOuting, setOnlyOuting] = useState(false);

  const advisorGroups = useMemo(
    () => groupStudentsByAdvisor(students, records),
    [students, records],
  );
  const tripGroups = useMemo(
    () => detectAdvisorProjectGroups(students, records),
    [students, records],
  );

  const filtered = useMemo(() => {
    return advisorGroups.filter((g) => {
      if (
        onlyOuting &&
        g.leaveCount === 0 &&
        !tripGroups.some((t) => t.advisor === g.advisor)
      ) {
        return false;
      }
      if (!search.trim()) return true;
      const q = search.trim();
      return (
        g.advisor.includes(q) ||
        g.majors.some((m) => m.includes(q)) ||
        g.members.some((m) => (m.name + m.number + m.className).includes(q))
      );
    });
  }, [advisorGroups, tripGroups, search, onlyOuting]);

  return (
    <div className="advisor-view">
      <h1>导师视图</h1>
      <div className="toolbar">
        <input
          aria-label="搜索导师或门下学生"
          placeholder="搜索导师姓名、专业或学生姓名学号"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="check-row" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={onlyOuting}
            onChange={(e) => setOnlyOuting(e.target.checked)}
          />
          只看有请假/出差学生的导师组
        </label>
      </div>

      <div className="advisor-grid">
        {filtered.map((g) => {
          const teamTrips = tripGroups.filter((t) => t.advisor === g.advisor);
          return (
            <Card key={g.advisor} className="advisor-card">
              <Card.Header>
                <div>
                  <Card.Title>{g.advisor}</Card.Title>
                  <Card.Description>
                    {g.majors.join(" / ") || "未标注专业"} · 门下{" "}
                    <span className="tabular">{g.members.length}</span> 名学生
                  </Card.Description>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <Chip color="success">
                    在校 <span className="tabular">{g.presentCount}</span>
                  </Chip>
                  {g.leaveCount > 0 && (
                    <Chip color="warning">
                      离校 <span className="tabular">{g.leaveCount}</span>
                    </Chip>
                  )}
                </div>
              </Card.Header>

              {teamTrips.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {teamTrips.map((trip) => (
                    <div
                      key={trip.id}
                      style={{
                        padding: "8px 10px",
                        borderRadius: "8px",
                        background: "var(--warning-soft)",
                        fontSize: 12,
                      }}
                    >
                      <Chip color="warning" variant="soft">
                        同项目多人外出 · {trip.category}
                      </Chip>{" "}
                      <strong>{trip.projectName}</strong>（{trip.destination}，
                      <span className="tabular">{trip.count}</span> 人同行）
                    </div>
                  ))}
                </div>
              )}

              <div className="advisor-student-list">
                {g.members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="advisor-student-chip"
                    onClick={() => onSelectStudent(m)}
                    title={`${m.name} · ${m.number} - 点击查看详细信息`}
                  >
                    <div className="advisor-student-chip__row">
                      <span>{m.name}</span>
                      <Chip
                        color={m.status === "请假离校" ? "warning" : "success"}
                        variant="dot"
                      >
                        {m.status === "请假离校" ? "离校" : "在校"}
                      </Chip>
                    </div>
                    <small className="tabular">
                      {m.dorm || "未定"}
                      {m.bedNumber ? ` · ${m.bedNumber}床` : ""}
                      {m.residenceStatus && m.residenceStatus !== "正常住宿"
                        ? ` · ${m.residenceStatus}`
                        : ""}
                    </small>
                  </button>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {!filtered.length && (
        <div className="empty">没有匹配的指导导师记录</div>
      )}
    </div>
  );
}
