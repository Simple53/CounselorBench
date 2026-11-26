import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  MobileScroll,
  KeyboardInput,
  KeyboardTextarea,
  BottomSheet,
  useKeyboard,
  useKeyboardInsets,
  useMobileDevice,
  useScreenPortal,
} from "./mobile";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import IconUser from "@tabler/icons-react/dist/esm/icons/IconUser.mjs";
import IconFlag from "@tabler/icons-react/dist/esm/icons/IconFlag.mjs";
import IconUsers from "@tabler/icons-react/dist/esm/icons/IconUsers.mjs";
import IconCalendar from "@tabler/icons-react/dist/esm/icons/IconCalendar.mjs";
import IconCalendarCheck from "@tabler/icons-react/dist/esm/icons/IconCalendarCheck.mjs";
import IconCoins from "@tabler/icons-react/dist/esm/icons/IconCoins.mjs";
import IconBook from "@tabler/icons-react/dist/esm/icons/IconBook.mjs";
import IconHeart from "@tabler/icons-react/dist/esm/icons/IconHeart.mjs";
import IconBriefcase from "@tabler/icons-react/dist/esm/icons/IconBriefcase.mjs";
import IconDeviceDesktop from "@tabler/icons-react/dist/esm/icons/IconDeviceDesktop.mjs";
import IconAlertTriangle from "@tabler/icons-react/dist/esm/icons/IconAlertTriangle.mjs";
import IconClipboard from "@tabler/icons-react/dist/esm/icons/IconClipboard.mjs";
import IconTrendingUp from "@tabler/icons-react/dist/esm/icons/IconTrendingUp.mjs";
import IconFolder from "@tabler/icons-react/dist/esm/icons/IconFolder.mjs";
import IconHome from "@tabler/icons-react/dist/esm/icons/IconHome.mjs";
import IconLayoutGrid from "@tabler/icons-react/dist/esm/icons/IconLayoutGrid.mjs";
import IconBell from "@tabler/icons-react/dist/esm/icons/IconBell.mjs";
import IconChartBar from "@tabler/icons-react/dist/esm/icons/IconChartBar.mjs";
import IconSearch from "@tabler/icons-react/dist/esm/icons/IconSearch.mjs";
import IconChevronDown from "@tabler/icons-react/dist/esm/icons/IconChevronDown.mjs";
import IconChevronRight from "@tabler/icons-react/dist/esm/icons/IconChevronRight.mjs";
import IconChevronLeft from "@tabler/icons-react/dist/esm/icons/IconChevronLeft.mjs";
import IconPlus from "@tabler/icons-react/dist/esm/icons/IconPlus.mjs";
import IconFilter from "@tabler/icons-react/dist/esm/icons/IconFilter.mjs";
import IconSettings from "@tabler/icons-react/dist/esm/icons/IconSettings.mjs";
import IconX from "@tabler/icons-react/dist/esm/icons/IconX.mjs";
import {
  students as seedStudents,
  starterRecords,
  starterTasks,
  moduleNames,
  personalModules,
  mobileMetrics,
  notices,
  localDay,
  type Row,
} from "./domain";
import {
  leaveActions,
  leaveStatus,
  leaveOverdue,
  validateLeave,
  transitionLeave,
  leaveTypes,
  leaveReasonCategories,
  classifyLeaveReason,
  leaveDurationHours,
} from "../../src/leave.mjs";
import { leaveInsights } from "../../src/leave-insights.mjs";
import { groupStudentsByAdvisor } from "../../src/model.mjs";
import { loadRememberedSchoolAuth } from "../../src/remember-auth.mjs";
import { modelPresets } from "../../src/model-presets.mjs";
import { CalendarPanel } from "./CalendarPanel";
import { DormPanel } from "./DormPanel";
import { LeaveDashboard } from "./LeaveDashboard";
import { SchoolLinks } from "./SchoolLinks";
import { SchoolConnection, SchoolRecordTools } from "./SchoolConnection";
import { MobileWebBook } from "./MobileWebBook";
import { MobileTaskBoard } from "./MobileTaskBoard";
import { seedWebbook } from "../../src/webbook.mjs";
import {
  createSchoolClient,
  schoolPresets,
  schoolStudents,
} from "./school-client.mjs";
const icons: Record<string, any> = {
  学生信息: IconUser,
  学校链接: IconDeviceDesktop,
  请假销假: IconCalendarCheck,
  日常管理: IconCalendar,
  奖惩助贷: IconCoins,
  思政教育: IconFlag,
  党团建设: IconUsers,
  学风建设: IconBook,
  心理健康: IconHeart,
  就业指导: IconBriefcase,
  网络育人: IconDeviceDesktop,
  应急处突: IconAlertTriangle,
  工作实务: IconClipboard,
  专业成长: IconTrendingUp,
  工作留痕: IconFolder,
};
const order = [
  "学生信息",
  "请假销假",
  "日常管理",
  "奖惩助贷",
  "思政教育",
  "党团建设",
  "学风建设",
  "心理健康",
  "就业指导",
  "网络育人",
  "应急处突",
  "学校链接",
];
const tabs = [
  { id: "home", label: "首页", icon: IconHome },
  { id: "services", label: "服务", icon: IconLayoutGrid },
  { id: "inbox", label: "待办", icon: IconCalendar },
  { id: "mine", label: "我的", icon: IconUser },
];
export default function Prototype() {
  const [tab, setTab] = useState("home"),
    [stack, setStack] = useState<string[]>([]),
    [students, setStudents] = useState<Row[]>(seedStudents),
    [records, setRecords] = useState<Row[]>(starterRecords),
    [tasks, setTasks] = useState<Row[]>(starterTasks);
  const [query, setQuery] = useState(""),
    [expanded, setExpanded] = useState(false),
    [sheet, setSheet] = useState(""),
    [inbox, setInbox] = useState("tasks"),
    [taskFilter, setTaskFilter] = useState("pending"),
    [read, setRead] = useState<string[]>([]),
    [toast, setToast] = useState(""),
    [error, setError] = useState(""),
    [visible, setVisible] = useState(20);
  const [filter, setFilter] = useState({
      status: "全部",
      start: "",
      end: "",
      sort: "desc",
    }),
    [draftFilter, setDraftFilter] = useState(filter),
    [files, setFiles] = useState<File[]>([]),
    [logs, setLogs] = useState<Row[]>([]),
    [font, setFont] = useState(14),
    [theme, setTheme] = useState("light"),
    [model, setModel] = useState({ endpoint: "", model: "", key: "" }),
    [fab, setFab] = useState<{ x: number; y: number } | null>(null);
  const [editingHome, setEditingHome] = useState(false),
    [homeWidgets, setHomeWidgets] = useState<string[]>([
      "students",
      "present",
      "leave",
      "return",
      "records",
      "tasks",
      "leaveStats",
      "major",
    ]);
  const [autoSync, setAutoSync] = useState(false);
  const [webbook, setWebbook] = useState<Record<string, any[]>>(() => {
    try {
      const raw = localStorage.getItem("sc-mobile-webbook-v1");
      return raw ? { ...seedWebbook(), ...JSON.parse(raw) } : seedWebbook();
    } catch {
      return seedWebbook();
    }
  });
  const [bookmarks, setBookmarks] = useState<Row[]>(() => {
    try {
      const raw = localStorage.getItem("sc-mobile-bookmarks-v1");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("sc-mobile-webbook-v1", JSON.stringify(webbook));
    } catch {}
  }, [webbook]);
  useEffect(() => {
    try {
      localStorage.setItem("sc-mobile-bookmarks-v1", JSON.stringify(bookmarks));
    } catch {}
  }, [bookmarks]);
  const credentials = useRef({ username: "", password: "" });
  const seenSchoolIds = useRef<Set<string> | null>(null);
  const [view, setView] = useState("list"),
    [leaveSource, setLeaveSource] = useState("local"),
    [leaveScope, setLeaveScope] = useState("all"),
    [leaveCat, setLeaveCat] = useState("全部");
  const [schoolConfig, setSchoolConfig] = useState<any>({
      ...schoolPresets.nnu,
      preset: "nnu",
    }),
    [schoolToken, setSchoolToken] = useState(""),
    [schoolBusy, setSchoolBusy] = useState(false);
  const [school, setSchool] = useState<any>({
    records: [],
    complete: false,
    capabilities: [],
    syncedAt: "",
  });
  const schoolLock = useRef(false);
  const allRecords = [...records, ...school.records],
    schoolRoster = schoolStudents(school.records);
  const leaveRecords: Row[] =
    leaveSource === "school"
      ? school.records
      : records.filter((r) => r.module === "请假销假");
  const leaveRoster = leaveSource === "school" ? schoolRoster : students;
  useEffect(() => {
    let mounted = true;
    loadRememberedSchoolAuth().then((saved: any) => {
      if (!mounted || !saved) return;
      credentials.current = {
        username: saved.username || "",
        password: saved.password || "",
      };
      setSchoolConfig((prev: any) => ({
        ...prev,
        ...(saved.baseUrl ? { baseUrl: saved.baseUrl } : {}),
        ...(saved.preset ? { preset: saved.preset } : {}),
        ...(saved.proxyUrl ? { proxyUrl: saved.proxyUrl } : {}),
        autoSync: saved.autoSync !== false,
      }));
      if (saved.token) setSchoolToken(saved.token);
      if (saved.autoSync !== false && saved.token) setAutoSync(true);
    });
    return () => {
      mounted = false;
    };
  }, []);
  const coverage =
    leaveSource === "school"
      ? school.syncedAt
        ? `校方已同步 ${school.records.length} 条 · ${school.complete ? "接口声明完整" : "仅部分记录，不能代表全部学生或历史"}`
        : "校方尚未同步"
      : "本地示例数据";
  const keyboard = useKeyboard(),
    { screenRef } = useScreenPortal(),
    insets = useKeyboardInsets(),
    { device } = useMobileDevice(),
    urls = useRef<string[]>([]),
    drag = useRef<any>(null),
    moved = useRef(false);
  const route = stack.at(-1) || tab,
    module = route.startsWith("module:") ? route.slice(7) : "",
    student = route.startsWith("student:")
      ? students.find((s) => s.id === route.slice(8))
      : undefined,
    record = route.startsWith("record:")
      ? allRecords.find((r) => r.id === route.slice(7))
      : undefined;
  const title =
    module ||
    (student
      ? "详细信息"
      : record
        ? "记录详情"
        : route === "leave:new"
          ? "请假申请"
          : route === "task:new"
            ? "新增待办"
            : route.startsWith("new:")
              ? "新增记录"
              : (
                  {
                    appearance: "外观显示",
                    model: "AI配置",
                    data: "数据管理",
                    school: "学校接入",
                    files: "附件管理",
                    account: "账户管理",
                    about: "关于应用",
                  } as Record<string, string>
                )[route] || "");
  const metricRoster =
    leaveSource === "school"
      ? schoolRoster.map((s: Row) => ({
          ...s,
          status: school.records.some(
            (r: Row) => r.studentId === s.id && leaveStatus(r) === "请假中",
          )
            ? "请假离校"
            : "状态未知",
        }))
      : students;
  const metrics = mobileMetrics(
      metricRoster,
      leaveSource === "school" ? school.records : records,
      tasks,
    ).map((m) =>
      leaveSource === "school" && m.kind === "present"
        ? { ...m, value: "待核实" }
        : leaveSource === "school" && m.kind === "students"
          ? { ...m, label: "已同步学生" }
          : m,
    ),
    messages = notices(records),
    unread = messages.filter((m) => !read.includes(m.key)).length;
  const name = (id: string) =>
    [...students, ...schoolRoster].find((s) => s.id === id)?.name || "个人工作";
  const client = () => createSchoolClient(schoolConfig, schoolToken);
  async function runSchool(work: () => Promise<void>) {
    if (schoolLock.current) return;
    schoolLock.current = true;
    setSchoolBusy(true);
    keyboard.hide();
    try {
      await work();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      schoolLock.current = false;
      setSchoolBusy(false);
    }
  }
  const openCalendar = (row: Row) => {
    if (row.module === "工作待办") {
      selectTab("inbox");
      setInbox("tasks");
      setView("list");
    } else if (row.module === "工作留痕" && logs.some((l) => l.id === row.id))
      notify(`${row.action} · ${row.subject}`);
    else go("record:" + row.id);
  };
  const calendarEvents = [
    ...records.filter((r) => !r.sensitive && r.module !== "请假销假"),
    ...leaveRecords,
    ...tasks.map((t) => ({ ...t, module: "工作待办" })),
  ];
  useEffect(() => {
    if (!autoSync || !schoolToken || !schoolConfig.baseUrl) return;
    let stopped = false,
      running = false;
    async function sync(initial = false) {
      if (running || document.hidden) return;
      running = true;
      try {
        const api = createSchoolClient(schoolConfig, schoolToken);
        if (initial && schoolConfig.preset === "nnu")
          await api.openSession({
            ...credentials.current,
            proxyUrl: schoolConfig.proxyUrl || "",
          });
        const result = await api.list();
        if (!stopped) {
          const prevIds = seenSchoolIds.current;
          seenSchoolIds.current = new Set(result.records.map((r: Row) => r.id));
          if (prevIds) {
            const fresh = result.records.filter((r: Row) => !prevIds.has(r.id));
            if (fresh.length) {
              const msg = `校方新增 ${fresh.length} 条请销假：${fresh
                .slice(0, 2)
                .map((r: Row) => r.studentName || "学生")
                .join("、")}`;
              notify(msg);
              if (
                schoolConfig.schoolNotify !== false &&
                typeof Notification !== "undefined" &&
                Notification.permission === "granted"
              ) {
                new Notification("辅智通 · 校方请销假", { body: msg });
              }
            }
          }
          setSchool(result);
          setLeaveSource("school");
        }
      } catch (e) {
        if (!stopped) {
          setAutoSync(false);
          setSchool((s: any) => ({ ...s, syncError: (e as Error).message }));
          notify((e as Error).message);
        }
      } finally {
        running = false;
      }
    }
    sync(true);
    const intervalMs = Math.max(30, Number(schoolConfig.schoolInterval) || 60) * 1000;
    const timer = setInterval(() => sync(), intervalMs);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [autoSync, schoolToken, schoolConfig]);
  function viewSwitch() {
    return (
      <div className="sc-view-switch" aria-label="显示方式">
        <button
          aria-pressed={view === "list"}
          onClick={() => {
            keyboard.hide();
            setView("list");
          }}
        >
          {route === "home" ? "统计视图" : "列表视图"}
        </button>
        <button
          aria-pressed={view === "calendar"}
          onClick={() => {
            keyboard.hide();
            setView("calendar");
          }}
        >
          日历视图
        </button>
      </div>
    );
  }
  function sourceSwitch() {
    return (
      <div className="sc-source-switch">
        <label>
          请假数据
          <select
            aria-label="请假数据来源"
            value={leaveSource}
            onChange={(e) => setLeaveSource(e.target.value)}
          >
            <option value="local">本地示例</option>
            <option value="school">校方记录</option>
          </select>
        </label>
        <button onClick={() => go("school")}>学校接入</button>
      </div>
    );
  }
  function notify(s: string) {
    setToast(s);
  }
  function log(action: string, subject: string, mod = module || "工作实务") {
    setLogs((s) => [
      {
        id: crypto.randomUUID(),
        date: localDay(),
        action,
        subject,
        module: mod,
      },
      ...s,
    ]);
  }
  function go(s: string) {
    keyboard.hide();
    setQuery("");
    setVisible(20);
    setError("");
    setFiles([]);
    setView("list");
    setLeaveScope("all");
    setLeaveCat("全部");
    setFilter({ status: "全部", start: "", end: "", sort: "desc" });
    setStack((a) => [...a, s]);
  }
  function back() {
    keyboard.hide();
    setQuery("");
    setError("");
    setFiles([]);
    setStack((s) => s.slice(0, -1));
  }
  function selectTab(s: string) {
    keyboard.hide();
    setSheet("");
    setQuery("");
    setError("");
    setStack([]);
    setView("list");
    setTab(s);
  }
  function blur(e: any) {
    if (
      !(e.relatedTarget instanceof HTMLInputElement) &&
      !(e.relatedTarget instanceof HTMLTextAreaElement)
    )
      keyboard.hide();
  }
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;
    // Native focus must scroll the app's MobileScroll, never the outer device screen.
    const keepDeviceStill = () => {
      screen.scrollTop = 0;
      screen.scrollLeft = 0;
    };
    screen.addEventListener("scroll", keepDeviceStill);
    keepDeviceStill();
    return () => screen.removeEventListener("scroll", keepDeviceStill);
  }, [screenRef, device.id]);
  useEffect(
    () => () => urls.current.forEach((u) => URL.revokeObjectURL(u)),
    [],
  );
  function changeLeave(row: Row, action: string) {
    try {
      const next = transitionLeave(row, action);
      const updated = records.map((r) => (r.id === row.id ? next : r));
      setRecords(updated);
      if (["depart", "return", "close"].includes(action))
        setStudents((all) =>
          all.map((s) =>
            s.id === row.studentId
              ? {
                  ...s,
                  status: updated.some(
                    (r) =>
                      r.studentId === s.id &&
                      r.module === "请假销假" &&
                      leaveStatus(r) === "请假中",
                  )
                    ? "请假离校"
                    : "在校",
                }
              : s,
          ),
        );
      log(
        leaveActions[leaveStatus(row)].find((a: any) => a.action === action)
          .label,
        name(row.studentId),
        "请假销假",
      );
      notify("状态已更新");
    } catch (e) {
      notify((e as Error).message);
    }
  }
  function exportRows(rows: Row[], label: string) {
    const clean = rows.map(({ files, photoUrl, ...r }) => ({
      ...r,
      ...(files
        ? { files: files.map((f: File) => ({ name: f.name, size: f.size })) }
        : {}),
    }));
    const u = URL.createObjectURL(
      new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = u;
    a.download = label + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
    notify("已导出当前筛选结果");
  }
  function saveForm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<
      string,
      string
    >;
    try {
      if (route === "task:new") {
        setTasks((t) => [{ ...d, id: crypto.randomUUID(), done: false }, ...t]);
        log("新增待办", d.text, d.module);
      } else {
        const mod = route === "leave:new" ? "请假销假" : route.slice(4),
          r: Row = {
            ...d,
            id: crypto.randomUUID(),
            module: mod,
            date: d.startAt?.slice(0, 10) || localDay(),
            status: mod === "请假销假" ? "待审批" : "待跟进",
            sensitive: mod === "心理健康",
            files,
            attachmentIds: [],
          };
        if (mod === "请假销假") {
          validateLeave(r, records);
          r.leaveState = "待审批";
          r.title = d.leaveType + "申请";
        } else if (!d.title.trim()) throw Error("请填写记录标题");
        setRecords((all) => [r, ...all]);
        log("新增记录", mod === "心理健康" ? "心理记录更新" : r.title, mod);
      }
      back();
      notify("已保存到本次手机预览");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const available = moduleNames.filter((n) => icons[n]),
    foundStudents = students.filter((s) =>
      [s.name, s.number, s.className, s.advisor].some((v) =>
        String(v || "").includes(query),
      ),
    );
  const leaveSummary = useMemo(
    () => leaveInsights(leaveRoster, leaveRecords),
    [leaveRoster, leaveRecords],
  );
  const advisorGroupsList = useMemo(
    () => groupStudentsByAdvisor(foundStudents, records),
    [foundStudents, records],
  );
  const found = (module === "请假销假" ? leaveRecords : records)
    .filter(
      (r) =>
        r.module === module &&
        (module === "心理健康" || !r.sensitive) &&
        [r.title, r.summary, r.destination, r.projectName, name(r.studentId)].some((v) =>
          String(v || "").includes(query),
        ) &&
        (module !== "请假销假" ||
          leaveScope === "all" ||
          ["请假中", "待审批", "待销假"].includes(leaveStatus(r))) &&
        (module !== "请假销假" ||
          leaveCat === "全部" ||
          classifyLeaveReason(r) === leaveCat) &&
        (filter.status === "全部" ||
          (module === "请假销假" ? leaveStatus(r) : r.status) ===
            filter.status) &&
        (!filter.start || (r.startAt || r.date) >= filter.start) &&
        (!filter.end || (r.startAt || r.date).slice(0, 10) <= filter.end),
    )
    .sort(
      (a, b) =>
        String(a.startAt || a.date).localeCompare(String(b.startAt || b.date)) *
        (filter.sort === "asc" ? 1 : -1),
    );
  const chart = useMemo(
    () =>
      Object.entries(
        students.reduce(
          (a: Record<string, number>, s) => ({
            ...a,
            [s.major]: (a[s.major] || 0) + 1,
          }),
          {},
        ),
      ).map(([label, count]) => ({
        label: label
          .replace("计算机科学与技术", "计算机")
          .replace("数据科学与大数据", "数据科学"),
        count,
      })),
    [students],
  );
  const frameHeight =
    device.geometry.screen.height -
    (device.platform === "android" && !keyboard.visible
      ? device.geometry.safeArea.bottom
      : 0);
  const isForm =
      route === "leave:new" || route === "task:new" || route.startsWith("new:"),
    pos = fab || {
      x: device.geometry.screen.width - 64,
      y: frameHeight - insets.bottomInset - 135,
    };
  function search(placeholder: string) {
    return (
      <div className="sc-search">
        <IconSearch size={21} />
        <KeyboardInput
          aria-label={placeholder}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setVisible(20);
          }}
          onBlur={blur}
        />
        {query && (
          <button
            aria-label="清空搜索"
            onClick={() => {
              setQuery("");
              keyboard.hide();
            }}
          >
            <IconX size={16} />
          </button>
        )}
      </div>
    );
  }
  function grid(names: string[]) {
    return (
      <div className="sc-module-grid">
        {names
          .filter((n) => n.includes(query))
          .map((n) => {
            const Icon = icons[n] || IconFolder;
            return (
              <button
                key={n}
                className="sc-module"
                onClick={() => go("module:" + n)}
              >
                <Icon size={27} stroke={1.7} />
                <span>{n}</span>
              </button>
            );
          })}
      </div>
    );
  }
  return (
    <div
      className="sc-app"
      data-theme={theme}
      data-root={!stack.length}
      style={
        {
          "--sc-font": font + "px",
          "--device-safe-area-top": device.geometry.safeArea.top + "px",
          "--sc-bottom-safe":
            device.platform === "ios"
              ? device.geometry.safeArea.bottom + "px"
              : "0px",
        } as CSSProperties
      }
    >
      {stack.length > 0 && (
        <header className="sc-header">
          {stack.length ? (
            <>
              <button aria-label="返回" onClick={back}>
                <IconChevronLeft size={23} />
              </button>
              <h1>{title}</h1>
              {module &&
              !["学生信息", "工作留痕", "学校链接"].includes(module) &&
              !(module === "请假销假" && leaveSource === "school") ? (
                <button
                  aria-label={module === "请假销假" ? "新增请假" : "新增记录"}
                  onClick={() =>
                    go(module === "请假销假" ? "leave:new" : "new:" + module)
                  }
                >
                  <IconPlus size={23} />
                </button>
              ) : (
                <span />
              )}
            </>
          ) : null}
        </header>
      )}
      <MobileScroll key={route} className="sc-scroll">
        <main className="sc-content">
          {route === "home" && (
            <>
              <div className="sc-toolbar">
                <h2 className="sc-section-title">
                  数据概览{" "}
                  <small className="sc-coverage">
                    {leaveSource === "school" ? "校方已同步" : "本地示例"}
                  </small>
                </h2>
                <button onClick={() => setEditingHome(!editingHome)}>
                  {editingHome ? "完成编辑" : "编辑模块"}
                </button>
              </div>
              {editingHome && (
                <div className="sc-calendar-layers">
                  {[
                    ...metrics.map((m) => [m.kind, m.label]),
                    ["leaveStats", "请假重点统计"],
                    ["major", "专业分布"],
                  ].map(([id, label]) => (
                    <label key={id}>
                      <input
                        type="checkbox"
                        checked={homeWidgets.includes(id)}
                        onChange={() =>
                          setHomeWidgets((s) =>
                            s.includes(id)
                              ? s.filter((x) => x !== id)
                              : [...s, id],
                          )
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              )}
              <div className="sc-metrics">
                {metrics
                  .filter((m) => homeWidgets.includes(m.kind))
                  .map((m, i) => {
                    const Icon = [
                      IconUser,
                      IconBook,
                      IconCalendar,
                      IconCalendarCheck,
                      IconFolder,
                      IconClipboard,
                      IconCalendarCheck,
                      IconAlertTriangle,
                    ][i];
                    return (
                      <button
                        className={
                          "sc-metric " +
                          ([2, 3].includes(i) ? "sc-leave-metric" : "")
                        }
                        key={m.kind}
                        onClick={() => {
                          if (
                            ["leave", "return", "approval", "overdue"].includes(
                              m.kind,
                            )
                          ) {
                            go("module:请假销假");
                            setFilter((f) => ({
                              ...f,
                              status:
                                m.kind === "return"
                                  ? "待销假"
                                  : m.kind === "approval"
                                    ? "待审批"
                                    : m.kind === "leave"
                                      ? "请假中"
                                      : "全部",
                            }));
                          } else if (m.kind === "tasks") selectTab("inbox");
                          else if (["students", "present"].includes(m.kind))
                            go("module:学生信息");
                          else selectTab("services");
                        }}
                      >
                        <Icon size={25} />
                        <span>{m.label}</span>
                        <strong>{m.value}</strong>
                      </button>
                    );
                  })}
              </div>
              {homeWidgets.includes("major") && (
                <section className="sc-chart-section">
                  <h2 className="sc-section-title">专业分布</h2>
                  <div className="sc-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chart}
                        layout="vertical"
                        margin={{ left: 0, right: 24, top: 6, bottom: 0 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="label"
                          width={78}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "var(--sc-ink)", fontSize: 13 }}
                        />
                        <Bar
                          dataKey="count"
                          fill="#0961ff"
                          barSize={11}
                          radius={4}
                          isAnimationActive={false}
                          label={{
                            position: "right",
                            fill: "var(--sc-ink)",
                            fontSize: 13,
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              )}
              {homeWidgets.includes("leaveStats") && (
                <LeaveDashboard
                  students={metricRoster}
                  records={leaveRecords}
                  coverage={coverage}
                  onOpen={(r) => go("record:" + r.id)}
                />
              )}
            </>
          )}
          {route === "services" && (
            <>
              {search("搜索功能")}
              <section className="sc-services-section">
                <h2 className="sc-section-title">学生工作</h2>
                {grid(order.filter((n) => available.includes(n)))}
              </section>
              <section className="sc-personal-section">
                <h2 className="sc-section-title">个人工作</h2>
                {grid(personalModules)}
              </section>
              {![...order, ...personalModules].some((n) =>
                n.includes(query),
              ) && <p className="sc-empty">未找到匹配模块</p>}
            </>
          )}
          {route === "inbox" && (
            <>
              <div className="sc-segments">
                {[
                  ["tasks", "待办"],
                  ["messages", "消息"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    className={inbox === id ? "active" : ""}
                    onClick={() => setInbox(id)}
                  >
                    {label}
                    {id === "messages" && unread > 0 && <b>{unread}</b>}
                  </button>
                ))}
              </div>
              {inbox === "tasks" && viewSwitch()}
              {view === "calendar" && inbox === "tasks" ? (
                <CalendarPanel
                  events={tasks
                    .filter(
                      (t) =>
                        taskFilter === "all" ||
                        t.done === (taskFilter === "done"),
                    )
                    .map((t) => ({ ...t, module: "工作待办" }))}
                  onOpen={(r) => {
                    setView("list");
                    setTaskFilter(r.done ? "done" : "pending");
                  }}
                />
              ) : inbox === "tasks" ? (
                <MobileTaskBoard
                  tasks={tasks}
                  today={localDay()}
                  onToggle={(t) => {
                    setTasks((all) =>
                      all.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)),
                    );
                    log(t.done ? "重新打开待办" : "完成待办", t.text, t.module);
                  }}
                  onImportant={(t) =>
                    setTasks((all) =>
                      all.map((x) =>
                        x.id === t.id ? { ...x, important: !x.important } : x,
                      ),
                    )
                  }
                  onAdd={() => go("task:new")}
                />
              ) : (
                <>
                  <div className="sc-toolbar">
                    <span>本地事项提醒</span>
                    <button onClick={() => setRead(messages.map((m) => m.key))}>
                      全部已读
                    </button>
                  </div>
                  <div className="sc-list">
                    {messages.map((m) => (
                      <button
                        className="sc-notice"
                        key={m.key}
                        onClick={() => {
                          setRead((s) => [...s, m.key]);
                          go("module:请假销假");
                          setFilter((f) => ({
                            ...f,
                            status:
                              m.id === "approval"
                                ? "待审批"
                                : m.id === "return"
                                  ? "待销假"
                                  : "全部",
                          }));
                        }}
                      >
                        <IconBell size={21} />
                        <span>
                          <strong>{m.title}</strong>
                          <small>{m.count} 条事项</small>
                        </span>
                        {!read.includes(m.key) && <i className="sc-unread" />}
                        <IconChevronRight size={17} />
                      </button>
                    ))}
                  </div>
                  {!messages.length && <p className="sc-empty">暂无消息</p>}
                </>
              )}
            </>
          )}
          {route === "mine" && (
            <>
              <div className="sc-profile">
                <IconUser size={34} />
                <div>
                  <h2>辅导员</h2>
                  <span>手机交互预览</span>
                </div>
              </div>
              <div className="sc-list">
                {[
                  ["appearance", "外观显示", IconDeviceDesktop],
                  ["model", "AI配置", IconSettings],
                  ["data", "数据管理", IconFolder],
                  ["account", "账户管理", IconUser],
                  ["about", "关于应用", IconBook],
                ].map(([id, label, Icon]: any) => (
                  <button
                    key={id}
                    className="sc-menu-row"
                    onClick={() => go(id)}
                  >
                    <Icon size={22} />
                    <span>{label}</span>
                    <IconChevronRight size={18} />
                  </button>
                ))}
              </div>
            </>
          )}
          {route === "data" && (
            <div className="sc-list">
              {[
                ["files", "附件管理"],
                ["school", "学校接入"],
              ].map(([id, label]) => (
                <button key={id} className="sc-menu-row" onClick={() => go(id)}>
                  <span>{label}</span>
                  <IconChevronRight size={18} />
                </button>
              ))}
            </div>
          )}
          {route === "school" && (
            <SchoolConnection
              config={schoolConfig}
              busy={schoolBusy}
              meta={school}
              onSave={async (c, t, login) => {
                credentials.current = login;
                if (c.preset === "nnu" && !t) {
                  try {
                    const r = await fetch(new URL("/bootstrap", c.baseUrl));
                    if (!r.ok) throw Error("本机学校连接器未就绪");
                    t = (await r.json()).token;
                  } catch (e) {
                    notify((e as Error).message);
                    return;
                  }
                }
                setAutoSync(c.autoSync !== false);
                setSchoolConfig(c);
                setSchoolToken(t);
                setSchool({
                  records: [],
                  complete: false,
                  capabilities: [],
                  syncedAt: "",
                });
                notify("学校配置已保存到本次会话");
              }}
              onSync={() =>
                runSchool(async () => {
                  setSchool(await client().list());
                  setAutoSync(schoolConfig.autoSync !== false);
                  setLeaveSource("school");
                  notify("已同步校方记录");
                })
              }
              onSession={() =>
                runSchool(async () => {
                  await client().openSession({
                    ...credentials.current,
                    proxyUrl: schoolConfig.proxyUrl || "",
                  });
                  notify("请在电脑浏览器完成校方登录，再同步记录");
                })
              }
            />
          )}
          {route === "school" && (
            <>
              <div className="sc-coverage">{coverage}</div>
              {sourceSwitch()}
            </>
          )}
          {route === "appearance" && (
            <div className="sc-form">
              <label>
                主题
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="light">浅色</option>
                  <option value="dark">深色</option>
                </select>
              </label>
              <label>
                字号
                <select
                  value={font}
                  onChange={(e) => setFont(Number(e.target.value))}
                >
                  <option value={14}>标准 14px</option>
                  <option value={16}>较大 16px</option>
                </select>
              </label>
            </div>
          )}
          {route === "model" && (
            <form
              className="sc-form"
              onSubmit={(e) => {
                e.preventDefault();
                keyboard.hide();
                notify("配置已保留在本次预览");
              }}
            >
              <label>
                模型预设
                <select
                  aria-label="模型预设"
                  defaultValue="custom"
                  onChange={(e) => {
                    const p = modelPresets.find(
                      (p: any) => p.id === e.target.value,
                    );
                    setModel({ endpoint: p.endpoint, model: p.model, key: "" });
                  }}
                >
                  {modelPresets.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              {[
                ["endpoint", "API 地址"],
                ["model", "模型名称"],
                ["key", "API 密钥"],
              ].map(([key, label]) => (
                <label key={key}>
                  {label}
                  <KeyboardInput
                    aria-label={label}
                    type={key === "key" ? "password" : "text"}
                    value={(model as any)[key]}
                    onChange={(e) =>
                      setModel((s) => ({ ...s, [key]: e.target.value }))
                    }
                    onBlur={blur}
                  />
                </label>
              ))}
              <button className="sc-primary">保存配置</button>
              <p className="sc-inline-note">模型未连接，预览不会发送资料。</p>
            </form>
          )}
          {route === "files" && (
            <>
              <button
                className="sc-secondary"
                onClick={() =>
                  exportRows(
                    records
                      .filter((r) => !r.sensitive)
                      .flatMap((r) =>
                        (r.files || []).map((f: File) => ({
                          id: r.id,
                          record: r.title,
                          name: f.name,
                          size: f.size,
                        })),
                      ),
                    "资料清单",
                  )
                }
              >
                导出资料清单
              </button>
              {!records.some((r) => r.files?.length && !r.sensitive) && (
                <p className="sc-empty">暂无导入的附件</p>
              )}
              {records
                .filter((r) => !r.sensitive)
                .flatMap((r) =>
                  (r.files || []).map((f: File, i: number) => (
                    <div className="sc-file-row" key={r.id + i}>
                      <IconFolder size={20} />
                      <span>{f.name}</span>
                      <button
                        onClick={() => {
                          const url = URL.createObjectURL(f);
                          urls.current.push(url);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = f.name;
                          a.click();
                        }}
                      >
                        下载
                      </button>
                    </div>
                  )),
                )}
            </>
          )}
          {route === "account" && (
            <>
              <div className="sc-profile">
                <IconUser size={32} />
                <h2>预览账户</h2>
              </div>
              <p>此手机原型使用虚构资料，未连接真实用户及加密存储。</p>
              <button
                className="sc-secondary"
                onClick={() => {
                  selectTab("home");
                  notify("已返回预览首页");
                }}
              >
                返回预览首页
              </button>
            </>
          )}
          {route === "about" && (
            <div className="sc-about">
              <img src="/assets/workbench-icon.svg" alt="辅智通" />
              <h2>辅智通</h2>
              <p>手机交互原型</p>
              <p>本次数据在内存中，刷新后重置。</p>
            </div>
          )}
          {module === "学校链接" && (
            <SchoolLinks bookmarks={bookmarks} onBookmarks={setBookmarks} />
          )}
          {(module === "工作实务" || module === "专业成长") && (
            <MobileWebBook
              section={module}
              chapters={webbook[module] || []}
              onChange={(next) =>
                setWebbook((prev) => ({ ...prev, [module]: next }))
              }
            />
          )}
          {module === "学生信息" && (
            <>
              <div className="sc-view-switch">
                <button
                  aria-pressed={view !== "dorm" && view !== "advisor"}
                  onClick={() => setView("list")}
                >
                  学生列表
                </button>
                <button
                  aria-pressed={view === "dorm"}
                  onClick={() => {
                    keyboard.hide();
                    setView("dorm");
                  }}
                >
                  宿舍视图
                </button>
                <button
                  aria-pressed={view === "advisor"}
                  onClick={() => {
                    keyboard.hide();
                    setView("advisor");
                  }}
                >
                  导师视图
                </button>
              </div>
              {search("搜索姓名、学号、班级或导师")}
              {view === "dorm" ? (
                <DormPanel
                  students={foundStudents}
                  onOpen={(s) => go("student:" + s.id)}
                />
              ) : view === "advisor" ? (
                <>
                  <div className="sc-toolbar">
                    <span>{advisorGroupsList.length} 位导师</span>
                    <button onClick={() => exportRows(foundStudents, "导师门下学生")}>
                      导出
                    </button>
                  </div>
                  {advisorGroupsList.map((g: any) => (
                    <section className="sc-advisor-card" key={g.advisor}>
                      <div className="sc-advisor-card__head">
                        <div>
                          <strong>{g.advisor}</strong>
                          <small>
                            {g.majors.join(" / ") || "未标注专业"} · 共{" "}
                            {g.members.length} 人
                          </small>
                        </div>
                        {g.leaveCount > 0 && (
                          <span className="sc-status late">
                            离校 {g.leaveCount}
                          </span>
                        )}
                      </div>
                      <div className="sc-list">
                        {g.members.map((s: Row) => (
                          <button
                            className="sc-menu-row"
                            key={s.id}
                            onClick={() => go("student:" + s.id)}
                          >
                            <span>
                              {s.name} · {s.className}
                            </span>
                            <span className="sc-status">
                              {s.status || "在校"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>
                  ))}
                  {!advisorGroupsList.length && (
                    <p className="sc-empty">未找到匹配导师或学生</p>
                  )}
                </>
              ) : (
                <>
                  <div className="sc-toolbar">
                    <span>{foundStudents.length} 名学生</span>
                    <button
                      onClick={() => exportRows(foundStudents, "学生信息")}
                    >
                      导出
                    </button>
                  </div>
                  <div className="sc-list">
                    {foundStudents.slice(0, visible).map((s) => (
                      <button
                        className="sc-student-row"
                        key={s.id}
                        onClick={() => go("student:" + s.id)}
                      >
                        {s.photoUrl ? (
                          <img
                            className="sc-avatar"
                            src={s.photoUrl}
                            alt={s.name}
                          />
                        ) : (
                          <span className="sc-avatar">
                            <IconUser size={23} />
                          </span>
                        )}
                        <span>
                          <strong>{s.name}</strong>
                          <small>
                            {s.number} · {s.className}
                          </small>
                        </span>
                        <IconChevronRight size={18} />
                      </button>
                    ))}
                  </div>
                  {foundStudents.length > visible && (
                    <button
                      className="sc-more"
                      onClick={() => setVisible((v) => v + 20)}
                    >
                      加载更多
                    </button>
                  )}
                  {!foundStudents.length && (
                    <p className="sc-empty">未找到学生</p>
                  )}
                </>
              )}
            </>
          )}
          {module === "工作留痕" && (
            <>
              <MobileTaskBoard
                tasks={tasks}
                today={localDay()}
                onToggle={(t) => {
                  setTasks((all) =>
                    all.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)),
                  );
                  log(t.done ? "重新打开待办" : "完成待办", t.text, t.module);
                }}
                onImportant={(t) =>
                  setTasks((all) =>
                    all.map((x) =>
                      x.id === t.id ? { ...x, important: !x.important } : x,
                    ),
                  )
                }
                onAdd={() => go("task:new")}
              />
              {viewSwitch()}
              {view === "calendar" ? (
                <CalendarPanel events={logs} onOpen={openCalendar} />
              ) : (
                <>
                  <h2 className="sc-section-title">每日简报</h2>
                  <article className="sc-detail-box">
                    <strong>{localDay()}</strong>
                    <p>本次操作 {logs.length} 条</p>
                    <p>已完成待办 {tasks.filter((t) => t.done).length} 项</p>
                    <button onClick={() => exportRows(logs, "每日简报")}>
                      导出留痕
                    </button>
                  </article>
                  <div className="sc-list">
                    {logs.map((l) => (
                      <div className="sc-log" key={l.id}>
                        <strong>{l.action}</strong>
                        <p>{l.subject}</p>
                        <small>{l.module}</small>
                      </div>
                    ))}
                  </div>
                  {!logs.length && (
                    <p className="sc-empty">操作后将在这里留痕</p>
                  )}
                </>
              )}
            </>
          )}
          {module && !["学生信息", "工作留痕", "学校链接", "工作实务", "专业成长"].includes(module) && (
            <>
              {module === "请假销假" && (
                <>
                  {sourceSwitch()}
                  <div className="sc-leave-sync-bar">
                    <span className="sc-coverage">{coverage}</span>
                    <button
                      type="button"
                      disabled={schoolBusy}
                      onClick={() =>
                        runSchool(async () => {
                          setSchool(await client().list());
                          setLeaveSource("school");
                          notify("已抓取最新校方请销假记录");
                        })
                      }
                    >
                      {schoolBusy ? "同步中…" : "实时抓取同步"}
                    </button>
                  </div>
                  {leaveSummary.advisorGroups.length > 0 && (
                    <div className="sc-group-alert" role="status">
                      <strong>
                        同导师科研/出差多人同行（{leaveSummary.advisorGroups.length}组）
                      </strong>
                      {leaveSummary.advisorGroups.map((g: any) => (
                        <div key={g.id} className="sc-group-alert__item">
                          <span>
                            {g.advisor} · {g.projectName}（{g.destination}）
                          </span>
                          <small>
                            {g.count}人同行：{g.studentNames.join("、")}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="sc-leave-cats" aria-label="请假视图范围">
                    {[
                      ["all", "全部请假"],
                      ["active", "当前请假列表"],
                    ].map(([k, label]) => (
                      <button
                        key={k}
                        type="button"
                        className={leaveScope === k ? "active" : ""}
                        onClick={() => setLeaveScope(k)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="sc-leave-cats" aria-label="请假事由分类">
                    {["全部", ...leaveReasonCategories].map((c: string) => (
                      <button
                        key={c}
                        type="button"
                        className={leaveCat === c ? "active" : ""}
                        onClick={() => setLeaveCat(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {viewSwitch()}
              {search(
                module === "请假销假" ? "搜索学生、导师、目的地或事由" : "搜索学生或记录",
              )}
              <div className="sc-toolbar">
                <span>{found.length} 条记录</span>
                <div>
                  <button
                    onClick={() => {
                      setDraftFilter(filter);
                      setSheet("filter");
                    }}
                  >
                    <IconFilter size={17} />
                    筛选
                  </button>
                  <button
                    onClick={() => {
                      if (module === "请假销假") {
                        const grouped = found.reduce((acc: Record<string, any[]>, r) => {
                          const cat = classifyLeaveReason(r);
                          (acc[cat] ||= []).push(r);
                          return acc;
                        }, {});
                        const u = URL.createObjectURL(
                          new Blob([JSON.stringify(grouped, null, 2)], {
                            type: "application/json",
                          }),
                        );
                        const a = document.createElement("a");
                        a.href = u;
                        a.download = "请假销假-按事由分类.json";
                        a.click();
                        setTimeout(() => URL.revokeObjectURL(u), 1000);
                        notify("已按事由分类导出");
                      } else {
                        exportRows(found, module);
                      }
                    }}
                  >
                    {module === "请假销假" ? "分类导出" : "导出"}
                  </button>
                </div>
              </div>
              {view === "calendar" ? (
                <CalendarPanel events={found} onOpen={openCalendar} />
              ) : (
                <>
                  <div className="sc-list">
                    {found.slice(0, visible).map((r) => (
                      <button
                        className="sc-record-row"
                        key={r.id}
                        onClick={() => go("record:" + r.id)}
                      >
                        <div>
                          <strong>{name(r.studentId)}</strong>
                          <span
                            className={
                              "sc-status " + (leaveOverdue(r) ? "late" : "")
                            }
                          >
                            {module === "请假销假" ? leaveStatus(r) : r.status}
                          </span>
                        </div>
                        <p>
                          {module === "请假销假"
                            ? `[${classifyLeaveReason(r)}] ${r.title}${r.destination ? ` · ${r.destination}` : ""} (${leaveDurationHours(r)}h)`
                            : r.title}
                        </p>
                        <small>
                          {r.startAt
                            ? `${r.startAt.replace("T", " ")} 至 ${r.endAt.replace("T", " ")}`
                            : r.date}
                        </small>
                        {leaveOverdue(r) && <em>已逾期未返校</em>}
                      </button>
                    ))}
                  </div>
                  {found.length > visible && (
                    <button
                      className="sc-more"
                      onClick={() => setVisible((v) => v + 20)}
                    >
                      加载更多
                    </button>
                  )}
                  {!found.length && <p className="sc-empty">暂无匹配记录</p>}
                </>
              )}
            </>
          )}
          {student && (
            <>
              <div className="sc-student-profile">
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt={student.name} />
                ) : (
                  <IconUser size={38} />
                )}
                <h2>{student.name}</h2>
                <span>{student.number}</span>
                <label className="sc-upload-photo">
                  导入照片
                  <input
                    type="file"
                    aria-label="导入学生照片"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (
                        !f.type.startsWith("image/") ||
                        f.size > 20 * 1024 * 1024
                      ) {
                        notify("请选择不超过20MB的图片");
                        return;
                      }
                      const url = URL.createObjectURL(f);
                      urls.current.push(url);
                      setStudents((all) =>
                        all.map((s) =>
                          s.id === student.id ? { ...s, photoUrl: url } : s,
                        ),
                      );
                      log("导入照片", student.name, "学生信息");
                    }}
                  />
                </label>
              </div>
              <dl className="sc-details">
                {[
                  ["班级", "className"],
                  ["专业", "major"],
                  ["年级", "year"],
                  ["在校状态", "status"],
                  ["联系电话", "phone"],
                  ["宿舍", "dorm"],
                  ["床号", "bedNumber"],
                  ["住宿标注", "residenceStatus"],
                  ["指导导师", "advisor"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{student[key] || "未填写"}</dd>
                  </div>
                ))}
              </dl>
              <h2 className="sc-section-title">档案记录</h2>
              {records
                .filter((r) => r.studentId === student.id && !r.sensitive)
                .slice(0, 8)
                .map((r) => (
                  <button
                    className="sc-menu-row"
                    key={r.id}
                    onClick={() => go("record:" + r.id)}
                  >
                    <span>{r.title}</span>
                    <IconChevronRight size={18} />
                  </button>
                ))}
            </>
          )}
          {record && (
            <>
              <h2 className="sc-record-heading">{record.title}</h2>
              <span className="sc-status">
                {record.module === "请假销假"
                  ? leaveStatus(record)
                  : record.status}
              </span>
              <dl className="sc-details">
                {[
                  ["所属学生", name(record.studentId)],
                  ["所属模块", record.module],
                  ...(record.module === "请假销假"
                    ? [
                        ["假别", record.leaveType],
                        ["开始时间", record.startAt.replace("T", " ")],
                        ["结束时间", record.endAt.replace("T", " ")],
                        ["请假去向", record.destination],
                      ]
                    : [["记录日期", record.date]]),
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v || "未提供"}</dd>
                  </div>
                ))}
              </dl>
              <p className="sc-summary">{record.summary}</p>
              {leaveOverdue(record) && (
                <p className="sc-error">已超过预计返校时间，请核实学生情况。</p>
              )}
              {record.source === "school" && (
                <SchoolRecordTools
                  record={record}
                  client={client}
                  capabilities={school.capabilities}
                  busy={schoolBusy}
                  onBusy={setSchoolBusy}
                  onSync={setSchool}
                  onDone={back}
                  notify={notify}
                  onDetail={(r) =>
                    setSchool((s: any) => ({
                      ...s,
                      records: s.records.map((x: Row) =>
                        x.id === r.id ? r : x,
                      ),
                    }))
                  }
                />
              )}
              {record.module === "请假销假" && record.source !== "school" && (
                <div className="sc-actions">
                  {(leaveActions[leaveStatus(record)] || []).map((a: any) => (
                    <button
                      key={a.action}
                      className={
                        a.action === "reject" ? "sc-secondary" : "sc-primary"
                      }
                      onClick={() => changeLeave(record, a.action)}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
              {record.files?.map((f: File, i: number) => {
                const fileUrl = URL.createObjectURL(f);
                urls.current.push(fileUrl);
                const isImg = f.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name);
                const isPdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name);
                return (
                  <div className="sc-attachment-preview" key={i}>
                    <div className="sc-file-row">
                      <IconFolder size={20} />
                      <span>{f.name}</span>
                      <a href={fileUrl} download={f.name}>下载</a>
                    </div>
                    {isImg && <img src={fileUrl} alt={f.name} />}
                    {isPdf && <iframe title={f.name} src={fileUrl} />}
                  </div>
                );
              })}
            </>
          )}
          {isForm && (
            <form className="sc-form" onSubmit={saveForm}>
              {route === "task:new" ? (
                <>
                  <label>
                    待办事项
                    <KeyboardInput
                      name="text"
                      aria-label="待办事项"
                      required
                      maxLength={200}
                      onBlur={blur}
                    />
                  </label>
                  <label>
                    截止日期
                    <KeyboardInput
                      name="date"
                      aria-label="截止日期"
                      type="date"
                      defaultValue={localDay()}
                      required
                      onBlur={blur}
                    />
                  </label>
                  <label>
                    所属模块
                    <select name="module" defaultValue="工作实务">
                      {available.map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <label>
                    所属学生
                    <select
                      aria-label="所属学生"
                      name="studentId"
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>
                        选择学生
                      </option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} · {s.number}
                        </option>
                      ))}
                    </select>
                  </label>
                  {route === "leave:new" ? (
                    <>
                      <label>
                        假别
                        <select name="leaveType" aria-label="假别">
                          {leaveTypes.map((t: string) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        开始时间
                        <KeyboardInput
                          type="datetime-local"
                          aria-label="开始时间"
                          name="startAt"
                          defaultValue={localDay() + "T09:00"}
                          required
                          onBlur={blur}
                        />
                      </label>
                      <label>
                        结束时间
                        <KeyboardInput
                          type="datetime-local"
                          aria-label="结束时间"
                          name="endAt"
                          defaultValue={localDay() + "T18:00"}
                          required
                          onBlur={blur}
                        />
                      </label>
                      <label>
                        请假去向
                        <KeyboardInput
                          name="destination"
                          aria-label="请假去向"
                          maxLength={200}
                          required
                          onBlur={blur}
                        />
                      </label>
                    </>
                  ) : (
                    <label>
                      记录标题
                      <KeyboardInput
                        name="title"
                        aria-label="记录标题"
                        required
                        maxLength={200}
                        onBlur={blur}
                      />
                    </label>
                  )}
                  <label>
                    {route === "leave:new" ? "请假事由" : "内容摘要"}
                    <KeyboardTextarea
                      name="summary"
                      aria-label={
                        route === "leave:new" ? "请假事由" : "内容摘要"
                      }
                      required
                      maxLength={5000}
                      rows={3}
                      onBlur={blur}
                    />
                  </label>
                  <label className="sc-file-picker">
                    添加附件
                    <input
                      aria-label="添加附件"
                      type="file"
                      multiple
                      onChange={(e) => setFiles([...(e.target.files || [])])}
                    />
                    {files.length > 0 && <span>{files.length} 个文件</span>}
                  </label>
                </>
              )}
              {error && (
                <p role="alert" className="sc-error">
                  {error}
                </p>
              )}
              <button className="sc-primary" type="submit">
                {route === "leave:new" ? "提交申请" : "保存"}
              </button>
            </form>
          )}
        </main>
      </MobileScroll>
      {!insets.isKeyboardVisible && (
        <nav
          className="sc-bottom-nav"
          aria-label="主导航"
          style={{ bottom: insets.bottomInset }}
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              aria-current={tab === id ? "page" : undefined}
              className={tab === id ? "active" : ""}
              onClick={() => selectTab(id)}
            >
              <Icon size={23} stroke={1.65} />
              <span>{label}</span>
              {id === "inbox" && unread > 0 && (
                <b className="sc-nav-count">{unread}</b>
              )}
            </button>
          ))}
        </nav>
      )}
      {!insets.isKeyboardVisible && !isForm && (
        <button
          className="sc-ai"
          aria-label="打开AI助手"
          style={{ left: pos.x, top: pos.y }}
          data-scroll-drag="ignore"
          onPointerDown={(e) => {
            moved.current = false;
            drag.current = {
              x: e.clientX,
              y: e.clientY,
              from: pos,
              scale:
                e.currentTarget.getBoundingClientRect().width /
                e.currentTarget.offsetWidth,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            const d = drag.current,
              dx = (e.clientX - d.x) / d.scale,
              dy = (e.clientY - d.y) / d.scale;
            if (Math.abs(dx) + Math.abs(dy) > 6) {
              moved.current = true;
              setFab({
                x: Math.max(
                  8,
                  Math.min(device.geometry.screen.width - 52, d.from.x + dx),
                ),
                y: Math.max(
                  device.geometry.safeArea.top + 55,
                  Math.min(
                    frameHeight - insets.bottomInset - 106,
                    d.from.y + dy,
                  ),
                ),
              });
            }
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onClick={() => {
            if (!moved.current) setSheet("ai");
          }}
        >
          AI
        </button>
      )}
      {toast && (
        <div
          className="sc-toast"
          role="status"
          style={{ bottom: insets.bottomInset + 76 }}
        >
          {toast}
        </div>
      )}
      <BottomSheet
        open={sheet === "filter"}
        onOpenChange={(open) => {
          if (!open) setSheet("");
        }}
        title="筛选与排序"
      >
        <div className="sc-form">
          <label>
            状态
            <select
              aria-label="筛选状态"
              value={draftFilter.status}
              onChange={(e) =>
                setDraftFilter((s) => ({ ...s, status: e.target.value }))
              }
            >
              {[
                "全部",
                ...(module === "请假销假"
                  ? [
                      "待审批",
                      "已批准",
                      "请假中",
                      "待销假",
                      "已销假",
                      "已驳回",
                      "校方状态未知",
                    ]
                  : ["待跟进", "已完成"]),
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            开始日期
            <KeyboardInput
              type="date"
              aria-label="筛选开始日期"
              value={draftFilter.start}
              onChange={(e) =>
                setDraftFilter((s) => ({ ...s, start: e.target.value }))
              }
              onBlur={blur}
            />
          </label>
          <label>
            结束日期
            <KeyboardInput
              type="date"
              min={draftFilter.start}
              aria-label="筛选结束日期"
              value={draftFilter.end}
              onChange={(e) =>
                setDraftFilter((s) => ({ ...s, end: e.target.value }))
              }
              onBlur={blur}
            />
          </label>
          <label>
            时间排序
            <select
              aria-label="时间排序"
              value={draftFilter.sort}
              onChange={(e) =>
                setDraftFilter((s) => ({ ...s, sort: e.target.value }))
              }
            >
              <option value="desc">从新到旧</option>
              <option value="asc">从旧到新</option>
            </select>
          </label>
          <button
            className="sc-primary"
            onClick={() => {
              if (
                draftFilter.start &&
                draftFilter.end &&
                draftFilter.end < draftFilter.start
              ) {
                notify("结束日期不能早于开始日期");
                return;
              }
              setFilter(draftFilter);
              setSheet("");
              keyboard.hide();
            }}
          >
            应用筛选
          </button>
          <button
            className="sc-secondary"
            onClick={() =>
              setDraftFilter({
                status: "全部",
                start: "",
                end: "",
                sort: "desc",
              })
            }
          >
            重置条件
          </button>
        </div>
      </BottomSheet>
      <BottomSheet
        open={sheet === "ai"}
        onOpenChange={(open) => {
          if (!open) setSheet("");
        }}
        title="AI 工作建议"
      >
        <div className="sc-ai-content">
          <h3>{module || title || tabs.find((t) => t.id === tab)?.label}</h3>
          <ul>
            {(module === "请假销假"
              ? [
                  "核对请假起止时间与去向",
                  "离校前完成审批，返校后核实销假",
                  "先联系确认逾期学生，勿自动判定返校",
                ]
              : [
                  "先核对当前模块资料与待办",
                  "补齐时间、对象和关联附件",
                  "导出前检查范围与敏感信息",
                ]
            ).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <button
            className="sc-primary"
            onClick={() => {
              selectTab("mine");
              go("model");
            }}
          >
            模型设置
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
