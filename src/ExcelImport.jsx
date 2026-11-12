import React, { useState, useMemo } from "react";
import { Button, Modal } from "./ui.jsx";
import {
  importableFields,
  autoDetectHeaderRow,
  autoMapColumns,
  previewImportDiff,
} from "./model.mjs";

function cellText(val) {
  if (val == null) return "";
  if (typeof val === "object") {
    if (val.text) return String(val.text);
    if (Array.isArray(val.richText)) return val.richText.map((x) => x.text).join("");
    if (val.result !== undefined) return String(val.result);
  }
  return String(val);
}

export function ExcelImport({ existingStudents, onImport, onClose }) {
  const [sheets, setSheets] = useState([]),
    [sheetIndex, setSheetIndex] = useState(0),
    [headerRowIndex, setHeaderRowIndex] = useState(0),
    [mapping, setMapping] = useState({}),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await file.arrayBuffer());
      const extracted = wb.worksheets
        .map((ws) => {
          const rows = [];
          ws.eachRow({ includeEmpty: false }, (row) => {
            const values = Array.isArray(row.values) ? row.values.slice(1) : [];
            rows.push(values.map(cellText));
          });
          return { name: ws.name, rows };
        })
        .filter((s) => s.rows.length > 0);
      if (!extracted.length) throw Error("Excel 文件中未读取到有效数据行");
      setSheets(extracted);
      setSheetIndex(0);
      const detected = autoDetectHeaderRow(extracted[0].rows);
      setHeaderRowIndex(detected);
      setMapping(autoMapColumns(extracted[0].rows[detected]));
    } catch (err) {
      setError("解析 Excel 失败：" + err.message);
    } finally {
      setLoading(false);
    }
  }

  const currentSheet = sheets[sheetIndex];
  const headers = useMemo(
    () => (currentSheet?.rows[headerRowIndex] || []).map((h, i) => ({ index: String(i), label: h || `第 ${i + 1} 列` })),
    [currentSheet, headerRowIndex],
  );
  const diff = useMemo(
    () => (currentSheet ? previewImportDiff(currentSheet.rows, headerRowIndex, mapping, existingStudents) : []),
    [currentSheet, headerRowIndex, mapping, existingStudents],
  );
  const createdCount = diff.filter((d) => d.mode === "create").length;
  const updatedCount = diff.filter((d) => d.mode === "update").length;

  return (
    <Modal title="Excel 复杂表头映射导入向导" wide onClose={onClose}>
      <div className="excel-import">
        <label className="file-button">
          {loading ? "正在解析 Excel…" : "选择 Excel (.xlsx) 名单"}
          <input
            type="file"
            aria-label="选择Excel名单"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFile}
          />
        </label>
        {error && <p className="save-error" role="alert">{error}</p>}
        {currentSheet && (
          <>
            <div className="form-grid" style={{ marginTop: 12 }}>
              <label>
                工作表 (Sheet)
                <select
                  aria-label="选择工作表"
                  value={sheetIndex}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    setSheetIndex(idx);
                    const detected = autoDetectHeaderRow(sheets[idx].rows);
                    setHeaderRowIndex(detected);
                    setMapping(autoMapColumns(sheets[idx].rows[detected]));
                  }}
                >
                  {sheets.map((s, i) => (
                    <option key={s.name} value={i}>
                      {s.name}（{s.rows.length} 行）
                    </option>
                  ))}
                </select>
              </label>
              <label>
                表头所在行（自动跳过上方标题/说明行）
                <select
                  aria-label="表头所在行"
                  value={headerRowIndex}
                  onChange={(e) => {
                    const rIdx = Number(e.target.value);
                    setHeaderRowIndex(rIdx);
                    setMapping(autoMapColumns(currentSheet.rows[rIdx]));
                  }}
                >
                  {currentSheet.rows.slice(0, 12).map((r, i) => (
                    <option key={i} value={i}>
                      第 {i + 1} 行：{r.filter(Boolean).slice(0, 5).join(" | ")}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <h3>字段列映射</h3>
            <div className="form-grid">
              {importableFields.map((f) => (
                <label key={f.id}>
                  {f.label}{f.required ? " *" : ""}
                  <select
                    aria-label={`映射${f.label}`}
                    value={mapping[f.id] ?? ""}
                    onChange={(e) => setMapping({ ...mapping, [f.id]: e.target.value })}
                  >
                    <option value="">-- 不导入 --</option>
                    {headers.map((h) => (
                      <option key={h.index} value={h.index}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <p style={{ margin: "12px 0", fontWeight: 600 }}>
              识别有效学生 {diff.length} 人：将新增 {createdCount} 人，按学号合并更新 {updatedCount} 人
            </p>
            {diff.length > 0 && (
              <div className="table-scroll" style={{ maxHeight: 220 }}>
                <table>
                  <thead>
                    <tr>
                      <th>动作</th>
                      <th>姓名</th>
                      <th>学号</th>
                      <th>班级</th>
                      <th>专业</th>
                      <th>宿舍</th>
                      <th>联系电话</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diff.slice(0, 20).map((d, i) => (
                      <tr key={i}>
                        <td>{d.mode === "create" ? "新增" : "更新"}</td>
                        <td>{d.name}</td>
                        <td>{d.number}</td>
                        <td>{d.className || "-"}</td>
                        <td>{d.major || "-"}</td>
                        <td>{d.dorm || "-"}</td>
                        <td>{d.phone || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <footer style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <Button onClick={onClose}>取消</Button>
              <Button
                primary
                disabled={!diff.length}
                onClick={() => {
                  onImport(diff);
                  onClose();
                }}
              >
                确认导入 ({diff.length} 人)
              </Button>
            </footer>
          </>
        )}
      </div>
    </Modal>
  );
}
