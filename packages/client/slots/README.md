# @mini-dsh/client-slots

[English](README.md) | 中文

Mini-DSH 浏览器端的声明式 UI 插槽注册表服务。

---

## 核心职责与 Cordis 契约

- **注册服务**：`ctx.slots`（`SlotRegistryService`）；
- **核心功能**：
  - `ctx.slots.register(slotName, renderer)`：允许任意插件向指定命名插槽（如 `main.cards`、`sidebar.widgets`）贡献 UI 组件，返回 Disposer；
  - `ctx.slots.renderSlot(slotName, container)`：将插槽内的所有组件渲染到指定的 DOM 容器中；
  - `ctx.emit('slot/updated', slotName)`：当插槽增删插件时触发事件通知。

---

## 对应 DeepSeek Harness (`dsh`) 模块

- 对应 dsh 仓库的 [**`packages/client/ui-slots`**](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/client/ui-slots/README.md) (`ctx.slots`)。
- **异同对比**：
  - **设计理念完全一致**：都是为了让前端组件间实现零耦合、完全由插槽声明驱动；
  - `mini-dsh` 使用简洁的原生 DOM 渲染函数；
  - `dsh` 完整版深度结合 React，提供了 `SlotMap` 类型级声明合并、4 种 Props Share 派生（`PropsRuntime`、`PropsRenderSlots`、`PropsStore`、`inject`）、以及对 Session Scope 和 Store 的复杂绑定。
