import test from "node:test";
import assert from "node:assert/strict";
import {
  validateLeave,
  transitionLeave,
  leaveOverdue,
  classifyLeaveReason,
  leaveDurationHours,
} from "../src/leave.mjs";
const request = {
  id: "test",
  module: "请假销假",
  studentId: "s1",
  leaveType: "事假",
  startAt: "2026-11-12T09:00",
  endAt: "2026-11-12T18:00",
  destination: "家中",
  summary: "家庭事务",
  status: "待审批",
};
test("请假校验拒绝无效日期、逆序和同一学生未结束的重叠申请", () => {
  assert.throws(
    () => validateLeave({ ...request, startAt: "2026-02-30T09:00" }),
    /有效/,
  );
  assert.throws(
    () => validateLeave({ ...request, endAt: request.startAt }),
    /晚于/,
  );
  assert.throws(
    () => validateLeave({ ...request, id: "other" }, [request]),
    /重叠/,
  );
  assert.doesNotThrow(() =>
    validateLeave({ ...request, id: "other", studentId: "s2" }, [request]),
  );
  assert.doesNotThrow(() =>
    validateLeave(
      {
        ...request,
        id: "other",
        startAt: request.endAt,
        endAt: "2026-11-13T18:00",
      },
      [request],
    ),
  );
});
test("审批、离校、返校与销假必须按顺序，由明确动作改变状态", () => {
  const now = new Date("2026-11-12T12:00");
  let r = transitionLeave(request, "approve", now);
  assert.throws(() => transitionLeave(r, "close", now), /当前状态/);
  assert.throws(
    () => transitionLeave(r, "depart", new Date("2026-11-11T12:00")),
    /尚未/,
  );
  r = transitionLeave(r, "depart", now);
  assert(leaveOverdue(r, new Date("2026-11-13T12:00")));
  r = transitionLeave(r, "return", now);
  assert.equal(r.status, "待销假");
  assert(!leaveOverdue(r, new Date("2026-11-13T12:00")));
  r = transitionLeave(r, "close", now);
  assert.equal(r.status, "已销假");
  assert(r.closedAt);
  assert.throws(() => transitionLeave(r, "return", now));
});
test("请假事由七类自动归纳与请假时长计算准确", () => {
  assert.equal(classifyLeaveReason({ summary: "返乡探亲办理证件" }), "回家");
  assert.equal(classifyLeaveReason({ summary: "校医院复诊发烧", leaveType: "病假" }), "生病");
  assert.equal(classifyLeaveReason({ summary: "赴国家重点实验室超算测试" }), "实验");
  assert.equal(classifyLeaveReason({ summary: "参加全国青年学术会议宣讲" }), "学术会议");
  assert.equal(classifyLeaveReason({ summary: "前往天目山生态站野外采样观测" }), "野外观察");
  assert.equal(classifyLeaveReason({ summary: "赴北京参加秋招终面" }), "实习求职");
  assert.equal(classifyLeaveReason({ summary: "个人校外常规事务" }), "其他");
  assert.equal(classifyLeaveReason({ reasonCategory: "实验", summary: "普通外出" }), "实验");

  assert.equal(
    leaveDurationHours({ startAt: "2026-11-12T09:00", endAt: "2026-11-12T18:00" }),
    9,
  );
  assert.equal(
    leaveDurationHours({ startAt: "2026-11-12", endAt: "2026-11-13" }),
    33,
  );
  assert.equal(
    leaveDurationHours({ startAt: "2026-11-12T18:00", endAt: "2026-11-12T09:00" }),
    0,
  );
});
