# Cognis-Fonts-Module

Dedicated Cognis extension module that:
- supplies packaged font files from module static assets
- injects a Settings section that recreates the Appearance → Font controls (font family, size, preview, reset)

## Structure

- `manifest.json` — module manifest
- `package.json` — module package metadata
- `routes.json` — module route declarations
- `api/index.js` — `registerUi(ctx)` settings-section + static-dir registration
- `ui/settings-font-section.js` — dynamic settings section factory (`createSettingsSection`)
- `ui/font-faces.css` + `ui/fonts/*.ttf` — bundled fonts served from `/static/modules/fonts/...`
- `ui/index.html` — simple module page
