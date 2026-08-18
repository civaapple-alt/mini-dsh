# @mini-dsh/plugin-task-runner

Mini-DSH 的 Headless 任务运行器插件。用于在纯终端/无头模式下编排执行多步骤自动化任务，对标真实 DeepSeek Harness 的 `dsh-headless` 运行器与任务驱动模型。

## 特性
- 注册 `ctx.taskRunner` 服务。
- 响应式依赖注入：消费并编排 `ctx.greeter` 与 `ctx.counter`。
- 事件分发：发出 `task/start`、`task/step`、`task/complete` 事件。
- 支持 `autoRun`（自动启动）和 `exitOnComplete`（运行完自动退出，适合 CI 场景）。
