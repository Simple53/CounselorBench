import {
  collectAttachments,
  csvCell,
  escapeHTML,
  safeFilename,
} from "./work.mjs";
export function downloadBlob(blob, name) {
  const a = document.createElement("a"),
    url = URL.createObjectURL(blob);
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export async function buildPackage({
  format,
  rows,
  columns,
  attachments,
  title,
}) {
  // 固定导出行号，确保文件清单能关联到未包含内部 ID 的表格。
  columns = [
    { id: "exportRow", label: "导出行号" },
    ...columns.filter((c) => c.id !== "exportRow"),
  ];
  rows = rows.map((r, i) => ({ ...r, exportRow: i + 1 }));
  const ZIP = (await import("jszip")).default;
  const zip = new ZIP();
  const plain = rows.map((r) =>
    Object.fromEntries(columns.map((c) => [c.label, r[c.id] ?? ""])),
  );
  let blob, ext;
  if (format === "xlsx") {
    const E = (await import("exceljs")).default;
    const b = new E.Workbook(),
      s = b.addWorksheet("数据");
    s.columns = columns.map((c) => ({ header: c.label, key: c.id, width: 24 }));
    rows.forEach((r) =>
      s.addRow(Object.fromEntries(columns.map((c) => [c.id, r[c.id] ?? ""]))),
    );
    blob = new Blob([await b.xlsx.writeBuffer()]);
    ext = "xlsx";
  } else if (format === "csv") {
    blob = new Blob([
      "\ufeff" +
        [
          columns.map((c) => csvCell(c.label)).join(","),
          ...rows.map((r) => columns.map((c) => csvCell(r[c.id])).join(",")),
        ].join("\r\n"),
    ]);
    ext = "csv";
  } else if (format === "json") {
    blob = new Blob([JSON.stringify(plain, null, 2)]);
    ext = "json";
  } else {
    blob = new Blob(
      [
        `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>${escapeHTML(title)}</title><style>body{font-family:system-ui;padding:24px}table{border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px;vertical-align:top}pre{white-space:pre-wrap}</style><h1>${escapeHTML(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHTML(c.label)}</th>`).join("")}<th>附件</th></tr></thead><tbody>${rows
          .map(
            (r) =>
              `<tr>${columns.map((c) => `<td>${escapeHTML(r[c.id])}</td>`).join("")}<td>${(
                r.attachmentIds || []
              )
                .map((id) => {
                  const a = attachments.find((v) => v.id === id);
                  return a?.file
                    ? `<a href="附件/${escapeHTML(a.id + "_" + safeFilename(a.name))}">${escapeHTML(a.name)}</a>`
                    : a
                      ? escapeHTML(a.name) + "（文件不可用）"
                      : "";
                })
                .join("<br>")}</td></tr>`,
          )
          .join("")}</tbody></table></html>`,
      ],
      { type: "text/html" },
    );
    ext = "html";
  }
  zip.file(`${safeFilename(title)}.${ext}`, await blob.arrayBuffer());
  const manifest = [];
  for (const a of collectAttachments(rows, attachments)) {
    if (a.file) {
      const path = `附件/${a.id}_${safeFilename(a.name)}`;
      zip.file(path, await a.file.arrayBuffer());
      manifest.push({ id: a.id, name: a.name, path, status: "已打包" });
    } else
      manifest.push({
        id: a.id,
        name: a.name,
        status: "缺失：尚未关联可读文件",
      });
  }
  for (const file of manifest) {
    file.rows = rows
      .filter((r) => r.attachmentIds?.includes(file.id))
      .map((r) => r.exportRow);
  }
  zip.file("文件清单.json", JSON.stringify(manifest, null, 2));
  return {
    blob: await zip.generateAsync({ type: "blob" }),
    manifest,
    missing: manifest.filter((a) => a.status.startsWith("缺失")).length,
  };
}
export async function exportPackage(spec) {
  const result = await buildPackage(spec);
  downloadBlob(result.blob, `${safeFilename(spec.title)}.zip`);
  return result.missing;
}
export function openPreview(row, columns, attachments) {
  const html = String(
    `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>${escapeHTML(row.title || row.name || "记录预览")}</title><style>body{font:16px/1.7 system-ui;max-width:900px;margin:40px auto;padding:0 24px}dl{display:grid;grid-template-columns:130px 1fr;gap:16px}dt{font-weight:bold}dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}a{display:block;color:#0961ff;margin:12px 0}button{padding:8px 16px}</style><h1>${escapeHTML(row.title || row.name || "记录预览")}</h1><dl>${columns.map((c) => `<dt>${escapeHTML(c.label)}</dt><dd>${escapeHTML(row[c.id])}</dd>`).join("")}</dl><h2>附件</h2>${
      collectAttachments([row], attachments)
        .map((a) =>
          a.url
            ? `<a href="${escapeHTML(a.url)}" download="${escapeHTML(a.name)}">${escapeHTML(a.name)}</a>`
            : `<p>${escapeHTML(a.name)}（未关联可读文件）</p>`,
        )
        .join("") || "<p>无附件</p>"
    }</html>`,
  );
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const w = window.open(url, "_blank");
  if (!w) {
    URL.revokeObjectURL(url);
    return false;
  }
  w.opener = null;
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return true;
}
