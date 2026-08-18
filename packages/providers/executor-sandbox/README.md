# @mini-dsh/provider-executor-sandbox (Service Provider)

远程沙箱命令执行提供方，模拟安全隔离的云端微容器（E2B / Docker / Landlock）。

## 作用
- 实现 `@mini-dsh/seam-executor` 的 `ExecutorService` 抽象类。
- 对标 DeepSeek Harness 的 `packages/e2b/*` 与 `packages/shell/bash-sandbox`。
