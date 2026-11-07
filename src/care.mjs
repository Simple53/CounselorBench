import { localDate } from "./work.mjs";
export const careLevels = [
  { id: "routine", label: "常规关注", color: "blue" },
  { id: "focus", label: "重点关注", color: "amber" },
  { id: "priority", label: "优先跟进", color: "red" },
];
export function initialCareProfiles(students) {
  return students
    .filter((s) => s.concern)
    .map((s, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i * 3 - 2);
      return {
        id: s.id,
        studentId: s.id,
        level: careLevels[i % 3].id,
        lastTalk: localDate(d),
      };
    });
}
// 谈话周期由使用者设置，不内置临床标准，也不从学生数据自动推断等级。
export function careSchedule(profile, cycles, asOf, remindDays = 3) {
  const days = Number(cycles[profile.level]);
  if (!Number.isInteger(days) || days < 1)
    return { next: "", reminder: "未设周期", due: false };
  if (!profile.lastTalk) return { next: "", reminder: "待首次谈话", due: true };
  const d = new Date(`${profile.lastTalk}T12:00:00`);
  if (Number.isNaN(d.valueOf()))
    return { next: "", reminder: "日期待核对", due: false };
  d.setDate(d.getDate() + days);
  const next = localDate(d);
  const target = new Date(`${asOf}T12:00:00`),
    gap = Math.round((d - target) / 86400000);
  return {
    next,
    reminder:
      gap < 0
        ? "已逾期"
        : gap === 0
          ? "今日到期"
          : gap <= remindDays
            ? "近期需谈话"
            : "周期内",
    due: gap <= remindDays,
  };
}
export const careFields = [
  ["studentName", "学生"],
  ["number", "学号"],
  ["levelLabel", "关注等级"],
  ["lastTalk", "最近谈话"],
  ["cycle", "谈话周期"],
  ["next", "下次谈话"],
  ["reminder", "提醒状态"],
].map(([id, label]) => ({ id, label }));
