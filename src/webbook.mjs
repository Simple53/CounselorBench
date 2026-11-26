// 工作实务 / 专业成长：个人 WebBook（章节 + 简易 Markdown）。
export const webbookSections = ["工作实务", "专业成长"];

const seed = {
  工作实务: [
    {
      id: "wb-flow",
      title: "学期工作流程",
      tags: ["流程"],
      body: "## 学期初\n- [ ] 核对学生名单与宿舍\n- [ ] 更新党团、资助、困难学生台账\n- [ ] 制定班会与谈心谈话计划\n\n## 学期中\n- [ ] 月度谈心谈话\n- [ ] 请销假与晚归情况汇总\n- [ ] 心理健康排查\n\n## 学期末\n- [ ] 成绩与学业预警\n- [ ] 评奖评优材料\n- [ ] 工作总结归档\n\n（示例，可直接编辑成自己的流程）",
    },
    {
      id: "wb-points",
      title: "常用要点速查",
      tags: ["要点"],
      body: "## 谈心谈话\n1. 先倾听，再确认事实\n2. 记录时间、地点、结论与后续动作\n\n## 突发事件\n1. 先保证安全\n2. 按学校规定逐级报告\n3. 保留过程记录",
    },
  ],
  专业成长: [
    {
      id: "wb-plan",
      title: "学习与培训计划",
      tags: ["计划"],
      body: "## 本学期目标\n- [ ] 完成一次辅导员业务培训\n- [ ] 阅读 2 本专业书籍\n- [ ] 形成 1 篇工作案例总结\n\n（示例，可直接编辑）",
    },
    {
      id: "wb-notes",
      title: "课题与论文笔记",
      tags: ["笔记"],
      body: "## 选题方向\n- 待补充\n\n## 参考文献\n1. 待补充",
    },
  ],
};
export const seedWebbook = () => JSON.parse(JSON.stringify(seed));

export function newChapter(title, now = new Date()) {
  const t = String(title || "").trim();
  if (!t) throw Error("请填写章节标题");
  return {
    id: globalThis.crypto?.randomUUID?.() || `wb-${now.getTime()}`,
    title: t,
    tags: [],
    body: "## 要点\n- ",
    updatedAt: now.toISOString(),
  };
}

// 解析为块：不输出 HTML，由 React 渲染，避免注入。
export function parseBlocks(md) {
  const blocks = [];
  const lines = String(md || "").split("\n");
  let list = null;
  const flush = () => {
    if (list) blocks.push(list);
    list = null;
  };
  lines.forEach((raw, line) => {
    const s = raw.trimEnd();
    let m;
    if (!s.trim()) return flush();
    if ((m = /^(#{1,3})\s+(.*)$/.exec(s))) {
      flush();
      blocks.push({ type: "h", level: m[1].length, text: m[2], line });
    } else if ((m = /^\s*[-*]\s+\[( |x|X)\]\s*(.*)$/.exec(s))) {
      if (list?.type !== "check") (flush(), (list = { type: "check", items: [] }));
      list.items.push({ text: m[2], done: m[1] !== " ", line });
    } else if ((m = /^\s*[-*]\s+(.*)$/.exec(s))) {
      if (list?.type !== "ul") (flush(), (list = { type: "ul", items: [] }));
      list.items.push({ text: m[1], line });
    } else if ((m = /^\s*\d+[.、)]\s*(.*)$/.exec(s))) {
      if (list?.type !== "ol") (flush(), (list = { type: "ol", items: [] }));
      list.items.push({ text: m[1], line });
    } else {
      flush();
      blocks.push({ type: "p", text: s, line });
    }
  });
  flush();
  return blocks;
}

// 切换第 line 行的 - [ ] / - [x]。
export function toggleCheck(body, line) {
  const lines = String(body || "").split("\n");
  const s = lines[line];
  if (s === undefined || !/^\s*[-*]\s+\[( |x|X)\]/.test(s)) return body;
  lines[line] = s.replace(/\[( |x|X)\]/, (_, c) => (c === " " ? "[x]" : "[ ]"));
  return lines.join("\n");
}

export function chaptersToMarkdown(section, chapters) {
  return [
    `# ${section}`,
    ...chapters.map((c) => `\n# ${c.title}\n${c.tags?.length ? `标签：${c.tags.join("、")}\n` : ""}\n${c.body}`),
  ].join("\n");
}

export function searchChapters(chapters, q) {
  const k = String(q || "").trim();
  if (!k) return chapters;
  return chapters.filter((c) =>
    [c.title, c.body, ...(c.tags || [])].join("\n").includes(k),
  );
}
