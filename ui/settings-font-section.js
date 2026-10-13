const uiCtx = globalThis[Symbol.for("cognis.uiCtx")];
const preferences = uiCtx?.capabilities.get("fonts:preferences");
if (!preferences)
    throw new Error("Required UI capability unavailable: fonts:preferences");
const loadPrefs = () => preferences.load();
const savePrefs = (input) => preferences.save(input);

const SECTION_ID = "module-fonts";
const DEFAULT_FONT = "Orbitron";
const DEFAULT_FONT_SIZE = 12;
const MINIMAL_FONTS = ["Arial", "sans-serif"];

function translate(i18n, key, fallback) {
    const value = i18n?.t?.(key);
    return value && value !== key ? value : fallback;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function toFontFamilyValue(font) {
    if (!font) return DEFAULT_FONT;
    return /^[a-zA-Z0-9-]+$/.test(font)
        ? font
        : `"${font.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function parseSavedFont(fontValue) {
    if (!fontValue || typeof fontValue !== "string") return DEFAULT_FONT;
    return (
        fontValue
            .split(",")[0]
            .trim()
            .replace(/^['"]|['"]$/g, "") || DEFAULT_FONT
    );
}

async function loadFontsCatalog() {
    await document.fonts?.ready;
    const seen = new Set();
    document.fonts?.forEach((face) => {
        const family = face.family.replace(/^['"]|['"]$/g, "").trim();
        if (family) seen.add(family);
    });
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

export async function createSettingsSection({ i18n, root, markDirty }) {
    const { ensurePageStylesheet } = await uiCtx.capabilities
        .get("ui:reuse")
        .importModule("page-styles.js");
    await ensurePageStylesheet("/static/modules/fonts/styles/fonts.css");
    let loadedPrefs = null;
    let loaded = false;

    let savedFont = DEFAULT_FONT;
    let savedSize = DEFAULT_FONT_SIZE;
    let currentFont = DEFAULT_FONT;
    let currentSize = DEFAULT_FONT_SIZE;
    let availableFonts = [];

    let fontSelect = null;
    let fontSizeValue = null;
    let fontPreview = null;
    let resetButton = null;

    function isDirty() {
        return currentFont !== savedFont || currentSize !== savedSize;
    }

    function emitDirtyState() {
        const dirty = isDirty();
        markDirty?.(SECTION_ID, dirty);
        if (resetButton) resetButton.disabled = !dirty;
    }

    function updatePreview() {
        if (!fontPreview) return;
        fontPreview.style.fontFamily = `${toFontFamilyValue(currentFont)}, Arial, sans-serif`;
        fontPreview.style.fontSize = `${currentSize}pt`;
    }

    function updateSizeLabel() {
        if (!fontSizeValue) return;
        fontSizeValue.textContent = `${currentSize} pt`;
    }

    function setFontSize(size) {
        currentSize = Math.max(8, Math.min(24, Math.round(size)));
        updateSizeLabel();
        updatePreview();
        emitDirtyState();
    }

    function syncControlsToState() {
        if (fontSelect) fontSelect.value = currentFont;
        updateSizeLabel();
        updatePreview();
        emitDirtyState();
    }

    async function ensureLoaded() {
        if (loaded) return;
        loadedPrefs = await loadPrefs();

        const rawSize = Number(
            loadedPrefs?.appFontSize ??
                loadedPrefs?.greetingFontSize ??
                DEFAULT_FONT_SIZE,
        );
        const normalizedSize = rawSize < 8 ? Math.round(rawSize * 12) : rawSize;
        const normalizedFontSize = Math.max(
            8,
            Math.min(24, Math.round(normalizedSize)),
        );
        const normalizedFont = parseSavedFont(
            loadedPrefs?.appFont || loadedPrefs?.greetingFont,
        );

        savedFont = normalizedFont;
        currentFont = normalizedFont;
        savedSize = normalizedFontSize;
        currentSize = normalizedFontSize;

        loaded = true;
    }

    function connectDom() {
        fontSelect = root.querySelector("#module-pref-font-select");
        fontSizeValue = root.querySelector("#module-pref-font-size-value");
        fontPreview = root.querySelector("#module-pref-font-preview");
        resetButton = root.querySelector("#module-pref-font-reset");

        if (fontSelect) {
            fontSelect.onchange = () => {
                currentFont = fontSelect.value || DEFAULT_FONT;
                updatePreview();
                emitDirtyState();
            };
        }

        const sizeUpButton = root.querySelector("#module-pref-font-size-up");
        const sizeDownButton = root.querySelector(
            "#module-pref-font-size-down",
        );
        if (sizeUpButton)
            sizeUpButton.onclick = () => setFontSize(currentSize + 1);
        if (sizeDownButton)
            sizeDownButton.onclick = () => setFontSize(currentSize - 1);
        if (resetButton) {
            resetButton.onclick = () => {
                currentFont = DEFAULT_FONT;
                currentSize = DEFAULT_FONT_SIZE;
                syncControlsToState();
            };
        }
    }

    async function renderIntoRoot() {
        await ensureLoaded();

        availableFonts = await loadFontsCatalog();
        if (!availableFonts.length) {
            availableFonts.push(...MINIMAL_FONTS);
        }
        if (!availableFonts.includes(currentFont))
            availableFonts.unshift(currentFont);

        const fontOptions = availableFonts
            .map(
                (font) =>
                    `<option value="${escapeHtml(font)}" style="font-family:${escapeHtml(toFontFamilyValue(font))}, Arial, sans-serif">${escapeHtml(font)}</option>`,
            )
            .join("");

        const fontHeading = translate(i18n, "module.fonts.name", "Font");
        const fontSelectLabel = fontHeading;
        const increaseFontSizeLabel = translate(
            i18n,
            "module.fonts.size.increase",
            "Increase font size",
        );
        const decreaseFontSizeLabel = translate(
            i18n,
            "module.fonts.size.decrease",
            "Decrease font size",
        );
        const previewLabel = translate(
            i18n,
            "module.fonts.preview",
            "Font preview",
        );
        const previewSample = translate(
            i18n,
            "module.fonts.preview.sample",
            "The quick brown fox jumps over the lazy dog.",
        );
        const resetLabel = translate(i18n, "module.fonts.reset", "Reset");

        const mountNode = root.querySelector(`#${SECTION_ID}-mount`);
        if (!mountNode) return;
        const headingId = `${SECTION_ID}-heading`;
        const previewId = `${SECTION_ID}-preview`;

        mountNode.innerHTML = `
      <div class="module-fonts-heading" aria-labelledby="${escapeHtml(headingId)}">
        <h3 id="${escapeHtml(headingId)}">${escapeHtml(fontHeading)}</h3>
        <button id="module-pref-font-reset" type="button">${escapeHtml(resetLabel)}</button>
      </div>
      <div class="module-fonts-picker">
        <label class="module-fonts-label">
          ${escapeHtml(fontSelectLabel)}
          <select id="module-pref-font-select" class="theme-select">${fontOptions}</select>
        </label>
        <div class="module-fonts-stepper">
          <button id="module-pref-font-size-up" class="module-fonts-size" type="button" aria-label="${escapeHtml(increaseFontSizeLabel)}"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="m6 15 6-6 6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg></button>
          <span id="module-pref-font-size-value" role="status" aria-live="polite"></span>
          <button id="module-pref-font-size-down" class="module-fonts-size" type="button" aria-label="${escapeHtml(decreaseFontSizeLabel)}"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2"/></svg></button>
        </div>
      </div>
      <div class="module-fonts-preview">
        <h4>${escapeHtml(previewLabel)}</h4>
        <span id="${escapeHtml(previewId)}" role="region" aria-label="${escapeHtml(previewLabel)}">${escapeHtml(previewSample)}</span>
      </div>
    `;

        connectDom();
        syncControlsToState();
    }

    return {
        id: "fonts",
        label: translate(i18n, "module.fonts.name", "Font"),
        subComposerOptions: {
            allowCustomization: false,
            preferenceKey: "settings-module-fonts-layout",
            heading: translate(i18n, "module.fonts.appearance", "Appearance"),
            elements: [
                {
                    id: "fonts-preferences",
                    label: translate(i18n, "module.fonts.name", "Font"),
                    render: () => `<div id="${SECTION_ID}-mount"></div>`,
                },
            ],
            onRender: () => {
                void renderIntoRoot().catch((error) => {
                    uiCtx.capabilities.get("ui:log")?.(
                        "error",
                        "Font preferences loading failed.",
                        {
                            component: "fonts",
                            operation: "loadPreferences",
                            errorName: error.name,
                        },
                    );
                });
            },
        },
        isDirty,
        save: async () => {
            await ensureLoaded();
            const mergedPrefs = {
                ...(loadedPrefs || {}),
                appFont: toFontFamilyValue(currentFont),
                appFontSize: currentSize,
            };
            await savePrefs(mergedPrefs);
            loadedPrefs = mergedPrefs;
            savedFont = currentFont;
            savedSize = currentSize;
            emitDirtyState();
        },
        commit: () => {
            savedFont = currentFont;
            savedSize = currentSize;
            emitDirtyState();
        },
        discard: () => {
            currentFont = savedFont;
            currentSize = savedSize;
            syncControlsToState();
        },
    };
}
