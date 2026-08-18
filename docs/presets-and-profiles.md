# 预设配置体系指南：部署级 Profile vs 会话级 Preset 与 Include & Patch

在 Agent 系统中，配置分为两个截然不同的生命周期与关注点：
1. **部署级（Profile）**：决定整个 Node.js 进程的基础底座（HTTP Server、数据库、LLM 提供方）；
2. **会话级（Preset）**：决定用户在某个具体的 Chat 对话中，Agent 的人设（Persona）与允许调用的工具池（Tools）。

本文档详细解析这两者的协同工作原理、Cordis 作用域隔离机制以及 `Include & Patch` 增量补丁机制。

---

## 1. 架构层次对比

```text
                               ┌─────────────────────────────────────────────────────────────┐
                               │             部署级 Profile (dsh --profile web)              │
                               │             profiles/web.yml 或 profiles/base.yml           │
                               │             挂载在 Root Context: ctx.server, ctx.executor    │
                               └──────────────────────────────┬──────────────────────────────┘
                                                              │
                                      ┌───────────────────────┴───────────────────────┐
                                      │  Root Context (全局单例基础设施，全进程共享)    │
                                      └───────────────────────┬───────────────────────┘
                                                              │
                      ┌───────────────────────────────────────┴───────────────────────────────────────┐
                      │ 动态创建会话                                                                   │ 动态创建会话
                      ▼ ctx.isolate('counter') (派生会话 A 子上下文)                                   ▼ ctx.isolate('counter') (派生会话 B 子上下文)
       ┌──────────────────────────────┐                                                ┌──────────────────────────────┐
       │  会话 A：Session 1 (极简模式) │                                                │  会话 B：Session 2 (标准模式) │
       │  加载 presets/minimal.yml    │                                                │  加载 presets/standard.yml   │
       ├──────────────────────────────┤                                                ├──────────────────────────────┤
       │ • 继承：全局 ctx.server      │                                                │ • 继承：全局 ctx.server      │
       │ • 独享：Prompt: "极简模式"   │                                                │ • 独享：Prompt: "标准模式"   │
       │ • 独享工具：仅 tool-bash     │                                                │ • 独享工具：greeter + counter│
       │                             │                                                │            + tool-bash       │
       └──────────────────────────────┘                                                └──────────────────────────────┘
```

---

## 2. 会话级 Presets 与 Cordis 作用域隔离

### 为什么需要 `ctx.isolate()`？
如果直接在根 `Context` 上加载插件，后加载的插件服务会变成全局可见，导致 Session A 意外调用到 Session B 的专属工具。

在 `packages/host/session-manager/src/index.ts` 中：
```ts
// 核心：为每个 Session 派生独立的子 Context 并隔离会话工具服务键
const sessionCtx = this.ctx.isolate('counter').isolate('greeter').isolate('toolBash')

for (const toolName of presetConfig.tools) {
  const toolMod = await import(toolName)
  await sessionCtx.plugin(toolMod) // ◄── 仅装配到该会话的隔离域内
}
```

### 验证多会话并发隔离
运行：
```bash
pnpm start:presets
```
控制台将同时创建 `chat-alice-01`（`minimal`）和 `chat-bob-02`（`standard`），并清晰对比证明：
* Session A 中的 `ctx.counter` 为 `false`（已隔离排除）；
* Session B 中的 `ctx.counter` 为 `true`（正常挂载）。

---

## 3. Include & Patch 全局增量补丁机制

### 什么是 Include & Patch？
当需要基于一个基础 Profile 启动增强版 Agent 时（例如为基础 Headless Agent 追加 Goal 目标领域），传统做法是复制一份 100+ 行的完整 YAML。

而通过 `@mini-dsh/plugin-include`，可以用 10 行声明增量覆写：

#### `profiles/goal.yml`
```yaml
- id: base
  name: '@mini-dsh/plugin-include'
  config:
    path: ./base.yml                 # ◄── 引用基础配置文件
    patches:
      - insert:                      # ◄── 增量追加新插件
          - id: goal
            name: '@mini-dsh/plugin-goal'
          - id: tool-goal
            name: '@mini-dsh/plugin-tool-goal'
```

### 支持的 Patch 操作
- **`insert`**：向列表追加新插件；
- **`delete`**：从基础列表中剔除指定名称/ID 的插件；
- **`update`**：修改已有插件的 `config` 参数或 `disabled` 状态。

---

## 4. 对标 DeepSeek Harness 官方实现

| 架构概念 | Mini-DSH 极简实现 | DeepSeek Harness 官方模块 | 说明 |
|---|---|---|---|
| **会话预设目录** | `presets/*.yml` | [`apps/cli/config/agent-presets/`](file:///d:/gh-ws/deepseek-harness/apps/cli/config/agent-presets) | 存放 `minimal`, `standard`, `code`, `cordis` 预设 |
| **会话管理服务** | `@mini-dsh/host-session-manager` | [`packages/preset/agent-presets`](file:///d:/gh-ws/deepseek-harness/packages/preset/agent-presets/README.md) (`ctx.agentPresets`) | 动态加载预设并管理 `isolate` Realm |
| **Include 插件** | `@mini-dsh/plugin-include` | [`vendor/include`](file:///d:/gh-ws/deepseek-harness/vendor/include/README.md) (`@deepseek-ai/cordis-plugin-include`) | 提供 Profile 的递归 Include 与 Patch 算法 |
| **Goal 领域状态机** | `@mini-dsh/plugin-goal` | [`packages/goal/goal`](file:///d:/gh-ws/deepseek-harness/packages/goal/goal/README.md) (`ctx.goals`) | 跟踪同会话目标生命周期与 Round 计数 |
