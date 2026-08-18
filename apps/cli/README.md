# @mini-dsh/cli — Host 命令行启动器

[English](README.md) | 中文

`@mini-dsh/cli` 是 Mini-DSH 的 Node.js 宿主启动程序。

---

## 核心职责

1. **命令行参数解析**：解析 `--profile <name>`（默认为 `web`）；
2. **Profile YAML 配置加载**：读取并解析 `profiles/<name>.yml`；
3. **Cordis 容器初始化**：创建根 `Context`，过滤 `disabled: true` 的条目，将所有启用的插件模块通过 `await ctx.plugin(mod, config)` 装配进容器；
4. **生命周期优雅停机**：监听 `SIGINT` / `SIGTERM` 信号，调用 `await ctx.fiber.dispose()` 优雅释放所有插件资源。

---

## 对应 DeepSeek Harness (`dsh`) 模块

| 特性 | `mini-dsh` 实现 | `deepseek-harness` 对应模块 |
|---|---|---|
| **应用启动器** | `apps/cli/src/index.ts` | [`apps/cli/`](file:///d:/gh-ws/dsh-ws/deepseek-harness/apps/cli/README.md) |
| **Profile 引导与 Patch** | 直接读取 `profiles/*.yml` | [`packages/boot/app-boot/`](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/boot/app-boot/README.md) |
| **Loader 插件治理** | 动态 `import()` + `ctx.plugin()` | `@deepseek-ai/cordis-plugin-loader` + `cordis:include` |

---

## 运行命令

```bash
# 启动 Web GUI 模式 (默认)
tsx src/index.ts --profile web

# 启动 Headless 纯后端模式
tsx src/index.ts --profile base
```
