import React, { useState } from "react";
import { DataTable } from "./DataTable.jsx";
import { Button, Modal } from "./ui.jsx";
import { SearchSelect } from "./SearchSelect.jsx";
import { careLevels, careSchedule, careFields } from "./care.mjs";
import { today, localDate } from "./work.mjs";
export function Psychology({
  students,
  records,
  prefs,
  onPrefs,
  onStudent,
  onTalk,
  onPreview,
  onLog,
  onExport,
  profiles,
  setProfiles,
}) {
  const [modal, setModal] = useState(""),
    [error, setError] = useState("");
  const levels = prefs.careLevels || careLevels,
    cycles = prefs.careCycles || {},
    ahead = prefs.careAhead ?? 3;
  const options = students.map((s) => ({
    value: s.id,
    label: `${s.name} · ${s.number}`,
  }));
  const rows = profiles.map((p) => {
    const student = students.find((s) => s.id === p.studentId),
      level = levels.find((l) => l.id === p.level);
    const dates = records
      .filter(
        (r) =>
          r.studentId === p.studentId &&
          r.module === "心理健康" &&
          r.status === "已完成" &&
          r.date <= today(),
      )
      .map((r) => r.date);
    const lastTalk = [p.lastTalk, ...dates].filter(Boolean).sort().at(-1) || "";
    return {
      ...p,
      studentName: student?.name || "",
      number: student?.number || "",
      levelLabel: level?.label || "",
      cycle: cycles[p.level] ? `${cycles[p.level]}天` : "未设置",
      lastTalk,
      ...careSchedule({ ...p, lastTalk }, cycles, today(), ahead),
      _tone: level?.color || "blue",
    };
  });
  return (
    <>
      <div className="care-toolbar">
        <Button
          onClick={() => {
            setError("");
            setModal("profile");
          }}
        >
          关注管理
        </Button>
        <Button onClick={() => setModal("cycles")}>谈话周期</Button>
        <span>近期需谈话 {rows.filter((r) => r.due).length} 人</span>
        <span>
          已逾期 {rows.filter((r) => r.reminder === "已逾期").length} 人
        </span>
      </div>
      <DataTable
        title="心理健康"
        rows={rows}
        fields={careFields}
        student
        templates={prefs.templates.care || {}}
        onTemplates={(value) =>
          onPrefs({ templates: { ...prefs.templates, care: value } })
        }
        onPreview={(r) => onPreview(r, careFields)}
        onExport={(rs, cs) => onExport(rs, cs, "心理关注台账")}
        onComplete={(r) => onTalk(r.studentId)}
        actionLabel="登记谈话"
      />
      <details className="care-talks">
        <summary>谈话记录</summary>
        {records
          .filter((r) => r.module === "心理健康")
          .map((r) => (
            <button
              key={r.id}
              onDoubleClick={() =>
                onPreview(
                  {
                    ...r,
                    studentName: students.find((s) => s.id === r.studentId)
                      ?.name,
                  },
                  [
                    { id: "date", label: "日期" },
                    { id: "studentName", label: "学生" },
                    { id: "title", label: "标题" },
                    { id: "summary", label: "内容" },
                  ],
                )
              }
            >
              {r.date} · {students.find((s) => s.id === r.studentId)?.name} ·{" "}
              {r.title}
            </button>
          ))}
      </details>
      {modal === "profile" && (
        <Modal title="心理关注管理" onClose={() => setModal("")}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const d = Object.fromEntries(new FormData(e.currentTarget));
              const existing = profiles.find(
                (p) => p.studentId === d.studentId,
              );
              setProfiles((s) =>
                existing
                  ? s.map((p) =>
                      p.id === existing.id
                        ? { ...p, ...d, lastTalk: d.lastTalk || p.lastTalk }
                        : p,
                    )
                  : [...s, { ...d, id: crypto.randomUUID() }],
              );
              onLog(
                existing ? "调整关注" : "添加关注",
                "心理关注台账更新",
                "心理健康",
              );
              setModal("");
            }}
          >
            <SearchSelect
              label="所属学生"
              name="studentId"
              options={options}
              required
              studentCreate
              onCreate={onStudent}
            />
            <SearchSelect
              label="关注等级"
              name="level"
              options={levels.map((l) => ({ value: l.id, label: l.label }))}
              required
              onCreate={(q) => {
                const l = { id: crypto.randomUUID(), label: q, color: "blue" };
                onPrefs({ careLevels: [...levels, l] });
                return { value: l.id, label: l.label };
              }}
            />
            <label>
              最近谈话
              <input name="lastTalk" type="date" max={today()} />
            </label>
            {error && <p role="alert">{error}</p>}
            <Button primary>保存关注</Button>
          </form>
        </Modal>
      )}
      {modal === "cycles" && (
        <Modal title="谈话周期设置" onClose={() => setModal("")}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget),
                next = {};
              levels.forEach((l) => {
                next[l.id] = data.get(l.id) ? Number(data.get(l.id)) : null;
              });
              onPrefs({
                careCycles: next,
                careAhead: Number(data.get("ahead")),
              });
              onLog("调整周期", "谈话提醒规则更新", "心理健康");
              setModal("");
            }}
          >
            {levels.map((l) => (
              <label key={l.id}>
                <span className={`care-badge ${l.color}`}>{l.label}</span>
                <input
                  aria-label={`${l.label}周期`}
                  name={l.id}
                  type="number"
                  min="1"
                  max="365"
                  defaultValue={cycles[l.id] || ""}
                  placeholder="设置天数"
                />
              </label>
            ))}
            <label>
              提前提醒天数
              <input
                name="ahead"
                aria-label="提前提醒天数"
                type="number"
                min="0"
                max="30"
                defaultValue={ahead}
              />
            </label>
            <Button primary>保存周期</Button>
          </form>
        </Modal>
      )}
    </>
  );
}
