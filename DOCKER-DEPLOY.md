# Docker 部署指南

## 快速部署

### 1. 安装 Docker

#### 命令行安装（推荐）

```bash
# macOS (需要先安装 Homebrew)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install --cask docker

# Windows (使用 Chocolatey)
# 先安装 Chocolatey: https://chocolatey.org/install
choco install docker-desktop

# Ubuntu
sudo apt update && sudo apt install docker.io
```

#### 图形界面安装

- **Windows**: 下载 Docker Desktop for Windows
- **macOS**: 下载 Docker Desktop for Mac

### 2. 部署项目

```bash
# 构建镜像
docker build -t ws-demo .

# 运行容器（自动重启 + 开机启动）
docker run -d -p 4444:4444 --restart unless-stopped --name ws-demo ws-demo
```

### 3. 访问应用

打开浏览器访问：http://localhost:4444

## 常用命令

```bash
# 查看状态
docker ps

# 查看日志
docker logs ws-demo

# 停止服务
docker stop ws-demo

# 重启服务
docker restart ws-demo

# 删除容器
docker rm ws-demo
```
