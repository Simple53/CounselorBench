# Prototype Instructions

## 用户与桌面发布（2026-11-07）

- 登录界面只用用户名/密码，支持注册与恢复密钥重设；隐藏账套选择和术语。用户名不区分大小写且并发注册不允许重复。
- 参照Dev_file2quiz的Electron/electron-builder，用原生GitHub Actions生成Windows、macOS、Linux的安装文件。内部保留独立加密资料，不将数据并入安装包。
- 不提交output、release、缓存、用户资料、恢复密钥、证书或本机配置。只提交程序源代码、锁文件和必要品牌图标。
- 现阶段为Electron壳 + Node认证加密快照，不得宣称Tauri/SQLCipher已实现。文件服务仅绑定127.0.0.1，渲染端禁止Node集成。

## Confirmed product decisions

- 中文本地辅导员工作台；禁用在线字体、分析上报和自动模型调用。
- 首页视觉依据：exec-194c06c2-5edf-4060-8a7c-aa0ab5e612c0.png；字段视图延续蓝白表格，不含统计区。
- 工作首页为侧栏首项；基本信息改名学生信息，新增工作留痕，15 个四字板块按功能分组，设置固定底部。
- 首页没有重复标题、日期或说明性灰字；小组件支持添加、移除、排序、大小调整。
- AI 为全局悬浮球，API/模型/资料库归设置；附件只登记链接，无录音导入、录制、播放。
- 每列筛选排序，多条件筛选、多字段排序、字段模板；详情记录仅按时间/按板块。
- 原型用虚构数据，禁止假称已加密或已连接模型。

## 2026-11-06 confirmed changes

- 编辑布局可直接拖动标题换位、边缘缩放及网格吸附；添加组件包括板块入口。
- 字段组合默认占位名称，末项模板管理；各业务表格共用筛选排序和时间跨度，只有学生信息显示学生详情。
- 记录可选任意格式文件、登记路径或复用附件；统一管理。多格式数据与可用附件ZIP导出，未关联文件报告缺失。
- 双击记录使用页内对话框预览，不打开标签页或窗口。
- 留痕基于实际操作汇总，每日AI简报需确认发送，可保存草稿。
- AI 球可移动，面板可固定；按板块提供规则建议，API 密钥只在内存保存。

## 字号与界面约束（本轮要求优先）

- 图标使用管理主题的本地 SVG；首页默认提供多个可调整的业务入口。
- 学生照片支持多图导入、肖像选择、查看与移除关联，并随该学生附件导出；文件不存入业务行。
- 列筛选参考 Excel：搜索、复选列表、全选、全不选、反选、条件且／或；确认应用后生效，取消不修改表格。
- 工作留痕提供每日简报、综合文档及日历，综合文档可按日期范围导出 Markdown。

- 默认正文和导航 14px，标题 16–20px；只用统一 rem 尺度，禁止大屏媒体查询额外放大字号。允许用户在设置中主动调整。
- 侧栏学生工作平铺，仅个人工作三个板块单独分组；新增自定义板块不再制造属性分组。
- 学生信息右下角可选行数。新增记录的学生、状态、模块等选择器可搜索和新增，必须保证首次输入不被状态同步清空。
- 附件管理仅设置入口；根目录配置不得冒充实际磁盘迁移。
- 心理关注名单与谈话内容独立于公共搜索、普通导出、附件索引及留痕正文；等级人工登记，周期由使用者设置，不自动诊断或推断等级。
- AI 非固定状态必须锚定在悬浮球旁并保持在视口内；支持本地兼容模型预设，密钥不持久化。

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
