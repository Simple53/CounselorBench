import { useState } from "react";
import { groupStudentsByDorm } from "../../src/model.mjs";
import type { Row } from "./domain";

function getBedToneClass(s: Row) {
  const status = String(s.status || "");
  const res = String(s.residenceStatus || "");
  if (status.includes("逾期")) return "sc-bed-box--overdue";
  if (status.includes("请假") || status.includes("离校")) return "sc-bed-box--leave";
  if (res === "退宿") return "sc-bed-box--withdrawn";
  if (res === "走读") return "sc-bed-box--commute";
  if (res === "换宿舍") return "sc-bed-box--transferred";
  return "sc-bed-box--present";
}

export function DormPanel({
  students,
  onOpen,
}: {
  students: Row[];
  onOpen: (s: Row) => void;
}) {
  const [building, setBuilding] = useState("");
  const rooms: any[] = groupStudentsByDorm(students);
  return (
    <>
      <label className="sc-dorm-filter">
        楼栋
        <select
          aria-label="宿舍楼栋"
          value={building}
          onChange={(e) => setBuilding(e.target.value)}
        >
          <option value="">全部楼栋</option>
          {[...new Set(rooms.map((r) => r.building))].map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </label>
      <div className="sc-dorm-legend" aria-label="状态图例">
        <span className="sc-bed-pill sc-bed-box--present">在校</span>
        <span className="sc-bed-pill sc-bed-box--leave">请假离校</span>
        <span className="sc-bed-pill sc-bed-box--overdue">逾期未返</span>
        <span className="sc-bed-pill sc-bed-box--commute">走读</span>
        <span className="sc-bed-pill sc-bed-box--transferred">换宿舍</span>
        <span className="sc-bed-pill sc-bed-box--withdrawn">退宿</span>
      </div>
      {rooms
        .filter((r) => !building || r.building === building)
        .map((r) => (
          <section className="sc-dorm-room" key={r.room}>
            <h3>
              {r.room} · {r.members.length}人
            </h3>
            <div className="sc-bed-grid">
              {r.members.map((s: Row) => {
                const res = s.residenceStatus && s.residenceStatus !== "住宿" ? s.residenceStatus : "";
                return (
                  <button
                    type="button"
                    className={`sc-bed-box ${getBedToneClass(s)}`}
                    key={s.id}
                    onClick={() => onOpen(s)}
                  >
                    <div className="sc-bed-box__top">
                      <span className="sc-bed-num">
                        {s.bedNumber ? `${s.bedNumber}号床` : "待定床位"}
                      </span>
                      <span className="sc-bed-state">{s.status || "在校"}</span>
                    </div>
                    <strong className="sc-bed-name">{s.name}</strong>
                    {res && <span className="sc-bed-tag">{res}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
    </>
  );
}
