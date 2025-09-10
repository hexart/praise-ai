# 使用官方 Node.js 运行时作为基础镜像
FROM node:22-alpine AS build

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 pnpm-lock.yaml（如果存在）
COPY package.json pnpm-lock.yaml* ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装项目依赖
RUN pnpm install --frozen-lockfile

# 复制项目文件
COPY . .

# 构建生产版本
RUN pnpm build

# 安装 serve 用于服务静态文件
RUN npm install -g serve

# 暴露端口
EXPOSE 5173

# 启动应用
CMD ["serve", "-s", "dist", "-l", "5173"]