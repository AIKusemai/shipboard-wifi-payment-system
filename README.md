# ShipTourWifi

ShipTourWifi 是一个船上 WiFi 付费系统，提供用户认证、套餐购买、上网会话管理和后台管理能力。

## 技术栈

### 前端

- React 19
- Vite 7
- React Router
- Axios
- Lucide React

### 后端

- Java 17
- Spring Boot 4
- Spring Security
- Spring Data JPA
- JWT
- WebSocket

### 数据存储

- H2
- PostgreSQL
- Redis

## 项目结构

```text
ShipTourWifi/
├── backend/                 Spring Boot 后端
│   ├── src/main/java/
│   ├── src/main/resources/
│   └── src/test/
├── frontend/                React 前端
│   ├── src/components/
│   ├── src/modules/wifi/
│   ├── src/utils/
│   └── package.json
├── compose.yaml             本地依赖编排文件
├── start-dev.sh             一键启动脚本
└── README.md
```

## 功能说明

### 用户端

- 用户注册
- 用户登录
- 查看 WiFi 套餐
- 购买套餐
- 查看当前上网会话
- 查看剩余时长和流量

### 管理端

- 查看会话列表
- 断开活跃会话
- 新增套餐
- 编辑套餐
- 上下架套餐
- 查看统计信息

## 本地运行说明

### 环境要求

- Node.js 22 及以上
- Java 17
- Maven Wrapper

### 默认端口

- 前端：`5173`
- 后端：`8080`

### 后端运行配置

本地默认使用 `local-verification` profile：

- 数据库：H2 内存库
- Redis 引导：关闭

## 启动方式

### 方法一：一键启动

在项目根目录执行：

```bash
bash ./start-dev.sh
```

启动后：

- 前端地址：`http://localhost:5173`
- 后端地址：`http://localhost:8080/api`

日志输出目录：

- `.runtime/backend.log`
- `.runtime/frontend.log`

### 方法二：分别启动

后端：

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=local-verification
```

前端：

```bash
cd frontend
nvm use 22
npx vite --port 5173
```

## 测试与校验

后端测试：

```bash
cd backend
./mvnw test
```

前端代码检查：

```bash
cd frontend
npm run lint
```

前端构建：

```bash
cd frontend
npm run build
```

## API 基址

前端默认 API 地址定义在：

- [frontend/src/config/api.js](/home/chenqy/projects/ShipTourWifi/frontend/src/config/api.js)

默认值：

```js
http://localhost:8080/api
```
