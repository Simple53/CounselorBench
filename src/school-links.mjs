import { nnuLeaveReviewUrl } from "./school-client.mjs";

export const schoolLinks = [
  { id: "home", name: "学校官网", url: "https://www.nnu.edu.cn/" },
  {
    id: "leave",
    name: "南师大请销假管理",
    url: nnuLeaveReviewUrl,
  },
];

export function schoolLink(name, url) {
  const target = new URL(url);
  if (
    !["https:", "http:"].includes(target.protocol) ||
    target.username ||
    target.password
  )
    throw Error("请输入不含账号密码的HTTP或HTTPS网址");
  if (!name.trim()) throw Error("请输入链接名称");
  return { id: crypto.randomUUID(), name: name.trim(), url: target.href };
}
