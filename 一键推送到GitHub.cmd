@echo off
chcp 65001 >nul
cd /d "g:\onedrive\smallprjs\Dev_stusys\counselor-workbench"
echo ==============================================
echo 正在准备提交辅智通最新代码到 GitHub...
echo ==============================================
git add .
git commit -m "feat: 升级高校辅导员智慧管理系统功能并支持GitHub Pages部署"
echo.
echo 正在推送到 GitHub (main 分支)...
git push origin main
echo.
echo ==============================================
echo 推送完成！
echo GitHub Actions 正在自动构建部署中...
echo 稍后请访问：https://simple53.github.io/CounselorBench/
echo ==============================================
pause
