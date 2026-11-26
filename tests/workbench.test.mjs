import test from "node:test";
import assert from "node:assert/strict";
import {
  segments,
  quadrant,
  quadrants,
  weekDays,
  monthGrid,
  pendingSummary,
  addDays,
} from "../src/tasks.mjs";
import {
  parseBlocks,
  toggleCheck,
  newChapter,
  searchChapters,
  chaptersToMarkdown,
  seedWebbook,
} from "../src/webbook.mjs";
import { bookmark, filterLinks, schoolDirectory } from "../src/school-links.mjs";
import { buildPackage } from "../src/files.js";

const T = "2026-11-26";
const tasks = [
  { id: "a", date: "2026-11-24", text: "逾期", done: false },
  { id: "b", date: T, text: "今天", done: false, important: true },
  { id: "c", date: "2026-12-10", text: "以后", done: false, important: true },
  { id: "d", date: "2026-12-10", text: "远期次要", done: false },
  { id: "e", date: T, text: "已完成", done: true },
];

test("待办三段式只含未完成任务并统计待完成", () => {
  const s = segments(tasks, T);
  assert.deepEqual([s.overdue.length, s.today.length, s.upcoming.length], [1, 1, 2]);
  assert.deepEqual(pendingSummary(tasks, T), { total: 4, overdue: 1, today: 1 });
});

test("四象限：紧急为逾期或2天内，重要为手动标记", () => {
  assert.equal(quadrant(tasks[1], T), "Q1");
  assert.equal(quadrant(tasks[2], T), "Q2");
  assert.equal(quadrant(tasks[0], T), "Q3");
  assert.equal(quadrant(tasks[3], T), "Q4");
  const q = quadrants(tasks, T);
  assert.equal(q.Q1.length + q.Q2.length + q.Q3.length + q.Q4.length, 4);
});

test("周视图周一开始，月视图42格并跨月", () => {
  const w = weekDays(T); // 2026-11-26 周四
  assert.equal(w[0], "2026-11-23");
  assert.equal(w[6], "2026-11-29");
  const m = monthGrid(2026, 10);
  assert.equal(m.length, 42);
  assert.equal(m[0], "2026-10-26");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});

test("WebBook：解析块、勾选清单、搜索与导出", () => {
  const body = "## 流程\n- [ ] 第一步\n- [x] 第二步\n1. 编号\n普通段落";
  const blocks = parseBlocks(body);
  assert.deepEqual(blocks.map((b) => b.type), ["h", "check", "ol", "p"]);
  const next = toggleCheck(body, 1);
  assert.match(next, /- \[x\] 第一步/);
  assert.equal(toggleCheck(next, 1), body);
  assert.equal(toggleCheck(body, 0), body);
  assert.throws(() => newChapter("  "), /标题/);
  const seed = seedWebbook();
  assert.ok(seed.工作实务.length && seed.专业成长.length);
  assert.equal(searchChapters(seed.工作实务, "谈心").length >= 1, true);
  assert.match(chaptersToMarkdown("工作实务", seed.工作实务), /^# 工作实务/);
});

test("学校黄页：手动书签校验、分类与搜索", () => {
  const b = bookmark("资助中心", "https://example.com/a", "学生事务", "备注");
  assert.equal(b.category, "学生事务");
  assert.equal(b.custom, true);
  assert.equal(bookmark("x", "https://example.com", "不存在").category, "我的书签");
  assert.throws(() => bookmark("x", "javascript:alert(1)"));
  assert.throws(() => bookmark("x", "https://u:p@example.com"));
  assert.ok(filterLinks(schoolDirectory, "研招").length >= 1);
  assert.ok(schoolDirectory.every((l) => new URL(l.url).protocol === "https:"));
});

test("导出支持按分类存放附件", async () => {
  const JSZip = (await import("jszip")).default;
  const att = (id) => ({ id, name: `${id}.txt`, file: { arrayBuffer: async () => new TextEncoder().encode(id).buffer } });
  const { blob, manifest } = await buildPackage({
    format: "json",
    title: "请假",
    classifyBy: "reasonCategory",
    columns: [{ id: "reasonCategory", label: "事由" }],
    rows: [
      { reasonCategory: "生病", attachmentIds: ["a1"] },
      { reasonCategory: "回家", attachmentIds: ["a2"] },
    ],
    attachments: [att("a1"), att("a2")],
  });
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  assert.ok(zip.file("附件/生病/a1_a1.txt"));
  assert.ok(zip.file("附件/回家/a2_a2.txt"));
  assert.equal(manifest.every((m) => m.status === "已打包"), true);
});
