# Spring Cloud Platform

前后端分离的 Spring Cloud 微服务基础平台（认证/用户/权限 + 网关 + 配置中心 + 微服务控制台 + 前端 Ant Design Pro）。

## 模块
- `config-server`：Spring Cloud Config（native 文件模式，`config-repo`）
- `discovery-server`：Eureka 注册中心
- `gateway`：Spring Cloud Gateway，JWT 资源服务
- `auth-service`：登录/注册/刷新令牌（MongoDB）
- `user-service`：用户/角色管理（MongoDB，默认管理员 admin@example.com / admin123）
- `console-service`：聚合注册中心 + 健康状态
- `frontend`：Vite + Ant Design Pro 组件，登录/注册/控制台

## 本地运行（Maven）
```bash
mvn -pl config-server -am spring-boot:run
mvn -pl discovery-server -am spring-boot:run
mvn -pl gateway -am spring-boot:run
mvn -pl auth-service -am spring-boot:run
mvn -pl user-service -am spring-boot:run
mvn -pl console-service -am spring-boot:run
# 前端
cd frontend && npm install && npm run dev
```
需本地 MongoDB（默认连接 `mongodb://localhost:27017/spring-cloud-platform`）。

## Docker Compose 一键启动
```bash
docker compose up --build
# 前端 http://localhost:5173 ，网关 http://localhost:8080
```
Compose 包含 MongoDB、Config/Eureka、各服务及前端。需要约 1-2 分钟完成构建。

## Kubernetes 示例
位于 `k8s/`，包含 namespace、Mongo StatefulSet、Config/Eureka/各服务/前端/Ingress（域名 `platform.local`）。
示例镜像名为 `spring-cloud-platform/<service>:latest`，自行构建并推送后再部署：
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/mongodb.yaml
kubectl apply -f k8s/config-server.yaml
kubectl apply -f k8s/discovery-server.yaml
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/user-service.yaml
kubectl apply -f k8s/console-service.yaml
kubectl apply -f k8s/gateway.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml
```
本地 Ingress 需在 hosts 中添加 `platform.local` 指向 ingress controller。

## 关键 API
- `POST /auth/register` 注册并返回 access/refresh token
- `POST /auth/login` 登录
- `POST /auth/refresh` 刷新 access token
- `GET /users/me` 查看当前用户（需要 Authorization: Bearer ...）
- `GET /users` & `POST /users`（需 ADMIN 角色）
- `GET /console/services` 查看服务实例健康状态

## 默认账户
- 管理员：`admin@example.com` / `admin123`（由 user-service 启动自动创建）

## 验证建议
- 启动后通过前端完成注册/登录，使用控制台页面查看微服务状态。
- 使用 Postman/Curl 校验：登录 -> 携带 accessToken 访问 `/users/me` -> 刷新 token -> 再次访问受保护接口。
