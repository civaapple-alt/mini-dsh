# client/ — 浏览器端基础包

[English](README.md) | 中文

`client/` 目录下存放运行在浏览器环境下的 Web GUI 核心底座包。

---

## 包含模块与 DSH 对应表

| 包名 | 职责 | 对应 DSH 模块 |
|---|---|---|
| [**`slots/`**](slots/README.md) | `ctx.slots` UI 插槽注册与渲染服务 | [`packages/client/ui-slots`](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/client/ui-slots/README.md) |
| [**`shell/`**](shell/README.md) | 浏览器端 Cordis 容器引导内核与动态模块拉取 | [`packages/client/web`](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/client/web/README.md) + [`packages/client/modules`](file:///d:/gh-ws/dsh-ws/deepseek-harness/packages/client/modules/README.md) (Client 半) |
