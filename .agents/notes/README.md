# Agent Notes — mini-dsh Architecture and Decision Records

English | [中文](README.zh.md)

This directory contains design decision records and architectural notes for **mini-dsh**. Agent Notes document the core architectural choices, underlying Cordis mechanisms, and the rationale behind "why we built it this way and what alternatives were rejected".

---

## Directory Structure

```text
.agents/notes/
├── README.md               # English index
├── README.zh.md            # Chinese index
├── proposed/               # Proposals under discussion
├── implemented/            # Delivered architecture & design records
│   ├── architecture/       # System architecture and module design decisions
│   └── process/            # Workflows, build tooling, and conventions
├── rejected/               # Rejected proposals with documented reasons
└── archived/               # Archived records
```

---

## Implemented Architecture Notes

| Date | Topic | Summary |
|---|---|---|
| `2026-08-18` | [Cordis Plugin and Service Injection Model](implemented/architecture/2026-08-18-cordis-plugin-and-service-model.md) | Unified plugin interface, `Service` base class, `ctx.inject` topological waiting, and `ctx.effect` lifecycle cleanup |
| `2026-08-18` | [Host/Client Symmetric Plugin and Boot Architecture](implemented/architecture/2026-08-18-host-client-symmetric-architecture.md) | Dual-end Cordis containers, `mini.client` manifest scanning, `window.__MINI_BOOT__` boot graph, and dynamic client bundle loading |
| `2026-08-18` | [Declarative UI Slot System](implemented/architecture/2026-08-18-declarative-ui-slot-system.md) | `ctx.slots` abstraction, component decoupling, shared rendering zones, and event-driven updates |
| `2026-08-18` | [Configuration-Driven Profiles and Bundles](implemented/architecture/2026-08-18-configuration-profiles-and-bundles.md) | YAML profile mapping, seamless switching between Headless and Web GUI, zero-code feature toggles |
| `2026-08-18` | [End-to-End Boot & Manifest Lifecycle](implemented/architecture/2026-08-18-end-to-end-boot-and-manifest-lifecycle.md) | Complete 6-stage lifecycle from CLI boot, `window.__MINI_BOOT__` injection to browser shell dynamic loading and troubleshooting |
| `2026-08-18` | [Capability Seams and Portable Execution Worlds](implemented/architecture/2026-08-18-capability-seams-and-portable-execution-worlds.md) | Triad seam architecture (Service Definition, Provider, Consumer) and instant local vs sandbox world switching |
| `2026-08-18` | [Per-Session Presets and Multi-Tenant Scope Isolation](implemented/architecture/2026-08-18-per-session-presets-and-scope-isolation.md) | Deployment Profile vs Session Preset two-level architecture with Cordis `ctx.isolate` multi-session isolation |
| `2026-08-18` | [Include and Patch Configuration Overlays](implemented/architecture/2026-08-18-include-and-patch-configuration-overlays.md) | Recursive Include parsing and `insert`/`delete`/`update` patch algorithms for zero-redundancy configuration extension |

