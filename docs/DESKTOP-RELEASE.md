# 桌面安装与发布

本轮参照 `Dev_file2quiz` 的 Electron + electron-builder 与 GitHub Actions 原生构建方式。React界面和现有Node加密文件服务都在安装包内，不要求使用者另外安装Node或启动浏览器。运行中只监听随机本机端口；不部署云端服务、不自动调用模型。

当前桌面壳是Electron，安装体积包含Chromium；原架构中的Tauri/SQLCipher仍是后续迁移目标，当前加密存储是AES-GCM快照与独立附件。

## 使用

- 登录：用户名、密码。首次选择“创建用户”；用户名不区分英文字母大小写，注册时禁止重名。
- 创建用户后另行保存恢复密钥，忘记密码时使用“忘记密码”重设。没有云端找回入口。
- 旧版资料可使用原账套名称作为用户名登录，原密码、恢复密钥和加密附件保持兼容。
- Windows保留 `%LOCALAPPDATA%/SmartCounselor/workspaces`；macOS保存在 `~/Library/Application Support/CounselorBench/workspaces`；Linux保存在 `${XDG_DATA_HOME:-~/.local/share}/CounselorBench/workspaces`。
- 卸载程序不删除业务数据。加密备份从工作台右上角导出；程序安装目录不保存用户密码或资料。

## 格式

| 系统 | 架构 | 文件 |
| --- | --- | --- |
| Windows | x64、arm64 | NSIS安装版 `.exe`、便携版 `.exe` |
| macOS | Intel x64、Apple Silicon arm64 | `.dmg`、`.zip` |
| Linux | x64、arm64 | `.AppImage`、`.deb`、`.rpm` |

未配置商业签名证书或Apple公证，macOS使用临时签名；系统可能要求用户手动允许安装。安装包通过GitHub Release附带SHA256校验清单。没有自动更新检查，更新由用户主动下载安装包完成。

## 本地构建

```sh
npm ci
npm test
npm run desktop
npm run dist:win
npm run dist:mac
npm run dist:linux
```

应在相应系统构建原生安装包；CI使用Windows、macOS、Ubuntu各自构建，不借用其他项目的账号数据、同步配置或密钥。

## Actions

推送main执行逻辑、前端构建和真实Electron启动检查。推送 `v*` 标签会构建六个系统/架构组合，上传Actions artifacts，并汇总为GitHub预发布版本；也支持手动运行工作流。发布前须使package.json版本号与标签一致。

渲染进程关闭Node集成、启用contextIsolation和sandbox；禁止授予摄像头/麦克风等权限、禁止任意页面导航。附件下载由本地服务授权，用户明确点击的外部网页才交给系统浏览器。

参考：[electron-builder多平台构建](https://www.electron.build/docs/features/multi-platform-build/)、[Electron安全配置](https://www.electronjs.org/docs/latest/tutorial/security)。
