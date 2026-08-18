# @mini-dsh/provider-executor-local (Service Provider)

本地命令执行提供方，通过 Node.js 子进程直接在宿主机执行命令。

## 作用
- 实现 `@mini-dsh/seam-executor` 的 `ExecutorService` 抽象类。
- 对标 DeepSeek Harness 的 `packages/shell/bash-local`。
