# plugins/ — 全栈功能插件包

[English](README.md) | 中文

`plugins/` 目录下存放系统中具体的业务全栈插件。每个插件自包含后端服务、API 端点以及前端 UI 组件。

---

## 包含模块与 DSH 对应表

| 插件名称 | 后端能力 | 前端 UI 贡献插槽 | 对应 DSH 模块 |
|---|---|---|---|
| [**`greeter/`**](greeter/README.md) | `ctx.greeter` 服务 + `GET /api/greet` | `main.cards`（主内容卡片） | [`packages/goal/goal-local`](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/goal/goal-local/README.md) + [`packages/client/ui-goal`](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/client/ui-goal/README.md) |
| [**`counter/`**](counter/README.md) | `ctx.counter` 状态服务 + `/api/count` | `sidebar.widgets`（侧边栏小组件） | [`packages/interaction/feedback`](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/interaction/feedback/README.md) + [`packages/client/ui-message-feedback`](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/client/ui-message-feedback/README.md) |

---

## 全栈插件标准结构

每个全栈插件遵循统一的物理与代码结构：

```text
packages/plugins/<name>/
├── package.json       # 声明 "main": "./src/index.ts" 与 "mini": { "client": "./dist/client.js" }
├── src/
│   ├── index.ts       # Host 后端入口: 提供 Service, 挂载 HTTP API, 登记 clientModules
│   └── client.ts      # Client 前端入口: 注入 slots, 注册 UI 组件到命名插槽
└── dist/
    └── client.js      # 经 esbuild 独立打包出的前端 ES Module Bundle
```
