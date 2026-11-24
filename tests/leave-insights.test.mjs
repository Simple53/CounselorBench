import test from "node:test";
import assert from "node:assert/strict";
import {
  calendarDays,
  onCalendarDay,
  leaveInsights,
  detectAdvisorProjectGroups,
} from "../src/leave-insights.mjs";
test("月历周一开始、跨年并包含跨天事件边界", () => {
  const days = calendarDays("2027-01");
  assert.equal(days.length, 42);
  assert.equal(days[0], "2026-12-28");
  assert.ok(
    onCalendarDay(
      { startAt: "2026-12-31T12:00", endAt: "2027-01-02T18:00" },
      "2027-01-02",
    ),
  );
  assert.ok(
    !onCalendarDay(
      { startAt: "2026-12-31", endAt: "2027-01-02" },
      "2027-01-03",
    ),
  );
  assert.equal(
    onCalendarDay({ startAt: "2026-02-30", endAt: "2026-12-31" }, "2026-11-13"),
    false,
  );
});
test("频次按获批开始日期统计，状态不受统计区间影响、不猜测地域", () => {
  const base = {
    studentId: "s",
    module: "请假销假",
    startAt: "2026-11-01T09:00",
    endAt: "2026-11-02T18:00",
    destination: "校外考点",
  };
  const result = leaveInsights(
    [
      { id: "s", name: "甲", status: "在校" },
      { id: "unknown", name: "乙" },
    ],
    [
      { ...base, id: "a", status: "请假中" },
      { ...base, id: "b", status: "已驳回" },
      { ...base, id: "c", status: "待审批" },
    ],
    {
      start: "2026-11-01",
      end: "2026-11-01",
      now: new Date("2026-11-03T09:00"),
    },
  );
  assert.equal(result.total, 1);
  const separate = leaveInsights(
    [
      { id: "a", name: "同名", number: "重复值" },
      { id: "b", name: "同名", number: "重复值" },
    ],
    ["a", "b"].map((studentId) => ({ ...base, studentId, status: "已销假" })),
  );
  assert.equal(separate.frequency.length, 2);
  assert.deepEqual(
    separate.frequency.map((r) => r.count),
    [1, 1],
  );
  assert.equal(result.students[0].leaveStatus, "逾期未返");
  assert.equal(result.students[1].leaveStatus, "状态未知");
  assert.deepEqual(result.regions, [{ label: "校外考点", count: 1 }]);
  assert.equal(
    leaveInsights([{ id: "s" }], [{ ...base, status: "请假中" }], {
      start: "2026-12-01",
    }).total,
    0,
  );
  assert.throws(() =>
    leaveInsights([], [], { start: "2026-12-01", end: "2026-11-01" }),
  );
});
test("自动识别同导师同项目多人结伴出差并聚合时长与分类统计", () => {
  const stus = [
    { id: "s1", name: "赵一", number: "01", advisor: "周明华", status: "请假离校" },
    { id: "s2", name: "钱二", number: "02", advisor: "周明华", status: "请假离校" },
    { id: "s3", name: "孙三", number: "03", advisor: "李博", status: "在校" },
  ];
  const recs = [
    {
      id: "r1",
      module: "请假销假",
      studentId: "s1",
      leaveType: "公假",
      reasonCategory: "野外观察",
      projectName: "长江口湿地观测",
      destination: "崇明东滩生态站",
      startAt: "2026-11-10T08:00",
      endAt: "2026-11-11T08:00",
      status: "请假中",
      summary: "湿地野外采样",
    },
    {
      id: "r2",
      module: "请假销假",
      studentId: "s2",
      leaveType: "公假",
      reasonCategory: "野外观察",
      projectName: "长江口湿地观测",
      destination: "崇明东滩生态站",
      startAt: "2026-11-10T09:00",
      endAt: "2026-11-11T09:00",
      status: "已批准",
      summary: "协助湿地野外采样",
    },
    {
      id: "r3",
      module: "请假销假",
      studentId: "s3",
      leaveType: "事假",
      reasonCategory: "回家",
      destination: "苏州",
      startAt: "2026-11-09T09:00",
      endAt: "2026-11-09T15:00",
      status: "已销假",
      summary: "回家办事",
    },
  ];
  const groups = detectAdvisorProjectGroups(stus, recs);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].advisor, "周明华");
  assert.equal(groups[0].count, 2);
  assert.deepEqual(groups[0].studentNames.sort(), ["赵一", "钱二"].sort());

  const summary = leaveInsights(stus, recs, { now: new Date("2026-11-10T12:00") });
  assert.equal(summary.total, 3);
  assert.equal(summary.totalHours, 54);
  assert.equal(summary.avgHours, 18);
  assert.equal(summary.categories[0].label, "野外观察");
  assert.equal(summary.categories[0].count, 2);
  assert.equal(summary.advisorGroups.length, 1);
});
