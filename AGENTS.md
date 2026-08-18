# AGENTS.md — Mini-DSH Guidelines & Repository Standards

Mini-DSH is a minimalist, educational harness demonstrating the **"Everything is a plugin"** architecture powered by **Cordis** (`@deepseek-ai/cordis`). It showcases full-stack modularity, symmetrical host/client execution, and configuration-driven profiles.

---

## 1. Repository Layout

```text
apps/
  cli/             Host Node.js CLI runner (drives Cordis Loader with YAML profiles)
packages/
  host/
    webserver/     HTTP server & router service (ctx.server)
    client-modules/ Scans plugins for mini.client and serves window.__MINI_BOOT__ & bundles
  client/
    slots/         UI slot registry service (ctx.slots)
    shell/         Browser Cordis boot kernel (loads modules & orchestrates slots)
  plugins/
    greeter/       Fullstack demo plugin (ctx.greeter + GET /api/greet + main.cards card)
    counter/       Fullstack demo plugin (ctx.counter + /api/count + sidebar.widgets widget)
profiles/          Cordis YAML profile definitions (base.yml, web.yml)
.agents/
  notes/           Architecture Decision Records & notes (implemented/, proposed/, etc.)
```

---

## 2. Essential Commands

```sh
pnpm install            # Install workspace dependencies (pnpm 11+ monorepo)
pnpm run build          # Build all TypeScript files and client browser bundles (esbuild)
pnpm start              # Start Web GUI profile on http://localhost:3000
pnpm run start:base     # Start Headless base profile (backend services only)
pnpm run dev            # Build and start Web GUI profile in one command
```

---

## 3. Core Architectural Conventions

1. **Everything is a Plugin**:
   - Every system capability and business feature is packaged as a Cordis plugin exposing `apply(ctx: Context, config?: Config)`.
   - Long-lived capabilities inherit `Service` from `@deepseek-ai/cordis` and register with `super(ctx, 'serviceName')`.
   - Extend `Context` and `Events` via TypeScript Declaration Merging for end-to-end type safety.

2. **Registrations are Effects (`ctx.effect`)**:
   - All external bindings (HTTP routes, event listeners, DOM elements) MUST be wrapped in `ctx.effect()`.
   - `ctx.effect()` must return a disposer function. When a plugin unloads or `ctx.fiber.dispose()` is called, all resources are cleanly freed.

3. **Explicit Dependency Injection (`ctx.inject`)**:
   - Never import runtime singleton instances across packages.
   - Accessing another service requires `ctx.inject(['serviceName'], (ctx) => { ... })`.
   - Accessing `ctx.service` without declaring it in `inject` will trigger a runtime check failure (`cannot get property without inject`).

4. **Symmetrical Dual-End Cordis Architecture**:
   - **Host (Node.js)**: Runs Cordis Context inside `apps/cli`.
   - **Client (Browser)**: Runs an independent Cordis Context inside `packages/client/shell`.
   - **Bridge**: `packages/host/client-modules` scans `package.json` with `mini.client`, generates `window.__MINI_BOOT__`, and serves bundles at `/plugins/:id/client.js`.

5. **UI Slot Registry Discipline (`ctx.slots`)**:
   - Client plugins register UI components into named slots (e.g. `main.cards`, `sidebar.widgets`) via `ctx.slots.register(slotName, renderer)`.
   - The shell layout only defines slot containers; it has zero direct knowledge of individual feature plugins.
   - `register()` returns an unmount disposer to ensure clean unmounting.

6. **Configuration-Driven Profiles (`profiles/*.yml`)**:
   - Runtime capabilities are determined entirely by the active YAML profile (`--profile <name>`).
   - Disabling a plugin (`disabled: true`) cleanly suppresses both its backend routes and frontend UI without modifying code.

---

## 4. Creating a New Plugin Checklist

When adding a new plugin to `packages/plugins/<name>`:

1. **Package Setup**:
   - Create `package.json` with `@mini-dsh/plugin-<name>`.
   - If providing frontend UI, add `"mini": { "client": "./dist/client.js" }` and an `esbuild` build script.
2. **Host Backend (`src/index.ts`)**:
   - Export `apply(ctx, config)`.
   - If providing a service, extend `Service` and declare on `Context`.
   - If exposing HTTP endpoints, use `ctx.inject(['server', ...], ...)`.
3. **Client Frontend (`src/client.ts`)**:
   - Export `apply(ctx)`.
   - Use `ctx.inject(['slots'], (ctx) => { ctx.slots.register('slot.name', ...) })`.
4. **Profile Declaration**:
   - Add the plugin entry to `profiles/web.yml` or `profiles/base.yml`.
5. **Build & Run**:
   - Run `pnpm run build` and launch `pnpm start` to test.

---

## 5. Agent Notes Policy

- Significant architectural decisions, structural changes, or invariant guarantees MUST be documented in `.agents/notes/implemented/architecture/YYYY-MM-DD-title.md` (and `.zh.md`).
- Active notes must follow the standard triplet structure: Context & Problem, Architectural Decisions, and Consequences & Guarantees.
