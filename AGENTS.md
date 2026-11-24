# Prototype Instructions

## 2026-11-14 手机首页与真实接入

- 首页仅数据概览，可编辑组件增减；不显示视图切换、独立请假概览和请假数据选择。校方数据源和账号密码统一在我的/数据管理/学校接入配置。
- 保存配置后默认每分钟只读同步，失败暂停；账号密码仅本次内存，不写明文文件，不自动审批。验证码与校方认证须人工完成。
- 手机学生信息提供宿舍视图，复用电脑分组逻辑；学校链接为独立四字板块，支持自定义HTTP(S)网址，拒绝脚本与内嵌凭据。
- 多模式调试入口 http://127.0.0.1:4178/debug.html ，手机4176，桌面4178，预览参数preview=demo只显示虚构数据，不能解锁真实资料。
- 真实探测：学校HTTPS请销假入口返回412，未进入登录页，未读取真实学生信息或执行审批；不能宣称学校接入完成。

## 手机界面与高校接口（2026-11-13，本轮优先）

- 手机四个根页顶部不出现logo或名称，子页保留返回和功能标题。我的直列外观显示、AI配置、数据管理；不再设置管理中转。附件管理、学校接入归数据管理。
- 首页、待办、业务记录、工作留痕支持日历；首页请假统计可按学生状态、获批频次、去向/地域、月份及日期范围配置。未知地域/校方状态不得猜测，部分数据不冒充完整历史或名册。
- 通用学校网关配置与NNU适配器分离。NNUAutoLeave仅作为源码参考，不读取其配置/日志/凭据/Profile，不运行自动批量审核。真实校方操作必须逐条确认并重新同步，超时不自动重试。
- 手机校方资料及凭据仍仅本次会话，未完成真实学校联调或真机HTTPS网关部署。NNU已知能力只含当前页销假待办和单条同意，完整历史/附件未取得，不能宣称已接通。
- 4174现由其他项目占用；本工程手机预览使用4176，不终止其他项目的服务。

## 手机界面确认（2026-11-12）

- 手机工程放在 mobile/，保留已有桌面实现与辅智通品牌。底部四项：首页、服务、待办、我的。
- 首页默认六项统计，更多展开；服务采用四列白底细边框、蓝色线性图标；个人三个板块单独分组。请假销假独立、靠前。
- 消息和任务合并进待办，设置只在我的内出现。AI 球支持拖动，默认使用本地建议，不自动请求模型。
- 目前手机仅交互原型、内存示例数据，不能宣称手机加密存储、真实账户、API 调用、后台提醒或原生安装包已完成。
- 请假校验和状态机共享 src/leave.mjs，学生是否离校依据仍处于请假中的记录计算。

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
