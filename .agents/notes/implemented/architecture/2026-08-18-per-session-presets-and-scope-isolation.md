# Per-Session Presets and Multi-Tenant Scope Isolation

## Context
A single deployment process (Web server / Gateway) needs to host multiple concurrent chat sessions, where different sessions require different personas (e.g. concise engineer vs full architect) and restricted tool catalogs (e.g. minimal bash vs standard full tools) without cross-session pollution.

## Decision
Introduce a two-level configuration structure:
1. **Deployment-level Profiles (`profiles/*.yml`)**: Process lifetime, loaded once on boot to mount singletons (`ctx.server`, `ctx.clientModules`, `ctx.sessions`).
2. **Session-level Presets (`presets/*.yml`)**: Session lifetime, loaded dynamically per session creation.
3. **Cordis Scope Isolation**: `SessionManagerService` uses `this.ctx.isolate('counter').isolate('greeter').isolate('toolBash')` to branch a private child context for each session.

## Consequences
- Multi-tenant tool isolation: Session A (`minimal`) cannot see or invoke tools mounted in Session B (`standard`).
- Zero-downtime extensibility: Adding a new mode only requires dropping a new YAML into `presets/`.
