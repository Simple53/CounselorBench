import React, { useState } from "react";
import { Button, Modal } from "./ui.jsx";
import { batchMatchPhotos } from "./photoMatcher.mjs";

export function BatchPhotoImportModal({ students, onConfirm, onClose }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleFiles(e) {
    const files = [...e.target.files];
    if (!files.length) return;
    setLoading(true);
    setTimeout(() => {
      const res = batchMatchPhotos(files, students);
      setResult(res);
      setLoading(false);
    }, 100);
  }

  return (
    <Modal title="批量导入照片（智能自动匹配）" wide onClose={onClose}>
      <div className="batch-photo-import" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ margin: 0, fontSize: 14, opacity: 0.85 }}>
          支持一次性多选学生证件照/一寸照。系统将自动解析文件名（如：<code>2026010101_张三.jpg</code>、<code>李四-一寸照.png</code>、<code>2026010102.jpeg</code>），按学号与姓名自动归档并设置为肖像。
        </p>

        <label className="file-button" style={{ alignSelf: "flex-start" }}>
          {loading ? "正在解析匹配…" : "选择多张照片或文件夹"}
          <input
            type="file"
            multiple
            accept="image/*"
            aria-label="选择多张照片"
            onChange={handleFiles}
          />
        </label>

        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 14 }}>
              <span style={{ color: "#16a34a", fontWeight: 600 }}>
                成功匹配：{result.matched.length} 张
              </span>
              <span style={{ color: result.unmatched.length ? "#dc2626" : "inherit" }}>
                未匹配：{result.unmatched.length} 张
              </span>
            </div>

            <div className="table-scroll" style={{ maxHeight: 260 }}>
              <table>
                <thead>
                  <tr>
                    <th>文件名</th>
                    <th>匹配学生</th>
                    <th>学号</th>
                    <th>匹配方式</th>
                  </tr>
                </thead>
                <tbody>
                  {result.matched.map((m, idx) => (
                    <tr key={idx}>
                      <td>{m.file.name}</td>
                      <td><strong>{m.student.name}</strong></td>
                      <td>{m.student.number}</td>
                      <td>
                        <span className="care-badge" style={{ background: "#dcfce7", color: "#15803d" }}>
                          {m.matchType === "number" ? "按学号匹配" : "按姓名匹配"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {result.unmatched.map((u, idx) => (
                    <tr key={"u" + idx} style={{ opacity: 0.7 }}>
                      <td>{u.file.name}</td>
                      <td colSpan={3} style={{ color: "#dc2626" }}>
                        {u.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <Button onClick={onClose}>取消</Button>
              <Button
                primary
                disabled={!result.matched.length}
                onClick={() => {
                  onConfirm(result.matched);
                  onClose();
                }}
              >
                确认导入并应用 ({result.matched.length} 张)
              </Button>
            </footer>
          </div>
        )}
      </div>
    </Modal>
  );
}
