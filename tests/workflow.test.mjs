import test from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { buildPackage } from "../src/files.js";
import { dailyReport, matchSpan, csvCell } from "../src/work.mjs";
test("每日完成只统计当天实际完成操作，重开与新增不冒充完成", () => {
  const result = dailyReport(
    [
      {
        time: "2026-11-06T09:00:00",
        action: "完成待办",
        subject: "A",
        module: "工作实务",
      },
      {
        time: "2026-11-06T10:00:00",
        action: "新增记录",
        subject: "B",
        module: "日常管理",
      },
      {
        time: "2026-11-05T10:00:00",
        action: "完成记录",
        subject: "C",
        module: "日常管理",
      },
    ],
    [
      { date: "2026-11-06", text: "到期", done: false },
      { date: "2026-11-07", text: "未来", done: false },
      { date: "2026-11-05", text: "已完成", done: true },
    ],
    "2026-11-06",
  );
  assert.equal(result.completed.length, 1);
  assert.equal(result.entries.length, 2);
  assert.equal(result.pending.length, 1);
  assert.ok(!result.text.includes("未来"));
});
test("时间跨度包含边界，空范围允许所有日期", () => {
  assert.ok(matchSpan("2026-11-06", "2026-11-06", "2026-11-06"));
  assert.ok(!matchSpan("2026-11-05", "2026-11-06", ""));
  assert.ok(matchSpan("2026-11-06", "", ""));
});
test("ZIP去重附件，报告缺失并按导出行关联；不打包范围外文件", async () => {
  const file = new File(["测试内容"], "../../凭证.txt", { type: "text/plain" });
  const spec = {
    format: "json",
    title: "日常管理",
    columns: [{ id: "title", label: "标题" }],
    rows: [
      { id: "r1", title: "一", attachmentIds: ["a", "b"] },
      { id: "r2", title: "二", attachmentIds: ["a"] },
    ],
    attachments: [
      { id: "a", name: file.name, file },
      { id: "b", name: "历史.pdf", file: null },
      { id: "c", name: "其他.txt", file: new File(["不应出现"], "其他.txt") },
    ],
  };
  const result = await buildPackage(spec),
    zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
  assert.equal(result.missing, 1);
  assert.equal(result.manifest.length, 2);
  assert.deepEqual(result.manifest[0].rows, [1, 2]);
  assert.ok(
    !Object.keys(zip.files).some(
      (n) => n.includes("其他") || n.includes("../"),
    ),
  );
  const rows = JSON.parse(await zip.file("日常管理.json").async("string"));
  assert.equal(rows[1]["导出行号"], 2);
  assert.equal(
    await zip.file(result.manifest[0].path).async("string"),
    "测试内容",
  );
});
test("HTML转义业务文本，不把内容当作脚本；CSV阻止公式执行", async () => {
  const { blob } = await buildPackage({
    format: "html",
    title: "测试",
    columns: [{ id: "title", label: "标题" }],
    rows: [{ title: "<script>alert(1)</script>", attachmentIds: [] }],
    attachments: [],
  });
  const z = await JSZip.loadAsync(await blob.arrayBuffer()),
    html = await z.file("测试.html").async("string");
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<script>"));
  assert.equal(csvCell("=1+1"), '"\'=1+1"');
});
