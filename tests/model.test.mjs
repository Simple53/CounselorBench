import test from "node:test";
import assert from "node:assert/strict";
import { matchRules, summarize, monthDays } from "../src/model.mjs";
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
