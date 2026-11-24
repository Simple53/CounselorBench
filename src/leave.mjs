export const leaveTypes = ["事假", "病假", "公假", "其他"];

export const leaveReasonCategories = [
  "回家",
  "生病",
  "实验",
  "学术会议",
  "野外观察",
  "实习求职",
  "其他",
];

export const leaveActions = {
  待审批: [
    { action: "approve", label: "审批通过", next: "已批准" },
    { action: "reject", label: "驳回申请", next: "已驳回" },
  ],
  已批准: [{ action: "depart", label: "确认离校", next: "请假中" }],
  请假中: [{ action: "return", label: "登记返校", next: "待销假" }],
  待销假: [{ action: "close", label: "确认销假", next: "已销假" }],
};

export function leaveStatus(record) {
  return (
    record.leaveState ||
    (Object.hasOwn(leaveActions, record.status) ||
    ["已销假", "已驳回"].includes(record.status)
      ? record.status
      : "待审批")
  );
}

function parseLocal(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(
    String(value || "").trim(),
  );
  if (!match) return NaN;
  const [, y, m, d, h = "00", min = "00"] = match;
  const date = new Date(
    Number(y),
    Number(m) - 1,
    Number(d),
    Number(h),
    Number(min),
  );
  return date.getFullYear() === Number(y) &&
    date.getMonth() === Number(m) - 1 &&
    date.getDate() === Number(d) &&
    date.getHours() === Number(h) &&
    date.getMinutes() === Number(min)
    ? date.valueOf()
    : NaN;
}

export function classifyLeaveReason(record) {
  const explicit = String(record?.reasonCategory || "").trim();
  if (explicit && leaveReasonCategories.includes(explicit) && explicit !== "其他") {
    return explicit;
  }
  const text = `${record?.summary || ""} ${record?.title || ""} ${record?.destination || ""} ${record?.projectName || ""}`;
  if (/野外|考察|观测|采样点|生态站|台站|科考/.test(text)) return "野外观察";
  if (/学术会议|会议|论坛|研讨会|年会|宣讲|汇报/.test(text)) return "学术会议";
  if (/实验|实验室|上机|测试|化验|超算|科研/.test(text)) return "实验";
  if (
    /生病|医院|就诊|发烧|感冒|住院|体检|复诊|手术|肠胃/.test(text) ||
    record?.leaveType === "病假"
  ) {
    return "生病";
  }
  if (/回家|探亲|家事|家庭|返乡|家中|父母|身份证/.test(text)) return "回家";
  if (/实习|面试|笔试|求职|秋招|春招/.test(text)) return "实习求职";
  return explicit || "其他";
}

export function leaveDurationHours(record) {
  const rawStart = String(record?.startAt || "").trim();
  const rawEnd = String(record?.endAt || "").trim();
  if (!rawStart || !rawEnd) return 0;
  const normStart = /^\d{4}-\d{2}-\d{2}$/.test(rawStart)
    ? rawStart + "T09:00"
    : rawStart;
  const normEnd = /^\d{4}-\d{2}-\d{2}$/.test(rawEnd)
    ? rawEnd + "T18:00"
    : rawEnd;
  const start = parseLocal(normStart);
  const end = parseLocal(normEnd);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0;
  }
  return Number(((end - start) / 3600000).toFixed(1));
}

export function validateLeave(input, records = []) {
  if (!input.studentId) throw Error("请选择学生");
  if (!leaveTypes.includes(input.leaveType)) throw Error("请选择有效假别");
  const start = parseLocal(input.startAt),
    end = parseLocal(input.endAt);
  if (!Number.isFinite(start) || !Number.isFinite(end))
    throw Error("请填写有效的起止时间");
  if (end <= start) throw Error("结束时间须晚于开始时间");
  if (!String(input.summary || "").trim()) throw Error("请填写请假事由");
  if (!String(input.destination || "").trim()) throw Error("请填写请假去向");
  const overlap = records.some(
    (r) =>
      r.module === "请假销假" &&
      r.id !== input.id &&
      r.studentId === input.studentId &&
      !["已驳回", "已销假"].includes(leaveStatus(r)) &&
      start < parseLocal(r.endAt) &&
      end > parseLocal(r.startAt),
  );
  if (overlap) throw Error("与该学生未结束的请假时间重叠");
  return {
    ...input,
    reasonCategory: input.reasonCategory || classifyLeaveReason(input),
    summary: input.summary.trim(),
    destination: input.destination.trim(),
  };
}

export function transitionLeave(record, action, now = new Date()) {
  const change = leaveActions[leaveStatus(record)]?.find(
    (a) => a.action === action,
  );
  if (!change) throw Error("当前状态不能执行此操作");
  if (["approve", "depart"].includes(action)) validateLeave(record);
  if (action === "depart" && now.valueOf() < parseLocal(record.startAt))
    throw Error("尚未到请假开始时间");
  return {
    ...record,
    status: change.next,
    leaveState: change.next,
    updatedAt: now.toISOString(),
    ...(action === "return" ? { returnedAt: now.toISOString() } : {}),
    ...(action === "close" ? { closedAt: now.toISOString() } : {}),
  };
}

export function leaveOverdue(record, now = new Date()) {
  return (
    leaveStatus(record) === "请假中" && parseLocal(record.endAt) < now.valueOf()
  );
}
