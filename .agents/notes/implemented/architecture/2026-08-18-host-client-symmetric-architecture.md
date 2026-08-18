# Agent Note: Host/Client Symmetric Plugin and Boot Architecture

Status: implemented

English | [中文](2026-08-18-host-client-symmetric-architecture.zh.md)

> Scope: Describes how mini-dsh runs symmetrical Cordis containers across Host (Node.js) and Client (Browser), coordinating full-stack plugins via dynamic manifest scanning and bundle distribution.

---

## 1. Context & Problem

In traditional web applications, frontend code is compiled into a single monolith bundle at build time. Adding or removing a plugin typically requires:
1. Editing root shell entries or central route definitions;
2. Re-triggering a full application bundle build.

This breaks the essence of true modularity—**plugins should be autonomous, self-describing, and capable of being added/removed without modifying core shell code**.

---

## 2. Architectural Decisions

### (1) Dual-End Cordis Containers
- **Host (Node.js)**: Runs Cordis Context inside `apps/cli`, loading infrastructure servers and backend service plugins.
- **Client (Browser)**: Runs an independent Cordis Context inside `packages/client/shell`, managing dynamic module imports and UI slot orchestration.

### (2) `mini.client` Manifest & Dynamic Scanning
- Full-stack plugins declare their client entry in `package.json`:
  ```json
  {
    "name": "@mini-dsh/plugin-greeter",
    "mini": {
      "client": "./dist/client.js"
    }
  }
  ```
- `packages/host/client-modules` automatically scans workspace packages at startup and composes the `WebBootGraph`:
  ```json
  {
    "modules": [
      { "id": "@mini-dsh/plugin-greeter", "url": "/plugins/@mini-dsh/plugin-greeter/client.js" }
    ]
  }
  ```

### (3) `window.__MINI_BOOT__` Injection & Dynamic Loading
- When serving HTML, the Host injects `WebBootGraph` as `<script>` defining `window.__MINI_BOOT__`.
- The browser shell kernel executes standard native dynamic `import(mod.url)` to fetch each plugin's `client.js` bundle.
- The browser Cordis container applies each module (`await ctx.plugin(pluginModule)`), executing `apply(ctx)` in the browser environment.

---

## 3. Consequences & Guarantees

1. **Self-Contained Full-Stack Packages**: A package (e.g. `@mini-dsh/plugin-greeter`) contains both backend endpoints (`src/index.ts`) and frontend UI components (`src/client.ts`).
2. **Zero-Touch Core**: `apps/cli` and `packages/client/shell` require no hardcoded knowledge of feature plugins.
3. **Independent Artifacts**: Each plugin bundle is compiled independently into modern browser ESM (`dist/client.js`), eliminating monolithic app re-bundling.
