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
    attachments: Array.isArray(row.ATTACHMENTS)
      ? row.ATTACHMENTS.filter((a) => a && a.id && a.name).map((a) => ({
          id: String(a.id),
          name: String(a.name),
          mime: String(a.mime || ""),
        }))
      : row.FJ_ID && row.FJ_NAME
        ? [{ id: String(row.FJ_ID), name: String(row.FJ_NAME), mime: "" }]
        : [],
  };
  if (row.LEAVE_TYPE) out.leaveType = String(row.LEAVE_TYPE);
  if (row.TUTOR_NAME) out.advisor = String(row.TUTOR_NAME);
  return out;
}
export function createNnuAdapter(getPage) {
  let busy = false;
  let importedCache = null;
  const attempted = new Set();

  function pickActivePage(basePage) {
    if (!basePage) return null;
    if (typeof basePage.context !== "function") return basePage;
    try {
      const pages = basePage.context().pages();
      const ehall = pages.find((p) => {
        try {
          return new URL(p.url()).hostname.endsWith("nnu.edu.cn") && !new URL(p.url()).hostname.includes("authserver");
        } catch {
          return false;
        }
      });
      return ehall || pages.at(-1) || basePage;
    } catch {
      return basePage;
    }
  }

  async function ensureReviewPage(page) {
    if (typeof page.url !== "function") return page;
    let currentUrl = "";
    try {
      currentUrl = page.url();
    } catch {}
    if (currentUrl && new URL(currentUrl).hostname === "authserver.nnu.edu.cn") {
      throw Error("尚在统一身份认证页，请先在外部浏览器窗口完成登录");
    }
    const isReview = currentUrl.includes("lwNjnuStuLeaveManagement") && currentUrl.includes("reviewxj");
    if (!isReview && typeof page.goto === "function") {
      await page.goto(nnuEntry, { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
    }
    if (typeof page.waitForFunction === "function") {
      await page
        .waitForFunction(
          () => {
            const $ = window.$;
            if ($?.("#emapdatatable")?.length) return true;
            return document.querySelectorAll("table tbody tr").length > 0;
          },
          { timeout: 6000 },
        )
        .catch(() => {});
    }
    return page;
  }

  async function rows() {
    const rawPage = getPage();
    if (!rawPage) {
      if (importedCache) return importedCache;
      throw Error("请先建立校方会话并手动登录");
    }
    const page = await ensureReviewPage(pickActivePage(rawPage));
    return page.evaluate(() => {
      const $ = window.$,
        table = $?.("#emapdatatable");
      let list;
      if (table?.length) {
        if (table.data("jqxGrid")) list = table.jqxGrid("getrows");
        else if (table.data("jqxDataTable")) list = table.jqxDataTable("getRows");
        else if (table.emapdatatable) list = table.emapdatatable("tableRows");
      }
      if (Array.isArray(list)) {
        return list.map((r) =>
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
              "ATTACHMENTS",
              "FJ_ID",
              "FJ_NAME",
              "FJ_URL",
            ].map((k) => [k, r[k]]),
          ),
        );
      }
      // 回退解析普通 DOM 表格行
      const trs = Array.from(document.querySelectorAll("table tbody tr"));
      if (trs.length) {
        const parsed = trs
          .map((tr, idx) => {
            const cells = Array.from(tr.querySelectorAll("td"))
              .map((td) => td.innerText.trim())
              .filter(Boolean);
            if (!cells.length) return null;
            const text = cells.join(" ");
            const numMatch = text.match(/\b\d{8,14}\b/);
            const timeMatches = text.match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?/g) || [];
            const nameCell =
              cells.find((c) => /^[\u4e00-\u9fa5]{2,5}$/.test(c)) || cells[0];
            return {
              WID: `dom-${idx}-${numMatch?.[0] || nameCell}`,
              USER_ID: numMatch?.[0] || `dom-${idx}`,
              USER_NAME: nameCell,
              XSBH: numMatch?.[0] || "",
              FLOWSTATUS: /已销假/.test(text) ? "9" : "1",
              LEAVE_TIME: timeMatches[0] || "",
              RETURN_TIME: timeMatches[1] || "",
              REASON: cells.find((c) => c.length >= 4 && !/\d{4}[-/]/.test(c) && c !== nameCell) || text.slice(0, 60),
              OUT_PLACE: "",
            };
          })
          .filter(Boolean);
        if (parsed.length) return parsed;
      }
      if (!table?.length)
        throw Error("尚未进入销假待办页，请先登录并打开reviewxj");
      throw Error("无法读取校方待办表格");
    });
  }
  return {
    setImported(records) {
      importedCache = Array.isArray(records) ? records : [];
    },
    async list() {
      if (importedCache && !getPage()) {
        return {
          records: importedCache,
          complete: false,
          total: null,
          capabilities: ["close"],
        };
      }
      const data = await rows();
      return {
        records: data.map(normalizeNnu),
        complete: false,
        total: null,
        capabilities: ["close"],
      };
    },
    async attachment(id, fileId) {
      const page = getPage();
      if (!page) throw Error("请先建立校方会话并手动登录");
      const row = (await rows()).find((r) => String(r.WID) === String(id));
      if (!row) throw Error("记录已离开当前页，请重新同步");
      const list = Array.isArray(row.ATTACHMENTS)
        ? row.ATTACHMENTS
        : row.FJ_ID && row.FJ_NAME
          ? [{ id: String(row.FJ_ID), name: String(row.FJ_NAME), url: row.FJ_URL || "" }]
          : [];
      const item = list.find((a) => String(a.id) === String(fileId));
      if (!item?.url) {
        const err = Error("南师大附件接口尚未取得");
        err.status = 501;
        throw err;
      }
      const res = await page.context().request.get(item.url);
      if (!res.ok()) throw Error(`校方附件拉取失败（HTTP ${res.status()}）`);
      return {
        bytes: Buffer.from(await res.body()),
        mime: res.headers()["content-type"] || "application/octet-stream",
        name: item.name || `${fileId}`,
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
