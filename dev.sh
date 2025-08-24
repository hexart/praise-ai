#!/bin/bash

# Praise AI 开发环境启动脚本
# 用于同时启动后端和前端服务

echo "🚀 启动 Praise AI 开发环境..."

# 检查是否在正确的目录
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 函数：启动后端服务
start_backend() {
    echo "📡 启动后端服务..."
    cd backend
    
    # 检查虚拟环境是否存在
    if [ ! -d "venv" ]; then
        echo "❌ 虚拟环境不存在，请先创建虚拟环境："
        echo "   cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
        exit 1
    fi
    
    # 激活虚拟环境并启动FastAPI
    source venv/bin/activate && python3 main.py &
    BACKEND_PID=$!
    echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"
    cd ..
}

# 函数：启动前端服务
start_frontend() {
    echo "🎨 启动前端服务..."
    cd frontend
    
    # 检查依赖是否已安装
    if [ ! -d "node_modules" ]; then
        echo "📦 安装前端依赖..."
        pnpm install
    fi
    
    pnpm dev &
    FRONTEND_PID=$!
    echo "✅ 前端服务已启动 (PID: $FRONTEND_PID)"
    cd ..
}

# 清理函数
cleanup() {
    echo ""
    echo "🛑 正在关闭服务..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ 后端服务已关闭"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ 前端服务已关闭"
    fi
    echo "👋 开发环境已退出"
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 启动服务
start_backend
start_frontend

echo ""
echo "🎉 开发环境启动完成！"
echo "📡 后端服务: http://localhost:8000"
echo "🎨 前端服务: http://localhost:5173"
echo ""
echo "💡 按 Ctrl+C 退出开发环境"

# 等待用户中断
wait