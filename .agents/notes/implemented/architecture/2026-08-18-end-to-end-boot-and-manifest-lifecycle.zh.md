# Agent Note: 端到端启动与清单生命周期 (Boot & Manifest Lifecycle)

Status: implemented

[English](2026-08-18-end-to-end-boot-and-manifest-lifecycle.md) | 中文

> 范围：记录从 CLI 启动、Host 端服务装配、`window.__MINI_BOOT__` 生成注入、浏览器端微内核引导、UI 插槽挂载，以及**插件停用（disabled）、重启重新加载与生命周期清理**的完整端到端机制。

---

## 1. 背景与问题 (Context & Problem)

在全栈插件微内核系统中，初学者最容易困惑的问题包括：
1. **启动时序与边界**：CLI、Host WebServer、浏览器端 Cordis 容器三者是如何先后启动的？
2. **前后端信息传递**：浏览器打开时如何知道后端启用了哪些插件？
3. **插件停用与状态残留缺陷**：为什么禁用了后端插件，如果清单静态扫描依然命中，前端还会发起请求并报错？
4. **重启与重载机制**：修改 Profile 配置文件后，系统内部是如何做到前后端连带干净卸载与恢复的？

---

## 2. 核心架构决策 (Architecture Decision)

### (1) 全链路 6 步时序
1. **CLI 引导**：`apps/cli` 读取 `profiles/web.yml`，初始化根 Context；
2. **Host 服务就绪**：`host-webserver` 启动 HTTP 监听，`host-client-modules` 提供注册中心；
3. **插件自治登记**：全栈插件通过 `ctx.inject(['clientModules'])` 将自己的 `lib/client.js` 动态登记到活动模块表；
4. **HTML 响应与清单注入**：浏览器发起 `GET /` 请求，Host 将当前活跃的模块图作为全局变量注入到 `<script>window.__MINI_BOOT__ = ...</script>`；
5. **浏览器微内核引导**：浏览器加载 `/lib/client-shell.js`，实例化浏览器端 Cordis `Context` 并挂载 `ctx.slots` 服务；
6. **动态按需拉取与插槽挂载**：浏览器遍历 `window.__MINI_BOOT__.modules`，通过原生 `await import('/plugins/:id/client.js')` 拉取前端 Bundle 并执行 `apply(ctx)`，将 UI 挂载到指定插槽。

### (2) 插件停用机制（Deactivation via Profile）
- **配置驱动**：在 `profiles/web.yml` 中设置 `disabled: true` 或注释对应行；
- **前后端连带卸载**：
  1. `apps/cli` 跳过该插件的 `apply(ctx)` 执行；
  2. 后端 API 路由不会被注册（外部请求返回 404）；
  3. 前端 Bundle 不会向 `clientModules` 登记；
  4. 生成的 `window.__MINI_BOOT__` 自动剔除该插件；
  5. 浏览器打开网页时完全不发起该插件的下载请求，对应插槽清空，无任何报错。

### (3) 动态响应式登记杜绝残留
- **否决的方案**：直接扫描文件系统的 `packages/plugins` 目录。该方案会导致已被 Profile 禁用的插件仍然出现在启动清单中，引发前端孤儿请求与报错。
- **实施的方案**：只有在插件后端 `apply(ctx)` 实际执行时，才通过 `ctx.clientModules.register(id, path)` 登记自己；当 Profile 中标记 `disabled: true` 时，前后端能力同生共死，零残留。

---

## 3. 架构收益与保证 (Consequences & Guarantees)

1. **端到端完全解耦**：浏览器外壳在构建期对任何具体业务插件一无所知，全流程依赖运行时动态装配。
2. **零侵入热插拔**：开关功能仅需修改 YAML 配置并重启，无需动用任何前端或后端业务源码。
3. **严格的 DSH 官方对标**：完整复刻了 `deepseek-harness` 中 `window.__DSH_BOOT__`、`AppWebEntry` 以及 `ui-slots` 的核心设计模式。
