# Capability Seam（能力接缝）与可移植执行世界深入指南

在构建现代 AI Coding Agent 时，智能体不仅要在本地开发机上运行，还要能够在云端隔离沙箱（如 E2B、Docker 容器、Landlock 等环境）中安全执行高危指令。

为了避免在 Agent 业务层写死各种各样的 `if (isCloud) { ... } else { ... }` 分支，DeepSeek Harness 提出了标准化的 **Capability Seam（能力接缝）** 架构。本文档详细拆解该模式在 Mini-DSH 中的极简实现。

---

## 1. 架构三元角色模型

Capability Seam 由 **Service Definition（契约定义）**、**Service Provider（能力提供方）** 和 **Consumer（消费者）** 三个完全解耦的角色组成：

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Capability Seam                                │
│                                                                             │
│   ┌────────────────────────┐                   ┌────────────────────────┐   │
│   │   Service Definition   │ ◄──────────────── │    Service Provider    │   │
│   │ (抽象契约/服务定义)    │                   │ (具体实现, 本地/沙箱)   │   │
│   │ @mini-dsh/seam-executor│                   │ executor-local/sandbox │   │
│   └───────────▲────────────┘                   └────────────────────────┘   │
│               │                                                             │
│               │ ctx.inject(['executor'], (ctx) => ...)                      │
│               │                                                             │
│   ┌───────────┴────────────┐                                                │
│   │        Consumer        │                                                │
│   │    (面向模型的工具)    │                                                │
│   │ @mini-dsh/plugin-tool-bash                                              │
│   └────────────────────────┘                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 角色分工

1. **Service Definition (`@mini-dsh/seam-executor`)**：
   - 声明 `ExecutorService` 抽象基类；
   - 规定 `exec(command: string): Promise<ExecResult>` 的输入输出标准；
   - 声明 Cordis 类型注入键 `Context.executor`。
2. **Service Providers**：
   - `@mini-dsh/provider-executor-local`：调用 Node.js `child_process.exec` 在宿主机直接执行；
   - `@mini-dsh/provider-executor-sandbox`：模拟在云端 Linux 隔离沙箱微容器（如 E2B）中执行。
3. **Consumer (`@mini-dsh/plugin-tool-bash`)**：
   - 面向 LLM 的 Bash 工具；
   - 声明依赖 `ctx.inject(['executor'])`，内部仅调用 `ctx.executor.exec(command)`，不关心底层到底运行在哪里。

---

## 2. 核心源码拆解

### ① 契约定义：`packages/seams/executor/src/index.ts`
```ts
import { Context, Service } from '@deepseek-ai/cordis'

export interface ExecResult {
  stdout: string
  stderr: string
  exitCode: number
  durationMs: number
  environment: 'local' | 'remote-sandbox'
}

export abstract class ExecutorService extends Service {
  public abstract exec(command: string): Promise<ExecResult>
}
```

### ② 消费者工具：`packages/plugins/tool-bash/src/index.ts`
```ts
export class ToolBashService extends Service {
  static inject = ['executor'] // ◄── 声明注入 executor 契约

  public async execute(command: string) {
    // 零条件分支，直接调用绑定的 executor
    return await this.ctx.executor.exec(command)
  }
}
```

---

## 3. 一秒切换执行世界（Profile 驱动）

通过切换不同的 Profile 配置文件，可以在不改动一行工具代码的前提下，瞬间切换执行环境：

### 本地执行世界：`profiles/local.yml`
```yaml
- name: '@mini-dsh/provider-executor-local'
- name: '@mini-dsh/plugin-tool-bash'
- name: '@mini-dsh/plugin-task-runner'
```
运行：`pnpm start:local` $\implies$ 在本机执行 `node -v`。

### 安全沙箱执行世界：`profiles/sandbox.yml`
```yaml
- name: '@mini-dsh/provider-executor-sandbox'
- name: '@mini-dsh/plugin-tool-bash'
- name: '@mini-dsh/plugin-task-runner'
```
运行：`pnpm start:sandbox` $\implies$ 自动隔离在云端沙箱中执行。

---

## 4. 对标 DeepSeek Harness 官方实现

| 架构角色 | Mini-DSH 极简实现 | DeepSeek Harness 官方模块 | 说明 |
|---|---|---|---|
| **Service Definition** | `@mini-dsh/seam-executor` | [`packages/shell/shell`](file:///d:/gh-ws/deepseek-harness/packages/shell/shell/README.md) (`ctx.shell`) | 抽象 Shell 执行服务契约 |
| **Local Provider** | `@mini-dsh/provider-executor-local` | [`packages/shell/bash-local`](file:///d:/gh-ws/deepseek-harness/packages/shell/bash-local/README.md) | 本地子进程执行 |
| **Sandbox Provider** | `@mini-dsh/provider-executor-sandbox` | [`packages/e2b/e2b`](file:///d:/gh-ws/deepseek-harness/packages/e2b/e2b/README.md) + `landlock` | E2B 云沙箱与 Linux Landlock 限制沙箱 |
| **Consumer** | `@mini-dsh/plugin-tool-bash` | [`packages/shell/tool-bash`](file:///d:/gh-ws/deepseek-harness/packages/shell/tool-bash/README.md) | 面向大模型的 Bash 交互工具 |
