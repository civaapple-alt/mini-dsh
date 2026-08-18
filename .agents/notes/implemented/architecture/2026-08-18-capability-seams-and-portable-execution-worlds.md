# Capability Seams and Portable Execution Worlds

## Context
In AI Agent systems, agents must run in varied environments (local developer machines, isolated cloud sandbox containers like E2B/Docker/Landlock, or remote workers) without requiring application-level branching or rewritten tools.

## Decision
Adopt the **Capability Seam** triad architecture:
1. **Service Definition (`@mini-dsh/seam-executor`)**: Declares the abstract `ExecutorService` contract (`exec(cmd): Promise<ExecResult>`) and binds context key `ctx.executor`.
2. **Service Providers**:
   - `@mini-dsh/provider-executor-local`: Host child process executor.
   - `@mini-dsh/provider-executor-sandbox`: Isolated remote container sandbox executor.
3. **Consumer (`@mini-dsh/plugin-tool-bash`)**: Model-facing tool depending solely on `ctx.executor`.

## Consequences
- Upstream tools and workflow runners require 0 modifications when switching environments.
- Swapping the execution world is achieved by replacing one line in the Profile YAML (`profiles/local.yml` vs `profiles/sandbox.yml`).
