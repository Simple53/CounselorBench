import { Photos } from "./Photos.jsx";
import { BriefArchive } from "./BriefArchive.jsx";
import React, { useState, useMemo, useEffect, useRef } from "react";
import IconLayoutList from "@tabler/icons-react/dist/esm/icons/IconLayoutList.mjs";
import IconHome from "@tabler/icons-react/dist/esm/icons/IconHome.mjs";
import IconUser from "@tabler/icons-react/dist/esm/icons/IconUser.mjs";
import IconFlag from "@tabler/icons-react/dist/esm/icons/IconFlag.mjs";
import IconUsers from "@tabler/icons-react/dist/esm/icons/IconUsers.mjs";
import IconCalendar from "@tabler/icons-react/dist/esm/icons/IconCalendar.mjs";
import IconAward from "@tabler/icons-react/dist/esm/icons/IconAward.mjs";
import IconBook from "@tabler/icons-react/dist/esm/icons/IconBook.mjs";
import IconHeart from "@tabler/icons-react/dist/esm/icons/IconHeart.mjs";
import IconBriefcase from "@tabler/icons-react/dist/esm/icons/IconBriefcase.mjs";
import IconCoins from "@tabler/icons-react/dist/esm/icons/IconCoins.mjs";
import IconShield from "@tabler/icons-react/dist/esm/icons/IconShield.mjs";
import IconDeviceDesktop from "@tabler/icons-react/dist/esm/icons/IconDeviceDesktop.mjs";
import IconAlertTriangle from "@tabler/icons-react/dist/esm/icons/IconAlertTriangle.mjs";
import IconFileText from "@tabler/icons-react/dist/esm/icons/IconFileText.mjs";
import IconTrendingUp from "@tabler/icons-react/dist/esm/icons/IconTrendingUp.mjs";
import IconHistory from "@tabler/icons-react/dist/esm/icons/IconHistory.mjs";
import IconSettings from "@tabler/icons-react/dist/esm/icons/IconSettings.mjs";
import IconX from "@tabler/icons-react/dist/esm/icons/IconX.mjs";
import IconPlus from "@tabler/icons-react/dist/esm/icons/IconPlus.mjs";
import IconChevronLeft from "@tabler/icons-react/dist/esm/icons/IconChevronLeft.mjs";
import IconChevronRight from "@tabler/icons-react/dist/esm/icons/IconChevronRight.mjs";
import IconCopy from "@tabler/icons-react/dist/esm/icons/IconCopy.mjs";
import {
  groups,
  modules,
  fields,
  moduleSchemas,
  initialStudents,
  initialRecords,
  initialTasks,
  monthDays,
} from "./model.mjs";
import { ExcelImport } from "./ExcelImport.jsx";
import { DormView } from "./DormView.jsx";
import { PartyBuildingView } from "./PartyBuildingView.jsx";
import { RewardAidView } from "./RewardAidView.jsx";
import { AcademicStudyView } from "./AcademicStudyView.jsx";
import { CareerGuidanceView } from "./CareerGuidanceView.jsx";
import { AccountManagementView } from "./AccountManagementView.jsx";
import { BatchPhotoImportModal } from "./BatchPhotoImportModal.jsx";
import {
  recordFields,
  traceFields,
  dailyReport,
  today,
  localDate,
} from "./work.mjs";
import { Button, Modal } from "./ui.jsx";
import { DataTable } from "./DataTable.jsx";
import { Home, defaultWidgets, moduleWidgets } from "./Home.jsx";
import { Assistant } from "./Assistant.jsx";
import { exportPackage } from "./files.js";
import { SearchSelect } from "./SearchSelect.jsx";
import { Psychology } from "./Psychology.jsx";
import { modelPresets } from "./model-presets.mjs";
import { initialCareProfiles } from "./care.mjs";
import "./workspace.css";
const icons = [
  IconUser,
  IconFlag,
  IconUsers,
  IconCalendar,
  IconAward,
  IconBook,
  IconHeart,
  IconBriefcase,
  IconCoins,
  IconShield,
  IconDeviceDesktop,
  IconAlertTriangle,
  IconFileText,
  IconTrendingUp,
  IconHistory,
];
const defaultTemplates = {
  student: {
    基础档案: ["name", "number", "className", "year", "phone", "attachments"],
    学籍信息: ["name", "number", "major", "year", "status"],
  },
  record: {
    记录概览: ["date", "studentName", "title", "status", "attachmentCount"],
  },
  trace: { 操作清单: ["date", "clock", "module", "action", "subject"] },
};
const defaults = {
  theme: "light",
  font: 14,
  densityVersion: 1,
  shortcutVersion: 1,
  hidden: [],
  extra: [],
  detailFields: ["number", "className", "year", "political", "phone", "origin"],
  grid: defaultWidgets,
  templates: defaultTemplates,
};
function readPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem("counselor-ui-v2") || "{}");
    if (!p.densityVersion) {
      p.font = 14;
      p.densityVersion = 1;
    }
    if (!p.shortcutVersion && p.grid) {
      const missing = moduleWidgets.filter(
        (w) => !p.grid.some((x) => x.i === w.i),
      );
      const addedHeight = missing.length ? 6 : 0;
      p.grid = [
        ...p.grid.map((w) => ({ ...w, y: w.y + addedHeight })),
        ...missing,
      ];
      p.shortcutVersion = 1;
    }
    return {
      ...defaults,
      ...p,
      templates: { ...defaultTemplates, ...p.templates },
    };
  } catch {
    return defaults;
  }
}
// 演示种子只在演示模式加载；本地账套由存储层注入，路径附件不自动读取磁盘。
const seedAttachments = initialRecords
  .filter((r) => !r.sensitive)
  .flatMap((r) =>
    r.paths.map((path, i) => ({
      id: `seed-${r.id}-${i}`,
      name: path.split("/").pop(),
      path,
      size: null,
      file: null,
      url: null,
    })),
  );
const seedRecords = initialRecords.map((r) => ({
  ...r,
  attachmentIds: r.paths.map((_, i) => `seed-${r.id}-${i}`),
}));
export function App({ initialData, onDataChange, workspaceControls }) {
  const [careProfiles, setCareProfiles] = useState(
    () => initialData?.careProfiles ?? initialCareProfiles(initialStudents),
  );
  const [prefs, setPrefs] = useState(() =>
      initialData?.prefs
        ? {
            ...defaults,
            ...initialData.prefs,
            templates: { ...defaultTemplates, ...initialData.prefs.templates },
          }
        : initialData
          ? defaults
          : readPrefs(),
    ),
    [page, setPage] = useState("工作首页"),
    [view, setView] = useState("字段视图");
  const [previewSpec, setPreviewSpec] = useState(null),
    [statusOptions, setStatusOptions] = useState(
      initialData?.statusOptions ?? ["待跟进", "已完成"],
    );
  function createStudent(name, { number }) {
    if (!number) throw Error("请填写学号");
    if (students.some((s) => s.number === number))
      throw Error("该学号已经存在，请搜索后选择");
    const s = {
      id: crypto.randomUUID(),
      name,
      number,
      className: "",
      major: "",
      year: "",
      phone: "",
      status: "在校",
      concern: false,
      attachments: 0,
    };
    setStudents((rows) => [...rows, s]);
    log("新增学生", name, "学生信息");
    return { value: s.id, label: `${name} · ${number}` };
  }
  function createModule(name) {
    if (!/^[\u4e00-\u9fff]{4}$/.test(name)) throw Error("板块名称需为四个汉字");
    if (!allModules.includes(name))
      patchPrefs({ extra: [...prefs.extra, name] });
    return name;
  }
  const [students, setStudents] = useState(
      initialData?.students ?? initialStudents,
    ),
    [records, setRecords] = useState(initialData?.records ?? seedRecords),
    [tasks, setTasks] = useState(initialData?.tasks ?? initialTasks),
    [attachments, setAttachments] = useState(
      initialData?.attachments ?? seedAttachments,
    ),
    [grades, setGrades] = useState(initialData?.grades ?? []),
    [logs, setLogs] = useState(initialData?.logs ?? []);
  const [photoStudent, setPhotoStudent] = useState("");
  const [selected, setSelected] = useState("s1"),
    [detail, setDetail] = useState(true),
    [recordMode, setRecordMode] = useState("按时间");
  const [modal, setModal] = useState(""),
    [editingItem, setEditingItem] = useState(null),
    [extraStudentIds, setExtraStudentIds] = useState([]),
    [setting, setSetting] = useState("外观设置"),
    [toast, setToast] = useState(""),
    [draftFiles, setDraftFiles] = useState([]),
    [draftIds, setDraftIds] = useState([]),
    [draftLinks, setDraftLinks] = useState("");
  const [exportSpec, setExportSpec] = useState(null),
    [format, setFormat] = useState("xlsx"),
    [exporting, setExporting] = useState(false),
    [attachmentSearch, setAttachmentSearch] = useState("");
  const [aiOpen, setAiOpen] = useState(false),
    [aiDocked, setAiDocked] = useState(false),
    [aiPrompt, setAiPrompt] = useState(""),
    [model, setModel] = useState(() => ({
      endpoint: prefs.aiModel?.endpoint || "",
      model: prefs.aiModel?.model || "",
      key: "",
    }));
  const [briefs, setBriefs] = useState(initialData?.briefs ?? {}),
    [aiBriefDate, setAiBriefDate] = useState("");
  const now = new Date();
  const [month, setMonth] = useState([now.getFullYear(), now.getMonth()]),
    [layers, setLayers] = useState(["应急处突", "日常管理", "思政教育"]),
    [calendarDate, setCalendarDate] = useState(""),
    [reportDate, setReportDate] = useState(today());
  const fileUrls = useRef([]),
    report = dailyReport(logs, tasks, reportDate);
  const patchPrefs = (p) => setPrefs((x) => ({ ...x, ...p })),
    notify = (t) => setToast(t);
  useEffect(() => {
    if (!initialData)
      localStorage.setItem("counselor-ui-v2", JSON.stringify(prefs));
    document.documentElement.dataset.theme = prefs.theme;
    document.documentElement.style.fontSize = `${prefs.font}px`;
  }, [prefs]);
  useEffect(() => {
    onDataChange?.({
      schemaVersion: 1,
      students,
      records,
      tasks,
      attachments,
      grades,
      logs,
      careProfiles,
      briefs,
      prefs,
      statusOptions,
    });
  }, [
    students,
    records,
    tasks,
    attachments,
    grades,
    logs,
    careProfiles,
    briefs,
    prefs,
    statusOptions,
    onDataChange,
  ]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => () => fileUrls.current.forEach(URL.revokeObjectURL), []);
  const allModules = [...modules, ...prefs.extra],
    activeModules = allModules.filter((m) => !prefs.hidden.includes(m));
  const publicRecords = useMemo(
    () => records.filter((r) => !r.sensitive),
    [records],
  );
  const recordRows = useMemo(
    () =>
      publicRecords.map((r) => ({
        ...r,
        studentName:
          students.find((s) => s.id === r.studentId)?.name || "个人工作",
        attachmentCount: r.attachmentIds.length,
      })),
    [publicRecords, students],
  );
  const studentRows = useMemo(
    () =>
      students.map((s) => {
        const ids = [
          ...new Set([
            ...(s.attachmentIds || []),
            ...publicRecords
              .filter((r) => r.studentId === s.id)
              .flatMap((r) => r.attachmentIds),
          ]),
        ];
        return {
          ...s,
          portraitUrl: attachments.find((a) => a.id === s.portraitId)?.url,
          attachments: ids.length,
          attachmentIds: ids,
        };
      }),
    [students, publicRecords, attachments],
  );
  const current = studentRows.find((s) => s.id === selected) || studentRows[0],
    personRecords = recordRows.filter((r) => r.studentId === current?.id);
  const log = (action, subject, module = page, metadata = {}) =>
    setLogs((s) => [
      {
        id: crypto.randomUUID(),
        time:
          localDate(new Date()) +
          new Date().toTimeString().slice(0, 8).replace(/^/, "T"),
        module,
        action,
        subject,
        ...metadata,
      },
      ...s,
    ]);
  function navigate(m) {
    setPage(m);
    setView("字段视图");
  }
  function settings(tab) {
    setSetting(tab);
    setModal("settings");
  }
  function handleBatchPhotoImport(matched) {
    const fileList = matched.map((m) => m.file);
    const addedAttachments = registerFiles(fileList);
    setAttachments((prev) => [...prev, ...addedAttachments]);

    setStudents((prev) =>
      prev.map((s) => {
        const itemIdx = matched.findIndex((m) => m.student.id === s.id);
        if (itemIdx === -1) return s;
        const attached = addedAttachments[itemIdx];
        const newPhotoIds = [...(s.photoIds || []), attached.id];
        const newAttachmentIds = [...(s.attachmentIds || []), attached.id];
        return {
          ...s,
          photoIds: newPhotoIds,
          attachmentIds: newAttachmentIds,
          portraitId: attached.id,
        };
      }),
    );
  function handleBatchPhotoImport(matched) {
    const fileList = matched.map((m) => m.file);
    const addedAttachments = registerFiles(fileList);
    setAttachments((prev) => [...prev, ...addedAttachments]);

    setStudents((prev) =>
      prev.map((s) => {
        const itemIdx = matched.findIndex((m) => m.student.id === s.id);
        if (itemIdx === -1) return s;
        const attached = addedAttachments[itemIdx];
        const newPhotoIds = [...(s.photoIds || []), attached.id];
        const newAttachmentIds = [...(s.attachmentIds || []), attached.id];
        return {
          ...s,
          photoIds: newPhotoIds,
          attachmentIds: newAttachmentIds,
          portraitId: attached.id,
        };
      }),
    );
    log("批量导入照片", `匹配成功 ${matched.length} 张`, "学生信息");
    notify(`批量匹配成功，已为 ${matched.length} 位学生绑定肖像照片！`);
  }
  function addRecord() {
    setEditingItem(null);
    setExtraStudentIds([]);
    setDraftFiles([]);
    setDraftIds([]);
    setDraftLinks("");
    setModal("record");
  }
    setEditingItem(null);
    setExtraStudentIds([]);
    setDraftFiles([]);
    setDraftIds([]);
    setDraftLinks("");
    setModal("record");
  }
  function editStudent(row) {
    const raw = students.find((s) => s.id === row.id) || row;
    setEditingItem(raw);
    setDraftFiles([]);
    setDraftIds(raw.attachmentIds || []);
    setDraftLinks("");
    setModal("student");
  }
  function deleteStudent(row) {
    setStudents((s) => s.filter((x) => x.id !== row.id));
    setCareProfiles((s) => s.filter((x) => x.studentId !== row.id));
    log("删除学生", row.name, "学生信息", { entityId: row.id });
    notify(`已删除学生：${row.name}`);
  }
  function editRecord(row) {
    const raw = records.find((r) => r.id === row.id) || row;
    setEditingItem(raw);
    setExtraStudentIds([]);
    setDraftFiles([]);
    setDraftIds(raw.attachmentIds || []);
    setDraftLinks("");
    setModal("record");
  }
  function deleteRecord(row) {
    setRecords((s) => s.filter((x) => x.id !== row.id));
    log("删除记录", row.title, row.module || page, { entityId: row.id });
    notify(`已删除记录：${row.title}`);
  }
  function handleExcelImport(diff) {
    let added = 0,
      updated = 0;
    setStudents((prev) => {
      const next = [...prev];
      for (const item of diff) {
        const { mode, existingId, ...fieldsData } = item;
        if (mode === "update" && existingId) {
          const idx = next.findIndex((s) => s.id === existingId);
          if (idx !== -1) {
            next[idx] = { ...next[idx], ...fieldsData };
            updated++;
          }
        } else {
          next.push({
            id: crypto.randomUUID(),
            className: "",
            major: "",
            year: "",
            phone: "",
            dorm: "",
            origin: "",
            political: "",
            emergencyContact: "",
            status: "在校",
            concern: false,
            attachmentIds: [],
            attachments: 0,
            ...fieldsData,
          });
          added++;
        }
      }
      return next;
    });
    log("导入名单", `新增 ${added} 人，更新 ${updated} 人`, "学生信息");
    notify(`Excel 导入完成：新增 ${added} 人，更新 ${updated} 人`);
  }
  function preview(row, fs) {
    setPreviewSpec({ row, fields: fs });
  }
  function requestExport(rows, columns, title = page) {
    setExportSpec({ rows, columns, title });
    setFormat("xlsx");
    setModal("export");
  }
  function registerFiles(files) {
    return files.map((file) => {
      const url = URL.createObjectURL(file);
      fileUrls.current.push(url);
      return {
        id: crypto.randomUUID(),
        name: file.name,
        path: "",
        size: file.size,
        type: file.type,
        file,
        url,
      };
    });
  }
  function collectDraft() {
    const added = registerFiles(draftFiles).map((a) => ({
        ...a,
        sensitive: page === "心理健康",
      })),
      linked = draftLinks
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((path) => {
          const id = crypto.randomUUID();
          const name = path.split(/[\\/]/).pop();
          return {
            id,
            name,
            path,
            size: null,
            file: initialData
              ? {
                  name,
                  size: null,
                  type: "",
                  arrayBuffer: async () => {
                    const r = await fetch(
                      "/api/path-file/" + encodeURIComponent(id),
                      {
                        headers: {
                          "X-SC-CSRF": window.__SC_CSRF || "",
                        },
                      },
                    );
                    if (!r.ok) throw Error("路径文件不可读");
                    return r.arrayBuffer();
                  },
                }
              : null,
            url: initialData
              ? "/api/path-file/" + encodeURIComponent(id)
              : null,
            sensitive: page === "心理健康",
          };
        });
    setAttachments((s) => [...s, ...added, ...linked]);
    return [
      ...new Set([
        ...draftIds,
        ...added.map((a) => a.id),
        ...linked.map((a) => a.id),
      ]),
    ];
  }
  function completeRecord(row) {
    setRecords((s) =>
      s.map((r) => (r.id === row.id ? { ...r, status: "已完成" } : r)),
    );
    log("完成记录", row.title, row.module, {
      entityId: row.id,
      attachmentIds: row.attachmentIds,
    });
    notify("记录已完成");
  }
  function toggleTask(task) {
    setTasks((s) =>
      s.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)),
    );
    log(task.done ? "重开待办" : "完成待办", task.text, task.module);
  }
  function setModuleTemplates(key, value) {
    patchPrefs({ templates: { ...prefs.templates, [key]: value } });
  }
  const traceRows = logs.map((l) => ({
    ...l,
    date: l.time.slice(0, 10),
    clock: l.time.slice(11),
  }));
  const isStudent = page === "学生信息";
  const tableFor = (title, rows, fs, kind, extra = {}) => (
    <DataTable
      key={title}
      title={title}
      rows={rows}
      fields={fs}
      student={kind === "student"}
      templates={prefs.templates[kind] || {}}
      onTemplates={(value) => setModuleTemplates(kind, value)}
      onPreview={(r) => preview(r, fs)}
      onExport={(rs, cs) => requestExport(rs, cs, title)}
      {...extra}
    />
  );
  return (
    <div className={`app ${aiOpen && aiDocked ? "ai-docked" : ""}`}>
      <header className="appbar">
        <div className="brand">
          <img
            src="/assets/workbench-icon.svg"
            className="app-icon"
            alt="辅智通图标"
          />
          <strong>辅智通 · 高校辅导员智慧管理系统</strong>
        </div>
        {page !== "工作首页" && page !== "工作留痕" && (
          <nav className="view-tabs">
            {["字段视图", "学生全览", "宿舍视图", "日历视图"].map((v) => (
              <button
                key={v}
                className={view === v ? "active" : ""}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            ))}
          </nav>
        )}
        {workspaceControls || <span className="demo-tag">演示环境</span>}
      </header>
      <aside className="sidebar">
        <div className="nav-scroll">
          <button
            className={`nav-item ${page === "工作首页" ? "active" : ""}`}
            onClick={() => navigate("工作首页")}
          >
            <IconHome />
            工作首页
          </button>
          {[
            [
              "学生工作",
              [
                ...modules.filter(
                  (m) => !["工作实务", "专业成长", "工作留痕"].includes(m),
                ),
                ...prefs.extra,
              ],
            ],
            ["个人工作", ["工作实务", "专业成长", "工作留痕"]],
          ].map(([group, names]) => (
            <section className="nav-group" key={group}>
              {group === "个人工作" && <h3>{group}</h3>}
              {names
                .filter((m) => !prefs.hidden.includes(m))
                .map((m) => {
                  const Icon = icons[modules.indexOf(m)] || IconFileText;
                  return (
                    <button
                      key={m}
                      className={`nav-item ${page === m ? "active" : ""}`}
                      onClick={() => navigate(m)}
                    >
                      <Icon />
                      {m}
                    </button>
                  );
                })}
            </section>
          ))}
        </div>
        <button
          className="nav-item settings-button"
          onClick={() => navigate("账户管理")}
        >
          <IconUser />
          账户管理
        </button>
        <button
          className="nav-item settings-button"
          onClick={() => settings("外观设置")}
        >
          <IconSettings />
          设置
        </button>
      </aside>
      <main>
        {page === "工作首页" ? (
          <Home
            widgets={prefs.grid}
            onLayout={(grid) => patchPrefs({ grid })}
            students={students.map((s) => ({
              ...s,
              concern: careProfiles.some((p) => p.studentId === s.id),
            }))}
            records={records}
            tasks={tasks}
            activeModules={activeModules}
            navigate={navigate}
            onTask={toggleTask}
            onAddTask={() => setModal("task")}
          />
        ) : page === "工作留痕" ? (
          <div className="workspace-main">
            <div className="daily-toolbar">
              <label>
                简报日期
                <input
                  aria-label="简报日期"
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                />
              </label>
              <Button
                onClick={() => {
                  setAiBriefDate(reportDate);
                  setAiPrompt(
                    `请基于以下操作留痕和待办生成简洁每日工作简报，不要增加未记录的事实。\n${report.text}`,
                  );
                  setAiOpen(true);
                }}
              >
                AI 每日简报
              </Button>
            </div>
            <div className="daily-summary">
              <section>
                <h2>每日完成</h2>
                <strong>{report.completed.length}</strong>
                <p>操作记录 {report.entries.length} 条</p>
              </section>
              <section>
                <h2>待办事项</h2>
                {report.pending.map((t) => (
                  <label key={t.id}>
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => toggleTask(t)}
                    />
                    {t.date} {t.text}
                  </label>
                ))}
                {!report.pending.length && <p>暂无到期未完成事项</p>}
              </section>
            </div>
            <BriefArchive
              logs={logs}
              tasks={tasks}
              briefs={briefs}
              date={reportDate}
              onDate={setReportDate}
            />
            {tableFor("工作留痕", traceRows, traceFields, "trace")}
          </div>
        ) : (
          <div className="workspace">
            <section className="workspace-main">
              {view === "日历视图" ? (
                <>
                  <h1>{page}</h1>
                  <div className="calendar-tools">
                    <Button
                      aria-label="上个月"
                      onClick={() =>
                        setMonth(([y, m]) =>
                          m === 0 ? [y - 1, 11] : [y, m - 1],
                        )
                      }
                    >
                      <IconChevronLeft />
                    </Button>
                    <h2>
                      {month[0]}年{month[1] + 1}月
                    </h2>
                    <Button
                      aria-label="下个月"
                      onClick={() =>
                        setMonth(([y, m]) =>
                          m === 11 ? [y + 1, 0] : [y, m + 1],
                        )
                      }
                    >
                      <IconChevronRight />
                    </Button>
                  </div>
                  <div className="layers">
                    {activeModules
                      .filter(
                        (m) =>
                          !["心理健康", "学生信息", "工作留痕"].includes(m),
                      )
                      .map((m) => (
                        <label key={m}>
                          <input
                            type="checkbox"
                            checked={layers.includes(m)}
                            onChange={() =>
                              setLayers(
                                layers.includes(m)
                                  ? layers.filter((v) => v !== m)
                                  : [...layers, m],
                              )
                            }
                          />
                          {m}
                        </label>
                      ))}
                  </div>
                  <div className="calendar">
                    <div className="weekdays">
                      {"一二三四五六日".split("").map((d) => (
                        <b key={d}>周{d}</b>
                      ))}
                    </div>
                    <div className="days">
                      {monthDays(...month).map((d) => (
                        <button
                          key={d.date}
                          className={`${d.current ? "" : "muted"} ${d.date === today() ? "today" : ""}`}
                          onClick={() => {
                            setCalendarDate(d.date);
                            setModal("calendar");
                          }}
                        >
                          <time>{d.day}</time>
                          {recordRows
                            .filter(
                              (r) =>
                                r.date === d.date && layers.includes(r.module),
                            )
                            .slice(0, 2)
                            .map((r) => (
                              <span key={r.id}>
                                {r.module} · {r.title}
                              </span>
                            ))}
                          {tasks
                            .filter(
                              (t) =>
                                t.date === d.date && layers.includes(t.module),
                            )
                            .map((t) => (
                              <span key={t.id} className="calendar-task">
                                {t.text}
                              </span>
                            ))}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : view === "学生全览" ? (
                <>
                  <h1>学生全览</h1>
                  <div className="overview-toolbar">
                    <select
                      aria-label="选择学生"
                      value={selected}
                      onChange={(e) => setSelected(e.target.value)}
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} · {s.number}
                        </option>
                      ))}
                    </select>
                    <Button
                      disabled={!current}
                      onClick={() => {
                        setAiPrompt(
                          `请根据以下学生档案与本学期记录，生成一段150字左右、客观温暖的《学期综合评语草稿》，不编造未提及的事实：\n学生：${current?.name}（${current?.className}，${current?.major}，状态：${current?.status}）\n关联记录：\n${personRecords.map((r) => `- [${r.date}] ${r.module} · ${r.title}：${r.summary}`).join("\n") || "暂无专项台账记录"}`,
                        );
                        setAiOpen(true);
                      }}
                    >
                      AI 生成学期评语
                    </Button>
                    <Button
                      disabled={!current}
                      onClick={() =>
                        requestExport(
                          personRecords,
                          recordFields,
                          `${current?.name || "学生"}个人记录`,
                        )
                      }
                    >
                      导出个人记录与附件
                    </Button>
                  </div>
                  <h2>{current?.name}</h2>
                  <div className="identity-grid">
                    {fields.map((f) => (
                      <div key={f.id}>
                        <span>{f.label}</span>
                        <strong>{current?.[f.id]}</strong>
                      </div>
                    ))}
                  </div>
                  {activeModules
                    .filter(
                      (m) => !["学生信息", "心理健康", "工作留痕"].includes(m),
                    )
                    .map((m) => (
                      <section className="person-module" key={m}>
                        <h2>{m}</h2>
                        {personRecords
                          .filter((r) => r.module === m)
                          .map((r) => (
                            <Record
                              key={r.id}
                              record={r}
                              attachments={attachments}
                              onPreview={() => preview(r, recordFields)}
                            />
                          ))}
                        {!personRecords.some((r) => r.module === m) && (
                          <p>暂无记录</p>
                        )}
                      </section>
                    ))}
                </>
              ) : view === "宿舍视图" ? (
                <DormView
                  students={studentRows}
                  records={publicRecords}
                  onSelectStudent={(s) => {
                    setSelected(s.id);
                    setPage("学生信息");
                    setView("字段视图");
                    setDetail(true);
                  }}
                  onUpdateDorm={(studentId, dorm) => {
                    const target = students.find((s) => s.id === studentId);
                    setStudents((rows) =>
                      rows.map((s) =>
                        s.id === studentId ? { ...s, dorm } : s,
                      ),
                    );
                    if (target) {
                      log(
                        "调整宿舍",
                        `${target.name} -> ${dorm || "未分配"}`,
                        "日常管理",
                      );
                      notify(`已更新 ${target.name} 的宿舍为 ${dorm || "未分配"}`);
                    }
                  }}
                />
              ) : page === "心理健康" ? (
                <Psychology
                  profiles={careProfiles}
                  setProfiles={setCareProfiles}
                  students={students}
                  records={records.filter((r) => r.sensitive)}
                  prefs={prefs}
                  onPrefs={patchPrefs}
                  onStudent={createStudent}
                  onTalk={(id) => {
                    setSelected(id);
                    addRecord();
                  }}
                  onPreview={preview}
                  onLog={log}
                  onExport={requestExport}
                />
              ) : isStudent ? (
                tableFor("学生信息", studentRows, fields, "student", {
                  onPhotos: (r) => setPhotoStudent(r.id),
                  onSelect: (r) => {
                    setSelected(r.id);
                    setDetail(true);
                  },
                  onAdd: () => {
                    setEditingItem(null);
                    setDraftFiles([]);
                    setDraftIds([]);
                    setDraftLinks("");
                    setModal("student");
                  },
                  onImport: () => setModal("excel-import"),
                  onBatchPhotos: () => setModal("batch-photos"),
                  onEdit: editStudent,
                  onDelete: deleteStudent,
                })
              ) : page === "党团建设" ? (
                <PartyBuildingView
                  students={studentRows}
                  records={publicRecords}
                  onSelectStudent={(s) => {
                    setSelected(s.id);
                    setDetail(true);
                  }}
                  onAddRecord={() => {
                    addRecord();
                  }}
                />
              ) : page === "奖惩助贷" ? (
                <RewardAidView
                  students={studentRows}
                  records={publicRecords}
                  onSelectStudent={(s) => {
                    setSelected(s.id);
                    setDetail(true);
                  }}
                  onAddRecord={() => {
                    addRecord();
                  }}
                />
              ) : page === "学风建设" ? (
                <AcademicStudyView
                  students={studentRows}
                  grades={grades}
                  onImportGrades={(importedGrades) => {
                    setGrades((prev) => [...prev, ...importedGrades]);
                    notify(`成功导入 ${importedGrades.length} 条成绩记录！`);
                  }}
                  onSelectStudent={(s) => {
                    setSelected(s.id);
                    setDetail(true);
                  }}
                  onAddRecord={() => {
                    addRecord();
                  }}
                />
              ) : page === "就业指导" ? (
                <CareerGuidanceView
                  students={studentRows}
                  records={publicRecords}
                  onSelectStudent={(s) => {
                    setSelected(s.id);
                    setDetail(true);
                  }}
                  onAddRecord={() => {
                    addRecord();
                  }}
                />
              ) : page === "账户管理" ? (
                <AccountManagementView
                  currentAccount={{ name: "辅导员工作台", id: "smart-counselor-local" }}
                  onLock={() => notify("已安全退出本地账户")}
                />
              ) : (
                tableFor(
                  page,
                  recordRows.filter((r) => r.module === page),
                  recordFields,
                  "record",
                  {
                    onAdd: addRecord,
                    onComplete: completeRecord,
                    onEdit: editRecord,
                    onDelete: deleteRecord,
                  },
                )
              )}
            </section>
            {isStudent && detail && current && view === "字段视图" && (
              <aside className="detail">
                <header>
                  <h2>{current.name}</h2>
                  <Button
                    aria-label="关闭学生详情"
                    onClick={() => setDetail(false)}
                  >
                    <IconX />
                  </Button>
                </header>
                <div className="student-portrait">
                  <button onClick={() => setPhotoStudent(current.id)}>
                    {current.portraitUrl ? (
                      <img
                        src={current.portraitUrl}
                        alt={`${current.name}肖像`}
                      />
                    ) : (
                      "导入照片"
                    )}
                  </button>
                  <Button onClick={() => setPhotoStudent(current.id)}>
                    照片管理
                  </Button>
                </div>
                <div className="detail-title">
                  <h3>学生信息</h3>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => editStudent(current)}>
                      编辑档案
                    </button>
                    <button onClick={() => settings("字段配置")}>
                      <IconSettings size={16} />
                      配置字段
                    </button>
                  </div>
                </div>
                <dl>
                  {prefs.detailFields.map((id) => {
                    const f = fields.find((v) => v.id === id);
                    return (
                      f && (
                        <React.Fragment key={id}>
                          <dt>{f.label}</dt>
                          <dd>{current[id]}</dd>
                        </React.Fragment>
                      )
                    );
                  })}
                </dl>
                <div className="detail-title">
                  <h3>档案记录</h3>
                  <div className="segmented">
                    {["按时间", "按板块"].map((m) => (
                      <button
                        key={m}
                        className={recordMode === m ? "active" : ""}
                        onClick={() => setRecordMode(m)}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                {(recordMode === "按时间"
                  ? [...personRecords].sort((a, b) =>
                      b.date.localeCompare(a.date),
                    )
                  : [...personRecords].sort((a, b) =>
                      a.module.localeCompare(b.module),
                    )
                ).map((r) => (
                  <Record
                    key={r.id}
                    record={r}
                    attachments={attachments}
                    showModule={recordMode === "按板块"}
                    onPreview={() => preview(r, recordFields)}
                  />
                ))}
              </aside>
            )}
          </div>
        )}
      </main>
      <Assistant
        page={page}
        open={aiOpen}
        setOpen={setAiOpen}
        docked={aiDocked}
        setDocked={setAiDocked}
        model={model}
        onSettings={() => settings("模型配置")}
        prompt={aiPrompt}
        setPrompt={setAiPrompt}
        position={prefs.aiPosition}
        onPosition={(aiPosition) => patchPrefs({ aiPosition })}
        onSaveBrief={
          aiBriefDate
            ? (text) => {
                setBriefs((s) => ({ ...s, [aiBriefDate]: text }));
                log("保存AI简报", `${aiBriefDate} 简报草稿`, "工作留痕");
                notify("AI草稿已保存至对应日期简报");
              }
            : null
        }
      />
      {["student", "record"].includes(modal) && (
        <Modal
          title={
            modal === "student"
              ? editingItem
                ? "编辑学生"
                : "新增学生"
              : editingItem
                ? "编辑记录"
                : "新增记录"
          }
          wide
          onClose={() => {
            setModal("");
            setEditingItem(null);
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const d = Object.fromEntries(new FormData(e.currentTarget));
              if (
                modal === "student" &&
                students.some(
                  (s) =>
                    s.number === d.number.trim() && s.id !== editingItem?.id,
                )
              ) {
                notify("学号已存在");
                return;
              }
              const attachmentIds = collectDraft();
              if (modal === "student") {
                if (editingItem) {
                  setStudents((s) =>
                    s.map((x) =>
                      x.id === editingItem.id
                        ? {
                            ...x,
                            ...d,
                            name: d.name.trim(),
                            number: d.number.trim(),
                            attachmentIds,
                            attachments: attachmentIds.length,
                          }
                        : x,
                    ),
                  );
                  log("编辑学生", d.name.trim(), "学生信息", {
                    entityId: editingItem.id,
                  });
                } else {
                  const student = {
                    phone: "",
                    dorm: "",
                    origin: "",
                    political: "",
                    emergencyContact: "",
                    status: "在校",
                    ...d,
                    id: crypto.randomUUID(),
                    name: d.name.trim(),
                    number: d.number.trim(),
                    concern: false,
                    attachmentIds,
                    attachments: attachmentIds.length,
                  };
                  setStudents((s) => [...s, student]);
                  setSelected(student.id);
                  log("新增学生", student.name, "学生信息");
                }
              } else {
                const extraTags = (moduleSchemas[page] || [])
                  .map(([key, label]) => (d[key] ? `${label}：${d[key]}` : ""))
                  .filter(Boolean)
                  .join("；");
                const fullSummary =
                  extraTags && !String(d.summary || "").includes(extraTags)
                    ? `【${extraTags}】${d.summary}`
                    : d.summary;
                if (editingItem) {
                  setRecords((s) =>
                    s.map((x) =>
                      x.id === editingItem.id
                        ? {
                            ...x,
                            ...d,
                            summary: fullSummary,
                            attachmentIds,
                          }
                        : x,
                    ),
                  );
                  log(
                    d.status === "已完成" ? "完成记录" : "编辑记录",
                    page === "心理健康" ? "心理谈话记录更新" : d.title,
                    editingItem.module || page,
                    {
                      entityId: editingItem.id,
                      attachmentIds:
                        page === "心理健康" ? [] : attachmentIds,
                    },
                  );
                } else {
                  const targets = [
                    d.studentId,
                    ...extraStudentIds.filter((id) => id && id !== d.studentId),
                  ];
                  const createdRecords = (targets.length ? targets : [""]).map(
                    (stuId) => ({
                      ...d,
                      studentId: stuId,
                      summary: fullSummary,
                      id: crypto.randomUUID(),
                      module: page,
                      sensitive: page === "心理健康",
                      attachmentIds,
                    }),
                  );
                  setRecords((s) => [...s, ...createdRecords]);
                  log(
                    d.status === "已完成" ? "完成记录" : "新增记录",
                    page === "心理健康" ? "心理谈话记录更新" : d.title,
                    page,
                    {
                      entityId: createdRecords[0].id,
                      attachmentIds:
                        page === "心理健康"
                          ? []
                          : createdRecords[0].attachmentIds,
                    },
                  );
                }
              }
              setEditingItem(null);
              setModal("");
              notify(
                initialData
                  ? "记录已更新，正在自动保存"
                  : "已保存至本次演示会话",
              );
            }}
          >
            <div className="form-grid">
              {modal === "student" ? (
                <>
                  {[
                    ["name", "姓名", true],
                    ["number", "学号", true],
                    ["className", "班级", true],
                    ["major", "专业", true],
                    ["year", "年级", true],
                    ["phone", "联系电话", false],
                    ["dorm", "宿舍（如 1栋101）", false],
                    ["origin", "生源地", false],
                    ["political", "政治面貌", false],
                    ["status", "在校状态", false],
                    ["emergencyContact", "紧急联系人及电话", false],
                  ].map(([id, label, req]) => (
                    <label key={id}>
                      {label}
                      <input
                        name={id}
                        required={req}
                        defaultValue={
                          editingItem?.[id] ?? (id === "status" ? "在校" : "")
                        }
                        maxLength={80}
                      />
                    </label>
                  ))}
                </>
              ) : (
                <>
                  <SearchSelect
                    label="所属学生"
                    name="studentId"
                    defaultValue={
                      editingItem
                        ? editingItem.studentId
                        : ["工作实务", "专业成长"].includes(page)
                          ? ""
                          : selected
                    }
                    required={!["工作实务", "专业成长"].includes(page)}
                    options={students.map((s) => ({
                      value: s.id,
                      label: `${s.name} · ${s.number}`,
                    }))}
                    studentCreate
                    onCreate={createStudent}
                  />
                  <label>
                    记录标题
                    <input
                      name="title"
                      defaultValue={editingItem?.title || ""}
                      required
                    />
                  </label>
                  <label>
                    日期
                    <input
                      name="date"
                      type="date"
                      defaultValue={editingItem?.date || today()}
                      required
                    />
                  </label>
                  <SearchSelect
                    label="状态"
                    name="status"
                    required
                    defaultValue={
                      editingItem?.status ||
                      (page === "心理健康" ? "已完成" : "待跟进")
                    }
                    options={statusOptions}
                    onCreate={(q) => {
                      setStatusOptions((s) => [...s, q]);
                      return q;
                    }}
                  />
                  {(moduleSchemas[page] || []).map(
                    ([key, label, typeOrOpts, placeholder]) => (
                      <label key={key}>
                        {label}
                        {Array.isArray(typeOrOpts) ? (
                          <select
                            name={key}
                            defaultValue={editingItem?.[key] || ""}
                          >
                            <option value="">-- 请选择 --</option>
                            {typeOrOpts.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            name={key}
                            type={typeOrOpts || "text"}
                            defaultValue={editingItem?.[key] || ""}
                            placeholder={placeholder || ""}
                          />
                        )}
                      </label>
                    ),
                  )}
                  {!editingItem &&
                    !["工作实务", "专业成长"].includes(page) && (
                      <details className="full">
                        <summary>批量同步关联其他学生（如同宿舍/同班活动）</summary>
                        <div className="check-list attachment-picker">
                          {students.slice(0, 60).map((s) => (
                            <label key={s.id}>
                              <input
                                type="checkbox"
                                checked={extraStudentIds.includes(s.id)}
                                onChange={(e) =>
                                  setExtraStudentIds((prev) =>
                                    e.target.checked
                                      ? [...prev, s.id]
                                      : prev.filter((id) => id !== s.id),
                                  )
                                }
                              />
                              {s.name} · {s.number}
                            </label>
                          ))}
                        </div>
                      </details>
                    )}
                  <label className="full">
                    <span
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      内容摘要
                      <Button
                        type="button"
                        onClick={(e) => {
                          const form = e.currentTarget.closest("form");
                          const raw =
                            form?.querySelector("textarea[name=summary]")
                              ?.value || "";
                          setAiPrompt(
                            `请将以下辅导员工作/谈心记录要点扩写为结构清晰、表述规范的台账摘要，不编造未提及的事实：\n\n${raw}`,
                          );
                          setAiOpen(true);
                        }}
                      >
                        AI 润色摘要
                      </Button>
                    </span>
                    <textarea
                      name="summary"
                      defaultValue={editingItem?.summary || ""}
                      required
                    />
                  </label>
                </>
              )}
            </div>
            <fieldset>
              <legend>附件</legend>
              <label>
                选择文件
                <input
                  aria-label="选择附件"
                  type="file"
                  multiple
                  onChange={(e) => {
                    setDraftFiles((s) => [...s, ...Array.from(e.target.files)]);
                    e.target.value = "";
                  }}
                />
              </label>
              <div className="draft-files">
                {draftFiles.map((f, i) => (
                  <div key={i}>
                    <span>{f.name}</span>
                    <Button
                      type="button"
                      aria-label={`移除附件${i}`}
                      onClick={() =>
                        setDraftFiles((s) => s.filter((_, j) => j !== i))
                      }
                    >
                      <IconX size={16} />
                    </Button>
                  </div>
                ))}
              </div>
              <label>
                登记文件路径（每行一个）
                <textarea
                  aria-label="附件路径"
                  value={draftLinks}
                  onChange={(e) => setDraftLinks(e.target.value)}
                />
              </label>
              <details>
                <summary>关联已有附件</summary>
                <div className="check-list attachment-picker">
                  {attachments
                    .filter((a) => !a.sensitive || page === "心理健康")
                    .map((a) => (
                      <label key={a.id}>
                        <input
                          type="checkbox"
                          checked={draftIds.includes(a.id)}
                          onChange={(e) =>
                            setDraftIds(
                              e.target.checked
                                ? [...draftIds, a.id]
                                : draftIds.filter((id) => id !== a.id),
                            )
                          }
                        />
                        {a.name}
                      </label>
                    ))}
                </div>
              </details>
            </fieldset>
            <Button primary>保存</Button>
          </form>
        </Modal>
      )}
      {modal === "task" && (
        <Modal title="新增待办" onClose={() => setModal("")}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const d = Object.fromEntries(new FormData(e.currentTarget));
              setTasks((s) => [
                ...s,
                { ...d, id: crypto.randomUUID(), done: false },
              ]);
              log("新增待办", d.text, d.module);
              setModal("");
            }}
          >
            <label>
              待办事项
              <input name="text" required />
            </label>
            <label>
              截止日期
              <input name="date" type="date" defaultValue={today()} required />
            </label>
            <SearchSelect
              label="所属板块"
              name="module"
              required
              defaultValue="工作实务"
              options={activeModules.filter((m) => m !== "心理健康")}
              onCreate={createModule}
            />
            <Button primary>添加</Button>
          </form>
        </Modal>
      )}
      {modal === "attachments" && (
        <Modal title="附件管理" wide onClose={() => setModal("")}>
          <form
            className="storage-location"
            onSubmit={(e) => {
              e.preventDefault();
              const path = new FormData(e.currentTarget).get("root").trim();
              if (!path) return;
              patchPrefs({ attachmentRoot: path });
              log("更新路径配置", "资料主库根目录配置", "附件管理");
              notify("存储位置配置已保存；未移动磁盘文件");
            }}
          >
            <label>
              资料主库存储位置
              <input
                name="root"
                aria-label="资料主库存储位置"
                defaultValue={prefs.attachmentRoot || ""}
                placeholder="如 D:\学生资料"
                required
              />
            </label>
            <Button>保存路径配置</Button>
            <p>浏览器当前只保存路径配置；实际移动文件需接入桌面文件接口。</p>
          </form>
          <div className="attachment-toolbar">
            <input
              aria-label="搜索附件"
              placeholder="搜索名称或路径"
              value={attachmentSearch}
              onChange={(e) => setAttachmentSearch(e.target.value)}
            />
            <label className="file-button">
              登记文件
              <input
                aria-label="登记文件"
                type="file"
                multiple
                onChange={(e) => {
                  const added = registerFiles(Array.from(e.target.files));
                  setAttachments((s) => [...s, ...added]);
                  log("登记附件", `${added.length} 个文件`, "附件管理");
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <div className="attachment-table">
            <table>
              <thead>
                <tr>
                  <th>名称</th>
                  <th>类型</th>
                  <th>可用状态</th>
                  <th>关联数</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {attachments
                  .filter(
                    (a) =>
                      !a.sensitive &&
                      (a.name + a.path).includes(attachmentSearch),
                  )
                  .map((a) => (
                    <tr key={a.id}>
                      <td title={a.path || a.name}>{a.name}</td>
                      <td>{a.name.split(".").pop()}</td>
                      <td>{a.file ? "可打包" : "仅路径"}</td>
                      <td>
                        {records.filter((r) => r.attachmentIds.includes(a.id))
                          .length +
                          students.filter((s) =>
                            s.attachmentIds?.includes(a.id),
                          ).length}
                      </td>
                      <td>
                        {a.url ? (
                          <a href={a.url} download={a.name}>
                            下载
                          </a>
                        ) : (
                          <label className="file-button">
                            重新关联
                            <input
                              type="file"
                              aria-label={`重新关联${a.id}`}
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                const [fresh] = registerFiles([file]);
                                setAttachments((s) =>
                                  s.map((v) =>
                                    v.id === a.id ? { ...fresh, id: a.id } : v,
                                  ),
                                );
                                log("重新关联附件", a.name, "附件管理");
                              }}
                            />
                          </label>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
      {modal === "batch-photos" && (
        <BatchPhotoImportModal
          students={students}
          onConfirm={handleBatchPhotoImport}
          onClose={() => setModal("")}
        />
      )}
      {modal === "excel-import" && (
        <ExcelImport
          existingStudents={students}
          onImport={handleExcelImport}
          onClose={() => setModal("")}
        />
      )}
      {modal === "export" && exportSpec && (
        <Modal
          title="导出数据与附件"
          onClose={() => !exporting && setModal("")}
        >
          <p>
            {exportSpec.title} · {exportSpec.rows.length} 条记录
          </p>
          {exportSpec.rows.some((r) =>
            /(\d{17}[\dXx]|1[3-9]\d{9}|抑郁|确诊|危机|处分)/.test(
              JSON.stringify(r),
            ),
          ) && (
            <p role="alert" style={{ fontSize: 13, color: "var(--danger, #b42318)" }}>
              敏感信息提醒：检测到导出范围内包含完整手机号、证件号或重点关注词，请确认接收对象权限。
            </p>
          )}
          <label>
            数据格式
            <select
              aria-label="导出格式"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              {[
                ["xlsx", "Excel"],
                ["csv", "CSV"],
                ["html", "HTML"],
                ["json", "JSON"],
              ].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <Button
            primary
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                const missing = await exportPackage({
                  ...exportSpec,
                  format,
                  attachments,
                });
                log(
                  "导出资料",
                  `${exportSpec.title} ${exportSpec.rows.length} 条`,
                  exportSpec.title,
                );
                notify(
                  missing
                    ? `已导出；${missing} 个附件不可读取，详见文件清单`
                    : "数据和可用附件已打包",
                );
                setModal("");
              } catch (e) {
                notify(`导出失败：${e.message}`);
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? "正在打包…" : "下载 ZIP"}
          </Button>
        </Modal>
      )}
      {modal === "calendar" && (
        <Modal title={calendarDate} onClose={() => setModal("")}>
          {recordRows
            .filter((r) => r.date === calendarDate && layers.includes(r.module))
            .map((r) => (
              <Record
                key={r.id}
                record={r}
                attachments={attachments}
                onPreview={() => preview(r, recordFields)}
              />
            ))}
          {tasks
            .filter((t) => t.date === calendarDate && layers.includes(t.module))
            .map((t) => (
              <p key={t.id}>{t.text}</p>
            ))}
        </Modal>
      )}
      {modal === "settings" && (
        <Modal title="设置" wide onClose={() => setModal("")}>
          <div className="settings-layout">
            <nav>
              {[
                "外观设置",
                "字段配置",
                "板块管理",
                "附件管理",
                "资料存储",
                "数据导出",
                "数据备份",
                "数据迁移",
                "模型配置",
              ].map((t) => (
                <button
                  key={t}
                  className={setting === t ? "active" : ""}
                  onClick={() =>
                    t === "附件管理" ? setModal("attachments") : setSetting(t)
                  }
                >
                  {t}
                </button>
              ))}
            </nav>
            <div className="settings-content">
              <h3>{setting}</h3>
              {setting === "外观设置" && (
                <>
                  <label>
                    主题
                    <select
                      value={prefs.theme}
                      onChange={(e) => patchPrefs({ theme: e.target.value })}
                    >
                      <option value="light">浅色</option>
                      <option value="dark">深色</option>
                    </select>
                  </label>
                  <label>
                    字号
                    <select
                      value={prefs.font}
                      onChange={(e) =>
                        patchPrefs({ font: Number(e.target.value) })
                      }
                    >
                      {[14, 16, 18, 20].map((n) => (
                        <option key={n} value={n}>
                          {n}px
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button onClick={() => patchPrefs({ grid: defaultWidgets })}>
                    恢复首页布局
                  </Button>
                </>
              )}
              {setting === "字段配置" && (
                <div className="check-list">
                  {fields.map((f) => (
                    <label key={f.id}>
                      <input
                        type="checkbox"
                        checked={prefs.detailFields.includes(f.id)}
                        onChange={(e) =>
                          patchPrefs({
                            detailFields: e.target.checked
                              ? [...prefs.detailFields, f.id]
                              : prefs.detailFields.filter((id) => id !== f.id),
                          })
                        }
                      />
                      {f.label}
                    </label>
                  ))}
                </div>
              )}
              {setting === "板块管理" && (
                <>
                  <div className="check-list">
                    {allModules.map((m) => (
                      <label key={m}>
                        <input
                          type="checkbox"
                          checked={!prefs.hidden.includes(m)}
                          onChange={(e) => {
                            patchPrefs({
                              hidden: e.target.checked
                                ? prefs.hidden.filter((v) => v !== m)
                                : [...prefs.hidden, m],
                            });
                            if (m === page) navigate("工作首页");
                          }}
                        />
                        {m}
                        {prefs.extra.includes(m) && (
                          <Button
                            onClick={() => {
                              patchPrefs({
                                extra: prefs.extra.filter((v) => v !== m),
                                hidden: prefs.hidden.filter((v) => v !== m),
                              });
                              if (page === m) navigate("工作首页");
                            }}
                          >
                            移除
                          </Button>
                        )}
                      </label>
                    ))}
                  </div>
                  <form
                    className="inline"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const m = new FormData(e.currentTarget)
                        .get("module")
                        .trim();
                      if (
                        !/^[\u4e00-\u9fff]{4}$/.test(m) ||
                        [...allModules, "工作首页", "设置"].includes(m)
                      ) {
                        notify("请输入不重复的四字板块名称");
                        return;
                      }
                      patchPrefs({ extra: [...prefs.extra, m] });
                      e.currentTarget.reset();
                    }}
                  >
                    <input
                      name="module"
                      aria-label="新板块名称"
                      placeholder="四字板块名称"
                      required
                    />
                    <Button>新增板块</Button>
                  </form>
                </>
              )}
              {setting === "资料存储" && (
                <>
                  {initialData ? (
                    <p>业务记录和附件自动加密保存到当前用户资料。</p>
                  ) : (
                    <p>当前业务数据和附件保留在本次演示会话，刷新后重置。</p>
                  )}
                  {!initialData && <p>请创建本地用户后保存资料。</p>}
                </>
              )}
              {setting === "数据导出" && (
                <Button
                  onClick={() => requestExport(studentRows, fields, "学生信息")}
                >
                  导出学生信息与附件
                </Button>
              )}
              {setting === "数据备份" && (
                <>
                  {initialData ? (
                    <p>使用右上角“加密备份”下载当前用户资料与关联附件。</p>
                  ) : (
                    <>
                      <p>创建本地用户后可启用加密备份。</p>
                      <Button disabled>备份资料库</Button>
                    </>
                  )}
                </>
              )}
              {setting === "数据迁移" && (
                <>
                  <p>本地文件接口接入后启用迁移与物理重命名。</p>
                  <Button disabled>迁移预览</Button>
                </>
              )}
              {setting === "模型配置" && (
                <>
                  <label>
                    预设模板
                    <select
                      aria-label="模型预设模板"
                      defaultValue="custom"
                      onChange={(e) => {
                        const preset = modelPresets.find(
                          (p) => p.id === e.target.value,
                        );
                        setModel({
                          ...model,
                          endpoint: preset.endpoint,
                          model: preset.model,
                          key: "",
                        });
                      }}
                    >
                      {modelPresets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {[
                    ["endpoint", "API 基础地址"],
                    ["model", "模型名称"],
                    ["key", "API 密钥"],
                  ].map(([id, label]) => (
                    <label key={id}>
                      {label}
                      <input
                        type={id === "key" ? "password" : "text"}
                        autoComplete="off"
                        value={model[id]}
                        onChange={(e) =>
                          setModel({ ...model, [id]: e.target.value })
                        }
                      />
                    </label>
                  ))}
                  <Button
                    onClick={() => {
                      patchPrefs({
                        aiModel: {
                          endpoint: model.endpoint.trim(),
                          model: model.model.trim(),
                        },
                      });
                      notify("模型配置已持久化保存");
                    }}
                  >
                    保存配置
                  </Button>
                  <Button
                    onClick={() => {
                      setModel({ endpoint: "", model: "", key: "" });
                      patchPrefs({ aiModel: { endpoint: "", model: "" } });
                      notify("模型配置已清除");
                    }}
                  >
                    清除配置
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
      {photoStudent && (
        <Photos
          student={students.find((s) => s.id === photoStudent)}
          attachments={attachments}
          onClose={() => setPhotoStudent("")}
          onImport={(files) => {
            const added = registerFiles(files);
            setAttachments((a) => [...a, ...added]);
            setStudents((ss) =>
              ss.map((s) =>
                s.id === photoStudent
                  ? {
                      ...s,
                      photoIds: [
                        ...(s.photoIds || []),
                        ...added.map((a) => a.id),
                      ],
                      attachmentIds: [
                        ...(s.attachmentIds || []),
                        ...added.map((a) => a.id),
                      ],
                      portraitId: s.portraitId || added[0]?.id,
                    }
                  : s,
              ),
            );
            if (added.length)
              log(
                "导入照片",
                `${students.find((s) => s.id === photoStudent).name} · ${added.length} 张`,
                "学生信息",
              );
          }}
          onCover={(id) => {
            setStudents((ss) =>
              ss.map((s) =>
                s.id === photoStudent ? { ...s, portraitId: id } : s,
              ),
            );
            log(
              "设置肖像",
              students.find((s) => s.id === photoStudent).name,
              "学生信息",
            );
          }}
          onRemove={(id) => {
            setStudents((ss) =>
              ss.map((s) =>
                s.id === photoStudent
                  ? {
                      ...s,
                      photoIds: (s.photoIds || []).filter((x) => x !== id),
                      attachmentIds: (s.attachmentIds || []).filter(
                        (x) => x !== id,
                      ),
                      portraitId:
                        s.portraitId === id
                          ? (s.photoIds || []).find((x) => x !== id)
                          : s.portraitId,
                    }
                  : s,
              ),
            );
            log(
              "移除照片",
              students.find((s) => s.id === photoStudent).name,
              "学生信息",
            );
          }}
        />
      )}
      {previewSpec && (
        <Modal
          title={previewSpec.row.title || previewSpec.row.name || "记录预览"}
          wide
          onClose={() => setPreviewSpec(null)}
        >
          <dl className="record-preview">
            {previewSpec.fields.map((f) => (
              <React.Fragment key={f.id}>
                <dt>{f.label}</dt>
                <dd>{String(previewSpec.row[f.id] ?? "")}</dd>
              </React.Fragment>
            ))}
          </dl>
          <h3>附件</h3>
          {(previewSpec.row.attachmentIds || []).map((id) => {
            const a = attachments.find((v) => v.id === id);
            return (
              a && (
                <div key={id}>
                  {a.url ? (
                    <a href={a.url} download={a.name}>
                      {a.name}
                    </a>
                  ) : (
                    <span>{a.name}（仅路径）</span>
                  )}
                </div>
              )
            );
          })}
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
function Record({ record, attachments, onPreview, showModule }) {
  return (
    <article
      className="record"
      tabIndex={0}
      onDoubleClick={onPreview}
      onKeyDown={(e) => e.key === "Enter" && onPreview()}
    >
      <div>
        <time>{record.date}</time>
        {showModule && <span>{record.module}</span>}
        <b>{record.title}</b>
      </div>
      <p>{record.summary}</p>
      {(record.attachmentIds || []).map((id) => {
        const a = attachments.find((v) => v.id === id);
        return (
          a && (
            <button
              className="file-link"
              key={id}
              title={a.path || a.name}
              onClick={() =>
                a.url
                  ? window.open(a.url, "_blank", "noopener")
                  : navigator.clipboard.writeText(a.path).catch(() => {})
              }
            >
              <IconCopy size={14} />
              {a.name}
            </button>
          )
        );
      })}
    </article>
  );
}
