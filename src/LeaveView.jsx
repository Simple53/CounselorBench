import React, { useState, useMemo } from "react";
import { Button, Card, Chip } from "./ui.jsx";
import {
  leaveStatus,
  leaveActions,
  leaveOverdue,
  leaveReasonCategories,
  classifyLeaveReason,
  leaveDurationHours,
} from "./leave.mjs";
import { leaveInsights } from "./leave-insights.mjs";
import { nnuLeaveReviewUrl } from "./school-client.mjs";

export const leaveFields = [
  ["studentName", "学生"],
  ["advisor", "指导导师"],
  ["reasonCategory", "事由分类"],
  ["leaveType", "假别"],
  ["startAt", "开始时间"],
  ["endAt", "结束时间"],
  ["durationHours", "时长(小时)"],
  ["destination", "请假去向"],
  ["status", "状态"],
  ["summary", "请假事由"],
].map(([id, label]) => ({ id, label }));

const categoryChipColor = {
  回家: "accent",
  生病: "danger",
  实验: "indigo",
  学术会议: "warning",
  野外观察: "success",
  实习求职: "default",
  其他: "default",
};

const statusChipColor = {
  待审批: "warning",
  已批准: "accent",
  请假中: "warning",
  待销假: "indigo",
  已销假: "success",
  已驳回: "danger",
};

const activeLeaveStates = ["待审批", "已批准", "请假中", "待销假"];

export function LeaveView({
  students,
  records,
  schoolRecords = [],
  schoolMeta = {},
  onSyncSchool,
  onOpenSchoolSettings,
  onSelectStudent,
  onAdd,
  onPreview,
  onAction,
  onExport,
}) {
  const [tabMode, setTabMode] = useState("current"); // 'current' 当前请假列表 | 'all' 全部台账
  const [categoryFilter, setCategoryFilter] = useState("全部");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [query, setQuery] = useState("");

  const studentMap = useMemo(
    () => new Map(students.map((s) => [s.id, s])),
    [students],
  );

  const mergedLeaves = useMemo(() => {
    const localLeaves = records.filter((r) => r.module === "请假销假");
    const combined = [...localLeaves, ...schoolRecords];
    return combined.map((r) => {
      const stu = studentMap.get(r.studentId);
      const status = leaveStatus(r);
      const category = classifyLeaveReason(r);
      const hours = leaveDurationHours(r);
      return {
        ...r,
        studentName: r.studentName || stu?.name || "未知学生",
        advisor: r.advisor || stu?.advisor || "未标注",
        reasonCategory: category,
        durationHours: hours,
        status,
      };
    });
  }, [records, schoolRecords, studentMap]);

  const insights = useMemo(
    () => leaveInsights(students, mergedLeaves),
    [students, mergedLeaves],
  );

  const scopedRows = useMemo(() => {
    return mergedLeaves
      .filter((r) => {
        if (tabMode === "current" && !activeLeaveStates.includes(r.status)) {
          return false;
        }
        if (categoryFilter !== "全部" && r.reasonCategory !== categoryFilter) {
          return false;
        }
        if (statusFilter !== "全部" && r.status !== statusFilter) {
          return false;
        }
        if (query.trim()) {
          const text = [
            r.studentName,
            r.advisor,
            r.reasonCategory,
            r.projectName,
            r.summary,
            r.destination,
          ]
            .filter(Boolean)
            .join(" ");
          if (!text.includes(query.trim())) return false;
        }
        return true;
      })
      .sort((a, b) => String(b.startAt).localeCompare(String(a.startAt)));
  }, [mergedLeaves, tabMode, categoryFilter, statusFilter, query]);

  const categoryCounts = useMemo(() => {
    const base =
      tabMode === "current"
        ? mergedLeaves.filter((r) => activeLeaveStates.includes(r.status))
        : mergedLeaves;
    const map = { 全部: base.length };
    for (const c of leaveReasonCategories) map[c] = 0;
    for (const r of base) {
      map[r.reasonCategory] = (map[r.reasonCategory] || 0) + 1;
    }
    return map;
  }, [mergedLeaves, tabMode]);

  return (
    <section className="leave-view">
      <h1>请假销假</h1>

      {/* 1. 学校账户实时抓取同步状态栏 */}
      <Card className="leave-sync-bar">
        <div className="leave-sync-bar__info">
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <strong style={{ fontSize: 15 }}>学校请销假账户实时同步</strong>
            {schoolMeta?.syncedAt ? (
              <Chip color="success">
                已同步 {schoolRecords.length} 条 ·{" "}
                {new Date(schoolMeta.syncedAt).toLocaleTimeString("zh-CN")}
              </Chip>
            ) : (
              <Chip color="default">未连接学校会话</Chip>
            )}
            {schoolMeta?.autoSync && (
              <Chip color="accent">每分钟自动抓取中</Chip>
            )}
          </div>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            接入南京师范大学统一身份认证与 EMAP 销假待办列表；{schoolMeta?.syncError || "可在右侧设置填写校方账号并记住密码免反复验证。"}
          </span>
        </div>
        <div className="leave-sync-bar__actions">
          <Button
            size="sm"
            primary
            disabled={schoolMeta?.busy}
            onClick={onSyncSchool}
          >
            {schoolMeta?.busy ? "抓取中…" : "实时抓取同步"}
          </Button>
          <Button size="sm" onClick={onOpenSchoolSettings}>
            配置校方账户
          </Button>
          <a
            href={nnuLeaveReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button button--outline button--sm"
            style={{ textDecoration: "none" }}
          >
            打开南师大请销假页 ↗
          </a>
        </div>
      </Card>

      {/* 2. 同导师科研项目多人出差智能识别 */}
      {insights.advisorGroups.length > 0 && (
        <Card className="leave-group-alert">
          <Card.Header>
            <div>
              <Card.Title>
                同导师项目多人结伴出差识别（<span className="tabular">{insights.advisorGroups.length}</span> 组）
              </Card.Title>
              <Card.Description>
                检测到同一指导导师门下多名学生同期因科研实验、学术会议或野外观察外出，请核对团队安全报备。
              </Card.Description>
            </div>
          </Card.Header>
          <div className="leave-group-list">
            {insights.advisorGroups.map((g) => (
              <div key={g.id} className="leave-group-item">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <strong>导师：{g.advisor}</strong>
                  <Chip color="warning">
                    {g.category} · <span className="tabular">{g.count}</span> 人同行
                  </Chip>
                </div>
                <div style={{ fontSize: 13 }}>
                  <div>项目：{g.projectName}</div>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>
                    目的地：{g.destination} · 时段：{g.startAt.slice(0, 10)} 至 {g.endAt.slice(0, 10)}
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {g.studentIds.map((sid, idx) => (
                    <Button
                      key={sid}
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectStudent?.(sid)}
                    >
                      {g.studentNames[idx]}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 3. 范围切换（当前请假列表 vs 全部台账）与 7 类事由分类筛选 */}
      <div className="toolbar">
        <div className="segmented" aria-label="请假列表视图切换">
          <button
            type="button"
            className={tabMode === "current" ? "active" : ""}
            onClick={() => setTabMode("current")}
          >
            当前请假列表（<span className="tabular">{mergedLeaves.filter((r) => activeLeaveStates.includes(r.status)).length}</span>）
          </button>
          <button
            type="button"
            className={tabMode === "all" ? "active" : ""}
            onClick={() => setTabMode("all")}
          >
            全部请假台账（<span className="tabular">{mergedLeaves.length}</span>）
          </button>
        </div>

        <input
          aria-label="搜索请假记录"
          placeholder="搜索学生、导师、项目或去向"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="请假状态"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {[
            "全部",
            "待审批",
            "已批准",
            "请假中",
            "待销假",
            "已销假",
            "已驳回",
          ].map((s) => (
            <option key={s} value={s}>
              {s === "全部" ? "全部办理状态" : s}
            </option>
          ))}
        </select>
        <Button primary onClick={onAdd}>
          新增请假
        </Button>
        <Button
          disabled={!scopedRows.length}
          onClick={() => onExport(scopedRows, leaveFields, "请假销假台账")}
        >
          导出记录与附件
        </Button>
        <Button
          disabled={!scopedRows.length}
          onClick={() =>
            onExport(scopedRows, leaveFields, "请假销假台账（按事由分类）", {
              classifyBy: "reasonCategory",
            })
          }
        >
          按事由分类导出附件
        </Button>
      </div>

      <div className="leave-category-bar" aria-label="按请假事由分类筛选">
        <span style={{ fontSize: 13, color: "var(--muted)" }}>事由分类：</span>
        {["全部", ...leaveReasonCategories].map((cat) => (
          <button
            key={cat}
            type="button"
            className={`leave-cat-btn ${categoryFilter === cat ? "active" : ""}`}
            onClick={() => setCategoryFilter(cat)}
          >
            {cat} <span className="tabular">({categoryCounts[cat] || 0})</span>
          </button>
        ))}
      </div>

      {/* 4. 请假明细表格 */}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>学生</th>
              <th>指导导师</th>
              <th>事由分类</th>
              <th>开始时间</th>
              <th>结束时间</th>
              <th>时长</th>
              <th>请假去向 / 项目</th>
              <th>状态</th>
              <th>办理</th>
            </tr>
          </thead>
          <tbody>
            {scopedRows.map((r) => (
              <tr key={r.id} onDoubleClick={() => onPreview(r, leaveFields)}>
                <td>
                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: 0,
                      padding: 0,
                      color: "var(--accent)",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                    onClick={() => onSelectStudent?.(r.studentId)}
                  >
                    {r.studentName}
                  </button>
                  {r.source === "school" && (
                    <span style={{ marginLeft: 6, fontSize: 11, color: "var(--muted)" }}>
                      [校方]
                    </span>
                  )}
                </td>
                <td>{r.advisor}</td>
                <td>
                  <Chip color={categoryChipColor[r.reasonCategory] || "default"}>
                    {r.reasonCategory}
                  </Chip>
                </td>
                <td className="tabular">{String(r.startAt || "").replace("T", " ")}</td>
                <td className="tabular">{String(r.endAt || "").replace("T", " ")}</td>
                <td className="tabular">
                  {r.durationHours ? `${r.durationHours}h` : "-"}
                </td>
                <td title={r.projectName || r.summary}>
                  {r.destination}
                  {r.projectName ? `（${r.projectName}）` : ""}
                </td>
                <td>
                  <Chip
                    color={
                      leaveOverdue(r)
                        ? "danger"
                        : statusChipColor[r.status] || "default"
                    }
                  >
                    {r.status}
                    {leaveOverdue(r) ? " · 已逾期" : ""}
                  </Chip>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 4 }}>
                    {(leaveActions[r.status] || [])
                      .filter((a) => r.source !== "school" || a.action === "close")
                      .map((a) => (
                      <Button
                        key={a.action}
                        size="sm"
                        onClick={() => onAction(r, a.action)}
                      >
                        {a.label}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="tertiary"
                      onClick={() => onPreview(r, leaveFields)}
                    >
                      详情
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!scopedRows.length && (
          <div className="empty">暂无匹配的请假记录</div>
        )}
      </div>
    </section>
  );
}
