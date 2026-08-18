# Agent Note: End-to-End Boot & Manifest Lifecycle

Status: implemented

English | [中文](2026-08-18-end-to-end-boot-and-manifest-lifecycle.zh.md)

> Scope: Documents the complete end-to-end lifecycle from CLI boot, Host service orchestration, `window.__MINI_BOOT__` generation/injection, browser shell initialization, UI slot mounting, as well as **plugin deactivation (`disabled: true`), restart reloading, and lifecycle teardown**.

---

## 1. Context & Problem

In full-stack microkernel architectures, newcomers often face questions regarding:
1. **Boot Order & Boundaries**: How do CLI, Host WebServer, and the browser Cordis container sequence their startup?
2. **Host-to-Client State Delivery**: How does the browser discover which plugins are active on the backend?
3. **Plugin Deactivation & Residue Prevention**: Why did a disabled plugin previously trigger orphaned client requests showing `Err`?
4. **Reloading Mechanics**: How does changing configuration in Profile achieve coordinated, clean teardown across both Host and Client?

---

## 2. Architectural Decisions

### (1) 6-Stage End-to-End Lifecycle
1. **CLI Boot**: `apps/cli` reads `profiles/web.yml` and instantiates the root Context;
2. **Host Infrastructure Ready**: `host-webserver` binds HTTP listeners, and `host-client-modules` provides registration facilities;
3. **Autonomous Plugin Registration**: Fullstack plugins use `ctx.inject(['clientModules'])` to register their `lib/client.js` bundle path;
4. **HTML Manifest Injection**: When the browser requests `GET /`, the Host injects the active module graph as `<script>window.__MINI_BOOT__ = ...</script>`;
5. **Browser Shell Boot**: The browser loads `/lib/client-shell.js`, instantiates a browser-side Cordis `Context`, and applies `ctx.slots`;
6. **Dynamic Import & Slot Mounting**: The shell iterates `window.__MINI_BOOT__.modules`, calls native `await import('/plugins/:id/client.js')`, executes `apply(ctx)`, and renders UI components into named slots.

### (2) Plugin Deactivation Mechanism (Profile-Driven)
- **Configuration**: Setting `disabled: true` under a plugin in `profiles/web.yml` (or removing the entry);
- **Coordinated Teardown**:
  1. `apps/cli` skips `ctx.plugin(mod)` for the disabled entry;
  2. Backend HTTP routes are not registered (calls return 404);
  3. The plugin does not register with `clientModules`;
  4. Generated `window.__MINI_BOOT__` excludes the plugin;
  5. The browser never issues requests for that plugin's bundle, and slot containers remain clean with zero errors.

### (3) Reactive Registration vs. Static Directory Scanning
- **Rejected Alternative**: Statically scanning `packages/plugins` on disk. This led to disabled plugins remaining in the boot graph, causing orphaned frontend requests.
- **Implemented Decision**: Dynamic registration via `ctx.clientModules.register()` only when the plugin's backend `apply(ctx)` actually runs. Disabling a plugin suppresses both backend routes and frontend bundles cleanly.

---

## 3. Consequences & Guarantees

1. **Complete Decoupling**: The browser shell artifact knows nothing about specific feature plugins at build time.
2. **Zero-Code Feature Toggling**: Enabling/disabling features requires only editing YAML configuration and restarting the application.
3. **Exact DSH Alignment**: Matches the core patterns of `deepseek-harness` (`window.__DSH_BOOT__`, `AppWebEntry`, `ui-slots`).
