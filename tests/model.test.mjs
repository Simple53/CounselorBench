import test from "node:test";
import assert from "node:assert/strict";
import {
  matchRules,
  summarize,
  monthDays,
  autoDetectHeaderRow,
  autoMapColumns,
  previewImportDiff,
  groupStudentsByDorm,
} from "../src/model.mjs";
test("学号前导零按文本匹配，多条件支持并且和或者", () => {
  const row = { number: "0012", year: "2026级", attachments: 3 };
  const rules = [
    { field: "number", op: "eq", value: "0012" },
    { field: "year", op: "eq", value: "2025级" },
  ];
  assert.equal(matchRules(row, rules), false);
  assert.equal(matchRules(row, rules, "or"), true);
  assert.equal(
    matchRules(row, [{ field: "attachments", op: "gte", value: "4" }]),
    false,
  );
  assert.equal(
    matchRules(row, [{ field: "number", op: "eq", value: "12" }]),
    false,
  );
});
test("汇总排除范围外记录和敏感正文记录", () => {
  const result = summarize(
    [{ id: "a", status: "请假离校", concern: true }],
    [
      { studentId: "a", module: "应急处突" },
      { studentId: "a", sensitive: true },
      { studentId: "b", module: "应急处突" },
    ],
  );
  assert.deepEqual(result, {
    students: 1,
    events: 1,
    records: 1,
    present: 0,
    leave: 1,
    concern: 1,
  });
});
test("2026年11月周日开始且跨年日期正确", () => {
  const nov = monthDays(2026, 10);
  assert.equal(nov[0].date, "2026-10-26");
  assert.equal(nov[6].date, "2026-11-01");
  assert.equal(nov.filter((d) => d.current).length, 30);
  assert.equal(monthDays(2026, 11).at(-1).date, "2027-01-10");
});
test("复杂多行表头自动识别表头行、映射字段并按学号预览新增与更新", () => {
  const sheetRows = [
    ["某某学院2026级本科生基础信息汇总表"],
    ["填表说明：请各班班长于周五前核对完毕"],
    ["序号", "学生姓名", "学生学号", "行政班", "所属专业", "寝室号", "手机号"],
    ["1", "张三", "2026010101", "计算机2601班", "计算机科学与技术", "1栋101", "13800000001"],
    ["2", "李四", "2026010999", "软件2601班", "软件工程", "2栋202", "13900000002"],
  ];
  const headerIdx = autoDetectHeaderRow(sheetRows);
  assert.equal(headerIdx, 2);
  const mapping = autoMapColumns(sheetRows[headerIdx]);
  assert.equal(mapping.name, "1");
  assert.equal(mapping.number, "2");
  assert.equal(mapping.dorm, "5");
  const diff = previewImportDiff(sheetRows, headerIdx, mapping, [
    { id: "s1", name: "张三旧", number: "2026010101" },
  ]);
  assert.equal(diff.length, 2);
  assert.equal(diff[0].mode, "update");
  assert.equal(diff[0].existingId, "s1");
  assert.equal(diff[0].dorm, "1栋101");
  assert.equal(diff[1].mode, "create");
  assert.equal(diff[1].name, "李四");
});
test("宿舍视图按楼栋与房间归组并兼容未分配宿舍", () => {
  const rooms = groupStudentsByDorm([
    { id: "1", name: "甲", dorm: "1栋101" },
    { id: "2", name: "乙", dorm: "1栋101" },
    { id: "3", name: "丙", dorm: "" },
  ]);
  assert.equal(rooms.length, 2);
  const r101 = rooms.find((r) => r.room === "1栋101");
  assert.equal(r101.building, "1栋");
  assert.equal(r101.members.length, 2);
});
test("照片批量匹配：支持学号与姓名自动识别", async () => {
  const { matchPhotoToStudent, batchMatchPhotos } = await import("../src/photoMatcher.mjs");
  const students = [
    { id: "s1", name: "张三", number: "2026010101" },
    { id: "s2", name: "李四", number: "2026010102" },
  ];
  const byNum = matchPhotoToStudent("2026010101_一寸照.jpg", students);
  assert.equal(byNum?.student.name, "张三");
  assert.equal(byNum?.matchType, "number");

  const byName = matchPhotoToStudent("李四证件照.png", students);
  assert.equal(byName?.student.number, "2026010102");
  assert.equal(byName?.matchType, "name");

  const batch = batchMatchPhotos(
    [{ name: "2026010101.jpg" }, { name: "未知人员.png" }],
    students,
  );
  assert.equal(batch.matched.length, 1);
  assert.equal(batch.unmatched.length, 1);
});
test("党团建设点线进度：政治面貌步数计算准确", async () => {
  const { getPoliticalStep } = await import("../src/partyProgress.mjs");
  assert.equal(getPoliticalStep("群众"), 0);
  assert.equal(getPoliticalStep("共青团员"), 0);
  assert.equal(getPoliticalStep("入党积极分子"), 2);
  assert.equal(getPoliticalStep("中共预备党员"), 4);
  assert.equal(getPoliticalStep("中共党员"), 5);
});
test("就业指导：根据专业与意向精准推荐企业", async () => {
  const { getRecommendedCompanies } = await import("../src/careerRecommendations.mjs");
  const csRecs = getRecommendedCompanies("计算机科学与技术", "企业就业");
  assert.ok(csRecs.some((c) => c.name.includes("华为")));
  const civilRecs = getRecommendedCompanies("软件工程", "考公选调");
  assert.ok(civilRecs.some((c) => c.name.includes("公务员")));
});
