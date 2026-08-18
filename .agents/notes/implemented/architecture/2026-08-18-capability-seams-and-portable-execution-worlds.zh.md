# 能力接缝（Capability Seams）与可移植执行世界

## 背景
在 Agent 系统中，智能体需要在多种环境下运行（本地开发机、云端 E2B/Docker/Landlock 隔离沙箱、远程 Worker），上层工具不应编写复杂的 `if-else` 环境分支，更不应耦合具体执行平台。

## 决策
采用标准化的 **Capability Seam** 三元角色架构：
1. **服务契约（Service Definition，`@mini-dsh/seam-executor`）**：定义 `ExecutorService` 抽象契约与 `ExecResult` 接口规范，绑定上下文键 `ctx.executor`。
2. **能力提供方（Service Providers）**：
   - `@mini-dsh/provider-executor-local`：基于 Node.js 原生子进程的本地执行器。
   - `@mini-dsh/provider-executor-sandbox`：模拟云端隔离沙箱容器的安全执行器。
3. **消费者（Consumer，`@mini-dsh/plugin-tool-bash`）**：面向大模型的 Bash 工具，仅依赖 `ctx.executor` 契约。

## 效果与收益
- 上层工具（`tool-bash`）与任务调度器（`task-runner`）与底层执行环境完全解耦，代码 0 修改。
- 切换执行世界仅需在 Profile YAML 中更改 Provider 名称（`profiles/local.yml` vs `profiles/sandbox.yml`）。
