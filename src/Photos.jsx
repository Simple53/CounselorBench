import React, { useState } from "react";
import { Button, Modal } from "./ui.jsx";
export function Photos({
  student,
  attachments,
  onImport,
  onCover,
  onRemove,
  onClose,
}) {
  const [view, setView] = useState(""),
    [error, setError] = useState("");
  const photos = (student.photoIds || [])
    .map((id) => attachments.find((a) => a.id === id))
    .filter(Boolean);
  return (
    <Modal title={`${student.name} · 照片管理`} onClose={onClose}>
      <label className="photo-import">
        导入照片
        <input
          aria-label="导入学生照片"
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            const files = [...e.target.files];
            if (
              files.some(
                (f) =>
                  !f.type.startsWith("image/") || f.size > 20 * 1024 * 1024,
              )
            ) {
              setError("请选择每张不超过20MB的图片");
              e.target.value = "";
              return;
            }
            setError("");
            onImport(files);
            e.target.value = "";
          }}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <div className="photo-gallery">
        {photos.map((p) => (
          <article key={p.id}>
            <button
              className="photo-image"
              aria-label={`查看${p.name}`}
              onClick={() => setView(p.id)}
            >
              <img src={p.url} alt={p.name} />
            </button>
            <span>{p.name}</span>
            <div>
              <Button
                disabled={student.portraitId === p.id}
                onClick={() => onCover(p.id)}
              >
                {student.portraitId === p.id ? "当前肖像" : "设为肖像"}
              </Button>
              <Button
                onClick={() => {
                  onRemove(p.id);
                  setView("");
                }}
              >
                移除照片
              </Button>
            </div>
          </article>
        ))}
      </div>
      {!photos.length && <p>暂无照片</p>}
      {view && (
        <div className="photo-lightbox">
          <Button onClick={() => setView("")}>关闭大图</Button>
          <img
            src={photos.find((p) => p.id === view)?.url}
            alt="学生照片大图"
          />
        </div>
      )}
    </Modal>
  );
}
