# 会话级预设（Presets）与多租户作用域隔离

## 背景
同一个后端服务进程需要并发服务多个用户的会话。不同会话对 Agent 的人设（Persona）和可用工具集有不同诉求（如极简高频模式 vs 标准全功能模式），多会话间的工具与状态绝不能发生串扰。

## 决策
构建双层配置与隔离体系：
1. **部署级 Profile（`profiles/*.yml`）**：进程生命周期，启动时加载一次，组装全局单例基础设施（HTTP 服务、模块扫描器、会话管理器等）。
2. **会话级 Preset（`presets/*.yml`）**：会话生命周期，用户在每次创建 Chat 时动态指定（如 `minimal` 或 `standard`）。
3. **Cordis 作用域隔离**：`SessionManagerService` 利用 `this.ctx.isolate('counter').isolate('greeter').isolate('toolBash')` 派生独立的子 Context，将 Preset 声明的工具严格限定在当前 Session 内部。

## 效果与收益
- 同进程多会话严格隔离：Session A (`minimal`) 仅拥有 `tool-bash`，无法访问 `counter`，节省 Token 并提升安全性；Session B (`standard`) 拥有全套工具。
- 零代码添加新模式：在 `presets/` 目录下新增一个 YAML，Web 界面自动发现并上线。
