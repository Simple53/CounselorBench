import React, { useState, useMemo, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import IconPlus from "@tabler/icons-react/dist/esm/icons/IconPlus.mjs";
import IconFilter from "@tabler/icons-react/dist/esm/icons/IconFilter.mjs";
import IconArrowsSort from "@tabler/icons-react/dist/esm/icons/IconArrowsSort.mjs";
import IconSearch from "@tabler/icons-react/dist/esm/icons/IconSearch.mjs";
import IconArrowUp from "@tabler/icons-react/dist/esm/icons/IconArrowUp.mjs";
import IconArrowDown from "@tabler/icons-react/dist/esm/icons/IconArrowDown.mjs";
import IconChevronLeft from "@tabler/icons-react/dist/esm/icons/IconChevronLeft.mjs";
import IconChevronRight from "@tabler/icons-react/dist/esm/icons/IconChevronRight.mjs";
import IconX from "@tabler/icons-react/dist/esm/icons/IconX.mjs";
import { Button, Modal } from "./ui.jsx";
import { matchRules } from "./model.mjs";
import { ExcelFilter, excelMatch } from "./ExcelFilter.jsx";
import { matchSpan } from "./work.mjs";
export function DataTable({
  title,
  rows,
  fields,
  student = false,
  onSelect,
  onPhotos,
  onPreview,
  onAdd,
  onImport,
  onBatchPhotos,
  onEdit,
  onDelete,
  onExport,
  onComplete,
  onManageAttachments,
  actionLabel = "完成",
  templates,
  onTemplates,
}) {
  const [search, setSearch] = useState(""),
    [sorting, setSorting] = useState([]),
    [rules, setRules] = useState([]),
    [mode, setMode] = useState("and"),
    [span, setSpan] = useState(["", ""]);
  const [visibility, setVisibility] = useState(
      Object.fromEntries(
        fields.map((f) => [
          f.id,
          !["summary", "origin", "political", "major", "emergencyContact"].includes(
            f.id,
          ),
        ]),
      ),
    ),
    [selection, setSelection] = useState({});
  const [modal, setModal] = useState(""),
    [column, setColumn] = useState(""),
    [filterAnchor, setFilterAnchor] = useState(null),
    [fieldSearch, setFieldSearch] = useState(""),
    [combo, setCombo] = useState("");
  const [templateName, setTemplateName] = useState(""),
    [templateFields, setTemplateFields] = useState([]),
    [editingName, setEditingName] = useState("");
  const scoped = useMemo(
    () =>
      rows.filter(
        (r) =>
          matchRules(r, rules, mode) && (student || matchSpan(r.date, ...span)),
      ),
    [rows, rules, mode, span, student],
  );
  const columns = useMemo(
    () =>
      fields.map((f) => ({
        accessorKey: f.id,
        header: f.label,
        filterFn: (row, id, value) => excelMatch(row.getValue(id), value),
        ...(f.id === "name" && onPhotos
          ? {
              cell: (info) => (
                <div className="student-name">
                  <button
                    aria-label={`管理${info.row.original.name}照片`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPhotos(info.row.original);
                    }}
                    onDoubleClick={(e) => e.stopPropagation()}
                  >
                    {info.row.original.portraitUrl ? (
                      <img src={info.row.original.portraitUrl} alt="肖像" />
                    ) : (
                      "照片"
                    )}
                  </button>
                  <span>{info.getValue()}</span>
                </div>
              ),
            }
          : {}),
      })),
    [fields, onPhotos],
  );
  const table = useReactTable({
    data: scoped,
    columns,
    state: {
      globalFilter: search,
      sorting,
      columnVisibility: visibility,
      rowSelection: selection,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setVisibility,
    onRowSelectionChange: setSelection,
    getRowId: (r) => r.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 12 } },
  });
  const hasSelection = Object.values(selection).some(Boolean),
    all = table.getSortedRowModel().rows;
  const exportRows = (
    hasSelection ? all.filter((r) => selection[r.id]) : all
  ).map((r) => r.original);
  const changeRule = (i, key, value) =>
    setRules((s) => s.map((r, j) => (i === j ? { ...r, [key]: value } : r)));
  function saveTemplate(e) {
    e.preventDefault();
    const name = templateName.trim();
    if (!name || !templateFields.length) return;
    const next = { ...templates };
    if (editingName && editingName !== name) delete next[editingName];
    next[name] = templateFields;
    onTemplates(next);
    setEditingName("");
    setTemplateName("");
    setTemplateFields([]);
  }
  return (
    <>
      <h1>{title}</h1>
      <div className="toolbar">
        <div className="search">
          <IconSearch size={18} />
          <input
            aria-label="搜索表格"
            placeholder="搜索…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setModal("fields")}>
          <IconFilter size={16} />
          字段选择
        </Button>
        <select
          aria-label="字段组合"
          value={combo}
          onChange={(e) => {
            if (e.target.value === "__manage") {
              setModal("templates");
              return;
            }
            setCombo(e.target.value);
            if (templates[e.target.value])
              setVisibility(
                Object.fromEntries(
                  fields.map((f) => [
                    f.id,
                    templates[e.target.value].includes(f.id),
                  ]),
                ),
              );
          }}
        >
          <option value="">字段组合</option>
          {Object.keys(templates).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
          <option value="__manage">模板管理</option>
        </select>
        <Button onClick={() => setModal("filter")}>
          <IconFilter size={16} />
          高级筛选{rules.length ? ` ${rules.length}` : ""}
        </Button>
        <Button onClick={() => setModal("sort")}>
          <IconArrowsSort size={16} />
          多列排序{sorting.length ? ` ${sorting.length}` : ""}
        </Button>
        {!student && (
          <div className="date-span">
            <input
              aria-label="开始日期"
              type="date"
              value={span[0]}
              onChange={(e) => setSpan([e.target.value, span[1]])}
            />
            <span>至</span>
            <input
              aria-label="结束日期"
              type="date"
              min={span[0]}
              value={span[1]}
              onChange={(e) => setSpan([span[0], e.target.value])}
            />
            {span.some(Boolean) && (
              <Button
                aria-label="清除日期范围"
                onClick={() => setSpan(["", ""])}
              >
                <IconX size={14} />
              </Button>
            )}
          </div>
        )}
        {onAdd && (
          <Button primary onClick={onAdd}>
            <IconPlus size={16} />
            {student ? "新增学生" : "新增记录"}
          </Button>
        )}
        {onImport && <Button onClick={onImport}>Excel 导入</Button>}
        {onBatchPhotos && <Button onClick={onBatchPhotos}>批量匹配照片</Button>}
        <Button
          onClick={() =>
            onExport(
              exportRows,
              fields.filter((f) => visibility[f.id] !== false),
            )
          }
          disabled={!exportRows.length}
        >
          导出
        </Button>
        {onManageAttachments && (
          <Button onClick={onManageAttachments}>附件管理</Button>
        )}
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            {table.getHeaderGroups().map((g) => (
              <tr key={g.id}>
                <th>
                  <input
                    aria-label="选择本页全部"
                    type="checkbox"
                    checked={table.getIsAllPageRowsSelected()}
                    onChange={table.getToggleAllPageRowsSelectedHandler()}
                  />
                </th>
                {g.headers.map((h) => (
                  <th key={h.id}>
                    <div className="column-heading">
                      <button onClick={h.column.getToggleSortingHandler()}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {h.column.getIsSorted() === "asc" ? (
                          <IconArrowUp size={14} />
                        ) : h.column.getIsSorted() === "desc" ? (
                          <IconArrowDown size={14} />
                        ) : null}
                      </button>
                      <button
                        aria-label={`筛选${h.column.columnDef.header}`}
                        aria-pressed={h.column.getIsFiltered()}
                        onClick={(e) => {
                          setFilterAnchor(
                            e.currentTarget.getBoundingClientRect(),
                          );
                          setColumn(column === h.id ? "" : h.id);
                        }}
                      >
                        <IconFilter size={14} />
                      </button>
                    </div>
                  </th>
                ))}
                {(onComplete || onEdit || onDelete) && <th>办理</th>}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((r) => (
              <tr
                className={`care-row ${r.original._tone || ""}`}
                key={r.id}
                tabIndex={0}
                onClick={() => onSelect?.(r.original)}
                onDoubleClick={() => onPreview(r.original)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onPreview(r.original);
                }}
              >
                <td>
                  <input
                    type="checkbox"
                    aria-label={`选择${r.original.name || r.original.title || r.id}`}
                    checked={r.getIsSelected()}
                    onChange={r.getToggleSelectedHandler()}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                {r.getVisibleCells().map((c) => (
                  <td key={c.id} title={String(c.getValue() ?? "")}>
                    {c.column.id === "levelLabel" ? (
                      <span className={`care-badge ${r.original._tone}`}>
                        {String(c.getValue())}
                      </span>
                    ) : (
                      flexRender(c.column.columnDef.cell, c.getContext())
                    )}
                  </td>
                ))}
                {(onComplete || onEdit || onDelete) && (
                  <td>
                    <div style={{ display: "flex", gap: 4, flexWrap: "nowrap" }}>
                      {onComplete && (
                        <Button
                          disabled={r.original.status === "已完成"}
                          onClick={(e) => {
                            e.stopPropagation();
                            onComplete(r.original);
                          }}
                        >
                          {actionLabel}
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(r.original);
                          }}
                        >
                          编辑
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(r.original);
                          }}
                        >
                          删除
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!table.getRowModel().rows.length && (
        <div className="empty">
          没有匹配记录
          <Button
            onClick={() => {
              setSearch("");
              setRules([]);
              setSpan(["", ""]);
              table.resetColumnFilters();
            }}
          >
            清除筛选
          </Button>
        </div>
      )}
      <div className="pagination">
        {student && (
          <label className="page-size">
            每页
            <select
              aria-label="每页显示行数"
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {[10, 12, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} 行
                </option>
              ))}
            </select>
          </label>
        )}
        <span>
          共 {all.length} 条 · 已选{" "}
          {exportRows.length && hasSelection ? exportRows.length : 0} 条
        </span>
        <Button
          aria-label="上一页"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          <IconChevronLeft size={18} />
        </Button>
        <span>
          {table.getState().pagination.pageIndex + 1} /{" "}
          {Math.max(1, table.getPageCount())}
        </span>
        <Button
          aria-label="下一页"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          <IconChevronRight size={18} />
        </Button>
      </div>
      {column && (
        <ExcelFilter
          key={column}
          column={table.getColumn(column)}
          rows={scoped}
          anchor={filterAnchor}
          onClose={() => setColumn("")}
        />
      )}
      {modal === "fields" && (
        <Modal title="字段选择" onClose={() => setModal("")}>
          <input
            aria-label="搜索字段"
            value={fieldSearch}
            onChange={(e) => setFieldSearch(e.target.value)}
          />
          <div className="check-list">
            {fields
              .filter((f) => f.label.includes(fieldSearch))
              .map((f) => (
                <label key={f.id}>
                  <input
                    type="checkbox"
                    checked={visibility[f.id] !== false}
                    disabled={
                      visibility[f.id] !== false &&
                      table.getVisibleLeafColumns().length === 1
                    }
                    onChange={(e) =>
                      setVisibility({ ...visibility, [f.id]: e.target.checked })
                    }
                  />
                  {f.label}
                </label>
              ))}
          </div>
          <Button primary onClick={() => setModal("")}>
            完成
          </Button>
        </Modal>
      )}
      {["filter", "sort"].includes(modal) && (
        <Modal
          title={modal === "sort" ? "多列排序" : "高级筛选"}
          onClose={() => setModal("")}
          wide
        >
          {modal === "filter" && (
            <label>
              条件关系
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="and">满足全部条件</option>
                <option value="or">满足任一条件</option>
              </select>
            </label>
          )}
          {(modal === "sort" ? sorting : rules).map((r, i) => (
            <div className="rule" key={i}>
              <select
                aria-label={`字段${i + 1}`}
                value={modal === "sort" ? r.id : r.field}
                onChange={(e) =>
                  modal === "sort"
                    ? setSorting((s) =>
                        s.map((v, j) =>
                          j === i ? { ...v, id: e.target.value } : v,
                        ),
                      )
                    : changeRule(i, "field", e.target.value)
                }
              >
                {fields.map((f) => (
                  <option
                    value={f.id}
                    key={f.id}
                    disabled={
                      modal === "sort" &&
                      sorting.some((s, j) => s.id === f.id && i !== j)
                    }
                  >
                    {f.label}
                  </option>
                ))}
              </select>
              {modal === "sort" ? (
                <select
                  aria-label={`顺序${i + 1}`}
                  value={r.desc ? "desc" : "asc"}
                  onChange={(e) =>
                    setSorting((s) =>
                      s.map((v, j) =>
                        j === i ? { ...v, desc: e.target.value === "desc" } : v,
                      ),
                    )
                  }
                >
                  <option value="asc">升序</option>
                  <option value="desc">降序</option>
                </select>
              ) : (
                <>
                  <select
                    aria-label={`条件${i + 1}`}
                    value={r.op}
                    onChange={(e) => changeRule(i, "op", e.target.value)}
                  >
                    <option value="contains">包含</option>
                    <option value="eq">等于</option>
                    <option value="neq">不等于</option>
                    <option value="gte">数值不小于</option>
                  </select>
                  <input
                    aria-label={`条件值${i + 1}`}
                    value={r.value}
                    onChange={(e) => changeRule(i, "value", e.target.value)}
                  />
                </>
              )}
              <Button
                aria-label={`移除条件${i + 1}`}
                onClick={() =>
                  modal === "sort"
                    ? setSorting((s) => s.filter((_, j) => i !== j))
                    : setRules((s) => s.filter((_, j) => i !== j))
                }
              >
                <IconX size={16} />
              </Button>
            </div>
          ))}
          <footer>
            <Button
              disabled={modal === "sort" && sorting.length >= fields.length}
              onClick={() =>
                modal === "sort"
                  ? setSorting((s) => [
                      ...s,
                      {
                        id: fields.find((f) => !s.some((v) => v.id === f.id))
                          .id,
                        desc: false,
                      },
                    ])
                  : setRules((s) => [
                      ...s,
                      { field: fields[0].id, op: "contains", value: "" },
                    ])
              }
            >
              添加{modal === "sort" ? "排序" : "条件"}
            </Button>
            <Button
              onClick={() => (modal === "sort" ? setSorting([]) : setRules([]))}
            >
              清空
            </Button>
            <Button primary onClick={() => setModal("")}>
              应用
            </Button>
          </footer>
        </Modal>
      )}
      {modal === "templates" && (
        <Modal title="模板管理" onClose={() => setModal("")} wide>
          <div className="template-layout">
            <div>
              {Object.entries(templates).map(([n, ids]) => (
                <div className="template-item" key={n}>
                  <Button
                    onClick={() => {
                      setEditingName(n);
                      setTemplateName(n);
                      setTemplateFields(ids);
                    }}
                  >
                    {n}
                  </Button>
                  <Button
                    aria-label={`删除模板${n}`}
                    onClick={() => {
                      const next = { ...templates };
                      delete next[n];
                      onTemplates(next);
                      if (combo === n) setCombo("");
                      if (editingName === n) {
                        setEditingName("");
                        setTemplateName("");
                        setTemplateFields([]);
                      }
                    }}
                  >
                    <IconX size={16} />
                  </Button>
                </div>
              ))}
            </div>
            <form onSubmit={saveTemplate}>
              <label>
                模板名称
                <input
                  aria-label="模板名称"
                  required
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </label>
              <div className="check-list">
                {fields.map((f) => (
                  <label key={f.id}>
                    <input
                      type="checkbox"
                      checked={templateFields.includes(f.id)}
                      onChange={(e) =>
                        setTemplateFields(
                          e.target.checked
                            ? [...templateFields, f.id]
                            : templateFields.filter((id) => id !== f.id),
                        )
                      }
                    />
                    {f.label}
                  </label>
                ))}
              </div>
              <Button primary disabled={!templateFields.length}>
                保存模板
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setEditingName("");
                  setTemplateName("");
                  setTemplateFields(
                    fields
                      .filter((f) => visibility[f.id] !== false)
                      .map((f) => f.id),
                  );
                }}
              >
                用当前字段新建
              </Button>
            </form>
          </div>
        </Modal>
      )}
    </>
  );
}
