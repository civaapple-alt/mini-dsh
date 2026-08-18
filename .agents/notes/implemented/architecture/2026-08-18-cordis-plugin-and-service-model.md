# Agent Note: Cordis Plugin and Service Injection Model

Status: implemented

English | [中文](2026-08-18-cordis-plugin-and-service-model.zh.md)

> Scope: Describes the unified plugin model, `Service` abstraction, dependency injection (`ctx.inject`), and effect lifecycle management (`ctx.effect`) in mini-dsh based on `@deepseek-ai/cordis`.

---

## 1. Context & Problem

Traditional modular systems often face several pain points:
1. **Hardcoded Dependencies & Initialization Ordering Hell**: Module A must start strictly after Module B, leading to fragile, manually managed startup scripts.
2. **Lack of Lifecycle Isolation & Teardown Mechanics**: Plugins that bind HTTP routes, timers, or event listeners often fail to release resources cleanly on reload or teardown, causing memory leaks and port collisions.
3. **Scope Bleed**: Any module can reach out to undeclared global objects without clear boundary checks.

In `mini-dsh`, we uphold the principle **"Everything is a plugin"**, requiring all capabilities and features to be encapsulated as autonomous Cordis plugins.

---

## 2. Architectural Decisions

### (1) Unified Plugin Interface & Service Provision (`Service`)
- Plugins are exposed via `apply(ctx: Context, config?: Config)` or class definitions.
- Long-lived capabilities extend `Service` (e.g. `WebServerService`, `SlotRegistryService`, `GreeterService`, `CounterService`), invoking `super(ctx, name)` in constructors.
- TypeScript Declaration Merging is used to extend `Context` and `Events` interfaces, providing full static type safety:
  ```ts
  declare module '@deepseek-ai/cordis' {
    interface Context {
      server: WebServerService
    }
  }
  ```

### (2) Dependency Injection & Topological Waiting (`ctx.inject`)
- Plugins **never directly import runtime instances** from other plugins. Instead, they declare service dependencies:
  ```ts
  // The callback executes only when both 'server' and 'greeter' services are ready
  ctx.inject(['server', 'greeter'], (ctx) => {
    ctx.effect(() => {
      const unRoute = ctx.server.route('/api/greet', handler)
      return () => unRoute()
    })
  })
  ```
- **Context Security Boundary**: Cordis strictly enforces that accessing `ctx.serviceName` requires that service to be explicitly declared in the injection list; otherwise, an error (`cannot get property without inject`) is thrown.

### (3) Effect and Lifecycle Teardown (`ctx.effect`)
- External registrations (HTTP routes, event listeners, DOM elements) are wrapped inside `ctx.effect()`.
- `ctx.effect()` returns a disposer function; when a plugin or the parent context is disposed (`ctx.fiber.dispose()`), Cordis cascades through all disposers to guarantee clean cleanup.

---

## 3. Consequences & Guarantees

1. **Order-Independent Loading**: Whether `host-webserver` loads before or after `plugin-greeter`, Cordis automatically triggers activations as services become available.
2. **Environment Adaptability (Headless Compatibility)**: If a profile lacks `host-webserver`, route registration blocks sleep safely while pure compute services (`ctx.greeter.greet()`) remain functional.
3. **Graceful Shutdown**: Upon receiving `SIGINT`, invoking `await ctx.fiber.dispose()` shuts down the HTTP server and unbinds all routes in one step.
