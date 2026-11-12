import React, { useState, useMemo } from "react";
import { Button, Modal } from "./ui.jsx";

export function parseGradeExcel(rows, headerIdx, mapping) {
  const dataRows = rows.slice(headerIdx + 1);
  const grades = [];
  for (const r of dataRows) {
    if (!Array.isArray(r)) continue;
    const number = String(r[Number(mapping.number)] ?? "").trim();
    const course = String(r[Number(mapping.course)] ?? "").trim();
    const scoreVal = r[Number(mapping.score)];
    const score = Number(scoreVal);
    if (!number || !course) continue;
    grades.push({
      number,
      name: String(r[Number(mapping.name)] ?? "").trim(),
      course,
      credit: Number(r[Number(mapping.credit)]) || 2,
      score: Number.isFinite(score) ? score : scoreVal,
      failed: Number.isFinite(score) ? score < 60 : /不及格|不合格|重修/.test(String(scoreVal)),
    });
  }
  return grades;
}

export function AcademicStudyView({ students, grades = [], onImportGrades, onSelectStudent, onAddRecord }) {
  const [modal, setModal] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const studentGradeSummary = useMemo(() => {
    const map = new Map();
    for (const s of students) {
      const stuGrades = grades.filter((g) => g.number === s.number);
      const failedCourses = stuGrades.filter((g) => g.failed);
      const passedCourses = stuGrades.filter((g) => !g.failed);
      const scores = stuGrades.map((g) => Number(g.score)).filter((n) => Number.isFinite(n));
      const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "-";

      map.set(s.id, {
        student: s,
        grades: stuGrades,
        failedCourses,
        passedCourses,
        avgScore: avg,
        warningLevel: failedCourses.length >= 3 ? "重度预警" : failedCourses.length >= 1 ? "轻度预警" : "正常",
      });
    }
    return map;
  }, [students, grades]);

  const list = useMemo(() => {
    return [...studentGradeSummary.values()].filter((item) => {
      const s = item.student;
      if (search && !(s.name + s.number + s.className).includes(search)) return false;
      if (filter === "failed") return item.failedCourses.length > 0;
      if (filter === "severe") return item.failedCourses.length >= 3;
      if (filter === "normal") return item.failedCourses.length === 0;
      return true;
    });
  }, [studentGradeSummary, search, filter]);

  const totalFailed = useMemo(
    () => [...studentGradeSummary.values()].filter((x) => x.failedCourses.length > 0).length,
    [studentGradeSummary],
  );

  return (
    <div className="academic-study-view">
      <h1>学风建设 · 成绩综合分析与学业帮扶</h1>

      <div className="daily-summary" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 14 }}>
        <section style={{ background: "var(--surface)", padding: 12, borderRadius: 8 }}>
          <h2 style={{ fontSize: 13, opacity: 0.8 }}>已导入成绩记录</h2>
          <strong style={{ fontSize: 24, color: "#2563eb" }}>{grades.length} 条</strong>
        </section>
        <section style={{ background: "var(--surface)", padding: 12, borderRadius: 8 }}>
          <h2 style={{ fontSize: 13, opacity: 0.8 }}>学业预警 (挂科 $\ge 1$)</h2>
          <strong style={{ fontSize: 24, color: totalFailed ? "#dc2626" : "#16a34a" }}>{totalFailed} 人</strong>
        </section>
        <section style={{ background: "var(--surface)", padding: 12, borderRadius: 8 }}>
          <h2 style={{ fontSize: 13, opacity: 0.8 }}>挂科率</h2>
          <strong style={{ fontSize: 24 }}>
            {students.length ? ((totalFailed / students.length) * 100).toFixed(1) : 0}%
          </strong>
        </section>
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
            ["failed", `挂科预警 (${totalFailed})`],
            ["severe", "严重预警 (挂科≥3)"],
            ["normal", "成绩正常"],
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
        <Button onClick={() => setModal("import-grade")}>
          导入成绩单 (Excel)
        </Button>
        <Button primary onClick={onAddRecord}>
          登记学风记录
        </Button>
      </div>

      <div className="table-scroll" style={{ marginTop: 14 }}>
        <table>
          <thead>
            <tr>
              <th>学生</th>
              <th>班级</th>
              <th>平均成绩</th>
              <th>挂科门数</th>
              <th>挂科科目清单</th>
              <th>预警等级</th>
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
                  <td>{s.className}</td>
                  <td>{item.avgScore}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: item.failedCourses.length ? "#dc2626" : "inherit" }}>
                      {item.failedCourses.length} 门
                    </span>
                  </td>
                  <td>
                    {item.failedCourses.length ? (
                      item.failedCourses.map((c, i) => (
                        <span key={i} className="care-badge" style={{ background: "#fee2e2", color: "#b91c1c", marginRight: 4, display: "inline-block", marginBottom: 2 }}>
                          {c.course} ({c.score})
                        </span>
                      ))
                    ) : (
                      <span style={{ color: "#16a34a" }}>全部合格</span>
                    )}
                  </td>
                  <td>
                    <span
                      className="care-badge"
                      style={{
                        background: item.warningLevel === "重度预警" ? "#fee2e2" : item.warningLevel === "轻度预警" ? "#fef3c7" : "#dcfce7",
                        color: item.warningLevel === "重度预警" ? "#b91c1c" : item.warningLevel === "轻度预警" ? "#b45309" : "#15803d",
                      }}
                    >
                      {item.warningLevel}
                    </span>
                  </td>
                  <td>
                    <Button onClick={(e) => { e.stopPropagation(); onSelectStudent(s); }}>
                      帮扶谈心
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal === "import-grade" && (
        <GradeImportModal
          onClose={() => setModal("")}
          onImport={(imported) => {
            onImportGrades(imported);
            setModal("");
          }}
        />
      )}
    </div>
  );
}

function GradeImportModal({ onClose, onImport }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await file.arrayBuffer());
      const ws = wb.worksheets[0];
      if (!ws) throw Error("Excel 工作表为空");
      const rows = [];
      ws.eachRow((row) => {
        const vals = Array.isArray(row.values) ? row.values.slice(1) : [];
        rows.push(vals.map((v) => (v != null && typeof v === "object" ? v.text || v.result || "" : v)));
      });
      if (!rows.length) throw Error("未读取到成绩行");
      const headers = rows[0].map((h) => String(h || "").trim());
      const numIdx = headers.findIndex((h) => /学号/.test(h));
      const nameIdx = headers.findIndex((h) => /姓名/.test(h));
      const courseIdx = headers.findIndex((h) => /课程|科目/.test(h));
      const scoreIdx = headers.findIndex((h) => /成绩|分数|总评/.test(h));
      const creditIdx = headers.findIndex((h) => /学分/.test(h));

      if (numIdx === -1 || courseIdx === -1 || scoreIdx === -1) {
        throw Error("表头需包含【学号】、【课程】和【成绩】列");
      }

      const parsed = parseGradeExcel(rows, 0, {
        number: numIdx,
        name: nameIdx !== -1 ? nameIdx : numIdx,
        course: courseIdx,
        score: scoreIdx,
        credit: creditIdx,
      });

      if (!parsed.length) throw Error("未解析到有效成绩数据");
      onImport(parsed);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="导入成绩单 (Excel)" onClose={onClose}>
      <label className="file-button">
        {loading ? "正在解析成绩…" : "选择成绩单 Excel (.xlsx)"}
        <input type="file" accept=".xlsx" onChange={handleFile} />
      </label>
      {error && <p className="save-error" role="alert" style={{ marginTop: 10 }}>{error}</p>}
      <p style={{ fontSize: 13, opacity: 0.75, marginTop: 12 }}>
        表头规范：包含“学号”、“课程名称”、“成绩”（可带学分、姓名），系统将自动判定是否及格并进行综合分析。
      </p>
    </Modal>
  );
}
