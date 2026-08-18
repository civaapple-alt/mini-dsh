# Include 与 Patch 增量配置补丁机制

## 背景
在部署或测试回放场景中，经常需要基于基础配置（如 Headless Agent）追加特定领域的服务或工具（如 Goal 状态机、沙箱适配器），而不应复制大量重复的 YAML 配置文件。

## 决策
在 Loader 中实现递归的 `Include & Patch` 拓扑解析引擎：
1. 当 Profile 节点为 `@mini-dsh/plugin-include` 时，加载 `config.path` 指向的基础配置；
2. 依次应用补丁数组：`insert`（追加插件）、`delete`（剔除插件）、`update`（覆写已有插件配置）；
3. 生成扁平化、拓扑就绪的插件列表交付给 Cordis 容器装配。

## 效果与收益
- 消除配置冗余：`profiles/goal.yml` 仅用 10 行 YAML 即可在 `base.yml` 基础上叠加上线 Goal 状态机与工具；
- 与 DeepSeek Harness 官方 `goal.cordis.yml` 设计完全一致。
