export const groups = [
  ["学生基础", ["学生信息"]],
  [
    "教育管理",
    [
      "思政教育",
      "党团建设",
      "日常管理",
      "请假销假",
      "奖惩助贷",
      "学风建设",
      "心理健康",
    ],
  ],
  ["发展服务", ["就业指导"]],
  ["安全保障", ["网络育人", "应急处突"]],
  ["工作支持", ["工作实务", "专业成长", "工作留痕", "学校链接"]],
];
export const modules = groups.flatMap(([, names]) => names);

export const residenceOptions = ["正常住宿", "走读", "换宿舍", "退宿"];

export const fields = [
  ["name", "姓名"],
  ["number", "学号"],
  ["className", "班级"],
  ["year", "年级"],
  ["phone", "联系电话"],
  ["major", "专业"],
  ["dorm", "宿舍"],
  ["bedNumber", "床号"],
  ["residenceStatus", "住宿标注"],
  ["advisor", "指导导师"],
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
  请假销假: [
    ["leaveType", "假别", ["事假", "病假", "公假", "其他"]],
    [
      "reasonCategory",
      "事由分类",
      ["回家", "生病", "实验", "学术会议", "野外观察", "实习求职", "其他"],
    ],
    [
      "projectName",
      "关联导师/科研项目",
      "text",
      "选填，如 国家自然基金湿地采样",
    ],
    ["startAt", "开始时间", "datetime-local", ""],
    ["endAt", "结束时间", "datetime-local", ""],
    ["destination", "请假去向", "text", "填写目的地"],
  ],
  日常管理: [
    [
      "subType",
      "事项类型",
      ["请假销假", "夜归/晚归", "宿舍卫生", "走读/外宿", "其他日常"],
    ],
    ["dateRange", "起止时间", "text", "如 2026-11-08 至 2026-11-10"],
  ],
  奖惩助贷: [
    [
      "category",
      "业务类型",
      [
        "国家奖学金",
        "国家励志奖学金",
        "校级奖学金",
        "企业奖学金",
        "助学贷款",
        "困难补助/减免",
        "勤工助学",
        "违纪处分",
        "夜不归宿/晚归通报",
        "其他奖惩",
      ],
    ],
    ["amount", "金额(元)/等级", "text", "如 8000 或 警告处分"],
    ["docNumber", "文号/批次", "text", "如 学字〔2026〕15号 或 2026秋季批次"],
  ],
  学风建设: [
    [
      "subType",
      "学业情况",
      [
        "期末成绩分析",
        "挂科预警帮扶",
        "考风考纪",
        "竞赛科研成果",
        "日常学业沟通",
      ],
    ],
    ["gpaInfo", "绩点/挂科科目", "text", "如 GPA 2.3 / 高数、大学物理重修"],
  ],
  思政教育: [
    [
      "subType",
      "谈话/活动形式",
      ["一对一谈心", "宿舍走访", "主题班会", "家校沟通"],
    ],
    ["location", "地点/方式", "text", "如 辅导员办公室 / 电话"],
  ],
  党团建设: [
    [
      "subType",
      "政治发展阶段",
      [
        "递交入党申请书",
        "确立为入党积极分子",
        "列为发展对象",
        "接收为预备党员",
        "预备党员转正",
        "团内推优",
      ],
    ],
    ["stageDate", "阶段生效日期", "date", ""],
    ["trainingStatus", "党校/党课培训", "text", "如 院党校结业 / 校党校第35期"],
  ],
  就业指导: [
    [
      "careerTarget",
      "职业意向类型",
      [
        "考研升学",
        "考公考编/选调生",
        "国企央企",
        "民营骨干企业",
        "出国出境深造",
        "自由职业/创业",
        "征兵入伍",
        "暂缓就业",
      ],
    ],
    ["targetCity", "意向城市/地区", "text", "如 杭州、上海、生源地省会"],
    [
      "recommendedCompany",
      "推荐意向企业/岗位",
      "text",
      "如 阿里巴巴、华为、国家电网、选调生",
    ],
  ],
};

const majors = [
  "计算机科学与技术",
  "软件工程",
  "人工智能",
  "数据科学与大数据",
];
const advisorsByMajor = {
  计算机科学与技术: ["周明华", "林远航", "陈静怡"],
  软件工程: ["张伟岸", "王建国", "赵敏"],
  人工智能: ["孙立群", "胡文博", "周明华"],
  数据科学与大数据: ["高志远", "徐海燕", "林远航"],
};
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

function studentAdvisorFor(i, major) {
  // 确保 s147, s148, s149 同属周明华课题组；s150, s151 同属张伟岸课题组，便于识别同导师出差
  if (i >= 146 && i <= 148) return "周明华";
  if (i >= 149 && i <= 150) return "张伟岸";
  const pool = advisorsByMajor[major] || ["周明华"];
  return pool[i % pool.length];
}

function residenceFor(i) {
  if (i === 4 || i === 19 || i === 42 || i === 77 || i === 103) return "走读";
  if (i === 9 || i === 33 || i === 65 || i === 91) return "换宿舍";
  if (i === 14 || i === 55 || i === 88) return "退宿";
  return "正常住宿";
}

export const initialStudents = Array.from({ length: 152 }, (_, i) => {
  const major = majors[i < 48 ? 0 : i < 84 ? 1 : i < 118 ? 2 : 3];
  return {
    id: `s${i + 1}`,
    name: `${surnames[i % 12]}同学${i >= 12 ? i + 1 : ""}`,
    number: String(2026010101 + i),
    className: `${i < 48 ? "计算机" : i < 84 ? "软件" : i < 118 ? "人工智能" : "数据科学"}2601班`,
    year: "2026级",
    phone: `138****${String(6821 + i)}`,
    major,
    dorm: `${(i % 4) + 1}栋${101 + (Math.floor(i / 4) % 15)}`,
    bedNumber: (i % 4) + 1,
    residenceStatus: residenceFor(i),
    advisor: studentAdvisorFor(i, major),
    status: i < 146 ? "在校" : "请假离校",
    concern: i < 8,
    origin: ["浙江", "江苏", "安徽"][i % 3],
    political:
      i % 8 === 0
        ? "中共党员"
        : i % 8 === 1
          ? "中共预备党员"
          : i % 8 === 2
            ? "发展对象"
            : i % 8 === 3
              ? "入党积极分子"
              : i % 2 === 0
                ? "共青团员"
                : "群众",
    emergencyContact: `${surnames[i % 12]}家长 139****${String(3100 + i)}`,
    attachments: (i % 4) + 1,
  };
});

export const initialLeaves = [
  {
    id: "leave-seed-1",
    studentId: "s147",
    module: "请假销假",
    leaveType: "公假",
    reasonCategory: "野外观察",
    projectName: "太湖流域湿地生态观测项目",
    title: "太湖湿地野外采样与水文观测",
    date: "2026-11-22",
    startAt: "2026-11-22T08:00",
    endAt: "2026-11-26T18:00",
    destination: "宜兴太湖生态定位观测站",
    status: "请假中",
    leaveState: "请假中",
    summary: "随周明华导师团队前往宜兴生态定位观测站开展野外观察与样本采集。",
    paths: ["请假证明/太湖湿地野外观察审批单.svg"],
    sensitive: false,
  },
  {
    id: "leave-seed-2",
    studentId: "s148",
    module: "请假销假",
    leaveType: "公假",
    reasonCategory: "野外观察",
    projectName: "太湖流域湿地生态观测项目",
    title: "太湖湿地野外观察记录采集",
    date: "2026-11-22",
    startAt: "2026-11-22T08:00",
    endAt: "2026-11-26T18:00",
    destination: "宜兴太湖生态定位观测站",
    status: "请假中",
    leaveState: "请假中",
    summary: "参与周明华导师“太湖流域湿地生态观测项目”团队野外观察出差。",
    paths: [],
    sensitive: false,
  },
  {
    id: "leave-seed-3",
    studentId: "s149",
    module: "请假销假",
    leaveType: "公假",
    reasonCategory: "野外观察",
    projectName: "太湖流域湿地生态观测项目",
    title: "湿地遥感地面验证野外观察",
    date: "2026-11-23",
    startAt: "2026-11-23T08:00",
    endAt: "2026-11-26T18:00",
    destination: "宜兴太湖生态定位观测站",
    status: "请假中",
    leaveState: "请假中",
    summary: "同周明华导师课题组赴宜兴开展野外观察实验与设备校准。",
    paths: [],
    sensitive: false,
  },
  {
    id: "leave-seed-4",
    studentId: "s150",
    module: "请假销假",
    leaveType: "公假",
    reasonCategory: "学术会议",
    projectName: "智能软件工程重点实验室年会汇报",
    title: "全国智能软件学术会议宣讲",
    date: "2026-11-23",
    startAt: "2026-11-23T09:00",
    endAt: "2026-11-25T20:00",
    destination: "上海国际会议中心",
    status: "请假中",
    leaveState: "请假中",
    summary: "受张伟岸导师指派参加学术会议并作分组论文报告。",
    paths: ["请假证明/全国智能软件学术会议邀请函.svg"],
    sensitive: false,
  },
  {
    id: "leave-seed-5",
    studentId: "s151",
    module: "请假销假",
    leaveType: "公假",
    reasonCategory: "学术会议",
    projectName: "智能软件工程重点实验室年会汇报",
    title: "参加智能软件学术会议论坛",
    date: "2026-11-23",
    startAt: "2026-11-23T09:00",
    endAt: "2026-11-25T20:00",
    destination: "上海国际会议中心",
    status: "请假中",
    leaveState: "请假中",
    summary: "同张伟岸导师课题组共赴上海参加全国智能软件学术会议。",
    paths: [],
    sensitive: false,
  },
  {
    id: "leave-seed-6",
    studentId: "s152",
    module: "请假销假",
    leaveType: "病假",
    reasonCategory: "生病",
    projectName: "",
    title: "急性肠胃炎医院就诊与休养",
    date: "2026-11-18",
    startAt: "2026-11-18T10:00",
    endAt: "2026-11-21T18:00",
    destination: "鼓楼医院门诊及回家休养",
    status: "请假中",
    leaveState: "请假中",
    summary: "因急性肠胃炎赴医院复诊，需核实是否已返校销假。",
    paths: ["请假证明/鼓楼医院急诊病历证明.svg"],
    sensitive: false,
  },
  {
    id: "leave-seed-7",
    studentId: "s1",
    module: "请假销假",
    leaveType: "事假",
    reasonCategory: "回家",
    projectName: "",
    title: "家中长辈祝寿周末回家",
    date: "2026-11-25",
    startAt: "2026-11-25T16:00",
    endAt: "2026-11-27T19:00",
    destination: "浙江杭州家中",
    status: "待审批",
    leaveState: "待审批",
    summary: "家庭事务申请周末回家探望父母，已附家长知情沟通说明。",
    paths: ["请假证明/家长知情沟通确认单.svg"],
    sensitive: false,
  },
  {
    id: "leave-seed-8",
    studentId: "s2",
    module: "请假销假",
    leaveType: "病假",
    reasonCategory: "生病",
    projectName: "",
    title: "口腔专科医院拔牙就诊",
    date: "2026-11-24",
    startAt: "2026-11-24T08:30",
    endAt: "2026-11-24T17:30",
    destination: "南京市口腔医院",
    status: "待销假",
    leaveState: "待销假",
    summary: "门诊手术就诊已返校，待上传病历证明并确认销假。",
    paths: ["请假证明/口腔医院门诊诊断书.svg"],
    sensitive: false,
  },
  {
    id: "leave-seed-9",
    studentId: "s3",
    module: "请假销假",
    leaveType: "公假",
    reasonCategory: "实验",
    projectName: "国家超算中心并行算力测试",
    title: "无锡超算中心集群实验测试",
    date: "2026-11-26",
    startAt: "2026-11-26T08:00",
    endAt: "2026-11-28T18:00",
    destination: "国家超级计算无锡中心",
    status: "已批准",
    leaveState: "已批准",
    summary: "前往无锡超算中心进行模型训练与性能实验测试。",
    paths: ["请假证明/国家超算中心实验上机函.svg"],
    sensitive: false,
  },
  {
    id: "leave-seed-10",
    studentId: "s4",
    module: "请假销假",
    leaveType: "事假",
    reasonCategory: "回家",
    projectName: "",
    title: "办理身份证补办返乡一趟",
    date: "2026-11-05",
    startAt: "2026-11-05T08:00",
    endAt: "2026-11-06T20:00",
    destination: "江苏苏州家中",
    status: "已销假",
    leaveState: "已销假",
    summary: "回生源地派出所补办证件，已按期返校核验销假。",
    paths: [],
    sensitive: false,
  },
  {
    id: "leave-seed-11",
    studentId: "s7",
    module: "请假销假",
    leaveType: "公假",
    reasonCategory: "实验",
    projectName: "半导体传感联合实验",
    title: "苏州纳米所精密测试实验",
    date: "2026-11-10",
    startAt: "2026-11-10T08:00",
    endAt: "2026-11-12T18:00",
    destination: "中科院苏州纳米所实验室",
    status: "已销假",
    leaveState: "已销假",
    summary: "前往合作实验室完成芯片封装测试实验。",
    paths: [],
    sensitive: false,
  },
  {
    id: "leave-seed-12",
    studentId: "s11",
    module: "请假销假",
    leaveType: "事假",
    reasonCategory: "实习求职",
    projectName: "",
    title: "苏州科技园企业终面行程",
    date: "2026-11-14",
    startAt: "2026-11-14T08:00",
    endAt: "2026-11-15T19:00",
    destination: "苏州工业园区",
    status: "已销假",
    leaveState: "已销假",
    summary: "参加研发岗线下终面考核，已按时返校。",
    paths: [],
    sensitive: false,
  },
];

const seedRecordModules = modules.filter(
  (m) => !["学生信息", "请假销假", "学校链接"].includes(m),
);

export const initialRecords = [
  ...initialLeaves,
  ...Array.from({ length: 374 }, (_, i) => {
    const mod =
      i < 18 ? "应急处突" : seedRecordModules[i % seedRecordModules.length];
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
          ? [
              "经评审获得2026学年校一等奖学金，发放奖金2000元。",
              "申请国家助学金并完成家庭经济困难资格初审。",
              "针对宿舍晚归与内务进行专项谈话教育并完成留痕。",
            ][i % 3]
          : "核对相关情况，登记沟通结果与后续安排。",
      paths: i % 3 ? [`资料主库/学生${(i % 152) + 1}/记录${i + 1}.pdf`] : [],
      sensitive: mod === "心理健康" && i >= 18,
    };
  }),
];

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
  {
    id: "name",
    label: "姓名",
    required: true,
    aliases: ["姓名", "学生姓名", "名字"],
  },
  {
    id: "number",
    label: "学号",
    required: true,
    aliases: ["学号", "学生学号", "考生号", "编号"],
  },
  {
    id: "className",
    label: "班级",
    aliases: ["班级", "行政班", "所在班级", "班级名称"],
  },
  { id: "major", label: "专业", aliases: ["专业", "专业名称", "所属专业"] },
  { id: "year", label: "年级", aliases: ["年级", "入学年份", "级"] },
  {
    id: "phone",
    label: "联系电话",
    aliases: ["联系电话", "电话", "手机号", "手机", "联系方式"],
  },
  {
    id: "dorm",
    label: "宿舍",
    aliases: ["宿舍", "寝室", "宿舍号", "楼栋房间", "住宿"],
  },
  {
    id: "bedNumber",
    label: "床号",
    aliases: ["床号", "床位", "床位号"],
  },
  {
    id: "residenceStatus",
    label: "住宿标注",
    aliases: ["住宿标注", "住宿状态", "走读情况", "住宿变动"],
  },
  {
    id: "advisor",
    label: "指导导师",
    aliases: ["指导导师", "导师", "学业导师", "本科生导师", "指导教师"],
  },
  {
    id: "status",
    label: "在校状态",
    aliases: ["在校状态", "学籍状态", "状态"],
  },
  {
    id: "origin",
    label: "生源地",
    aliases: ["生源地", "籍贯", "家庭住址", "省份"],
  },
  { id: "political", label: "政治面貌", aliases: ["政治面貌", "党团", "政治"] },
  {
    id: "emergencyContact",
    label: "紧急联系人",
    aliases: [
      "紧急联系人",
      "家长电话",
      "监护人",
      "家庭电话",
      "父亲电话",
      "母亲电话",
    ],
  },
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

function bedRank(s) {
  if (s.bedNumber !== undefined && s.bedNumber !== null && s.bedNumber !== "") {
    const num = Number(String(s.bedNumber).replace(/[^\d]/g, ""));
    if (Number.isFinite(num) && num > 0) return num;
  }
  const match = /-(\d+)$/.exec(String(s.dorm || ""));
  if (match) return Number(match[1]);
  return 999;
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
  const rooms = [...map.values()].sort((a, b) =>
    a.room.localeCompare(b.room, "zh-CN"),
  );
  for (const r of rooms) {
    r.members.sort((a, b) => bedRank(a) - bedRank(b));
  }
  return rooms;
}

export function groupStudentsByAdvisor(students, records = []) {
  const map = new Map();
  for (const s of students) {
    const advisor = String(s.advisor || "").trim() || "未分配导师";
    if (!map.has(advisor)) {
      map.set(advisor, {
        advisor,
        majors: new Set(),
        members: [],
        presentCount: 0,
        leaveCount: 0,
        activeRecordCount: 0,
      });
    }
    const group = map.get(advisor);
    group.members.push(s);
    if (s.major) group.majors.add(s.major);
    if (s.status === "请假离校") group.leaveCount += 1;
    else group.presentCount += 1;
  }
  const publicRecords = records.filter((r) => !r.sensitive);
  for (const group of map.values()) {
    const memberIds = new Set(group.members.map((m) => m.id));
    group.activeRecordCount = publicRecords.filter(
      (r) => memberIds.has(r.studentId) && r.status !== "已销假",
    ).length;
    group.majors = [...group.majors];
  }
  return [...map.values()].sort(
    (a, b) =>
      (a.advisor === "未分配导师" ? 1 : 0) -
        (b.advisor === "未分配导师" ? 1 : 0) ||
      b.members.length - a.members.length ||
      a.advisor.localeCompare(b.advisor, "zh-CN"),
  );
}
