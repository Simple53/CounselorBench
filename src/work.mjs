export const today = () => localDate(new Date());
export function localDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const escapeHTML = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function safeFilename(s) {
  return (
    String(s || "附件")
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
      .replace(/[. ]+$/, "")
      .slice(0, 100) || "附件"
  );
}
export function csvCell(v) {
  const s = String(v ?? "");
  return (
    '"' +
    (/^(\s*[=+@\-]|[\t\r\n])/.test(s) ? "'" + s : s).replace(/"/g, '""') +
    '"'
  );
}
export function dailyReport(logs, tasks, date) {
  const entries = logs.filter((l) => l.time.slice(0, 10) === date);
  const pending = tasks.filter((t) => !t.done && t.date <= date);
  const completed = entries.filter(
    (l) => l.action === "完成待办" || l.action === "完成记录",
  );
  return {
    entries,
    pending,
    completed,
    text: [
      `${date} 工作简报`,
      `操作 ${entries.length} 次，完成 ${completed.length} 项。`,
      ...entries.map((l) => `- ${l.action}：${l.subject}（${l.module}）`),
      "待办事项",
      ...pending.map((t) => `- ${t.date} ${t.text}`),
    ].join("\n"),
  };
}
export function matchSpan(date, start, end) {
  return (!start || date >= start) && (!end || date <= end);
}
// 只归档明确可用的文件；外部路径在浏览器中无法读取，必须列入缺失清单。
export function collectAttachments(rows, registry) {
  const ids = new Set(rows.flatMap((r) => r.attachmentIds || []));
  return [...ids]
    .map((id) => registry.find((a) => a.id === id))
    .filter(Boolean);
}
export const recordFields = [
  ["date", "日期"],
  ["studentName", "学生"],
  ["title", "记录标题"],
  ["module", "所属板块"],
  ["status", "状态"],
  ["summary", "内容摘要"],
  ["attachmentCount", "附件数"],
].map(([id, label]) => ({ id, label }));
export const traceFields = [
  ["date", "日期"],
  ["clock", "时间"],
  ["module", "所属板块"],
  ["action", "操作"],
  ["subject", "事项"],
].map(([id, label]) => ({ id, label }));
