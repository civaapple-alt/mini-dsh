# @mini-dsh/client-shell

[English](README.md) | 中文

Mini-DSH 浏览器端的基础引导内核（Web Shell Kernel）。

---

## 核心职责

1. **浏览器 Cordis 初始化**：在浏览器内存中调用 `new Context()` 实例化客户端容器；
2. **挂载基础 UI 服务**：加载 `@mini-dsh/client-slots` 插件；
3. **读取启动清单**：解析 HTML 头部注入的 `window.__MINI_BOOT__`；
4. **动态模块装载**：对清单中的每个插件执行原生 `await import(mod.url)`，并执行 `await ctx.plugin(pluginModule)`；
5. **插槽布局与响应式刷新**：初始化页面布局，执行初始插槽渲染，并监听 `slot/updated` 事件进行动态局部更新。

---

## 对应 DeepSeek Harness (`dsh`) 模块

- 对应 dsh 仓库的 [**`packages/client/web`**](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/client/web/README.md)（`AppWebEntry` 引导内核）+ [**`packages/client/modules`**](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/client/modules/README.md)（客户端惰性 CJS 模块加载器 `ClientModuleSystem`）。
- **异同对比**：
  - 两者都充当浏览器端的引导程序（Bootloader）；
  - `dsh` 完整版支持更复杂的分阶段预取（Stage-one prefetch）、Lazy 惰性物化、以及基于 SSE 的 HMR 模块热刷新。
