# Agent Note: Declarative UI Slot System

Status: implemented

English | [中文](2026-08-18-declarative-ui-slot-system.zh.md)

> Scope: Describes the browser-side `ctx.slots` service abstraction in mini-dsh and how plugins contribute decoupled UI components into named slots.

---

## 1. Context & Problem

In extensible frontend architectures, independent plugins often need to contribute UI elements to shared screen areas (e.g. sidebar widgets, main cards). Typical antipatterns include:
1. **Unconstrained Direct DOM Mutations**: Multiple plugins querying raw element IDs and overwriting innerHTML, leading to race conditions and collisions;
2. **Centralized Switch/Case Registries**: Requiring the core shell to maintain a static whitelist of components, defeating plugin autonomy.

---

## 2. Architectural Decisions

### (1) `SlotRegistryService` Core Abstraction
- `packages/client/slots` provides the `slots` Cordis service (`ctx.slots`).
- Key methods:
  - `ctx.slots.register(slotName: string, renderer: SlotRenderer): () => void`
  - `ctx.slots.renderSlot(slotName: string, container: HTMLElement): () => void`
  - Event `slot/updated` triggered on register/unregister.

### (2) Declarative Contribution & Rendering
- Feature plugins inject `slots` and register their render functions:
  ```ts
  ctx.inject(['slots'], (ctx) => {
    ctx.effect(() => {
      return ctx.slots.register('main.cards', (container, ctx) => {
        container.innerHTML = `...`
        return () => { /* Cleanup listeners */ }
      })
    })
  })
  ```
- The shell layout defines mount containers (e.g. `#slot-main-cards`), and re-executes `renderSlot()` whenever slot membership updates.

---

## 3. Consequences & Guarantees

1. **Zero Inter-Plugin Coupling**: `plugin-greeter` and `plugin-counter` render alongside each other without any mutual dependencies.
2. **Automatic Lifecycle Tracking**: Registrations return disposers tied to `ctx.effect()`; unmounting a plugin cleanly removes its UI.
3. **Framework-Agnostic Interface**: `SlotRenderer` operates on standard DOM nodes, easily accommodating Vanilla JS, React, Preact, or Vue.
