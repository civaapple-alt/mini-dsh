# @mini-dsh/seam-executor (Service Definition)

执行器接缝（Capability Seam）的抽象服务契约包。

## 作用
- 声明 `ctx.executor` 在 Cordis Context 中的类型定义。
- 导出 `ExecutorService` 抽象类及 `ExecResult` 标准返回格式。
- 对标 DeepSeek Harness 的 `packages/shell/shell` (`ShellExecutor`)。
