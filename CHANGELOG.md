# Changelog

All notable changes to the **Mini-DSH** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.4.0] - 2026-08-18

### Added (会话级 Presets 与多租户作用域隔离)
- **`presets/` 独立配置体系**：
  - 新增 `presets/minimal.yml`（极简模式预设，仅分配 ToolBash 与精简 Prompt）。
  - 新增 `presets/standard.yml`（标准全功能模式预设，分配 Greeter + Counter + ToolBash）。
- **`@mini-dsh/host-session-manager` 会话管理插件**：
  - 注册 `ctx.sessions` 服务，支持基于 Cordis `ctx.isolate()` 派生隔离的 Session 子上下文。
  - 自动将 Preset 声明的工具与 Persona 装配到会话作用域内，杜绝多会话工具泄漏。
  - 提供 `/api/presets`、`/api/sessions`、`/api/sessions/create` 完整的会话管理 REST API。
- **`@mini-dsh/plugin-presets-demo` 多会话隔离验证插件**：
  - 在同一 Node.js 进程中并发创建 `minimal` 与 `standard` 两个会话，严格验证各自的工具与人设隔离性。
- **新增 Profile 与命令**：
  - 新增 `profiles/presets.yml` 与 `pnpm start:presets` 快速运行验证。

---

## [0.3.0] - 2026-08-18

### Added (Capability Seam 与可移植执行世界)
- **`@mini-dsh/seam-executor` (Service Definition)**：
  - 声明 `ctx.executor` 抽象服务契约与 `ExecutorService` 基类及 `ExecResult` 接口规范。
- **`@mini-dsh/provider-executor-local` (Local Provider)**：
  - 基于 Node.js 子进程实现本地环境命令执行。
- **`@mini-dsh/provider-executor-sandbox` (Sandbox Provider)**：
  - 模拟云端容器与虚拟沙箱（E2B / Docker / Landlock）的安全隔离命令执行。
- **`@mini-dsh/plugin-tool-bash` (Consumer)**：
  - 面向大模型与业务层的 Bash 执行工具插件，与底层提供方完全解耦。
- **新增 Profiles 与脚本**：
  - 新增 `profiles/local.yml`（本地执行世界）与 `profiles/sandbox.yml`（安全沙箱世界）。
  - 根目录新增 `pnpm start:local` 与 `pnpm start:sandbox`。
- **`@mini-dsh/plugin-task-runner` 增强**：
  - 支持感知并调用 `ctx.executor` 执行工作流中的 Shell 指令并展示跨环境执行差异。

---

## [0.2.0] - 2026-08-18

### Added (新增功能)
- **`@mini-dsh/plugin-task-runner` 纯 CLI 任务运行器插件**：
  - 新建 Headless 任务调度插件，用于在无 Web 服务/无头模式下编排多步骤自动化工作流。
  - 注册 `ctx.taskRunner` 服务，支持响应式依赖注入（自动装配 `ctx.greeter` 与 `ctx.counter`）。
  - 新增 Cordis 类型化事件系统扩展：`task/start`、`task/step`、`task/complete`。
  - 支持 `autoRun`、`taskName`、`targetUser`、`iterations` 以及 `exitOnComplete` 配置项。
- **CLI 命令行动态任务传参支持**：
  - 更新 `apps/cli/src/index.ts`，支持 `--task "<taskName>"` 参数动态覆盖 Profile 中的默认任务名称，模拟 DeepSeek Harness 的 `dsh --profile headless "task"`。
  - 根目录 `package.json` 新增快捷脚本：`pnpm start:task "<taskName>"`。
- **Profile 配置完善**：
  - 更新 `profiles/base.yml`，默认集成 `@mini-dsh/plugin-task-runner`，提供完整的 Headless 工作流闭环。

### Documentation (文档更新)
- **`README.md`**：
  - 目录树中补齐 `packages/plugins/task-runner`。
  - 新增 “3. 运行 Headless 模式（对标真实 Agent 运行器）” 详细指南与控制台输出说明。
  - 新增 “实验 B：验证 Headless 优雅降级” 实验步骤。
- **`docs/beginner-guide.md`**：
  - 在第 7 节架构对标表中新增 `Headless 任务运行器` 与 DeepSeek Harness 官方 `core/agent-loop` + `bundle/headless` 的映射说明。
- **`packages/plugins/task-runner/README.md`**：
  - 新增 TaskRunner 插件的独立技术文档与 API 规范。

---

## [0.1.0] - 2026-08-18

### Added (初始版本)
- **Cordis 极简微内核底座**：
  - 基于 `@deepseek-ai/cordis` 实现轻量化微内核容器与生命周期管理。
  - 基于 YAML 的 Profile 驱动配置系统（`profiles/web.yml` 与 `profiles/base.yml`）。
- **Host 端基础服务**：
  - `@mini-dsh/host-webserver`：基于 Node 原生 HTTP 模块提供 `ctx.server` 路由服务。
  - `@mini-dsh/host-client-modules`：动态扫描活动插件并生成 `window.__MINI_BOOT__` 启动清单。
- **Client 端浏览器插槽与引导内核**：
  - `@mini-dsh/client-slots`：提供通用的 `ctx.slots`（`main.cards`、`sidebar.widgets`）插槽系统。
  - `@mini-dsh/client-shell`：浏览器端 Cordis 运行时内核（`AppWebEntry`），负责动态 import 插件 Bundle 并挂载 UI。
- **全栈示例插件**：
  - `@mini-dsh/plugin-greeter`：提供问候后端服务、`/api/greet` 接口及前端卡片组件。
  - `@mini-dsh/plugin-counter`：提供计数器后端状态、`/api/count` 接口及前端侧边栏小部件。
- **新手架构学习文档**：
  - 提供 `docs/beginner-guide.md` 完整端到端生命周期与时序图。
