# Mini-DSH: Cordis 极简架构实现与学习指南

本项目是一个极简版（Educational & Minimalist）的 DeepSeek Harness 架构实现，专门用于学习与验证 **Cordis** 框架的核心设计哲学：**“Everything is a plugin”（一切皆插件）**。

> 📖 **推荐初学者必读**：请阅读 [**《Mini-DSH 架构学习指南：从 CLI 启动到浏览器端动态插件加载全流程》**](docs/beginner-guide.md)，包含全流程时序图、`window.__MINI_BOOT__` 详解、`client-shell.js` 运作机制与 DSH 源码对标！

---

## 核心设计概念

1. **统一的插件模型（Cordis Plugin）**：
   - 所有的功能、服务、API 路由以及前端 UI 组件全部以 Cordis 插件（`apply(ctx, config)`）形式组织。
   - 通过依赖注入（`ctx.inject(['server', 'slots'])`）实现插件之间的拓扑解耦与延迟挂载。
   - 所有的注册与监听都封装在 `ctx.effect()` 中，支持干净的生命周期管理与销毁（Disposer）。

2. **配置驱动的 Profile 机制**：
   - 通过 YAML 文件（如 `profiles/web.yml`、`profiles/base.yml`）声明启用的插件及其配置参数。
   - 切换 Profile 即切换系统能力，无需修改一行代码。

3. **前后端对称的插件组合架构（Host + Client-Web）**：
   - **Host 端（Node.js）**：
     - 运行 Cordis Context。
     - `host-webserver` 插件提供 `ctx.server` 基础 HTTP 服务。
     - `host-client-modules` 插件自动扫描已加载插件的 `package.json`（带有 `mini.client` 字段），组装 `window.__MINI_BOOT__` 启动图，并分发 `/plugins/:id/client.js`。
   - **Client 端（浏览器 Web GUI）**：
     - 在浏览器中运行 Cordis Context。
     - `client-slots` 插件提供 `ctx.slots` 插槽机制（`main.cards`、`sidebar.widgets`）。
     - `client-shell` 动态 import 插件的前端 Bundle，并在浏览器端的 Cordis 中执行 `apply(ctx)`，将 UI 挂载到对应 Slot。

4. **全栈插件自包含（Full-Stack Plugin）**：
   - 以 `@mini-dsh/plugin-greeter` 和 `@mini-dsh/plugin-counter` 为例：
     - `src/index.ts`：向 Host 提供后端 Service 并挂载 API 路由（如 `/api/greet`、`/api/count`）。
     - `src/client.ts`：向 Client 注册前端交互卡片/控件。
     - 只需要在 `profiles/web.yml` 中添加一行插件名称，前后端能力就会全自动装配上线！

---

## 项目目录结构

```text
mini-dsh/
├── package.json                   # 根目录配置与工作区脚本
├── pnpm-workspace.yaml            # pnpm monorepo 配置
├── tsconfig.base.json             # 基础 TypeScript 配置
├── profiles/                      # Cordis Profile 配置文件
│   ├── base.yml                   # Headless 模式（仅后端插件与任务运行器，无 Web 服务）
│   └── web.yml                    # Web GUI 模式（包含 Web 服务与全栈 UI 插件）
├── apps/
│   └── cli/                       # Host 启动入口 (支持 --profile 和 --task 参数)
└── packages/
    ├── host/
    │   ├── webserver/             # Host HTTP 服务插件 (ctx.server)
    │   └── client-modules/        # Client 模块扫描与 Bundle 分发 (ctx.clientModules)
    ├── client/
    │   ├── slots/                 # 浏览器 UI 插槽系统 (ctx.slots)
    │   └── shell/                 # 浏览器 Cordis 引导内核 (AppWebEntry)
    └── plugins/
        ├── greeter/               # 问候服务全栈插件 (后端 API + 前端卡片)
        ├── counter/               # 计数器全栈插件 (后端状态 + 前端组件)
        └── task-runner/           # Headless 任务运行器插件 (多步骤工作流编排与事件发射)
```

---

## 快速上手与验证

### 1. 安装依赖与构建 Client Bundle

```bash
# 1. 在 mini-dsh 目录下安装依赖
pnpm install

# 2. 构建所有前端 Client Bundle 与 TypeScript 产物
pnpm run build
```

### 2. 运行 Web GUI 模式

```bash
pnpm start
# 或者指定 profile:
# pnpm --filter @mini-dsh/cli start --profile web
```

在浏览器中打开：**`http://localhost:3000`**

- 你将看到浏览器端 Cordis 容器自动激活。
- `@mini-dsh/plugin-greeter` 自动将问候卡片挂载到 **`main.cards`** 插槽，并在点击时请求 Host 的 `GET /api/greet`。
- `@mini-dsh/plugin-counter` 自动将计数器组件挂载到 **`sidebar.widgets`** 插槽，并在点击时请求 Host 的 `POST /api/count`。

---

### 3. 运行 Headless 模式（对标真实 Agent 运行器）

```bash
# 运行 base profile 下的默认多步骤任务
pnpm start:base

# 或者动态传入自定义任务指令 (模拟 dsh --profile headless "task")
pnpm start:task "Nightly Security Audit and Build"
```

**控制台输出过程**：
1. Cordis 自动加载 `greeter`、`counter` 与 `task-runner`；
2. `task-runner` 响应式注入所需服务，执行多步骤工作流（Step 1: 上下文初始化 $\to$ Step 2~N: 状态推进）；
3. 过程广播 `task/start`、`task/step`、`task/complete` 类型化事件；
4. 打印任务耗时与状态 Summary 并排空事件循环退出。

---

### 4. 验证 “Everything is a plugin” 的可插拔性

#### 实验 A：在配置文件中禁用一个插件
打开 `profiles/web.yml`，在 `plugin-counter` 节点下增加 `disabled: true`：
```yaml
- name: '@mini-dsh/plugin-counter'
  disabled: true
```
重启服务并刷新浏览器：
- 观察终端日志：`Counter` 插件未加载，未注册 `/api/count` 路由。
- 观察网页：`sidebar.widgets` 插槽中的计数器组件**完全消失**，系统其他功能丝毫不受影响。

#### 实验 B：验证 Headless 优雅降级
打开 `profiles/base.yml`，将 `@mini-dsh/plugin-counter` 设为 `disabled: true`：
```bash
pnpm start:base
```
- 观察 `task-runner`：自动检测到 `counter` 缺失，执行降级逻辑，依然稳定完成工作流！

---

## 许可证 (License)

本项目采用 [MIT 许可证](LICENSE)。

