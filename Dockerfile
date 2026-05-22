# 使用官方轻量级 Node.js 镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 优先复制依赖文件 (利用 Docker 缓存层，加速构建)
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制项目源代码
COPY . .

# Generate Prisma client
RUN npx prisma generate

# 构建 Next.js 应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]
