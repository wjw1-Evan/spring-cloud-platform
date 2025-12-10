# Spring Cloud Platform

前后端分离的 Spring Cloud 微服务基础平台（认证/用户/权限 + 网关 + 配置中心 + 微服务控制台 + 前端 Ant Design Pro）。

# Spring Cloud Platform

前后端分离的 Spring Cloud 微服务基础平台（认证/用户/权限 + 网关 + 配置中心 + 微服务控制台 + 前端 Ant Design Pro）。

本 README 包含启动说明、容器端口映射、以及常见问题的快速排查步骤（例如前端代理、浏览器弹窗、网关代理 500 等）。

## 模块
- `config-server`：Spring Cloud Config（native 文件模式，`config-repo`）
- `discovery-server`：Eureka 注册中心
- `gateway`：Spring Cloud Gateway（路由 + JWT 资源服务）
- `auth-service`：登录/注册/刷新令牌（MongoDB）
- `user-service`：用户/角色管理（MongoDB，默认管理员 admin@example.com / admin123）
- `console-service`：聚合注册中心 + 健康状态
- `frontend`：Vite + Ant Design Pro，生产静态资源由 nginx 提供

## 本地运行（Maven）
开发时可以直接用 Maven 启动单个模块：

```bash
mvn -pl config-server -am spring-boot:run
mvn -pl discovery-server -am spring-boot:run
mvn -pl gateway -am spring-boot:run
mvn -pl auth-service -am spring-boot:run
mvn -pl user-service -am spring-boot:run
mvn -pl console-service -am spring-boot:run
# 前端（开发服务器）
cd frontend && npm install && npm run dev
```

注意：若用 Maven 本地运行，需保证有可用的 MongoDB（默认连接 `mongodb://localhost:27017/spring-cloud-platform`）。

## Docker Compose（一键启动）
工程已包含 `docker-compose.yml`，可以用 Compose 一键启动所有服务（包括 MongoDB、Config/Eureka、各微服务与前端）：

```bash
docker compose up --build
# 前端（nginx）: http://localhost:5173
# 网关: http://localhost:8080
# 管理界面（Portainer）: http://localhost:9090
```

镜像构建与服务启动通常需要 1-2 分钟，首次构建会更久。

## 重要端口（默认）
- Frontend (nginx) : 5173 -> 容器 80
- Gateway : 8080 -> 容器 8080
- Auth service : 9000 -> 容器 9000
- User service : 9001 -> 容器 9001
- Admin / 管理面板（如已启用）: 8081

## 前端代理与生产静态资源
- 开发时 Vite dev server 的 proxy（`vite.config.ts`）只在 `npm run dev` 时生效。生产构建之后静态文件由 nginx 提供，nginx 需要在 runtime 将 API 请求代理到 `gateway`（容器网络内的主机名）。
- 若你修改了后端地址或需要在构建时指定 API 基址，请设置 `frontend/.env` 中的 VITE_API_BASE_URL（示例：`VITE_API_BASE_URL=http://localhost:8080`），然后重新构建前端镜像：

```bash
cd frontend
# 更新 .env 后重新构建镜像
docker compose build --no-cache frontend
docker compose up -d frontend
```

## 常见问题与排查

- 浏览器弹出“Windows 身份验证”对话框
	- 这个现象通常是因为后端返回了 `WWW-Authenticate: Basic` 的 401 响应（Spring Security 的 HTTP Basic）。解决办法：
		1. 确认服务的 Security 配置没有启用 `httpBasic()`（默认 dev 配置会生成一个临时密码并开启 basic）。
		2. 在调试时可临时允许 `/auth/**` 不认证以排查问题，但正式环境应使用 JWT/表单等方式并关闭 httpBasic。
		3. 使用隐身窗口或清除浏览器凭据来避免已缓存的凭证触发弹窗。

- 前端通过 nginx 代理到网关时收到 500（网关日志显示 UnknownHost / NXDOMAIN）
	- 说明网关在处理请求时尝试解析了一个不可达的主机名（例如容器短 ID），常见原因是 nginx 将原始 Host/header 透传为前端容器的主机名，导致 downstream（或某个过滤器）去做 DNS 解析。
	- 推荐 nginx 代理配置（在 `frontend/nginx.conf` 的相关 `location` 中）加入：

```nginx
proxy_set_header Host $proxy_host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_http_version 1.1;
proxy_set_header Connection "";
```

	- 这会让 nginx 将 `Host` 设置为 `proxy_pass` 指定的主机（例如 `gateway`），避免把前端容器短 id 泄露给网关并触发 DNS 解析错误。修改后需重建并重启 `frontend` 镜像。

- 通过网关转发时请求体/头丢失或行为不一致
	- 确认 nginx 的 `proxy_pass` 使用了正确的 URI（保留尾部斜杠的差别会影响路径拼接），并确认 `Content-Type`、`Content-Length` 正常传递。
	- 网关侧可查看日志：

```bash
docker compose logs --tail 200 gateway
```

- Spring Data 报错 “Parameter ... does not have a name”
	- 如果你在运行时遇到类似 Mapping/构造器参数名字相关的错误，通常是实体类缺少无参构造或 Lombok 注解导致的字节码信息缺失。解决方案是确保实体类有标准的无参构造（或在项目中启用 -parameters 编译参数并使用合适的 Lombok 注解）。

## 关键 API（摘要）
- POST /auth/register：注册并返回 access/refresh token
- POST /auth/login：登录（返回 access/refresh token）
- POST /auth/refresh：刷新 access token
- GET /users/me：查看当前用户（需要 Authorization: Bearer ...）
- GET /users、POST /users：用户管理（需 ADMIN 角色）
- GET /console/services：查看服务实例健康状态

## 默认账户
- 管理员：`admin@example.com` / `admin123`（由 `user-service` 在启动时自动创建）

## 验证建议（快速流程）
1. 启动全部服务（推荐使用 Docker Compose）：

```bash
docker compose up --build
```

2. 打开前端： http://localhost:5173，尝试注册/登录。
3. 使用 Postman 或 curl 验证接口：

```bash
# 登录
curl -i -X POST http://localhost:8080/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@example.com","password":"admin123"}'

# 使用返回的 access token 访问受保护接口
curl -H "Authorization: Bearer <access_token>" http://localhost:8080/users/me
```

## 进一步帮助
如果你需要，我可以：
- 帮你把 `frontend/nginx.conf` 的 `proxy_set_header` 自动加入并构建镜像；
- 检查并把 `auth-service` 的 security 配置恢复为：仅允许 `/auth/**` 和 actuator 无需认证，其余接口需要 JWT；
- 远程协助查看网关在转发时的完整堆栈（已有 gateway 日志的 UnknownHost 线索）。

欢迎随时告诉我你希望我接着做哪一步（例如我现在替你修改 `frontend/nginx.conf` 并重建镜像）。
