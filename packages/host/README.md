# host/ — 宿主端基础包

[English](README.md) | 中文

`host/` 目录下存放运行在 Node.js 宿主环境的基础服务插件。

---

## 包含模块与 DSH 对应表

| 包名 | ctx 服务名 | 职责 | 对应 DSH 模块 |
|---|---|---|---|
| [**`webserver/`**](webserver/README.md) | `ctx.server` | 宿主 HTTP 服务与路由监听 | [`packages/host/webserver`](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/host/webserver/README.md) (`ctx.webServer`) |
| [**`client-modules/`**](client-modules/README.md) | `ctx.clientModules` | 客户端 Bundle 注册与 `window.__MINI_BOOT__` 生成 | [`packages/client/modules`](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/client/modules/README.md) (Node 半) |
