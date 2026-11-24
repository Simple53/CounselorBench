import test from "node:test";
import assert from "node:assert/strict";
import {
  createSchoolClient,
  normalizeSchoolRecord,
  schoolPresets,
  validateSchoolConfig,
} from "../src/school-client.mjs";
import { normalizeNnu, createNnuAdapter } from "../bridge/nnu.mjs";
test('学校登录凭据仅通过会话POST传递，不拼入链接',async()=>{
 let call;const api=createSchoolClient({...schoolPresets.custom,baseUrl:'https://gateway.example'},'fixture-token',async(url,options)=>{call={url,options};return new Response(JSON.stringify({opened:true}))});
 await api.openSession({username:'fixture-user',password:'fixture-password'});
 assert.equal(call.url,'https://gateway.example/session/open');assert.equal(call.options.method,'POST');assert.equal(JSON.parse(call.options.body).password,'fixture-password');assert.equal(call.options.cache,'no-store');
});
const config = {
    ...schoolPresets.custom,
    baseUrl: "https://school-gateway.example",
  },
  row = {
    id: "a",
    studentId: "u",
    studentName: "测试学生",
    status: "待销假",
    startAt: "2026-11-13 09:00:00",
    endAt: "2026-11-13 18:00:00",
    summary: "考试",
    attachments: [{ id: "pdf", name: "证明.pdf" }],
  };
test("学校映射明确未知状态，ID隔离，校验接口同源且不允许远程明文凭据", () => {
  const r = normalizeSchoolRecord(row, config);
  assert.equal(r.id, "school:a");
  assert.equal(r.startAt, "2026-11-13T09:00");
  assert.equal(
    normalizeSchoolRecord({ ...row, status: "unexpected" }, config).leaveState,
    "校方状态未知",
  );
  assert.equal(
    normalizeSchoolRecord(
      { ...row, status: "7" },
      { ...config, statuses: { 7: "待销假" } },
    ).status,
    "待销假",
  );
  assert.throws(() => normalizeSchoolRecord({ ...row, id: null }, config));
  for (const baseUrl of [
    "http://remote.example",
    "https://user:pass@school.example",
    "https://school.example?token=secret",
  ])
    assert.throws(() => validateSchoolConfig({ ...config, baseUrl }));
  assert.throws(() =>
    validateSchoolConfig({ ...config, listPath: "//evil.example/leaves" }),
  );
  assert.throws(() =>
    validateSchoolConfig({ ...config, listPath: "/\\evil.example/leaves" }),
  );
});
test("读取、附件、人工提交使用同一网关令牌且不自动重试；部分数据默认不视为完整", async () => {
  const calls = [];
  const api = createSchoolClient(
    config,
    "fixture-token",
    async (url, options) => {
      calls.push({ url, options });
      return new Response(
        url.includes("/attachments/")
          ? "file"
          : JSON.stringify(
              options.method === "POST"
                ? { accepted: true }
                : url.endsWith("/leaves/a")
                  ? { record: row }
                  : { records: [row], capabilities: ["close", "unknown"] },
            ),
        {
          headers: {
            "Content-Type": url.includes("/attachments/")
              ? "application/pdf"
              : "application/json",
          },
        },
      );
    },
  );
  const list = await api.list();
  assert.equal(list.complete, false);
  assert.deepEqual(list.capabilities, ["close"]);
  assert.equal((await api.detail("a")).id, "school:a");
  assert.equal((await api.attachment("a", "pdf")).size, 4);
  await assert.rejects(() => api.act("a", "close", ""));
  assert.equal(calls.length, 3);
  await api.act("a", "close", "核实后同意");
  assert.equal(calls.length, 4);
  assert.equal(calls[3].options.method, "POST");
  for (const { url, options } of calls) {
    assert.equal(new URL(url).origin, "https://school-gateway.example");
    assert.equal(options.credentials, "omit");
    assert.equal(options.redirect, "error");
    assert.equal(options.headers.Authorization, "Bearer fixture-token");
  }
  const failed = createSchoolClient(config, "", async () => {
    throw Error("网络超时");
  });
  await assert.rejects(() => failed.act("a", "close", "同意"), /超时/);
  const duplicate = createSchoolClient(
    config,
    "",
    async () => new Response(JSON.stringify({ records: [row, row] })),
  );
  await assert.rejects(() => duplicate.list(), /重复/);
});
test("南师大只映射已验证的待销假语义，不臆造学号、去向、附件或完整历史", async () => {
  const r = normalizeNnu({
    WID: "w",
    USER_ID: "internal-user",
    USER_NAME: "甲",
    FLOWSTATUS: "1",
  });
  assert.equal(r.status, "待销假");
  assert.equal(r.studentNumber, "");
  assert.deepEqual(r.attachments, []);
  assert.equal(
    normalizeNnu({ WID: "w", USER_ID: "u", FLOWSTATUS: "2" }).status,
    "校方状态未知",
  );
  const adapter = createNnuAdapter(() => null);
  await assert.rejects(() => adapter.list(), /先建立/);
  await assert.rejects(
    () => adapter.act("w", "approve", "同意"),
    /只支持单条销假/,
  );
});
test("南师大单条提交前重读任务；同一任务结果未知或已提交后不再重复发送", async () => {
  let writes = 0;
  const page = {
    evaluate: async (_fn, arg) => {
      if (!arg)
        return [
          { WID: "w", USER_ID: "u", FLOWSTATUS: "1", TASKID: "t", NODEID: "n" },
        ];
      writes++;
      assert.equal(arg.row.WID, "w");
      return { accepted: true, verified: false };
    },
    reload: async () => {},
  };
  const adapter = createNnuAdapter(() => page);
  assert.equal((await adapter.act("w", "close", "已核实")).accepted, true);
  await assert.rejects(
    () => adapter.act("w", "close", "再次提交"),
    /不会重复提交/,
  );
  assert.equal(writes, 1);
  let attempts = 0;
  const uncertain = createNnuAdapter(() => ({
    ...page,
    evaluate: async (_fn, arg) => {
      if (!arg)
        return [
          { WID: "w", USER_ID: "u", FLOWSTATUS: "1", TASKID: "t", NODEID: "n" },
        ];
      attempts++;
      throw Error("响应超时");
    },
  }));
  await assert.rejects(() => uncertain.act("w", "close", "已核实"), /超时/);
  await assert.rejects(
    () => uncertain.act("w", "close", "重试"),
    /不会重复提交/,
  );
  assert.equal(attempts, 1);
});
