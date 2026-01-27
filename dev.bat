@echo off
chcp 65001 >nul
title Praise AI 开发环境

echo 🚀 启动 Praise AI 开发环境...

REM 检查是否在正确的目录
if not exist "backend" (
    echo ❌ 错误：请在项目根目录运行此脚本
    pause
    exit /b 1
)
if not exist "frontend" (
    echo ❌ 错误：请在项目根目录运行此脚本
    pause
    exit /b 1
)

REM 启动后端服务
echo 📡 启动后端服务...
cd backend

REM 检查虚拟环境是否存在
if not exist ".venv" (
    echo ❌ 虚拟环境不存在，请先创建虚拟环境：
    echo    cd backend ^&^& python -m venv .venv ^&^& .venv\Scripts\activate ^&^& pip install -r requirements.txt
    pause
    exit /b 1
)

REM 在新窗口中启动FastAPI
start "Praise AI Backend" cmd /k ".venv\Scripts\activate && python main.py"
cd ..

REM 等待一下，让后端启动
timeout /t 2 /nobreak >nul

REM 启动前端服务
echo 🎨 启动前端服务...
cd frontend

REM 检查依赖是否已安装
if not exist "node_modules" (
    echo 📦 安装前端依赖...
    pnpm install
)

REM 在新窗口中启动前端开发服务器
start "Praise AI Frontend" cmd /k "pnpm dev"
cd ..

echo.
echo 🎉 开发环境启动完成！
echo 📡 后端服务: http://localhost:8000
echo 🎨 前端服务: http://localhost:5173
echo.
echo 💡 关闭各自的命令行窗口可退出对应服务
echo.
pause