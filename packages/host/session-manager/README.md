# @mini-dsh/host-session-manager (Host Service)

会话管理服务插件，负责按 **Preset（预设）** 创建和管理隔离的会话级 Cordis 子上下文。

## 作用
- 注册 `ctx.sessions` 服务。
- 提供 `createSession(id, presetName)`：派生 `ctx.extend()` 子上下文并按 Preset YAML 隔离加载工具。
- 提供 `/api/presets`、`/api/sessions`、`/api/sessions/create` REST 接口。
- 对标 DeepSeek Harness 的 `packages/preset/agent-presets` 与 `packages/core/session`。
