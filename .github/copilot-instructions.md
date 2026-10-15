# AI instructions for Cognis external modules

These instructions define the common standard for external Cognis modules. Retain this common guidance when updating a module and keep domain-specific requirements in the final appendix.

## Session startup

Run `npm install` before exploration or development. Use `rg` rather than recursive `grep` for searches. Read every applicable `AGENTS.md` and `.github/copilot-instructions.md` before editing files.

## Template origin and ownership

Every new external module MUST start from [cognis-module-template](https://github.com/Cognis-Labs-HQ/cognis-module-template), using GitHub's template creation or a fork. Do not invent a parallel skeleton. Replace template identity, namespace, publisher, repository links, artwork and examples before publishing. Generate a new UUID once for the new product; never ship the template UUID or replace an established module UUID. Remove `template: true` from derived products. Record the template revision used in contributor guidance and review later template updates rather than blindly copying product code.

Read [Cognis external-module contracts](https://github.com/Cognis-Labs-HQ/Cognis/blob/master/src/docs/modules/external.en.md) and the owning capability documentation. The template supplies the contributor skeleton; the installed host's public contracts determine runtime compatibility.

## External module contract

One repository delivers exactly one module. Keep `manifest.json`, `package.json`, `routes.json`, and `bootstrap.js` at the repository root. Preserve the module UUID permanently; IDs are readable labels, but UUIDs are lifecycle and dependency identities. Use UUIDs in `requires`. Synchronize the versions in the manifest, package, and lockfile for every code, schema, API, or contract change, retain `"type": "module"`, and keep `routes.json` as an array, including when it is empty.

Always set `ui.stringsBaseUrl` in `manifest.json` to the module-owned locale bundle base URL; this is essential so Cognis can resolve localized manifest metadata before the module UI loads. Every entrypoint, asset, screenshot, and `manifest.files` item must be a regular repository-relative file with exact filename casing and must remain inside the checkout. Declare only capabilities and routes that the module actually needs, keep protected access least-privileged, and document why each requirement exists.

After the final file change, run `npm run manifest:hashes`. The digest inventory contains only regular packaged files: exclude `manifest.json` because it cannot hash itself, `docs/changelog/` because changelogs are host-discovered release metadata, the optional root `README.md` compatibility alias because the host resolves localized README files directly, and every symbolic link, directory, socket, or other non-regular filesystem entry. Never replace those exclusions with hashes of symlink targets. Changelog SHA-256 sums must never be added to `manifest.json`. Keep publisher, repository, homepage, support, license, categories, tags, and localized README metadata accurate. Never commit generated secrets, credentials, private repository tokens, or personal data.

## Component isolation, capabilities, and flows

`bootstrap.js` is the sole host integration entrypoint and should contain orchestration rather than business logic. Treat `ctx` as the complete cross-component bus. Obtain behavior through capabilities, contribute public behavior through neutral capabilities and named flow stages, and detect optional components by capability. Use camel case inside each colon-delimited capability or flow-name segment; keep the immutable manifest ID literal as the module-owned prefix, even when it contains hyphens. Keep capability contracts use-case-neutral: callers provide feature-specific labels, icons, and action identifiers.

Never import Cognis internals, sibling components, database drivers, auth implementations, gateways, adapters, or private package implementations. Pass authentication, authorization, persistence, request, logging, and UI behavior into handlers through a `ctx`-derived context. Route handlers validate and orchestrate; the owning capability executes provider-specific work. Browser consumers use gateway-owned UI clients rather than calling another gateway's API endpoints directly.

Create meaningful orchestration as named flows with stable, ordered stage IDs. Extend a flow with removable stages instead of branching on a known component or editing its internals. A module may create a flow only when it owns that operation. Register everything through the scoped context so the host can track it. Preserve published stage IDs when updating an existing flow; apply the casing convention to new identifiers without adding aliases.

Register owned cleanup with `ctx.registerDisposer` when using host registrations that return a disposer, including health checks and keyring-data ownership. Return a disposer from `bootstrapModule` or export `teardownModule(ctx)` for resources scoped registration cannot remove. Export `uninstallModule(ctx, { deleteContent })` when the module persists content outside its checkout; preserve content unless `deleteContent` is true. When persisting account-owned data, contribute cleanup through the host deprovision flow and applicable keyring ownership contract, preserving unrelated shared content. Test install, enable-disable-enable, and uninstall paths. No route, static directory, UI contribution, capability, flow, stage, timer, listener, socket, or runtime script may survive teardown.

## Structure and reuse

Use the following concern paths, creating optional directories only when the module provides that concern:

| Path                                      | Ownership                                                                    |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| `bootstrap.js`                            | Sole server integration and lifecycle orchestration                          |
| `api/index.js`                            | API registration and ctx-derived dependency wiring                           |
| `api/routes/<domain>/index.js`            | Thin domain-specific HTTP handlers                                           |
| `api/<feature>/`                          | Feature-owned server implementation                                          |
| `api/reuse/`                              | Server abstractions consumed by multiple features                            |
| `ui/index.js` or `ui/app/<page>/index.js` | Browser mount/unmount entrypoints                                            |
| `ui/<feature>/`                           | Feature-owned browser behavior                                               |
| `ui/styles/`                              | All module CSS; shared primitives in `ui/styles/reuse/`                      |
| `ui/templates/`                           | Reusable HTML/markup templates; `ui/index.html` may be a declared page shell |
| `ui/languages/<locale>/strings.xml`       | Module translations                                                          |
| `api/tests/`, `ui/tests/`, `cli/tests/`   | Layer-owned public-contract tests                                            |
| `tests/`                                  | Cross-layer lifecycle and content-graph tests only                           |
| `cli/index.js`                            | Host operational command registration                                        |
| `docs/index.<locale>.md`                  | Integration overview; focused contracts may use descriptive names            |
| `docs/changelog/<branch>.<locale>.md`     | Host-discovered release provenance                                           |
| `data/<domain>/`                          | Provider datasets and schemas                                                |
| `assets/`                                 | Artwork, SVG icons and screenshots                                           |
| `scripts/`, `tooling/`                    | Local validation, generation and build tools                                 |

Keep route URLs stable when moving handler files. Use generic names inside a domain directory; do not retain forwarding-only old-path entrypoints. Do not place CSS beside browser scripts or HTTP handlers in a flat `*-routes.js` API root. Add executable structure checks to reject deviations and test imported entrypoints and stylesheet dependencies after relocation.

Npm scripts are local to the checkout, not installed global commands. Run `npm --prefix <module-checkout> test` or change into that checkout before `npm test`. Expose installed operational commands as `cognisctl modules:<module-id>:<action>`, register them only through `cli/index.js`, and call public API contracts. Do not invoke installed modules' npm scripts from the Cognis root.

Put genuinely reusable layer-local code in `reuse/`; do not create `shared`, `utils`, `helpers`, or `common` directories. Promote a reusable abstraction when adjacent work reveals duplicated, parameterizable behavior, but keep feature-specific code beside its feature. Avoid redundant filenames when the containing directory already supplies the context.

Preserve blank lines between declarations, functions and methods. Do not compress code or raise size guards to hide growth. Keep source files at or below 1000 lines. Prefer cohesive modules, early returns, and descriptive names over dense expressions. Avoid ambiguous one- or two-letter names except conventional coordinates, counters, row/column names, `_`, and `id`. Comments explain non-obvious intent, constraints, or alternate control flow—not syntax or edit history. Do not add compatibility shims for obsolete contracts or tests whose only purpose is asserting that deleted legacy artifacts remain absent.

## Browser providers

A capability or navbar provider exports `mountProvider(scopedUiCtx)`. Importing its script must not start module-owned listeners or publish capabilities. Register browser capabilities, created flows and stage hooks through that scoped context; bind listeners to its `signal` and return cleanup for other resources. Cognis reconciles active provider catalogs, disposes removed providers, and invokes the same cached script's mount again on re-enable. Failure must roll back partial registrations. Obtain navbar links through `ui:navbarLinks`; do not append links to the shell yourself.

## UI and localization

Hardcoded English user-facing strings are forbidden under all circumstances, including fallback text, errors, empty states, accessibility labels, tooltips, toasts, and consent dialogs. Resolve every user-facing string through XML language keys. If the user’s preferred language does not provide a non-empty value, resolve the same key from the English XML resources. If the English key is also absent or empty, fail explicitly with a missing-translation error. Never substitute literal English, display the raw key, return an empty string, or catch and suppress that missing-translation failure to keep rendering. Tests must cover both the preferred-language-to-English fallback and failure when the English fallback key is unavailable.

Build dashboard content with host page-composer and client-side router contracts. The module owns only descendants rendered into the content root passed to `mount()`. Never manipulate or style the dashboard shell, `document.body`, `document.head`, or host-owned classes. End selectors at a module-namespaced class or ID; a host theme selector may appear only as an ancestor. Obtain host reusable modules and common styles through `ui:reuse`, and load third-party runtime scripts through `ui:resourceLoader`; dispose resource handles on unmount instead of appending scripts directly.

Never navigate with `window.location.href`, `window.location.replace`, or `window.location.reload`. Use links for navigation and buttons for actions. Destructive actions use the host's destructive styling; cancellation is not destructive. Use host router, toast, error-popup, decision-popup, timestamp, theme, font, avatar, and focus contracts. Do not use `alert`, `confirm`, or `prompt`, write transient status into arbitrary DOM nodes, depend on browser console output for operational failures, copy host CSS, add CSS comments, or use emoji/platform glyphs where a themeable SVG is appropriate.

Do not install or use Playwright; use existing browser tooling or a standalone Chromium/CDP check without a new browser dependency. Put every user-facing string in the German, English, Indonesian, and Japanese XML locale files with matching keys and genuine translations. Namespace keys to the module and use lowercase period-delimited words (for example `module.example.canvas.label`); do not use underscores or kebab-case between words. Localize manifest metadata, page titles, subtitles, labels, errors, empty states, accessibility text, and CLI-facing output where the host contract supports it.

## API, persistence, configuration, and security

Validate, bound, sanitize, and normalize at API boundaries. Authenticate and authorize before business logic, use least privilege and secure defaults, and return stable public errors without internal details. Do not impose an arbitrary result limit when the caller did not request one; validate an explicit limit without silently clamping or substituting it.

Keep persistence behind `ctx` capabilities and module-owned stores. Parameterize queries, keep schema/table names module-namespaced, and never bind the module to a concrete database driver. State-changing activity is logged at `info`. Caught failures are logged at `error` with safe structured metadata including component, operation, and relevant non-secret identifiers; uncaught runtime failures are fatal. Do not leave silent catches; log an intentional fallback before continuing.

Use manifest `ui.preferences` and the module-owned `GET`/`PUT /api/v1/modules/<id>/config` contract for administrator configuration rather than building a second settings UI. Persist configuration across disable and restart; clear it only through uninstall semantics. Never return stored passwords. User-specific secrets belong in the host keyring and configuration secrets must use the host's concealed-value contract. Use Web Crypto or Node Crypto—not `Math.random()`—for identifiers, tokens, keys, and generated values.

Declare hard dependencies sparingly and prefer capability requirements or soft dependencies for optional integrations. Disabled modules must not run their normal bootstrap. Use a declared `disabledApi` entrypoint only when configuration must work while disabled, and register only routes explicitly allowed in that state.

## Tests and quality

Tests must run in this standalone repository with local fakes for host capabilities. Test public route, capability, flow, lifecycle, authorization, localization, and manifest contracts rather than Cognis or sibling implementations. Every behavior change requires tests, safe logging, and synchronized documentation. Keep localized documentation variants structurally and semantically synchronized. Avoid release version numbers in documentation except changelogs; describe public contracts and link manifests for current metadata.

Run all of the following before committing:

```sh
npm install
npm run lint
npm test
npm run manifest:hashes
npm run check:manifest
git diff --check
```

Use the repository Prettier configuration: four-space indentation, double quotes in JavaScript, and trailing commas in multiline structures. Avoid tabs and trailing whitespace. Never wrap imports in `try`/`catch`. Do not add AI reasoning, session notes, or process commentary to product-facing files.

## Changelog entries

Store changelog entries in the shared `docs/changelog/` directory; do not create a root `CHANGELOG.md` or component-local changelog directories. Every pull request must add one entry in each supported language (`de`, `en`, `id`, and `ja`) using `<branch-name-without-copilot-prefix>.<lang>.md` filenames.

The `cognis-module-template` repository itself is the sole exception: do not create changelog entries for changes made to the template itself. The requirement above applies to external modules created from this template and must remain in these inherited instructions.

Each localized entry must contain, in this order, a level-one localized title, a localized bold feature-branch label, one or more level-two change headings with explanatory body text, and a localized level-two commit section. Use one change point per level-two heading because Cognis uses those headings as release-popup summaries. Translate the prose and provenance labels rather than copying English into other languages.

Keep commit-list items contiguous without blank lines between links. List implementation provenance as Markdown links whose targets use the module repository's full `/commit/<full-sha>` URL; the visible label may use the seven-character short reference. Before finishing, ensure the commit list records the immediately preceding implementation commit. If this requires a final bookkeeping commit, restrict it to the localized changelog files; because changelogs are excluded from the digest inventory, this bookkeeping step must not modify `manifest.json`. Existing changelog entries are immutable except for factual corrections.

## Review discipline

Treat human and automated review comments as actionable engineering feedback unless they conflict with higher-priority instructions. Complete technically sound review requests and verify observable behavior before marking them addressed. Record deliberately deferred work in root `TODO.md` with a concrete technical reason. Keep changes focused while leaving directly touched areas cleaner than you found them.

## Persistent review preferences

Treat ctx as the backbone of every supported server and browser action. Extend declared flows instead of importing foreign implementations, adding side-channel references or changing core/page-composer classes for convenience. Test component isolation and executable flow participation, not just source text. Optional components may disappear; retain neutral capability contracts and lifecycle-owned cleanup. Keep styles, scripts, templates and tests with their owning module. Reuse parameterizable duplicated behavior at its narrowest owner; avoid forwarding shims and speculative fallback contracts. Keep documentation cohesive, genuinely translated and focused on current supported behavior. Review complete diffs, preserve declaration spacing, and verify versions, dependency ceilings, lockfiles and final hashes.

## Module-specific requirements

Template guidance baseline: [d71b980](https://github.com/Cognis-Labs-HQ/cognis-module-template/blob/d71b98077d8d7af087b44009dafc2d736f86b617/.github/copilot-instructions.md).

Use host UI preferences and font resources. Never duplicate account preference endpoints or modify the page shell directly. Font changes apply through the host preference module.
