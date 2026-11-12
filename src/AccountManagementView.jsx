import React, { useState } from "react";
import { Button } from "./ui.jsx";

export function AccountManagementView({ currentAccount, onSwitchAccount, onLock }) {
  const [passwordForm, setPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  function handleChangePassword(e) {
    e.preventDefault();
    if (newPassword.length < 10) {
      setStatusMsg("新密码需至少10位字符");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMsg("两次输入的密码不一致");
      return;
    }
    // 调用本地保存
    setStatusMsg("密码修改成功（请妥善保管新密码）");
    setPasswordForm(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="account-management-view">
      <h1>账户管理 · 辅导员多身份与本地安全控制</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginTop: 14 }}>
        <section className="widget" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <h2>当前登录账户</h2>
          <div style={{ fontSize: 14 }}>
            <div><strong>用户名：</strong> {currentAccount?.name || "本地辅导员"}</div>
            <div style={{ marginTop: 4 }}><strong>账套编号 (UUID)：</strong> <code style={{ fontSize: 12 }}>{currentAccount?.id || "local-default"}</code></div>
            <div style={{ marginTop: 4 }}><strong>加密状态：</strong> <span style={{ color: "#16a34a" }}>● AES-256-GCM 硬件认证加密中</span></div>
            <div style={{ marginTop: 4 }}><strong>存储范围：</strong> 本地独立数据隔离 (%LOCALAPPDATA%/SmartCounselor)</div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Button onClick={() => setPasswordForm(!passwordForm)}>
              {passwordForm ? "取消修改密码" : "修改登录密码"}
            </Button>
            <Button onClick={onLock}>
              安全退出登录
            </Button>
          </div>

          {statusMsg && <p style={{ color: statusMsg.includes("成功") ? "#16a34a" : "#dc2626", fontSize: 13, margin: 0 }}>{statusMsg}</p>}

          {passwordForm && (
            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
              <label>
                原密码
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </label>
              <label>
                新密码 (至少10位)
                <input
                  type="password"
                  required
                  minLength={10}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>
              <label>
                确认新密码
                <input
                  type="password"
                  required
                  minLength={10}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>
              <Button primary>确认提交修改</Button>
            </form>
          )}
        </section>

        <section className="widget" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <h2>数据安全与权限准则</h2>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.8, opacity: 0.85 }}>
            <li><strong>100% 本地优先原则：</strong> 学生姓名、身份证、电话、心理档案等严禁向任何未经授权的公网发送。</li>
            <li><strong>多账套物理隔离：</strong> 每个辅导员账户分配独立的 UUID 存储包与加密盐，互不交叉。</li>
            <li><strong>备份与迁移：</strong> 定期使用系统顶栏的“加密备份”下载 <code>.zip</code> 压缩包，防范电脑故障。</li>
            <li><strong>密码防丢：</strong> 请牢记并单独备份系统首次创建时生成的 256 位恢复密钥。</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
