# @mini-dsh/host-client-modules

[English](README.md) | 中文

Mini-DSH 的客户端插件 Bundle 管理与启动清单服务。

---

## 核心职责与 Cordis 契约

- **注册服务**：`ctx.clientModules`（`ClientModuleService`）；
- **依赖声明**：`inject = ['server']`；
- **核心机制**：
  1. **动态注册**：提供 `ctx.clientModules.register(id, clientPath)`，允许活动插件动态登记其前端 Bundle；
  2. **路由分发**：自动为每个注册的插件挂载 `/plugins/:id/client.js` 端点；
  3. **清单注入**：在 `GET /` 页面请求中将当前活跃的模块图注入为 `window.__MINI_BOOT__`；
  4. **外壳分发**：提供 `/dist/client-shell.js` 前端引导内核文件。

---

## 对应 DeepSeek Harness (`dsh`) 模块

- 对应 dsh 仓库的 [**`packages/client/modules`**](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/client/modules/README.md) 的 **Node 端半侧**（`ctx.clientModules` / `ClientModuleRegistry`）。
- **异同对比**：
  - 两者都扮演 Node 宿主与浏览器之间的桥梁，负责生成 `window.__*BOOT__` 清单并分发静态 JS Bundle；
  - `dsh` 完整版支持增量包扫描、内容 Hash 版本号校验（Cache-busting rev）、以及与 HMR（热重载）服务的联动。
