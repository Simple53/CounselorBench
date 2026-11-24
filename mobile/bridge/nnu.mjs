// NNU-only EMAP conventions, isolated from the mobile domain and other universities.
export const nnuEntry =
  "https://ehallapp.nnu.edu.cn/qljfw/sys/lwNjnuStuLeaveManagement/index.do?gid_=Yko5cDZXQThPczJXWHdaSDhyYU9GVzhvdWloUkF4b0ErdUViZ3BoUnpFQzd3am5KTUE5NWlBR3RkTU1Pek1CV2xCaW1XYXZ6V25ES0t4VmVpS1lMcGc9PQ&amp_sec_version_=1&EMAP_LANG=zh&THEME=#/reviewxj";
export function normalizeNnu(row) {
  if (!row.WID || !row.USER_ID) throw Error("校方记录缺少WID或USER_ID");
  const out = {
    id: String(row.WID),
    studentId: String(row.USER_ID),
    studentName: String(row.USER_NAME || ""),
    studentNumber: String(row.XSBH || ""),
    status: String(row.FLOWSTATUS) === "1" ? "待销假" : "校方状态未知",
    startAt: String(row.LEAVE_TIME || ""),
    endAt: String(row.RETURN_TIME || ""),
    summary: String(row.REASON || ""),
    destination: String(row.OUT_PLACE || row.DESTINATION || ""),
    attachments: [],
  };
  if (row.LEAVE_TYPE) out.leaveType = String(row.LEAVE_TYPE);
  if (row.TUTOR_NAME) out.advisor = String(row.TUTOR_NAME);
  return out;
}
export function createNnuAdapter(getPage) {
  let busy = false;
  const attempted = new Set();
  async function rows() {
    const page = getPage();
    if (!page) throw Error("请先建立校方会话并手动登录");
    return page.evaluate(() => {
      const $ = window.$,
        table = $?.("#emapdatatable");
      if (!table?.length)
        throw Error("尚未进入销假待办页，请先登录并打开reviewxj");
      let rows;
      if (table.data("jqxGrid")) rows = table.jqxGrid("getrows");
      else if (table.data("jqxDataTable")) rows = table.jqxDataTable("getRows");
      else if (table.emapdatatable) rows = table.emapdatatable("tableRows");
      if (!Array.isArray(rows)) throw Error("无法读取校方待办表格");
      return rows.map((r) =>
        Object.fromEntries(
          [
            "WID",
            "USER_ID",
            "USER_NAME",
            "FLOWSTATUS",
            "TASKID",
            "NODEID",
            "REASON",
            "LEAVE_TIME",
            "RETURN_TIME",
            "CREATED_AT",
            "ZBWID",
            "LEAVE_LEN",
            "LEAVE_LEN_JUDGE",
            "OUT_PLACE",
            "DESTINATION",
            "LEAVE_TYPE",
            "XSBH",
            "TUTOR_NAME",
          ].map((k) => [k, r[k]]),
        ),
      );
    });
  }
  return {
    async list() {
      const data = await rows();
      return {
        records: data.map(normalizeNnu),
        complete: false,
        total: null,
        capabilities: ["close"],
      };
    },
    async detail(id) {
      const row = (await rows()).find((r) => String(r.WID) === id);
      if (!row) throw Error("记录已离开当前页，请重新同步");
      return { record: normalizeNnu(row) };
    },
    async act(id, action, comment) {
      if (action !== "close") throw Error("南师大当前适配器只支持单条销假审核");
      if (!comment?.trim()) throw Error("请填写审核意见");
      if (attempted.has(id))
        throw Error("该任务已提交或结果未知，请在校方核实；连接器不会重复提交");
      if (busy) throw Error("已有校方操作进行中，请勿重复提交");
      busy = true;
      try {
        const row = (await rows()).find((r) => String(r.WID) === id);
        if (
          !row ||
          String(row.FLOWSTATUS) !== "1" ||
          !row.TASKID ||
          !row.NODEID
        )
          throw Error("待办已变化或缺少任务标识，请刷新核实");
        attempted.add(id);
        const result = await getPage().evaluate(
          ({ row, comment }) =>
            new Promise((resolve, reject) => {
              const timer = setTimeout(
                () =>
                  reject(Error("提交结果未知，请先核实校方状态，勿重复提交")),
                15000,
              );
              window.require(
                ["utils", "appConfig"],
                (utils, appConfig) => {
                  const formData = Object.fromEntries(
                    [
                      "WID",
                      "USER_ID",
                      "USER_NAME",
                      "REASON",
                      "LEAVE_TIME",
                      "RETURN_TIME",
                      "CREATED_AT",
                      "ZBWID",
                      "LEAVE_LEN",
                      "LEAVE_LEN_JUDGE",
                    ].map((k) => [k, row[k]]),
                  );
                  utils
                    .doAjax(
                      window.WIS_EMAP_SERV.getContextPath() +
                        "/sys/emapflow/tasks/batchExecute.do",
                      {
                        commandType: "submit",
                        action: "model:T_STU_RETURN_INFO.SAVE",
                        execute: "do_submit",
                        defKey: appConfig.defkey,
                        flowComment: comment,
                        datas: JSON.stringify([
                          {
                            taskId: row.TASKID,
                            nodeId: row.NODEID,
                            USER_ID: row.USER_ID,
                            formData,
                          },
                        ]),
                      },
                      "post",
                    )
                    .done((data) => {
                      clearTimeout(timer);
                      resolve({
                        accepted: data?.succeed === true,
                        verified: false,
                      });
                    })
                    .fail(() => {
                      clearTimeout(timer);
                      reject(Error("校方提交失败或结果未知，请先核实再重试"));
                    });
                },
                () => {
                  clearTimeout(timer);
                  reject(Error("校方页面组件尚未就绪"));
                },
              );
            }),
          { row, comment },
        );
        if (result.accepted === false) attempted.delete(id);
        // Acknowledgement is not a verified state transition; refresh before updating UI.
        await getPage()
          .reload({ waitUntil: "domcontentloaded", timeout: 5000 })
          .catch(() => {});
        return result;
      } finally {
        busy = false;
      }
    },
  };
}
