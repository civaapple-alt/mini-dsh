# Include and Patch Configuration Overlays

## Context
Deployments and replay benchmarks often need to specialize a base profile (e.g. headless agent) with additional domain services (like Goal tracking or sandbox adapters) without duplicating large base YAML files.

## Decision
Implement a recursive Include & Patch resolver:
1. When `@mini-dsh/plugin-include` is encountered in a profile, the loader loads the base file referenced in `config.path`.
2. Applies declarative patches: `insert` (appends plugins), `delete` (removes plugins), `update` (modifies plugin configs).
3. Produces a synthesized flat plugin list for the Cordis container.

## Consequences
- Follows the DRY principle: `profiles/goal.yml` needs only 10 lines of YAML on top of `base.yml`.
- Replicates DeepSeek Harness's `examples/headless-agent/goal.cordis.yml` composition model.
