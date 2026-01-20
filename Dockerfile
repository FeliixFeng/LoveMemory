# 使用官方轻量级 Node.js 镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 优先复制依赖文件 (利用 Docker 缓存层，加速构建)
COPY package*.json ./

# 安装依赖 (仅生产环境)
RUN npm ci --only=production

# 复制项目源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]
