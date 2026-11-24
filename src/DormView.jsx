import React, { useState, useMemo } from "react";
import { Card, Chip } from "./ui.jsx";
import { groupStudentsByDorm, residenceOptions } from "./model.mjs";
import { leaveStatus, leaveOverdue } from "./leave.mjs";

function bedBoxStatus(student, records) {
  const res = student.residenceStatus || "正常住宿";
  const stuLeaves = records.filter(
    (r) => r.module === "请假销假" && r.studentId === student.id,
  );
  const overdue = stuLeaves.some((r) => leaveOverdue(r));
  const onLeave =
    student.status === "请假离校" ||
    stuLeaves.some((r) => leaveStatus(r) === "请假中");

  if (res === "退宿") {
    return { cls: "bed-box--withdrawn", chipColor: "default", dotText: "退宿" };
  }
  if (overdue) {
    return { cls: "bed-box--overdue", chipColor: "danger", dotText: "逾期未返" };
  }
  if (onLeave) {
    return { cls: "bed-box--leave", chipColor: "warning", dotText: "请假离校" };
  }
  if (res === "走读") {
    return { cls: "bed-box--commute", chipColor: "accent", dotText: "走读" };
  }
  if (res === "换宿舍") {
    return { cls: "bed-box--transferred", chipColor: "indigo", dotText: "换宿舍" };
  }
  return { cls: "bed-box--present", chipColor: "success", dotText: "在校" };
}

export function DormView({ students, records, onSelectStudent }) {
  const [buildingFilter, setBuildingFilter] = useState(""),
    [statusFilter, setStatusFilter] = useState("全部"),
    [search, setSearch] = useState("");

  const rooms = useMemo(() => groupStudentsByDorm(students), [students]);
  const buildings = useMemo(
    () => [...new Set(rooms.map((r) => r.building))],
    [rooms],
  );

  const filteredRooms = useMemo(
    () =>
      rooms
        .map((r) => {
          const members = r.members.filter((m) => {
            if (
              search &&
              !(
                r.room +
                m.name +
                m.number +
                m.className +
                (m.advisor || "")
              ).includes(search)
            ) {
              return false;
            }
            if (statusFilter === "全部") return true;
            if (statusFilter === "在校") return m.status !== "请假离校";
            if (statusFilter === "请假离校") return m.status === "请假离校";
            return (m.residenceStatus || "正常住宿") === statusFilter;
          });
          return { ...r, visibleMembers: members };
        })
        .filter(
          (r) =>
            (!buildingFilter || r.building === buildingFilter) &&
            r.visibleMembers.length > 0,
        ),
    [rooms, buildingFilter, statusFilter, search],
  );

  return (
    <div className="dorm-view">
      <h1>宿舍视图</h1>
      <div className="toolbar">
        <input
          aria-label="搜索宿舍或学生"
          placeholder="搜索寝室号、姓名、学号或导师"
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
        <select
          aria-label="筛选住宿状态"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {["全部", "在校", "请假离校", ...residenceOptions].map((opt) => (
            <option key={opt} value={opt}>
              {opt === "全部" ? "全部住宿/在校状态" : opt}
            </option>
          ))}
        </select>
      </div>

      <div className="dorm-legend" aria-label="床位颜色说明">
        <span style={{ fontSize: 13, color: "var(--muted)", marginRight: 4 }}>
          状态图例（按床号 1 → 4 排列，点击姓名查看详细信息）：
        </span>
        <Chip color="success">在校</Chip>
        <Chip color="warning">请假离校</Chip>
        <Chip color="danger">逾期未返</Chip>
        <Chip color="accent">走读</Chip>
        <Chip color="indigo">换宿舍</Chip>
        <Chip color="default">退宿</Chip>
      </div>

      <div className="dorm-grid">
        {filteredRooms.map((r) => {
          const roomRecordCount = records.filter((rec) =>
            r.members.some((m) => m.id === rec.studentId),
          ).length;
          return (
            <Card key={r.room} className="dorm-card">
              <Card.Header>
                <div>
                  <Card.Title>{r.room}</Card.Title>
                  <Card.Description>
                    <span className="tabular">{r.members.length} 人</span> · 关联记录{" "}
                    <span className="tabular">{roomRecordCount} 条</span>
                  </Card.Description>
                </div>
              </Card.Header>
              <div className="bed-grid">
                {r.visibleMembers.map((m, idx) => {
                  const st = bedBoxStatus(m, records);
                  const bedLabel = m.bedNumber ? `${m.bedNumber}号床` : `${idx + 1}号床`;
                  const resNote =
                    m.residenceStatus && m.residenceStatus !== "正常住宿"
                      ? m.residenceStatus
                      : null;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={`bed-box ${st.cls}`}
                      onClick={() => onSelectStudent(m)}
                      title={`${bedLabel} ${m.name}（${st.dotText}）- 点击查看详细信息`}
                    >
                      <div className="bed-box__top">
                        <span className="bed-box__num">{bedLabel}</span>
                        <span>{st.dotText}</span>
                      </div>
                      <div className="bed-box__name">{m.name}</div>
                      <div className="bed-box__meta">
                        {resNote ? (
                          <Chip color={st.chipColor} variant="soft">
                            {resNote}
                          </Chip>
                        ) : (
                          <span style={{ color: "var(--muted)" }} className="tabular">
                            {m.status === "请假离校"
                              ? "请假中"
                              : String(m.number || "").slice(-4)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
      {!filteredRooms.length && (
        <div className="empty">没有符合筛选条件的宿舍或学生</div>
      )}
    </div>
  );
}
