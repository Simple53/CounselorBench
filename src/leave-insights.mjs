import {
  leaveStatus,
  leaveOverdue,
  classifyLeaveReason,
  leaveDurationHours,
} from "./leave.mjs";

function dayOf(value) {
  const day = String(value || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "";
  const [y, m, d] = day.split("-").map(Number),
    date = new Date(y, m - 1, d);
  return date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
    ? day
    : "";
}

function dayTimestamp(value) {
  const d = dayOf(value);
  if (!d) return NaN;
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).valueOf();
}

export function calendarDays(month) {
  const [y, m] = month.split("-").map(Number),
    first = new Date(y, m - 1, 1);
  const offset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(y, m - 1, 1 - offset + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
}

export function onCalendarDay(event, day) {
  const start = dayOf(event.startAt || event.date),
    end = dayOf(event.endAt || event.startAt || event.date);
  return !!start && !!end && start <= day && end >= day;
}

export function detectAdvisorProjectGroups(students, records) {
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const leaves = records.filter(
    (r) =>
      r.module === "请假销假" &&
      leaveStatus(r) !== "已驳回" &&
      leaveStatus(r) !== "校方状态未知",
  );

  // 收集具备导师归属且涉及出差/科研类事由或明确科研项目的请假记录
  const researchLeaves = leaves
    .map((r) => {
      const stu = studentMap.get(r.studentId);
      const advisor = String(r.advisor || stu?.advisor || "").trim();
      const category = classifyLeaveReason(r);
      const projectName = String(r.projectName || "").trim();
      const isResearchTrip =
        ["实验", "学术会议", "野外观察"].includes(category) ||
        r.leaveType === "公假" ||
        Boolean(projectName);
      if (!advisor || !isResearchTrip) return null;
      return {
        record: r,
        student: stu,
        studentName: stu?.name || r.studentName || "未命名学生",
        advisor,
        category,
        projectName,
        destination: String(r.destination || "").trim(),
        startTs: dayTimestamp(r.startAt || r.date),
        endTs: dayTimestamp(r.endAt || r.startAt || r.date),
      };
    })
    .filter(Boolean);

  // 按导师 + (项目名或事由分类+目的地) 聚集，再验证日期窗口接近/重叠
  const buckets = new Map();
  const THREE_DAYS_MS = 3 * 86400000;
  for (const item of researchLeaves) {
    const topicKey =
      item.projectName ||
      `${item.category}::${item.destination || "校外"}`;
    const key = `${item.advisor}::${topicKey}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(item);
  }

  const groups = [];
  for (const [key, items] of buckets.entries()) {
    // 基于时间重叠或 <= 3 天相隔聚类
    const sorted = [...items].sort((a, b) => (a.startTs || 0) - (b.startTs || 0));
    const clusters = [];
    for (const item of sorted) {
      let target = clusters.find((c) => {
        if (!Number.isFinite(item.startTs) || !Number.isFinite(c.maxEnd)) {
          return true;
        }
        return item.startTs <= c.maxEnd + THREE_DAYS_MS;
      });
      if (!target) {
        target = {
          items: [],
          minStart: item.startTs,
          maxEnd: item.endTs || item.startTs,
        };
        clusters.push(target);
      }
      target.items.push(item);
      if (Number.isFinite(item.startTs) && (!Number.isFinite(target.minStart) || item.startTs < target.minStart)) {
        target.minStart = item.startTs;
      }
      if (Number.isFinite(item.endTs) && (!Number.isFinite(target.maxEnd) || item.endTs > target.maxEnd)) {
        target.maxEnd = item.endTs;
      }
    }

    clusters.forEach((c, idx) => {
      const uniqueStudents = new Map();
      for (const it of c.items) {
        uniqueStudents.set(it.record.studentId, it.studentName);
      }
      if (uniqueStudents.size >= 2) {
        const first = c.items[0];
        groups.push({
          id: `${key}#${idx}`,
          advisor: first.advisor,
          category: first.category,
          projectName: first.projectName || `${first.category}科研任务`,
          destination: first.destination || "校外目的地",
          startAt: c.items
            .map((x) => x.record.startAt || x.record.date)
            .filter(Boolean)
            .sort()[0] || "",
          endAt: c.items
            .map((x) => x.record.endAt || x.record.startAt || x.record.date)
            .filter(Boolean)
            .sort()
            .at(-1) || "",
          studentIds: [...uniqueStudents.keys()],
          studentNames: [...uniqueStudents.values()],
          count: uniqueStudents.size,
          records: c.items.map((x) => x.record),
        });
      }
    });
  }

  return groups.sort((a, b) => b.count - a.count || a.advisor.localeCompare(b.advisor, "zh-CN"));
}

export function leaveInsights(
  students,
  records,
  { start = "", end = "", now = new Date() } = {},
) {
  if (start && end && start > end) throw Error("结束日期不能早于开始日期");
  const leaves = records.filter((r) => r.module === "请假销假");
  // Frequency counts approved applications by start date; spanning intervals belong to the calendar.
  const approved = leaves
    .filter((r) =>
      ["已批准", "请假中", "待销假", "已销假"].includes(leaveStatus(r)),
    )
    .filter((r) => {
      const d = dayOf(r.startAt || r.date);
      return d && (!start || d >= start) && (!end || d <= end);
    });

  function group(key) {
    const counts = new Map();
    approved.forEach((r) => {
      const label = key(r);
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    return [...counts]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }

  const totalHours = Number(
    approved.reduce((sum, r) => sum + leaveDurationHours(r), 0).toFixed(1),
  );
  const avgHours = approved.length
    ? Number((totalHours / approved.length).toFixed(1))
    : 0;

  const categoryMap = new Map();
  approved.forEach((r) => {
    const label = classifyLeaveReason(r);
    const cur = categoryMap.get(label) || { label, count: 0, hours: 0 };
    cur.count += 1;
    cur.hours = Number((cur.hours + leaveDurationHours(r)).toFixed(1));
    categoryMap.set(label, cur);
  });
  const categories = [...categoryMap.values()].sort(
    (a, b) => b.count - a.count || b.hours - a.hours,
  );

  const studentDurations = [...new Set(approved.map((r) => r.studentId))]
    .map((id) => {
      const s = students.find((x) => x.id === id);
      const stuRows = approved.filter((r) => r.studentId === id);
      const hours = Number(
        stuRows.reduce((sum, r) => sum + leaveDurationHours(r), 0).toFixed(1),
      );
      return {
        id,
        label: `${s?.name || "未匹配学生"} · ${s?.number || id}`,
        advisor: s?.advisor || "",
        count: stuRows.length,
        hours,
      };
    })
    .sort((a, b) => b.hours - a.hours || b.count - a.count || a.label.localeCompare(b.label));

  return {
    students: students.map((s) => {
      const rows = leaves.filter((r) => r.studentId === s.id),
        out = rows.find((r) => leaveStatus(r) === "请假中");
      return {
        ...s,
        leaveCount: approved.filter((r) => r.studentId === s.id).length,
        leaveHours: Number(
          approved
            .filter((r) => r.studentId === s.id)
            .reduce((sum, r) => sum + leaveDurationHours(r), 0)
            .toFixed(1),
        ),
        leaveStatus: out
          ? leaveOverdue(out, now)
            ? "逾期未返"
            : "请假离校"
          : rows.some((r) => leaveStatus(r) === "待销假")
            ? "待核销假"
            : s.status || "状态未知",
      };
    }),
    frequency: [...new Set(approved.map((r) => r.studentId))]
      .map((id) => {
        const s = students.find((s) => s.id === id);
        return {
          id,
          label: `${s?.name || "未匹配学生"} · ${s?.number || id}`,
          count: approved.filter((r) => r.studentId === id).length,
        };
      })
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    regions: group((r) => r.region || r.destination || "未填写"),
    months: group((r) => String(r.startAt || r.date).slice(0, 7)).sort((a, b) =>
      a.label.localeCompare(b.label),
    ),
    total: approved.length,
    totalHours,
    avgHours,
    activeCount: leaves.filter((r) => leaveStatus(r) === "请假中").length,
    pendingCount: leaves.filter((r) =>
      ["待审批", "待销假"].includes(leaveStatus(r)),
    ).length,
    overdueCount: leaves.filter((r) => leaveOverdue(r, now)).length,
    categories,
    studentDurations,
    advisorGroups: detectAdvisorProjectGroups(students, leaves),
  };
}
