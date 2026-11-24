import React, { useState, useMemo } from "react";
import { Button, Card, Chip } from "./ui.jsx";

export function RewardAidView({ students, records, onSelectStudent, onAddRecord }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const studentRewardMap = useMemo(() => {
    const map = new Map();
    for (const s of students) {
      const related = records.filter(
        (r) =>
          r.studentId === s.id &&
          (r.module === "奖惩助贷" || r.module === "行为奖惩" || r.module === "资助育人"),
      );
      const scholarships = related.filter((r) =>
        /(奖学金|表彰|奖励|励志)/.test(r.title + (r.summary || "")),
      );
      const aids = related.filter((r) =>
        /(助学金|助学贷款|补助|困难|勤工)/.test(r.title + (r.summary || "")),
      );
      const disciplines = related.filter((r) =>
        /(处分|警告|记过|留校察看|通报|违纪)/.test(r.title + (r.summary || "")),
      );
      const lateBacks = records.filter(
        (r) =>
          r.studentId === s.id &&
          /(夜不归宿|晚归|夜归)/.test(r.title + (r.summary || "")),
      );

      map.set(s.id, {
        student: s,
        scholarships,
        aids,
        disciplines,
        lateBacks,
        totalEvents: related.length + lateBacks.length,
      });
    }
    return map;
  }, [students, records]);

  const list = useMemo(() => {
    return [...studentRewardMap.values()].filter((item) => {
      const s = item.student;
      if (search && !(s.name + s.number + s.className).includes(search)) return false;
      if (filter === "scholarship") return item.scholarships.length > 0;
      if (filter === "aid") return item.aids.length > 0;
      if (filter === "discipline") return item.disciplines.length > 0;
      if (filter === "lateBack") return item.lateBacks.length > 0;
      if (filter === "hasRecord") return item.totalEvents > 0;
      return true;
    });
  }, [studentRewardMap, filter, search]);

  const stats = useMemo(() => {
    let scholarshipCount = 0;
    let aidCount = 0;
    let disciplineCount = 0;
    let lateBackCount = 0;
    for (const item of studentRewardMap.values()) {
      if (item.scholarships.length) scholarshipCount++;
      if (item.aids.length) aidCount++;
      if (item.disciplines.length) disciplineCount++;
      if (item.lateBacks.length) lateBackCount++;
    }
    return { scholarshipCount, aidCount, disciplineCount, lateBackCount };
  }, [studentRewardMap]);

  return (
    <div className="reward-aid-view">
      <h1>奖惩助贷 · 学生综合资助与品行纪律看板</h1>

      <div className="summary-grid" style={{ marginBottom: 14 }}>
        <Card className="summary-card">
          <span className="summary-card__label">获各类奖学金</span>
          <strong className="summary-card__value" style={{ color: "var(--success)" }}>{stats.scholarshipCount} 人</strong>
        </Card>
        <Card className="summary-card">
          <span className="summary-card__label">困难资助 / 助学贷款</span>
          <strong className="summary-card__value" style={{ color: "var(--accent)" }}>{stats.aidCount} 人</strong>
        </Card>
        <Card className="summary-card">
          <span className="summary-card__label">违纪处分记录</span>
          <strong className="summary-card__value" style={{ color: stats.disciplineCount ? "var(--danger)" : "inherit" }}>{stats.disciplineCount} 人</strong>
        </Card>
        <Card className="summary-card">
          <span className="summary-card__label">夜不归宿 / 晚归记录</span>
          <strong className="summary-card__value" style={{ color: stats.lateBackCount ? "var(--warning)" : "inherit" }}>{stats.lateBackCount} 人</strong>
        </Card>
      </div>

      <div className="toolbar" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          aria-label="搜索姓名学号班级"
          placeholder="搜索姓名、学号、班级…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="segmented">
          {[
            ["all", "全员"],
            ["hasRecord", "有记录者"],
            ["scholarship", "奖学金获得者"],
            ["aid", "资助/助贷"],
            ["discipline", "违纪受处分"],
            ["lateBack", "夜不归宿/晚归"],
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
          登记奖惩助贷
        </Button>
      </div>

      <div className="table-scroll" style={{ marginTop: 14 }}>
        <table>
          <thead>
            <tr>
              <th>学生</th>
              <th>班级 / 宿舍</th>
              <th>奖学金记录</th>
              <th>助贷 / 困难资助</th>
              <th>违纪处分</th>
              <th>夜不归宿/晚归</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.slice(0, 100).map((item) => {
              const s = item.student;
              return (
                <tr key={s.id} onClick={() => onSelectStudent(s)} style={{ cursor: "pointer" }}>
                  <td>
                    <strong>{s.name}</strong>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>{s.number}</div>
                  </td>
                  <td>
                    <div>{s.className}</div>
                    <small style={{ opacity: 0.75 }}>{s.dorm || "未定宿舍"}</small>
                  </td>
                  <td>
                    {item.scholarships.length ? (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {item.scholarships.map((r) => (
                          <Chip key={r.id} color="success" variant="soft">
                            {r.title}
                          </Chip>
                        ))}
                      </div>
                    ) : (
                      <span style={{ opacity: 0.45 }}>-</span>
                    )}
                  </td>
                  <td>
                    {item.aids.length ? (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {item.aids.map((r) => (
                          <Chip key={r.id} color="accent" variant="soft">
                            {r.title}
                          </Chip>
                        ))}
                      </div>
                    ) : (
                      <span style={{ opacity: 0.45 }}>-</span>
                    )}
                  </td>
                  <td>
                    {item.disciplines.length ? (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {item.disciplines.map((r) => (
                          <Chip key={r.id} color="danger" variant="dot">
                            {r.title}
                          </Chip>
                        ))}
                      </div>
                    ) : (
                      <Chip color="success" variant="soft">无违纪</Chip>
                    )}
                  </td>
                  <td>
                    {item.lateBacks.length ? (
                      <Chip color="warning" variant="dot">
                        晚归 {item.lateBacks.length} 次
                      </Chip>
                    ) : (
                      <span style={{ opacity: 0.45 }}>正常</span>
                    )}
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStudent(s);
                      }}
                    >
                      详情
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!list.length && <div className="empty">没有匹配的奖惩助贷记录</div>}
    </div>
  );
}
