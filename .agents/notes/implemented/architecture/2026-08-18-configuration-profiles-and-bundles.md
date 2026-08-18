# Agent Note: Configuration-Driven Profiles and Bundles

Status: implemented

English | [中文](2026-08-18-configuration-profiles-and-bundles.zh.md)

> Scope: Describes how mini-dsh leverages YAML profile configuration to switch execution modes and manage plugin feature toggles without modifying source code.

---

## 1. Context & Problem

A single codebase often needs to serve divergent runtime scenarios:
- **Interactive Web GUI**: Boots the HTTP server, asset handlers, and full-stack UI plugins.
- **Headless / CLI Mode**: Requires only core backend services without spinning up network listeners or frontend machinery.

Hardcoding plugin composition in application code introduces fragile branching (`if (mode === 'headless') ...`) that accumulates maintenance burden.

---

## 2. Architectural Decisions

### (1) Declarative Profile YAML Format
- Profiles in `profiles/*.yml` declare a clean list of plugins with optional config and disabled flags:
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

### (2) Profile-Driven CLI Loader (`apps/cli`)
- The CLI accepts `--profile <name>` (defaulting to `web`) and loads `profiles/<name>.yml`.
- It iterates entries, skips disabled ones, dynamically resolves each package, and applies it to the root Cordis Context:
  ```ts
  const pluginMod = await resolvePlugin(entry.name)
  await ctx.plugin(pluginMod, entry.config)
  ```

---

## 3. Consequences & Guarantees

1. **One-Command Mode Switching**:
   - `pnpm run start:base` → Loads `profiles/base.yml` (Headless mode).
   - `pnpm start` → Loads `profiles/web.yml` (Full-stack Web GUI mode).
2. **Zero-Touch Feature Toggling**:
   - Marking `disabled: true` for `plugin-counter` prevents route registration and omits its client bundle from `window.__MINI_BOOT__`, instantly removing its UI without touching application code.
