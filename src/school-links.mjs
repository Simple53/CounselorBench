import { nnuLeaveReviewUrl } from "./school-client.mjs";

export const schoolLinks = [
  { id: "home", name: "学校官网", url: "https://www.nnu.edu.cn/" },
  {
    id: "leave",
    name: "南师大请销假管理",
    url: nnuLeaveReviewUrl,
  },
];

export const linkCategories = ["学校", "学生事务", "就业升学", "教育资源", "我的书签"];

// 黄页内置条目：均为公开官方站点；用户书签另存。
export const schoolDirectory = [
  { id: "d-home", category: "学校", name: "学校官网", url: "https://www.nnu.edu.cn/", note: "南京师范大学" },
  { id: "d-leave", category: "学校", name: "请销假管理", url: nnuLeaveReviewUrl, note: "学工请假审核（需校内登录）" },
  { id: "d-cas", category: "学校", name: "统一身份认证", url: "https://authserver.nnu.edu.cn/", note: "校园账号登录" },
  { id: "d-gqt", category: "学生事务", name: "共青团中央", url: "https://www.gqt.org.cn/", note: "团务与青年工作" },
  { id: "d-univs", category: "学生事务", name: "中国大学生在线", url: "https://www.univs.cn/", note: "高校学生工作资讯" },
  { id: "d-chsi", category: "学生事务", name: "学信网", url: "https://www.chsi.com.cn/", note: "学籍学历查询" },
  { id: "d-24365", category: "就业升学", name: "24365 大学生就业服务", url: "https://24365.smartedu.cn/", note: "国家大学生就业服务平台" },
  { id: "d-yz", category: "就业升学", name: "研招网", url: "https://yz.chsi.com.cn/", note: "研究生招生信息" },
  { id: "d-moe", category: "教育资源", name: "教育部", url: "https://www.moe.gov.cn/", note: "政策文件" },
  { id: "d-smartedu", category: "教育资源", name: "国家智慧教育平台", url: "https://www.smartedu.cn/", note: "课程与培训资源" },
];

function checkUrl(url) {
  const target = new URL(url);
  if (
    !["https:", "http:"].includes(target.protocol) ||
    target.username ||
    target.password
  )
    throw Error("请输入不含账号密码的HTTP或HTTPS网址");
  return target.href;
}

export function schoolLink(name, url) {
  const href = checkUrl(url);
  if (!name.trim()) throw Error("请输入链接名称");
  return { id: crypto.randomUUID(), name: name.trim(), url: href };
}

// 手动书签：可选分类与备注，分类默认“我的书签”。
export function bookmark(name, url, category = "我的书签", note = "") {
  const base = schoolLink(name, url);
  return {
    ...base,
    category: linkCategories.includes(category) ? category : "我的书签",
    note: String(note || "").trim().slice(0, 80),
    custom: true,
  };
}

export function filterLinks(items, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return items;
  return items.filter((l) =>
    [l.name, l.note, l.url, l.category].join(" ").toLowerCase().includes(q),
  );
}
