// 待办任务视图的纯函数：三段式、四象限、周/月视图，日期均为本地 YYYY-MM-DD。
function pad(n) {
  return String(n).padStart(2, "0");
}
export function fmt(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parse(date) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(date, n) {
  const d = parse(date);
  d.setDate(d.getDate() + n);
  return fmt(d);
}

// 逾期 / 今日 / 之后 三段，只含未完成任务。
export function segments(tasks, today) {
  const pending = tasks.filter((t) => !t.done);
  const byDate = (a, b) => String(a.date).localeCompare(String(b.date));
  return {
    overdue: pending.filter((t) => t.date < today).sort(byDate),
    today: pending.filter((t) => t.date === today),
    upcoming: pending.filter((t) => t.date > today).sort(byDate),
  };
}

// 紧急 = 已逾期或 2 天内到期；重要 = 手动标记 important。
export function quadrant(task, today) {
  const urgent = task.date <= addDays(today, 2);
  if (task.important) return urgent ? "Q1" : "Q2";
  return urgent ? "Q3" : "Q4";
}
export const quadrantMeta = {
  Q1: { title: "重要且紧急", hint: "立即处理" },
  Q2: { title: "重要不紧急", hint: "计划安排" },
  Q3: { title: "紧急不重要", hint: "尽快完成或委托" },
  Q4: { title: "不重要不紧急", hint: "有空再做" },
};
export function quadrants(tasks, today) {
  const out = { Q1: [], Q2: [], Q3: [], Q4: [] };
  for (const t of tasks.filter((t) => !t.done)) out[quadrant(t, today)].push(t);
  return out;
}

// 周一开始的一周 7 天。
export function weekDays(date) {
  const d = parse(date);
  const offset = (d.getDay() + 6) % 7;
  const start = addDays(date, -offset);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}
// 周一开始的 42 格月历。
export function monthGrid(year, month) {
  const first = fmt(new Date(year, month, 1));
  const offset = (parse(first).getDay() + 6) % 7;
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}
export function pendingSummary(tasks, today) {
  const s = segments(tasks, today);
  return {
    total: s.overdue.length + s.today.length + s.upcoming.length,
    overdue: s.overdue.length,
    today: s.today.length,
  };
}
