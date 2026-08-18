# @mini-dsh/plugin-greeter

[English](README.md) | 中文

问候服务全栈演示插件（Full-Stack Greeter Plugin）。

---

## 插件架构与 Cordis 契约

1. **Host 后端 (`src/index.ts`)**：
   - 提供 `ctx.greeter`（`GreeterService`）；
   - 依赖注入 `ctx.inject(['server', 'greeter'])`，挂载 `GET /api/greet?name=...` 路由；
   - 依赖注入 `ctx.inject(['clientModules'])`，向 Host 注册自己的前端 Bundle 路径。
2. **Client 前端 (`src/client.ts`)**：
   - 依赖注入 `ctx.inject(['slots'])`；
   - 向 `main.cards` 插槽注册问候交互卡片，点击时异步调用 Host 端的 `/api/greet`。

---

## 对应 DeepSeek Harness (`dsh`) 模块

- 对应 dsh 仓库的典型前后端组合包，如 [**`packages/goal/goal-local`**](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/goal/goal-local/README.md)（后端 Goal 服务）+ [**`packages/client/ui-goal`**](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/client/ui-goal/README.md)（前端 Goal 卡片）。
- **异同对比**：
  - 架构模式完全一致：后端自治维护能力并声明依赖，前端通过插槽解耦挂载交互卡片。
