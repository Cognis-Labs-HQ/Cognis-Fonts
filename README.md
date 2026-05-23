# Cognis-Fonts-Module

Dedicated Cognis extension module that:
- injects a Settings section that recreates the Appearance → Font controls (font family, size, preview, reset)
- dynamically detects available fonts from the host app context (`document.fonts`) for the picker

## Structure

- `manifest.json` — module manifest
- `package.json` — module package metadata
- `routes.json` — module route declarations
- `api/index.js` — `registerUi(ctx)` settings-section + static-dir registration
- `ui/settings-font-section.js` — dynamic settings section factory (`createSettingsSection`)
- `ui/index.html` — simple module page

## References

- Main app: https://github.com/Cognis-Labs-HQ/Cognis/tree/development/src
- Module baseline: https://github.com/Cognis-Labs-HQ/Cognis-Module-Template
