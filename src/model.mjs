export const groups = [
  ["学生基础", ["学生信息"]],
  [
    "教育管理",
    ["思政教育", "党团建设", "日常管理", "行为奖惩", "学风建设", "心理健康"],
  ],
  ["发展服务", ["就业指导", "资助育人"]],
  ["安全保障", ["安全管理", "网络育人", "应急处突"]],
  ["工作支持", ["工作实务", "专业成长", "工作留痕"]],
];
export const modules = groups.flatMap(([, names]) => names);
export const fields = [
  ["name", "姓名"],
  ["number", "学号"],
  ["className", "班级"],
  ["year", "年级"],
  ["phone", "联系电话"],
  ["major", "专业"],
  ["status", "在校状态"],
  ["origin", "生源地"],
  ["political", "政治面貌"],
  ["attachments", "附件数"],
].map(([id, label]) => ({ id, label }));
const majors = ["计算机科学与技术", "软件工程", "人工智能", "数据科学与大数据"];
const surnames = [
  "林",
  "陈",
  "张",
  "王",
  "李",
  "赵",
  "周",
  "吴",
  "徐",
  "孙",
  "胡",
  "高",
];
export const initialStudents = Array.from({ length: 152 }, (_, i) => ({
  id: `s${i + 1}`,
  name: `${surnames[i % 12]}同学${i >= 12 ? i + 1 : ""}`,
  number: String(2026010101 + i),
  className: `${i < 48 ? "计算机" : i < 84 ? "软件" : i < 118 ? "人工智能" : "数据科学"}2601班`,
  year: "2026级",
  phone: `138****${String(6821 + i)}`,
  major: majors[i < 48 ? 0 : i < 84 ? 1 : i < 118 ? 2 : 3],
  status: i < 146 ? "在校" : "请假离校",
  concern: i < 8,
  origin: ["浙江", "江苏", "安徽"][i % 3],
  political: i % 4 ? "共青团员" : "群众",
  attachments: (i % 4) + 1,
}));
export const initialRecords = Array.from({ length: 386 }, (_, i) => ({
  id: `r${i + 1}`,
  studentId: `s${(i % 152) + 1}`,
  module: i < 18 ? "应急处突" : modules[1 + (i % 13)],
  title:
    i < 18
      ? "事件核查与跟进"
      : ["入学适应沟通", "材料核对", "阶段跟进记录"][i % 3],
  date: `2026-${i % 3 === 0 ? "11" : "10"}-${String(i % 3 === 0 ? (i % 5) + 1 : (i % 28) + 1).padStart(2, "0")}`,
  status: i % 3 ? "已完成" : "待跟进",
  summary: "核对相关情况，登记沟通结果与后续安排。",
  paths: i % 3 ? [`资料主库/学生${(i % 152) + 1}/记录${i + 1}.pdf`] : [],
  sensitive: modules[1 + (i % 13)] === "心理健康" && i >= 18,
}));
export const initialTasks = [
  {
    id: "t1",
    date: "2026-11-05",
    text: "材料核对",
    done: false,
    module: "工作实务",
  },
  {
    id: "t2",
    date: "2026-11-06",
    text: "班会安排",
    done: false,
    module: "思政教育",
  },
  {
    id: "t3",
    date: "2026-11-09",
    text: "请假复核",
    done: false,
    module: "日常管理",
  },
];
export function matchRules(row, rules, mode = "and") {
  const active = rules.filter((r) => r.value !== "");
  const test = (r) => {
    const actual = row[r.field] ?? "";
    if (r.op === "eq") return String(actual) === r.value;
    if (r.op === "neq") return String(actual) !== r.value;
    if (r.op === "gte")
      return (
        Number.isFinite(Number(actual)) && Number(actual) >= Number(r.value)
      );
    return String(actual)
      .toLocaleLowerCase()
      .includes(r.value.toLocaleLowerCase());
  };
  return (
    !active.length || (mode === "or" ? active.some(test) : active.every(test))
  );
}
export function summarize(students, records) {
  const ids = new Set(students.map((s) => s.id));
  const scoped = records.filter((r) => ids.has(r.studentId) && !r.sensitive);
  return {
    students: students.length,
    events: scoped.filter((r) => r.module === "应急处突").length,
    records: scoped.length,
    present: students.filter((s) => s.status === "在校").length,
    leave: students.filter((s) => s.status === "请假离校").length,
    concern: students.filter((s) => s.concern).length,
  };
}
// 日历以本地日期构建，避免 UTC 转换造成事件跨日。
export function monthDays(year, month) {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(year, month, i - offset + 1);
    return {
      day: d.getDate(),
      current: d.getMonth() === month,
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    };
  });
}
