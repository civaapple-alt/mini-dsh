# @mini-dsh/plugin-tool-bash (Consumer)

面向大模型与任务系统的 Bash 命令执行工具插件。

## 作用
- 注入 `ctx.executor`（无论是 Local 还是 Sandbox Provider）。
- 注册 `ctx.toolBash` 服务。
- 对标 DeepSeek Harness 的 `packages/shell/tool-bash`。
