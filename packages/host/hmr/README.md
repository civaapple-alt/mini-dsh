# @mini-dsh/host-hmr

热模块替换（HMR）与配置文件监听服务插件。

## 作用
- 注册 `ctx.hmr` 服务。
- 使用 `chokidar` 监听配置与插件变更。
- 使用 `Schemastery` 校验配置。
- 配合 Cordis `ctx.effect()` 实现零残留热重载。
- 对标 DeepSeek Harness 的 `vendor/hmr` (`@deepseek-ai/cordis-plugin-hmr`)。
