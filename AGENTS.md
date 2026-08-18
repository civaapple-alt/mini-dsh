# AGENTS.md — Mini-DSH Guidelines & Repository Standards

Mini-DSH is an educational, minimalist reference implementation of the DeepSeek Harness (DSH) architecture powered by **Cordis** (`@deepseek-ai/cordis`). It showcases **"Everything is a plugin"**, fullstack dual-end execution (Node.js Host + Browser Web GUI), Capability Seams, per-session Presets with scope isolation, Include & Patch configuration overlays, and live HMR.

---

## 1. Repository Layout

```text
apps/
  cli/             Host CLI entry runner (drives Cordis Loader, Include & Patch, Schemastery)
presets/           【Session-level Presets】Per-chat persona and restricted tool catalogs (minimal, standard)
profiles/          【Deployment-level Profiles】Process infrastructure composition (web, base, local, sandbox, goal, hmr)
packages/
  seams/           【Capability Seams】Abstract service definitions (@mini-dsh/seam-executor)
  providers/       【Service Providers】Execution environments (executor-local, executor-sandbox)
  host/            【Host Services】Infrastructure plugins (webserver, client-modules, session-manager, hmr)
  client/          【Client Micro-Kernel】Browser Web GUI engine (slots, shell)
  plugins/         【Feature Plugins】Fullstack & consumer plugins (greeter, counter, tool-bash, goal, tool-goal, task-runner, hmr-demo, presets-demo)
docs/              【Tier 2 Concept & Lifecycle Guides】Specialized architecture tutorials and reference guides
.agents/
  notes/           【Tier 3 ADRs】Architectural decision records (implemented/architecture/)
```

---

## 2. Essential Commands

```sh
pnpm install            # Install workspace dependencies (pnpm 11+ monorepo)
pnpm run build          # Build all TypeScript modules and browser bundles (esbuild + tsc)
pnpm start              # Start Web GUI profile on http://localhost:3000
pnpm run start:base     # Start Headless base task runner profile
pnpm run start:task "T" # Start Headless task runner with custom task string
pnpm run start:local    # Run Local execution world (LocalExecutor + ToolBash)
pnpm run start:sandbox  # Run Secure Cloud Sandbox execution world (SandboxExecutor + ToolBash)
pnpm run start:presets  # Run Multi-session scope isolation experiment (minimal vs standard)
pnpm run start:goal     # Run Include & Patch overlay profile (base.yml + Goal domain)
pnpm run start:hmr      # Run Schemastery validation & live HMR hot-reload simulation
pnpm run watch:greeter  # Watch & live-recompile Greeter client bundle for instant Web HMR
```

---

## 3. Progressive Documentation Hierarchy (One Home Per Fact)

Documentation in Mini-DSH follows strict **Progressive Disclosure (渐进式披露)**:

| Tier | Home | Scope & Purpose |
|---|---|---|
| **Tier 1 (Root)** | [`README.md`](README.md) & [`AGENTS.md`](AGENTS.md) | High-level architectural map, operational commands, and standing development rules. |
| **Tier 2 (Guides)** | [`docs/beginner-guide.md`](docs/beginner-guide.md) | End-to-end tutorial: CLI boot $\to$ HTML injection $\to$ browser shell $\to$ slot rendering. |
| **Tier 2 (Seams)** | [`docs/capability-seams.md`](docs/capability-seams.md) | Triad Seam model (Service Definition / Provider / Consumer) & portable execution worlds. |
| **Tier 2 (Presets)**| [`docs/presets-and-profiles.md`](docs/presets-and-profiles.md) | Deployment Profile vs Session Preset hierarchy & `ctx.isolate()` multi-tenant isolation. |
| **Tier 2 (HMR)** | [`docs/schemastery-and-hmr.md`](docs/schemastery-and-hmr.md) | Declarative Schema validation (`schemastery`) & dual-end SSE live hot-reloading. |
| **Tier 3 (ADRs)** | [`.agents/notes/`](.agents/notes/README.zh.md) | Durable architectural decision records, trade-offs, and invariants. |
| **Tier 3 (Packages)**| `packages/*/*/README.md` | Concrete per-package contract, exports, and dependencies. |

---

## 4. Core Architectural Invariants

1. **Everything is a Plugin (`apply(ctx, config)`)**:
   - Every service, tool, router, and UI widget is packaged as a Cordis plugin.
   - Long-lived capabilities inherit `Service` from `@deepseek-ai/cordis` and register with `super(ctx, 'serviceName')`.
   - Extend `Context` and `Events` via TypeScript Declaration Merging.

2. **Registrations are Effects (`ctx.effect`)**:
   - All external bindings (HTTP routes, event listeners, file watchers, DOM slots) MUST be wrapped in `ctx.effect()`.
   - `ctx.effect()` must return a disposer. When a plugin is disposed (`fiber.dispose()`), all resources are cleanly unloaded (Quiescent Teardown).

3. **Capability Seam Triad (Definition $\to$ Provider $\to$ Consumer)**:
   - Upper tools (`tool-bash`) MUST only depend on abstract seams (`ctx.executor`), never directly on concrete providers (`executor-local`).
   - Swapping execution environments requires only changing the Provider in the Profile YAML.

4. **Two-Level Configuration & Multi-Session Scope Isolation**:
   - **Deployment Profiles (`profiles/*.yml`)**: Process lifecycle, mounts global singletons (`ctx.server`, `ctx.clientModules`, `ctx.sessions`).
   - **Session Presets (`presets/*.yml`)**: Chat lifecycle, loads dynamic persona & restricted tools.
   - `SessionManagerService` uses `this.ctx.isolate('counter').isolate('greeter').isolate('toolBash')` to branch private child contexts for each chat session.
   - To query services dynamically on anonymous session child contexts, use `sessionCtx.get('serviceName')` (bypasses static inject check).

5. **Declarative Schema Validation (`schemastery`)**:
   - Plugins export `export const Config: Schema<T> = Schema.object({ ... })`.
   - Cordis Loader validates raw YAML configs and automatically injects default values on startup.

6. **Fullstack Dual-End HMR (SSE + Dynamic Fiber Reload)**:
   - Host `HmrService` watches `packages/plugins/*/lib/client.js` and broadcasts reload events over `/api/hmr/events` SSE stream.
   - Browser `client-shell` unloads old plugin fiber (`oldFiber.dispose()`), re-imports bundle with cache busting, and re-applies `ctx.plugin(newMod)` with zero page refresh.

---

## 5. Development & Contribution Checklist

When adding or modifying a capability:

1. **Create Package / Seam**:
   - Place in appropriate subfolder (`packages/seams`, `packages/providers`, `packages/host`, `packages/plugins`).
   - If providing frontend UI, declare `"mini": { "client": "./lib/client.js" }` and add an `esbuild` script.
2. **Implement Service & Schema**:
   - Extend `Service` and export `export const Config = Schema.object({ ... })`.
   - Wrap disposables in `ctx.effect()`.
3. **Register in Profile or Preset**:
   - Add to `profiles/*.yml` or `presets/*.yml`.
4. **Document via Progressive Disclosure**:
   - If introducing a major architectural pattern, record an Agent Note in `.agents/notes/implemented/architecture/`.
   - If altering user/developer workflows, update the owning `docs/*.md` guide.
   - Update `CHANGELOG.md` following Keep a Changelog standard.
5. **Verify**:
   - Run `pnpm run build && pnpm start` to verify.
