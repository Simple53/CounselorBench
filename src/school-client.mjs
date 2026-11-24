import { classifyLeaveReason } from "./leave.mjs";

export const nnuLeaveReviewUrl =
  "https://ehallapp.nnu.edu.cn/qljfw/sys/lwNjnuStuLeaveManagement/index.do?gid_=Yko5cDZXQThPczJXWHdaSDhyYU9GVzhvdWloUkF4b0ErdUViZ3BoUnpFQzd3am5KTUE5NWlBR3RkTU1Pek1CV2xCaW1XYXZ6V25ES0t4VmVpS1lMcGc9PQ&amp_sec_version_=1&EMAP_LANG=zh&THEME=#/reviewxj";

export const schoolPresets = {
  custom: {
    label: "自定义高校",
    baseUrl: "",
    listPath: "/leaves",
    detailPath: "/leaves/{id}",
    actionPath: "/leaves/{id}/actions",
    attachmentPath: "/leaves/{id}/attachments/{fileId}",
    fields: {
      id: "id",
      studentId: "studentId",
      name: "studentName",
      number: "studentNumber",
      status: "status",
      startAt: "startAt",
      endAt: "endAt",
      summary: "summary",
      destination: "destination",
      region: "region",
      attachments: "attachments",
    },
    statuses: {},
  },
  nnu: {
    label: "南京师范大学请销假（本地连接器）",
    baseUrl: "http://127.0.0.1:4175",
    listPath: "/leaves",
    detailPath: "/leaves/{id}",
    actionPath: "/leaves/{id}/actions",
    attachmentPath: "/leaves/{id}/attachments/{fileId}",
    entryUrl: nnuLeaveReviewUrl,
    fields: {
      id: "id",
      studentId: "studentId",
      name: "studentName",
      number: "studentNumber",
      status: "status",
      startAt: "startAt",
      endAt: "endAt",
      summary: "summary",
      destination: "destination",
      attachments: "attachments",
    },
    statuses: {},
  },
};

const allowedStates = [
  "待审批",
  "已批准",
  "请假中",
  "待销假",
  "已销假",
  "已驳回",
];

export function validateSchoolConfig(config) {
  const url = new URL(config.baseUrl);
  if (url.username || url.password || url.search || url.hash)
    throw Error("根地址不能包含凭据、查询参数或片段");
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    )
  )
    throw Error("远程接口须使用HTTPS；本机调试可使用HTTP");
  for (const key of [
    "listPath",
    "detailPath",
    "actionPath",
    "attachmentPath",
  ]) {
    if (
      typeof config[key] !== "string" ||
      !config[key].startsWith("/") ||
      config[key].startsWith("//") ||
      config[key].includes("\\")
    )
      throw Error("接口路径须为根地址下的绝对路径");
    const target = new URL(
      config[key].replaceAll("{id}", "record").replaceAll("{fileId}", "file"),
      url,
    );
    if (target.origin !== url.origin) throw Error("接口不得跳转到其他来源");
  }
  return config;
}

function field(row, path) {
  return String(path || "")
    .split(".")
    .reduce((v, k) => v?.[k], row);
}

export function normalizeSchoolRecord(raw, config) {
  const f = config.fields || schoolPresets.custom.fields;
  const id = field(raw, f.id),
    studentId = field(raw, f.studentId);
  if (
    id == null ||
    studentId == null ||
    String(id) === "" ||
    String(studentId) === ""
  )
    throw Error("记录缺少稳定的记录ID或学生ID，请检查字段映射");
  const original = String(field(raw, f.status) || ""),
    status = config.statuses?.[original] || original;
  const attachments = field(raw, f.attachments) || [];
  if (!Array.isArray(attachments)) throw Error("附件字段须为数组");
  const time = (v) =>
    String(v || "")
      .replace(" ", "T")
      .replace(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}):\d{2}$/, "$1");
  const startAt = time(field(raw, f.startAt)),
    endAt = time(field(raw, f.endAt));
  const summary = String(field(raw, f.summary) || "");
  const destination = String(field(raw, f.destination) || "");
  return {
    id: `school:${id}`,
    externalId: String(id),
    studentId: `school:${studentId}`,
    studentName: String(field(raw, f.name) || "未命名学生"),
    studentNumber: String(field(raw, f.number) || ""),
    module: "请假销假",
    source: "school",
    leaveType: String(raw.leaveType || "其他"),
    reasonCategory:
      raw.reasonCategory ||
      classifyLeaveReason({
        summary,
        destination,
        leaveType: raw.leaveType,
      }),
    advisor: String(raw.advisor || ""),
    title: summary || "校方请假记录",
    summary,
    destination,
    region: String(field(raw, f.region) || ""),
    date: startAt.slice(0, 10),
    startAt,
    endAt,
    status: allowedStates.includes(status) ? status : "校方状态未知",
    leaveState: allowedStates.includes(status) ? status : "校方状态未知",
    rawStatus: original,
    attachments: attachments.map((a) => {
      if (a.id == null) throw Error("附件缺少ID");
      return {
        id: String(a.id),
        name: String(a.name || "附件"),
        mime: String(a.mime || "application/octet-stream"),
      };
    }),
  };
}

export function schoolStudents(records) {
  return [
    ...new Map(
      records.map((r) => [
        r.studentId,
        {
          id: r.studentId,
          name: r.studentName,
          number: r.studentNumber,
          advisor: r.advisor || "",
          status: "状态未知",
        },
      ]),
    ).values(),
  ];
}

export function createSchoolClient(
  config,
  token = "",
  fetcher = globalThis.fetch,
) {
  validateSchoolConfig(config);
  async function request(path, { method = "GET", body, binary = false } = {}) {
    const response = await fetcher(new URL(path, config.baseUrl).href, {
      method,
      headers: {
        Accept: binary ? "*/*" : "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(20000),
      credentials: "omit",
      redirect: "error",
      cache: "no-store",
    });
    if (!response.ok)
      throw Error(
        response.status === 401
          ? "校方会话或连接令牌已失效，请重新建立连接"
          : response.status === 501
            ? "当前适配器尚不支持此能力"
            : `接口请求失败（${response.status}）`,
      );
    return binary ? response.blob() : response.json();
  }
  function path(template, id, fileId) {
    return template
      .replaceAll("{id}", encodeURIComponent(id))
      .replaceAll("{fileId}", encodeURIComponent(fileId || ""));
  }
  return {
    async list() {
      const data = await request(config.listPath);
      if (!Array.isArray(data.records))
        throw Error("列表响应须包含records数组");
      const records = data.records.map((r) => normalizeSchoolRecord(r, config));
      if (new Set(records.map((r) => r.id)).size !== records.length)
        throw Error("列表存在重复记录ID，未覆盖本地数据");
      return {
        records,
        complete: data.complete === true,
        total: Number.isSafeInteger(data.total) ? data.total : null,
        capabilities: Array.isArray(data.capabilities)
          ? data.capabilities.filter((x) =>
              [
                "close",
                "approve",
                "reject",
                "depart",
                "return",
                "attachments",
              ].includes(x),
            )
          : [],
        syncedAt: new Date().toISOString(),
      };
    },
    async detail(id) {
      const data = await request(path(config.detailPath, id));
      const row = normalizeSchoolRecord(data.record, config);
      if (row.externalId !== String(id)) throw Error("详情ID与请求不一致");
      return row;
    },
    async act(id, action, comment) {
      if (!comment?.trim()) throw Error("请填写操作意见");
      return request(path(config.actionPath, id), {
        method: "POST",
        body: { action, comment: comment.trim() },
      });
    },
    attachment(id, fileId) {
      return request(path(config.attachmentPath, id, fileId), { binary: true });
    },
    openSession(credentials = {}) {
      return request("/session/open", { method: "POST", body: credentials });
    },
  };
}
