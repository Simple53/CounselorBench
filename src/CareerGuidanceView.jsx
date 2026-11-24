import React, { useState, useMemo } from "react";
import { Button, Card, Chip } from "./ui.jsx";
import { getRecommendedCompanies } from "./careerRecommendations.mjs";

export function CareerGuidanceView({ students, records, onSelectStudent, onAddRecord }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const studentCareerMap = useMemo(() => {
    return students.map((s) => {
      const careerRecords = records.filter(
        (r) => r.studentId === s.id && r.module === "就业指导",
      );
      // 提取谈话中的职业意向
      const latestTalk = careerRecords[0];
      const targetMatch = latestTalk
        ? /【职业意向类型：([^】]+)】/.exec(latestTalk.summary || "")
        : null;
      const cityMatch = latestTalk
        ? /【意向城市\/地区：([^】]+)】/.exec(latestTalk.summary || "")
        : null;
      const careerTarget = targetMatch ? targetMatch[1] : s.concern ? "暂缓就业/待帮扶" : "企业就业";
      const targetCity = cityMatch ? cityMatch[1] : s.origin || "生源地/长三角";
      const recommendations = getRecommendedCompanies(s.major, careerTarget);

      return {
        student: s,
        careerRecords,
        careerTarget,
        targetCity,
        recommendations,
      };
    });
  }, [students, records]);

  const list = useMemo(() => {
    return studentCareerMap.filter((item) => {
      const s = item.student;
      if (search && !(s.name + s.number + s.className + s.major + item.careerTarget).includes(search)) {
        return false;
      }
      if (filter === "postgraduate") return item.careerTarget.includes("考研");
      if (filter === "civil") return item.careerTarget.includes("考公");
      if (filter === "enterprise") return item.careerTarget.includes("企业");
      if (filter === "hasTalk") return item.careerRecords.length > 0;
      return true;
    });
  }, [studentCareerMap, search, filter]);

  return (
    <div className="career-guidance-view">
      <h1>就业指导 · 职业意向谈话与对口企业精准推荐</h1>

      <div className="toolbar" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          aria-label="搜索姓名学号专业意向"
          placeholder="搜索姓名、学号、专业、意向…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="segmented">
          {[
            ["all", "全员"],
            ["hasTalk", "已有谈话意向"],
            ["enterprise", "企业就业"],
            ["postgraduate", "升学考研"],
            ["civil", "考公选调"],
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
          登记就业谈话
        </Button>
      </div>

      <div className="advisor-grid">
        {list.map((item) => {
          const s = item.student;
          return (
            <Card
              key={s.id}
              style={{ padding: 16, gap: 10, cursor: "pointer" }}
              onClick={() => onSelectStudent(s)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <strong style={{ fontSize: 16 }}>{s.name}</strong>
                  <span className="tabular" style={{ marginLeft: 8, fontSize: 13, color: "var(--muted)" }}>{s.number}</span>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{s.className} · {s.major}</div>
                </div>
                <Chip color="accent">{item.careerTarget}</Chip>
              </div>

              <div style={{ fontSize: 13, background: "var(--surface-secondary)", padding: 10, borderRadius: 8 }}>
                <div>
                  <strong>谈话意向：</strong>
                  <span>{item.careerTarget} · 意向城市：{item.targetCity}</span>
                </div>
                <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 12 }}>
                  谈话指导记录：{item.careerRecords.length} 次
                  {item.careerRecords[0] ? ` (最近: ${item.careerRecords[0].date})` : " (尚未开展专题谈话)"}
                </div>
              </div>

              <div>
                <strong style={{ fontSize: 12, color: "var(--success)" }}>推荐投递企业及方向：</strong>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                  {item.recommendations.map((c, i) => (
                    <div key={i} style={{ fontSize: 12, display: "flex", justifyContent: "space-between" }}>
                      <span><strong>{c.name}</strong> <small style={{ color: "var(--muted)" }}>({c.roles})</small></span>
                      <span style={{ color: "var(--muted)" }}>{c.locations}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {!list.length && <div className="empty">没有匹配的就业意向学生</div>}
    </div>
  );
}
