# apps/ — Mini-DSH 应用入口

[English](README.md) | 中文

`apps/` 目录下存放面向终端用户或可执行的完整应用入口。

---

## 包含模块与 DSH 对应关系

| 模块 | 职责说明 | 对应 DeepSeek Harness (`dsh`) 模块 |
|---|---|---|
| [**`cli/`**](cli/README.md) | 命令行启动器，负责解析 `--profile` 并引导 Cordis Loader | [`apps/cli/`](file:///d:/gh-ws/dsh-ws/deepseek-harness/apps/cli/README.md) |

---

## 架构职责
- 应用层不包含底层业务逻辑，它只负责**装配**与**环境启动**。
- 通过 Profile YAML 配置文件（如 `profiles/web.yml`、`profiles/base.yml`）将 `packages/*` 中的插件组装成完整可运行的系统。
