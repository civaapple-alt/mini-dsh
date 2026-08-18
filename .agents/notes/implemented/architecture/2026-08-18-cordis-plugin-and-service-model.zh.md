# Agent Note: Cordis 插件与服务注入模型

Status: implemented

[English](2026-08-18-cordis-plugin-and-service-model.md) | 中文

> 范围：描述 mini-dsh 中基于 `@deepseek-ai/cordis` 的统一插件模型、`Service` 抽象、依赖注入（`ctx.inject`）与副作用生命周期管理（`ctx.effect`）。

---

## 1. 背景与问题 (Context & Problem)

传统应用在模块化扩展时，通常面临以下痛点：
1. **硬编码依赖与初始化时序地狱**：模块 A 必须在模块 B 初始化完成后才能启动，导致顶层入口写满显式的异步调用顺序；
2. **缺乏生命周期隔离与清理机制**：插件挂载了 HTTP 路由、定时器或事件监听，在卸载或热重载时无法干净释放，导致内存泄漏或端口占用；
3. **作用域污染**：任意模块都能直接穿透获取未声明的全局对象，缺乏依赖约束。

在 `mini-dsh` 中，我们以 **"Everything is a plugin"** 为核心原则，要求所有系统能力与业务功能均封装为自治的 Cordis 插件。

---

## 2. 核心架构决策 (Architecture Decision)

### (1) 统一的插件接口与服务提供 (`Service`)
- 插件以 `apply(ctx: Context, config?: Config)` 函数或类形式暴露。
- 长期存活的能力继承 `Service` 基类（如 `WebServerService`、`SlotRegistryService`、`GreeterService`、`CounterService`），在构造器中调用 `super(ctx, name)`。
- 通过 TypeScript 声明合并（Declaration Merging）扩展 `Context` 与 `Events` 接口，获得端到端完整的类型推导：
  ```ts
  declare module '@deepseek-ai/cordis' {
    interface Context {
      server: WebServerService
    }
  }
  ```

### (2) 依赖注入与拓扑等待 (`ctx.inject`)
- 插件之间**绝不直接相互 import 运行时实例**，而是声明所依赖的服务名：
  ```ts
  // 仅当 server 和 greeter 都就绪时，回调才会执行
  ctx.inject(['server', 'greeter'], (ctx) => {
    ctx.effect(() => {
      const unRoute = ctx.server.route('/api/greet', handler)
      return () => unRoute()
    })
  })
  ```
- **上下文安全边界**：Cordis 强制要求在访问 `ctx.serviceName` 时，当前 Context 必须显式声明注入了该服务，否则会抛出 `"cannot get property without inject"` 错误，杜绝隐式依赖。

### (3) 副作用与生命周期管理 (`ctx.effect`)
- 插件的所有外部注册（HTTP 路由监听、事件绑定、DOM 渲染）全部包裹在 `ctx.effect()` 中。
- `ctx.effect()` 返回一个 Disposer 函数；当插件被卸载（或父 Context 销毁如 `ctx.fiber.dispose()`）时，Cordis 会自底向上自动调用所有清理逻辑，保证零残留。

---

## 3. 架构收益与保证 (Consequences & Guarantees)

1. **完全解耦的加载时序**：无论 `host-webserver` 先加载还是 `plugin-greeter` 先加载，Cordis 均能根据服务提供事件自动级联激活。
2. **环境自适应（Headless 兼容）**：如果当前 Profile 没有加载 `host-webserver`，`ctx.inject(['server'])` 中的路由注册会自动休眠，而纯计算逻辑（如 `ctx.greeter.greet()`）依然可用。
3. **优雅停机（Graceful Shutdown）**：CLI 收到 `SIGINT` 时，只需调用 `await ctx.fiber.dispose()`，即可一键关闭 HTTP 服务器并注销所有路由。
