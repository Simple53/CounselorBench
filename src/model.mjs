export const groups = [
  ["学生基础", ["学生信息"]],
  [
    "教育管理",
    ["思政教育", "党团建设", "日常管理", "奖惩助贷", "学风建设", "心理健康"],
  ],
  ["发展服务", ["就业指导"]],
  ["安全保障", ["网络育人", "应急处突"]],
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
  ["dorm", "宿舍"],
  ["status", "在校状态"],
  ["origin", "生源地"],
  ["political", "政治面貌"],
  ["emergencyContact", "紧急联系人"],
  ["attachments", "附件数"],
].map(([id, label]) => ({ id, label }));
export const partyStages = [
  { id: "mass", label: "群众/共青团员", step: 0 },
  { id: "applicant", label: "入党申请人", step: 1 },
  { id: "activist", label: "入党积极分子", step: 2 },
  { id: "developer", label: "发展对象", step: 3 },
  { id: "probationary", label: "预备党员", step: 4 },
  { id: "full", label: "正式党员", step: 5 },
];
export const moduleSchemas = {
  日常管理: [
    ["subType", "事项类型", ["请假销假", "夜归/晚归", "宿舍卫生", "走读/外宿", "其他日常"]],
    ["dateRange", "起止时间", "text", "如 2026-11-08 至 2026-11-10"],
  ],
  奖惩助贷: [
    ["category", "业务类型", ["国家奖学金", "国家励志奖学金", "校级奖学金", "企业奖学金", "助学贷款", "困难补助/减免", "勤工助学", "违纪处分", "夜不归宿/晚归通报", "其他奖惩"]],
    ["amount", "金额(元)/等级", "text", "如 8000 或 警告处分"],
    ["docNumber", "文号/批次", "text", "如 学字〔2026〕15号 或 2026秋季批次"],
  ],
  学风建设: [
    ["subType", "学业情况", ["期末成绩分析", "挂科预警帮扶", "考风考纪", "竞赛科研成果", "日常学业沟通"]],
    ["gpaInfo", "绩点/挂科科目", "text", "如 GPA 2.3 / 高数、大学物理重修"],
  ],
  思政教育: [
    ["subType", "谈话/活动形式", ["一对一谈心", "宿舍走访", "主题班会", "家校沟通"]],
    ["location", "地点/方式", "text", "如 辅导员办公室 / 电话"],
  ],
  党团建设: [
    ["subType", "政治发展阶段", ["递交入党申请书", "确立为入党积极分子", "列为发展对象", "接收为预备党员", "预备党员转正", "团内推优"]],
    ["stageDate", "阶段生效日期", "date", ""],
    ["trainingStatus", "党校/党课培训", "text", "如 院党校结业 / 校党校第35期"],
  ],
  就业指导: [
    ["careerTarget", "职业意向类型", ["考研升学", "考公考编/选调生", "国企央企", "民营骨干企业", "出国出境深造", "自由职业/创业", "征兵入伍", "暂缓就业"]],
    ["targetCity", "意向城市/地区", "text", "如 杭州、上海、生源地省会"],
    ["recommendedCompany", "推荐意向企业/岗位", "text", "如 阿里巴巴、华为、国家电网、选调生"],
  ],
};
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
  dorm: `${(i % 4) + 1}栋${101 + (Math.floor(i / 4) % 15)}`,
  status: i < 146 ? "在校" : "请假离校",
  concern: i < 8,
  origin: ["浙江", "江苏", "安徽"][i % 3],
  political: i % 8 === 0 ? "中共党员" : i % 8 === 1 ? "中共预备党员" : i % 8 === 2 ? "发展对象" : i % 8 === 3 ? "入党积极分子" : i % 2 === 0 ? "共青团员" : "群众",
  emergencyContact: `${surnames[i % 12]}家长 139****${String(3100 + i)}`,
  attachments: (i % 4) + 1,
}));
export const initialRecords = Array.from({ length: 386 }, (_, i) => {
  const mod = i < 18 ? "应急处突" : modules[1 + (i % modules.length)];
  return {
    id: `r${i + 1}`,
    studentId: `s${(i % 152) + 1}`,
    module: mod,
    title:
      i < 18
        ? "事件核查与跟进"
        : mod === "奖惩助贷"
          ? ["获校一等奖学金", "家庭经济困难资助", "违纪晚归通报谈话"][i % 3]
          : ["入学适应沟通", "材料核对", "阶段跟进记录"][i % 3],
    date: `2026-${i % 3 === 0 ? "11" : "10"}-${String(i % 3 === 0 ? (i % 5) + 1 : (i % 28) + 1).padStart(2, "0")}`,
    status: i % 3 ? "已完成" : "待跟进",
    summary:
      mod === "奖惩助贷"
        ? ["经评审获得2026学年校一等奖学金，发放奖金2000元。", "申请国家助学金并完成家庭经济困难资格初审。", "针对宿舍晚归与内务进行专项谈话教育并完成留痕。"][i % 3]
        : "核对相关情况，登记沟通结果与后续安排。",
    paths: i % 3 ? [`资料主库/学生${(i % 152) + 1}/记录${i + 1}.pdf`] : [],
    sensitive: mod === "心理健康" && i >= 18,
  };
});
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
export const importableFields = [
  { id: "name", label: "姓名", required: true, aliases: ["姓名", "学生姓名", "名字"] },
  { id: "number", label: "学号", required: true, aliases: ["学号", "学生学号", "考生号", "编号"] },
  { id: "className", label: "班级", aliases: ["班级", "行政班", "所在班级", "班级名称"] },
  { id: "major", label: "专业", aliases: ["专业", "专业名称", "所属专业"] },
  { id: "year", label: "年级", aliases: ["年级", "入学年份", "级"] },
  { id: "phone", label: "联系电话", aliases: ["联系电话", "电话", "手机号", "手机", "联系方式"] },
  { id: "dorm", label: "宿舍", aliases: ["宿舍", "寝室", "宿舍号", "楼栋房间", "住宿"] },
  { id: "status", label: "在校状态", aliases: ["在校状态", "学籍状态", "状态"] },
  { id: "origin", label: "生源地", aliases: ["生源地", "籍贯", "家庭住址", "省份"] },
  { id: "political", label: "政治面貌", aliases: ["政治面貌", "党团", "政治"] },
  { id: "emergencyContact", label: "紧急联系人", aliases: ["紧急联系人", "家长电话", "监护人", "家庭电话", "父亲电话", "母亲电话"] },
];
export function autoDetectHeaderRow(rows) {
  let bestRow = 0,
    bestScore = -1;
  const limit = Math.min(rows.length, 10);
  for (let i = 0; i < limit; i++) {
    const cells = (rows[i] || []).map((c) => String(c ?? "").trim());
    let score = 0;
    for (const f of importableFields) {
      if (cells.some((c) => c && f.aliases.some((a) => c.includes(a))))
        score += f.required ? 3 : 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestRow = i;
    }
  }
  return bestRow;
}
export function autoMapColumns(headerRow = []) {
  const mapping = {};
  const headers = headerRow.map((h) => String(h ?? "").trim());
  for (const f of importableFields) {
    const idx = headers.findIndex(
      (h) =>
        h && (f.aliases.includes(h) || f.aliases.some((a) => h.includes(a))),
    );
    if (idx !== -1) mapping[f.id] = String(idx);
  }
  return mapping;
}
export function previewImportDiff(
  rows,
  headerRowIndex,
  mapping,
  existingStudents = [],
) {
  const dataRows = rows.slice(headerRowIndex + 1);
  const byNumber = new Map(
    existingStudents.map((s) => [String(s.number).trim(), s]),
  );
  const parsed = [];
  for (const row of dataRows) {
    if (!Array.isArray(row)) continue;
    const item = {};
    for (const f of importableFields) {
      const colIdx = mapping[f.id];
      if (colIdx !== undefined && colIdx !== "") {
        const raw = row[Number(colIdx)];
        const val = String(raw ?? "").trim();
        if (val) item[f.id] = val;
      }
    }
    if (!item.name || !item.number) continue;
    const existing = byNumber.get(item.number);
    parsed.push({
      ...item,
      mode: existing ? "update" : "create",
      existingId: existing?.id || null,
    });
  }
  return parsed;
}
export function groupStudentsByDorm(students) {
  const map = new Map();
  for (const s of students) {
    const raw = String(s.dorm || "").trim() || "未分配宿舍";
    const match = /^([^栋号楼]+[栋号楼])(.*)$/.exec(raw);
    const building = match
      ? match[1]
      : raw === "未分配宿舍"
        ? "未分配"
        : "默认楼栋";
    const room = raw;
    if (!map.has(room)) {
      map.set(room, { room, building, members: [] });
    }
    map.get(room).members.push(s);
  }
  return [...map.values()].sort((a, b) => a.room.localeCompare(b.room, "zh-CN"));
}
