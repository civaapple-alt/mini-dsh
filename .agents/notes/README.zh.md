# Agent Notes — mini-dsh 架构与决策记录

[English](README.md) | 中文

这里记录 **mini-dsh** 极简架构的核心设计决策与实现细节。Agent Note 记录影响本项目的关键架构选择、底层 Cordis 机制应用以及“为什么这么做 / 放弃了什么替代方案”。

---

## 目录结构

```text
.agents/notes/
├── README.md               # 英文说明
├── README.zh.md            # 中文说明
├── proposed/               # 待讨论与验证的提案
├── implemented/            # 已落地交付的决策记录
│   ├── architecture/       # 系统架构与模块设计决策
│   └── process/            # 工作流、构建与规范决策
├── rejected/               # 被否决的提案与原因记录
└── archived/               # 历史封存记录
```

---

## 已落地的核心架构决策列表

| 日期 | 决策记录 | 核心内容 |
|---|---|---|
| `2026-08-18` | [Cordis 插件与服务注入模型](implemented/architecture/2026-08-18-cordis-plugin-and-service-model.zh.md) | 统一插件接口、`Service` 抽象、`ctx.inject` 拓扑等待、`ctx.effect` 生命周期清理 |
| `2026-08-18` | [Host/Client 对称插件与引导机制](implemented/architecture/2026-08-18-host-client-symmetric-architecture.zh.md) | 双端 Cordis 容器、`mini.client` 清单扫描、`window.__MINI_BOOT__` 注入与动态 Bundle 加载 |
| `2026-08-18` | [声明式 UI 插槽系统 (Slot Registry)](implemented/architecture/2026-08-18-declarative-ui-slot-system.zh.md) | `ctx.slots` 抽象、组件解耦、多插件共享渲染区、事件驱动的响应式更新 |
| `2026-08-18` | [配置驱动的 Profile 机制](implemented/architecture/2026-08-18-configuration-profiles-and-bundles.zh.md) | YAML 配置映射、Headless/Web 模式自由切换、零侵入插件开关 |
| `2026-08-18` | [端到端启动与清单生命周期全解](implemented/architecture/2026-08-18-end-to-end-boot-and-manifest-lifecycle.zh.md) | CLI 引导、Host 注册、`window.__MINI_BOOT__` 注入与浏览器 Shell 动态加载全时序与排错 |
