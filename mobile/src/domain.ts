import {
  initialStudents,
  initialRecords,
  initialLeaves,
  initialTasks,
  modules,
} from "../../src/model.mjs";
import { leaveStatus, leaveOverdue } from "../../src/leave.mjs";
export type Row = { id: string; [key: string]: any };
export const students: Row[] = initialStudents;
export const moduleNames: string[] = modules;
export const personalModules = ["工作实务", "专业成长", "工作留痕"];
export function localDay(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const starterTasks: Row[] = initialTasks.map((t: Row, i: number) => ({
  ...t,
  date: localDay(i - 1),
}));
export const starterLeaves: Row[] = [
  {
    id: "leave-1",
    studentId: "s3",
    status: "待审批",
    startAt: localDay(1) + "T09:00",
    endAt: localDay(1) + "T18:00",
    summary: "家庭事务",
    destination: "生源地",
  },
  {
    id: "leave-2",
    studentId: "s150",
    status: "请假中",
    startAt: localDay(-2) + "T09:00",
    endAt: localDay(-1) + "T18:00",
    summary: "外出办理材料",
    destination: "市区",
  },
  {
    id: "leave-3",
    studentId: "s1",
    status: "待销假",
    startAt: localDay(-1) + "T09:00",
    endAt: localDay() + "T18:00",
    summary: "参加考试",
    destination: "校外考点",
  },
  {
    id: "leave-4",
    studentId: "s2",
    status: "待销假",
    startAt: localDay(-1) + "T09:00",
    endAt: localDay() + "T18:00",
    summary: "就诊",
    destination: "医院",
  },
].map((r) => ({
  ...r,
  module: "请假销假",
  leaveType: r.id === "leave-4" ? "病假" : "事假",
  title: r.summary,
  date: r.startAt.slice(0, 10),
  attachmentIds: [],
}));
export const starterRecords: Row[] = [
  ...initialRecords.filter((r: Row) => r.module && r.module !== "请假销假"),
  ...initialLeaves,
];
export function mobileMetrics(rows: Row[], records: Row[], tasks: Row[]) {
  const leaves = records.filter((r) => r.module === "请假销假");
  const present = rows.filter((s) => s.status === "在校").length;
  return [
    { label: "学生人数", value: rows.length, kind: "students" },
    { label: "当前在校", value: present, kind: "present" },
    {
      label: "请假离校",
      value: rows.filter((s) => s.status?.includes("离校")).length,
      kind: "leave",
    },
    {
      label: "待销假",
      value: leaves.filter((r) => leaveStatus(r) === "待销假").length,
      kind: "return",
    },
    {
      label: "记录总数",
      value: records.filter((r) => !r.sensitive).length,
      kind: "records",
    },
    {
      label: "待办事项",
      value: tasks.filter((t) => !t.done).length,
      kind: "tasks",
    },
    {
      label: "待审批",
      value: leaves.filter((r) => leaveStatus(r) === "待审批").length,
      kind: "approval",
    },
    {
      label: "逾期未返",
      value: leaves.filter((r) => leaveOverdue(r)).length,
      kind: "overdue",
    },
  ];
}
export function notices(records: Row[]) {
  const l = records.filter((r) => r.module === "请假销假");
  return [
    {
      id: "approval",
      title: "请假申请待审批",
      count: l.filter((r) => leaveStatus(r) === "待审批").length,
    },
    {
      id: "overdue",
      title: "请假逾期未返校",
      count: l.filter((r) => leaveOverdue(r)).length,
    },
    {
      id: "return",
      title: "返校登记待销假",
      count: l.filter((r) => leaveStatus(r) === "待销假").length,
    },
  ]
    .filter((n) => n.count > 0)
    .map((n) => ({
      ...n,
      key:
        n.id +
        ":" +
        l
          .filter((r) =>
            n.id === "approval"
              ? leaveStatus(r) === "待审批"
              : n.id === "return"
                ? leaveStatus(r) === "待销假"
                : leaveOverdue(r),
          )
          .map((r) => r.id)
          .sort()
          .join(","),
    }));
}
