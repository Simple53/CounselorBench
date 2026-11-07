import test from "node:test";
import assert from "node:assert/strict";
import { careSchedule } from "../src/care.mjs";
test("未配置周期不臆测谈话日期", () => {
  assert.equal(
    careSchedule({ level: "focus", lastTalk: "2026-11-01" }, {}, "2026-11-06")
      .reminder,
    "未设周期",
  );
});
test("按照人工周期计算逾期、到期和近期提醒", () => {
  const cycles = { focus: 7 };
  assert.deepEqual(
    careSchedule(
      { level: "focus", lastTalk: "2026-10-30" },
      cycles,
      "2026-11-06",
    ),
    { next: "2026-11-06", reminder: "今日到期", due: true },
  );
  assert.equal(
    careSchedule(
      { level: "focus", lastTalk: "2026-10-20" },
      cycles,
      "2026-11-06",
    ).reminder,
    "已逾期",
  );
  assert.equal(
    careSchedule(
      { level: "focus", lastTalk: "2026-11-01" },
      cycles,
      "2026-11-06",
    ).reminder,
    "近期需谈话",
  );
  assert.equal(
    careSchedule({ level: "focus", lastTalk: "" }, cycles, "2026-11-06")
      .reminder,
    "待首次谈话",
  );
  assert.equal(
    careSchedule(
      { level: "focus", lastTalk: "2026-11-06" },
      cycles,
      "2026-11-06",
    ).reminder,
    "周期内",
  );
});
