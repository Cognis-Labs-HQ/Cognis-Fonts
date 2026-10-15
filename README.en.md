# Fonts module

The Fonts module contributes application font selection, size, preview and reset controls to Cognis Settings through host preferences.

## Usage

Enable the module and open its Fonts settings section. Choose an available font and a size from 8 to 24 points, preview it, then save or discard through the host changes bar.

## Technical specification

### Settings and preferences

The settings contribution uses the host sub-composer contract. `fonts:preferences` delegates load and save to `ui:reuse` → `ui-preferences.js` through owned `fonts:loadPreferences` and `fonts:savePreferences` flows. Saving merges account preferences and applies them through the host. No account API calls, storage keys or shell styling are duplicated.

### Contributor layout and host ownership

Start new modules from [cognis-module-template](https://github.com/Cognis-Labs-HQ/cognis-module-template); this repository follows its pinned contributor guidance in `AGENTS.md`. `bootstrap.js` owns lifecycle orchestration, `api/index.js` wires ctx-derived dependencies, `api/routes/<domain>/index.js` owns HTTP handlers, and reusable server code belongs in `api/reuse/`. Browser features stay under `ui/`, styles under `ui/styles/`, reusable markup under `ui/templates/`, and localized documentation under `docs/index.<locale>.md`. Historical release entries live in `docs/changelog/` and are excluded from package hashes. Optional concerns are omitted when unsupported.

Consume public ctx capabilities and declared flows; do not import Cognis internals or sibling modules. Dashboard capability/navbar providers export `mountProvider(scopedUiCtx)` and return cleanup for owned resources. Imports must not register module behavior. The host disposes scoped capabilities, flow hooks, listeners and provider state when disabled, then mounts cached providers again when re-enabled. Settings/admin factories and authentication-footer descriptor providers follow their own documented host contracts. Test these contracts with standalone fakes, run the executable layout guard, regenerate hashes after the final packaged edit, and run lint, tests and manifest validation before publishing.
