# Schemastery 配置校验与 HMR 实时热重载指南

在微内核架构中，系统拥有大量的可插拔插件，每个插件拥有不同的配置参数，且系统在运行期间需要支持插件的动态热替换。

在 DeepSeek Harness 中，`vendor/schemastery` 与 `vendor/hmr` 是支撑这一体系的两大底层基石。本文档详细介绍这两项技术在 Mini-DSH 中的极简实现与实践。

---

## 1. Schemastery 声明式配置校验

### 什么是 Schemastery？
`schemastery` 是 Cordis 生态的类型驱动 Schema 建模与校验库（类似更轻量、可序列化的 Zod）。

### 在插件中定义 Config Schema
在 `packages/plugins/greeter/src/index.ts` 中：
```ts
import Schema from 'schemastery'

export interface GreeterConfig {
  greetingPrefix?: string
  enthusiasmLevel?: number
}

// 导出强类型 Config Schema
export const Config: Schema<GreeterConfig> = Schema.object({
  greetingPrefix: Schema.string().default('Hello from Cordis Greeter').description('问候语前缀'),
  enthusiasmLevel: Schema.number().default(1).description('问候热情度级别 (1-5)'),
})
```

### 运行时自动拦截与默认值注入（Loader）
在 `apps/cli/src/index.ts` 中，Cordis Loader 在装配插件前自动执行 Schema 校验：
```ts
if (typeof pluginMod.Config === 'function') {
  // 1. 自动校验字段类型（若传入错误类型则精准抛错）
  // 2. 自动注入缺失字段的 default 默认值
  config = pluginMod.Config(config)
}
```

---

## 2. HMR 热模块替换与配置实时监听

### 为什么需要 HMR？
在生产环境或 Agent **自修改（Self-Modification）** 模式下，修改插件配置或代码不应强行重启整个 Node.js 进程，而是通过事件通知与 Cordis 的 `ctx.effect()` 自动执行旧资源释放（Disposer）并热装载新逻辑。

### 2.1 Host 端文件监听与清理
在 `packages/host/hmr/src/index.ts` 中：
```ts
export class HmrService extends Service {
  public watchConfig(targetPath: string, onReload: (file: string) => Promise<void> | void) {
    const watcher = watch(targetPath, { ignoreInitial: true })

    watcher.on('change', async (changedPath) => {
      this.ctx.emit('hmr/change', changedPath)
      await onReload(changedPath)
      this.ctx.emit('hmr/reload', changedPath)
    })

    return () => watcher.close() // 返回清理函数
  }
}
```

### 2.2 Web 端双端联动 HMR（Host SSE 广播 + Browser Fiber 热重载）

Web 界面的 HMR 是全栈双端协作的过程：

```text
┌─────────────────────────┐                         ┌─────────────────────────┐
│ 1. Host 端 (Node.js)    │                         │ 2. Browser 端 (Web GUI) │
│    @mini-dsh/host-hmr   │                         │    packages/client/shell│
└───────────┬─────────────┘                         └───────────┬─────────────┘
            │                                                   │
            │  GET /api/hmr/events (Server-Sent Events 连接)    │
            │ ◄─────────────────────────────────────────────────┤
            │                                                   │
   [检测到 client.js 重新打包]                                  │
   [或收到 POST /api/hmr/trigger]                               │
            │                                                   │
            │  SSE 广播: data: {"type":"reload", "id":"..."}    │
            ├─────────────────────────────────────────────────► │
            │                                                   │
            │                                         [1. oldFiber.dispose()]
            │                                             (清理旧插槽组件)
            │                                         [2. dynamic import(url)]
            │                                             (带时间戳拉取新 Bundle)
            │                                         [3. ctx.plugin(newMod)]
            │                                             (新组件即刻上屏，零刷新)
            │                                         [4. 弹出 HMR Toast 动画]
```

1. **Host 侧**：提供 `/api/hmr/events` SSE 流，并在 `packages/plugins/*/lib/client.js` 发生变动时广播重载事件；
2. **Client 侧（`client-shell`）**：
   - 监听到 SSE 重载事件时，调用旧插件的 `oldFiber.dispose()`（自底向上卸载旧 Slot UI）；
   - 使用带时间戳的 URL 动态 `import(newUrl)` 重新加载前端 Bundle；
   - 重新执行 `ctx.plugin(newMod)`，新 UI 自动挂载到插槽，**完全无需手动刷新网页**！

---

## 3. 运行验证实验

运行内置的 HMR & Schemastery 自动化演示：
```bash
pnpm start:hmr
```

### 执行过程
1. **Schemastery 阶段**：Loader 自动为 `greeter` 注入默认值，输出：
   ```text
   [Schemastery] 🛡️ Validated config & injected defaults for "@mini-dsh/plugin-greeter"
   [Before HMR] Initial Greeter Output: "Initial Greeter, Bob!"
   ```
2. **HMR 监听阶段**：`HmrService` 实时监听 `scratch-live-config.json`；
3. **热更新生效**：模拟外部修改配置文件为 v2 后，HMR 自动捕获并无缝热更新内存中的 `GreeterService` 实例状态：
   ```text
   [Host HMR] 🔥 Detected change in "scratch-live-config.json"! Triggering live reload...
   [After HMR] Hot-Reloaded Greeter Output: "🔥 Hot-Reloaded Super Greeter (v2), Bob!!!!"
   ```

---

## 4. 对标 DeepSeek Harness 官方实现

| 架构机制 | Mini-DSH 极简实现 | DeepSeek Harness 官方源码 | 说明 |
|---|---|---|---|
| **配置 Schema 建模** | `schemastery` (`Schema.object`) | [`vendor/schemastery`](file:///d:/gh-ws/deepseek-harness/vendor/schemastery/README.md) (`@deepseek-ai/schemastery`) | 统一的强类型配置声明与默认值补全 |
| **热重载核心服务** | `@mini-dsh/host-hmr` (`ctx.hmr`) | [`vendor/hmr`](file:///d:/gh-ws/deepseek-harness/vendor/hmr/README.md) (`@deepseek-ai/cordis-plugin-hmr`) | 监听源码及 `cordis.yml` 变更并驱动 Fiber 热替换 |
| **无残留清理** | `ctx.effect(() => () => watcher.close())` | `cordis/src/fiber.ts` (`Quiescent Teardown`) | 热更新时自底向上执行 Disposer，0 内存与句柄泄漏 |
