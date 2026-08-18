# Agent Note: 声明式 UI 插槽系统 (Slot Registry)

Status: implemented

[English](2026-08-18-declarative-ui-slot-system.md) | 中文

> 范围：描述 mini-dsh 浏览器端的 `ctx.slots` 插槽服务抽象，以及插件如何通过插槽系统解耦地组合 UI 界面。

---

## 1. 背景与问题 (Context & Problem)

在插件化前端系统中，多个互相独立的插件需要在同一个页面的不同区域渲染内容（例如侧边栏挂载小组件、主内容区展示卡片）。常见的错误做法包括：
1. **直接 DOM 侵入**：插件各自调用 `document.getElementById` 暴力写入，容易发生选择器冲突且顺序混乱；
2. **中心化组件字典**：由主壳应用维护一个巨大的 `switch/case` 字典，破坏了插件自治性。

---

## 2. 核心架构决策 (Architecture Decision)

### (1) `SlotRegistryService` 核心抽象
- `packages/client/slots` 提供名为 `slots` 的 Cordis 服务 (`ctx.slots`)。
- 核心 API：
  - `ctx.slots.register(slotName: string, renderer: SlotRenderer): () => void`
  - `ctx.slots.renderSlot(slotName: string, container: HTMLElement): () => void`
  - `ctx.on('slot/updated', (slotName) => { ... })`

### (2) 声明式插槽定义与挂载
- 业务插件声明注入 `slots` 服务，并注册自己的渲染逻辑：
  ```ts
  // packages/plugins/greeter/src/client.ts
  ctx.inject(['slots'], (ctx) => {
    ctx.effect(() => {
      return ctx.slots.register('main.cards', (container, ctx) => {
        container.innerHTML = `...`
        return () => { /* 清理 DOM 监听事件 */ }
      })
    })
  })
  ```
- 壳层布局（`client-shell`）仅需定义插槽锚点（如 `#slot-main-cards`、`#slot-sidebar-widgets`），并在插槽发生更新时自动重新执行 `renderSlot()`。

---

## 3. 架构收益与保证 (Consequences & Guarantees)

1. **组件间零依赖**：`plugin-greeter` 和 `plugin-counter` 可以同时向不同或相同的插槽注册内容，彼此毫无耦合。
2. **生命周期自动跟随**：`ctx.slots.register` 返回 disposer，配合 `ctx.effect()`，当插件被卸载时，对应的 UI 组件会自动从页面中移除。
3. **框架无关性**：`SlotRenderer` 接收标准 DOM 容器，底层既可以使用原生 DOM，也可以无缝桥接 React / Preact / Vue 等任何渲染库。
