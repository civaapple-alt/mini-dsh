# @mini-dsh/host-webserver

[English](README.md) | 中文

Mini-DSH 的宿主 HTTP 服务器与路由基础服务。

---

## 核心职责与 Cordis 契约

- **注册服务**：`ctx.server`（`WebServerService`）；
- **生命周期**：
  - 构造时创建 `http.Server` 实例；
  - `ctx.effect()` 内监听端口并在插件卸载时调用 `this.server.close()`；
- **公开 API**：
  - `ctx.server.route(path: string, handler: RouteHandler): () => void`：注册 HTTP 路径处理器，返回注销函数（Disposer）。

---

## 对应 DeepSeek Harness (`dsh`) 模块

- 对应 dsh 仓库的 [**`packages/host/webserver`**](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/host/webserver/README.md) (`ctx.webServer`)。
- **异同对比**：
  - 两者都作为 Web GUI 的网络路由载体；
  - `dsh` 完整版封装了更严格的前缀路由分发、中间件、SPA 页面回退以及 WebSocket / SSE 载体支持。
