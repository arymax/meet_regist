# 使用 Node.js 官方镜像作为基础镜像
FROM node:14

# 设置工作目录
WORKDIR /app

# 安装构建工具和 libsqlite3
RUN apt-get update && apt-get install -y \
    build-essential \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# 安装 node-gyp 全局依赖
RUN npm install -g node-gyp

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 为 Docker 环境重新编译 SQLite3
RUN npm rebuild sqlite3 --build-from-source

# 复制项目文件到工作目录（确保 .dockerignore 中排除了 node_modules）
COPY . .

# 构建 React 应用
RUN npm run build

# 安装 Nginx
RUN apt-get update && apt-get install -y nginx

# 将构建的前端静态文件复制到 Nginx 的服务目录
COPY build /usr/share/nginx/html

# 复制 Nginx 配置文件到容器中
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制启动脚本到容器
COPY start.sh /start.sh

# 给启动脚本执行权限
RUN chmod +x /start.sh
RUN npm install cors --save
# 暴露端口
EXPOSE 8080

# 使用启动脚本来启动服务
CMD ["/start.sh"]
