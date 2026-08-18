# Agent Note: 配置驱动的 Profile 机制

Status: implemented

[English](2026-08-18-configuration-profiles-and-bundles.md) | 中文

> 范围：描述 mini-dsh 如何利用 YAML 配置文件（Profile）实现无代码修改的运行模式切换与插件开关治理。

---

## 1. 背景与问题 (Context & Problem)

同一个代码库常常需要面向多种不同的使用场景：
- **开发与调试**：希望启动完整的 Web GUI 界面与所有演示插件；
- **自动化测试 / 纯命令行**：只需要加载纯后端服务（Headless），无需启动 Web 服务器或渲染 UI。

如果将插件加载逻辑硬编码在主入口代码中，切换场景就必须编写大量的 `if/else` 条件分支，使得系统逐渐臃肿脆弱。

---

## 2. 核心架构决策 (Architecture Decision)

### (1) 声明式 Profile 配置格式
- 在 `profiles/*.yml` 中使用统一的 YAML 列表定义启用的插件名及其配置：
  ```yaml
  # profiles/web.yml
  - name: '@mini-dsh/host-webserver'
    config:
      port: 3000

  - name: '@mini-dsh/host-client-modules'

  - name: '@mini-dsh/plugin-greeter'
    config:
      greetingPrefix: "Cordis Mini-DSH Web"

  - name: '@mini-dsh/plugin-counter'
    disabled: false
  ```

### (2) CLI 启动器驱动 (`apps/cli`)
- CLI 接收 `--profile <name>` 参数（默认为 `web`），解析对应的 `profiles/<name>.yml`。
- 遍历 YAML 列表，过滤 `disabled: true` 的插件，将每个插件模块动态加载并应用到 Cordis Context 中：
  ```ts
  const pluginMod = await resolvePlugin(entry.name)
  await ctx.plugin(pluginMod, entry.config)
  ```

---

## 3. 架构收益与保证 (Consequences & Guarantees)

1. **环境与运行模式一键切换**：
   - 运行 `pnpm run start:base` → 加载 `profiles/base.yml`（仅后端，秒级启动，零网络开销）；
   - 运行 `pnpm start` → 加载 `profiles/web.yml`（全栈 Web GUI 模式）。
2. **零代码修改的插件开关（Feature Toggling）**：
   - 想要关闭 `plugin-counter` 时，只需在 YAML 中配置 `disabled: true`。
   - 后端路由不会被挂载，前端 `client-modules` 不会扫描该 Bundle，网页上的 UI 控件完全消失，实现真正的前后端连带零侵入开关。
