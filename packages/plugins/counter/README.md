# @mini-dsh/plugin-counter

[English](README.md) | 中文

计数器服务全栈演示插件（Full-Stack Counter Plugin）。

---

## 插件架构与 Cordis 契约

1. **Host 后端 (`src/index.ts`)**：
   - 提供 `ctx.counter`（`CounterService`），在 Node 内存中维护 `count` 状态；
   - 依赖注入 `ctx.inject(['server', 'counter'])`，挂载 `/api/count`（`GET` 获取当前值，`POST` 执行自增）；
   - 依赖注入 `ctx.inject(['clientModules'])`，向 Host 注册自己的前端 Bundle 路径。
2. **Client 前端 (`src/client.ts`)**：
   - 依赖注入 `ctx.inject(['slots'])`；
   - 向 `sidebar.widgets` 插槽注册计数器小组件，支持实时展示与点击加一。

---

## 对应 DeepSeek Harness (`dsh`) 模块

- 对应 dsh 仓库的 [**`packages/interaction/feedback`**](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/interaction/feedback/README.md)（后端交互状态）+ [**`packages/client/ui-message-feedback`**](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/client/ui-message-feedback/README.md)（前端交互按钮）。
- **异同对比**：
  - 均展示了后端有状态服务与前端 UI 控件通过 API 协同，且当在 Profile 中禁用时，前后端能力同步干净移除。
