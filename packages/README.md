# packages/ — Mini-DSH 插件与基础能力包

[English](README.md) | 中文

`packages/` 目录下存放系统中所有的 Cordis 插件与共享能力库。

---

## 模块分组与 DSH 对应概览

```text
packages/
├── host/                  # 宿主端 (Node.js) 基础服务
│   ├── webserver/         # HTTP 服务器 (ctx.server)
│   └── client-modules/    # 客户端 Bundle 扫描与分发 (ctx.clientModules)
├── client/                # 浏览器端 (Browser) 运行时与插槽机制
│   ├── slots/             # UI 插槽注册表 (ctx.slots)
│   └── shell/             # 浏览器 Cordis 容器引导内核
└── plugins/               # 全栈业务功能插件
    ├── greeter/           # 问候功能插件 (后端 API + 前端卡片)
    └── counter/           # 计数器功能插件 (后端状态 + 前端控件)
```

---

## 各包职责与 DSH 对应表

| 包路径 | 注册服务 / 作用 | 对应 DeepSeek Harness 模块 | 相似功能与设计差异 |
|---|---|---|---|
| [`host/webserver`](host/webserver/README.md) | `ctx.server` | [`packages/host/webserver`](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/host/webserver/README.md) | 都是 HTTP 载体服务。dsh 支持更加完备的路由中间件与 WebSocket。 |
| [`host/client-modules`](host/client-modules/README.md) | `ctx.clientModules` | [`packages/client/modules`](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/client/modules/README.md) (Node 半) | 都负责扫描 `dsh.client` / `mini.client` 并注入 `window.__*BOOT__` 启动图。 |
| [`client/slots`](client/slots/README.md) | `ctx.slots` | [`packages/client/ui-slots`](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/client/ui-slots/README.md) | 都是核心 UI 插槽机制。mini-dsh 使用原生 DOM；dsh 结合 React 并支持严格的 4-share Props 类型派生。 |
| [`client/shell`](client/shell/README.md) | 浏览器引导内核 | [`packages/client/web`](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/client/web/README.md) + [`packages/client/modules`](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/client/modules/README.md) (Client 半) | 都负责在浏览器端初始化 Cordis、动态拉取各插件的 `client.js` 并执行 `ctx.plugin()`。 |
| [`plugins/greeter`](plugins/greeter/README.md) | 全栈功能插件 | [`packages/goal/goal-local`](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/goal/goal-local/README.md) + [`packages/client/ui-goal`](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/client/ui-goal/README.md) | 典型的前后端一体插件结构（后端服务 + API + 前端 UI 插槽贡献）。 |
| [`plugins/counter`](plugins/counter/README.md) | 全栈状态插件 | [`packages/interaction/feedback`](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/interaction/feedback/README.md) + [`packages/client/ui-message-feedback`](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/client/ui-message-feedback/README.md) | 演示后端状态管理通过 HTTP RPC 与前端交互组件双向绑定。 |
